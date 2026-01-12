import { useState, useCallback } from "react";
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  AlertCircle,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CVUploadStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

interface ParsedCVData {
  full_name?: string;
  email?: string;
  phone?: string;
  current_status?: string;
  education?: Array<{ institution?: string; degree?: string; field?: string }>;
  experience?: Array<{ company?: string; title?: string; description?: string }>;
  skills?: string[];
}

const PARSING_STAGES = [
  { progress: 20, message: "Uploading your CV..." },
  { progress: 40, message: "Reading document..." },
  { progress: 60, message: "Extracting information..." },
  { progress: 80, message: "Analyzing skills & experience..." },
  { progress: 95, message: "Preparing your profile..." },
];

export function CVUploadStep({ onContinue, onSkip }: CVUploadStepProps) {
  const { talent, updateTalent, refreshTalent } = useTalent();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [parseMessage, setParseMessage] = useState("");
  const [uploadedFile, setUploadedFile] = useState<string | null>(talent?.cvUrl || null);
  const [parsedData, setParsedData] = useState<ParsedCVData | null>(null);
  const [parseComplete, setParseComplete] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const simulateProgress = () => {
    let stageIndex = 0;
    const interval = setInterval(() => {
      if (stageIndex < PARSING_STAGES.length) {
        setParseProgress(PARSING_STAGES[stageIndex].progress);
        setParseMessage(PARSING_STAGES[stageIndex].message);
        stageIndex++;
      } else {
        clearInterval(interval);
      }
    }, 1500);
    return interval;
  };

  async function handleUpload(file: File) {
    if (!talent?.id) {
      console.log("[CVUpload] No talent ID found");
      return;
    }

    console.log("[CVUpload] Starting upload for talent:", talent.id);

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);
    setIsParsing(false);
    setParsedData(null);
    setParseComplete(false);
    setParseError(null);

    try {
      // Step 1: Upload file
      const fileExt = file.name.split(".").pop();
      const filePath = `${talent.id}/cv.${fileExt}`;

      console.log("[CVUpload] Uploading to path:", filePath);

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("[CVUpload] Upload error:", uploadError);
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(filePath);

      console.log("[CVUpload] File uploaded to:", publicUrl);

      setUploadedFile(publicUrl);
      setIsUploading(false);
      setIsParsing(true);

      // Start progress simulation
      const progressInterval = simulateProgress();

      // Step 2: Call parse-cv edge function
      console.log("[CVUpload] Calling parse-cv edge function");
      const { data: parseResult, error: parseError } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl },
      });

      clearInterval(progressInterval);

      console.log("[CVUpload] Parse result:", parseResult);

      if (parseError) {
        console.error("[CVUpload] Parse CV error:", parseError);
        // Still save the CV URL even if parsing fails
        const updateResult = await updateTalent({ cvUrl: publicUrl });
        console.log("[CVUpload] UpdateTalent (fallback) result:", updateResult);

        setParseError(
          "We uploaded your CV but couldn't extract the information automatically. You can fill in your details manually on the next screen.",
        );
        toast.warning("CV uploaded but parsing had issues. You can fill in details manually.");
        setIsParsing(false);
        setParseComplete(true);
        return;
      }

      if (parseResult?.success && parseResult.parsed) {
        const parsed = parseResult.parsed as ParsedCVData;
        console.log("[CVUpload] Parsed data:", parsed);

        setParsedData(parsed);
        setParseProgress(100);
        setParseMessage("Profile ready!");

        // Auto-fill profile with parsed data
        const updateData: Record<string, any> = {
          cvUrl: publicUrl,
          cvParsedAt: new Date().toISOString(),
        };

        if (parsed.full_name && (!talent.fullName || talent.fullName === talent.email?.split("@")[0])) {
          updateData.fullName = parsed.full_name;
        }
        if (parsed.phone && !talent.phone) {
          updateData.phone = parsed.phone;
        }
        if (parsed.skills && parsed.skills.length > 0 && (!talent.skills || talent.skills.length === 0)) {
          updateData.skills = parsed.skills;
        }
        if (
          parsed.experience &&
          parsed.experience.length > 0 &&
          (!talent.experience || (talent.experience as any[]).length === 0)
        ) {
          updateData.experience = parsed.experience.map((exp) => ({
            company: exp.company || "",
            position: exp.title || "",
            description: exp.description || "",
          }));
        }
        if (
          parsed.education &&
          parsed.education.length > 0 &&
          (!talent.education || (talent.education as any[]).length === 0)
        ) {
          updateData.education = parsed.education.map((edu) => ({
            institution: edu.institution || "",
            degree: edu.degree || "",
            fieldOfStudy: edu.field || "",
          }));
        }

        console.log("[CVUpload] Updating talent with:", updateData);
        const updateResult = await updateTalent(updateData);
        console.log("[CVUpload] UpdateTalent result:", updateResult);

        // Refresh talent data to ensure UI shows updated info
        await refreshTalent();

        toast.success("CV parsed! Your profile has been updated.");
        setParseComplete(true);
      } else {
        console.log("[CVUpload] Parse result empty or unsuccessful, saving CV URL only");
        const updateResult = await updateTalent({ cvUrl: publicUrl });
        console.log("[CVUpload] UpdateTalent (no parse) result:", updateResult);
        toast.success("CV uploaded successfully!");
        setParseComplete(true);
      }

      setIsParsing(false);
    } catch (error) {
      console.error("[CVUpload] Error:", error);
      toast.error("Failed to upload CV. Please try again.");
      setParseError("Failed to upload CV. Please try again or skip for now.");
      setIsUploading(false);
      setIsParsing(false);
    }
  }

  const renderParsedSummary = () => {
    if (!parsedData && !parseComplete) return null;

    // If we have an error but CV was uploaded
    if (parseError) {
      return (
        <div className="w-full mt-4 p-4 bg-warning/10 border border-warning/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            <span className="font-semibold text-foreground">CV Uploaded</span>
          </div>
          <p className="text-sm text-muted-foreground">{parseError}</p>
        </div>
      );
    }

    if (!parsedData) return null;

    const stats = [];
    if (parsedData.skills && parsedData.skills.length > 0) {
      stats.push({ icon: Sparkles, label: `${parsedData.skills.length} skills`, items: parsedData.skills.slice(0, 5) });
    }
    if (parsedData.experience && parsedData.experience.length > 0) {
      stats.push({
        icon: Briefcase,
        label: `${parsedData.experience.length} experience${parsedData.experience.length > 1 ? "s" : ""}`,
        items: parsedData.experience
          .slice(0, 2)
          .map((e) => e.company || e.title)
          .filter(Boolean),
      });
    }
    if (parsedData.education && parsedData.education.length > 0) {
      stats.push({
        icon: GraduationCap,
        label: `${parsedData.education.length} education`,
        items: parsedData.education
          .slice(0, 2)
          .map((e) => e.institution || e.degree)
          .filter(Boolean),
      });
    }

    if (stats.length === 0) return null;

    return (
      <div className="w-full mt-4 p-4 bg-success/10 border border-success/20 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <span className="font-semibold text-foreground">Your profile will be updated with:</span>
        </div>

        {/* Name */}
        {parsedData.full_name && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-background/50 rounded-lg">
            <User className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{parsedData.full_name}</span>
          </div>
        )}

        {/* Stats with details */}
        <div className="space-y-3">
          {stats.map((stat, i) => (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <stat.icon className="h-4 w-4 text-primary" />
                <span>{stat.label}</span>
              </div>
              {stat.items && stat.items.length > 0 && (
                <div className="pl-5 text-xs text-muted-foreground">
                  {stat.items.join(", ")}
                  {stat.items.length < (stat.label.includes("skill") ? parsedData.skills?.length || 0 : 0) && "..."}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-success/20">
          You can review and edit these details in your profile after continuing.
        </p>
      </div>
    );
  };

  const canContinue = !isUploading && !isParsing;
  const showSuccessState = uploadedFile && parseComplete;

  return (
    <div className="flex flex-col items-center px-4 py-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">Upload Your CV</h2>
      <p className="text-muted-foreground text-center mb-6">
        We'll automatically fill your profile with your experience
      </p>

      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative w-full border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
          isDragging && "border-primary bg-primary/5",
          showSuccessState && "border-success bg-success/5",
          !isDragging && !showSuccessState && "border-border hover:border-primary/50",
        )}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-muted-foreground">Uploading your CV...</p>
          </div>
        ) : isParsing ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Sparkles className="h-12 w-12 text-primary animate-pulse" />
            </div>
            <div className="w-full max-w-[200px]">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${parseProgress}%` }} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{parseMessage}</p>
            <p className="text-xs text-muted-foreground">Please wait while we analyze your CV...</p>
          </div>
        ) : showSuccessState ? (
          <div className="flex flex-col items-center gap-3">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <p className="text-foreground font-medium">{parsedData ? "CV Analyzed Successfully!" : "CV Uploaded!"}</p>
            <p className="text-sm text-muted-foreground">Click to replace with a different CV</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Upload className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-foreground font-medium">Drag & drop your CV here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
            </div>
            <p className="text-xs text-muted-foreground">PDF or Word • Max 5MB</p>
          </div>
        )}
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileSelect}
          disabled={isUploading || isParsing}
        />
      </div>

      {/* Parsed Data Summary */}
      {renderParsedSummary()}

      {/* Benefits */}
      {!parsedData && !isParsing && !parseComplete && (
        <div className="w-full bg-muted/50 rounded-lg p-4 mt-6">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Why upload your CV?</p>
              <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                <li>• Auto-fill your profile instantly</li>
                <li>• Get personalized job matches</li>
                <li>• Better AI career advice</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col w-full gap-3 mt-6">
        <Button size="lg" onClick={onContinue} className="w-full" disabled={!canContinue}>
          {parsedData ? (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Review Profile & Continue
            </>
          ) : parseComplete ? (
            "Continue to Profile"
          ) : (
            "Continue"
          )}
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground" disabled={!canContinue}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
