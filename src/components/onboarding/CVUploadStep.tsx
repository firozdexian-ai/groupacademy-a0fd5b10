import { useState, useCallback, useEffect } from "react";
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
  Zap,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Intelligent Onboarding Ingress (CVUploadStep)
 * CTO Reference: Authoritative node for CV parsing and career vector initialization.
 */

interface CVUploadStepProps {
  onContinue: () => void;
  onSkip: () => void;
}

interface ParsedCVData {
  full_name?: string;
  email?: string;
  phone?: string;
  education?: Array<{ institution?: string; degree?: string; field?: string }>;
  experience?: Array<{ company?: string; title?: string; description?: string }>;
  skills?: string[];
}

const PARSING_STAGES = [
  { progress: 20, message: "Syncing document with registry..." },
  { progress: 40, message: "Initializing OCR protocols..." },
  { progress: 60, message: "Extracting knowledge artifacts..." },
  { progress: 80, message: "Synthesizing professional profile..." },
  { progress: 95, message: "Finalizing identity mapping..." },
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

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(talent?.professionCategoryId || "none");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("profession_categories").select("id, name").order("name");
      if (!error && data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const simulateProgress = () => {
    let stageIndex = 0;
    return setInterval(() => {
      if (stageIndex < PARSING_STAGES.length) {
        setParseProgress(PARSING_STAGES[stageIndex].progress);
        setParseMessage(PARSING_STAGES[stageIndex].message);
        stageIndex++;
      }
    }, 1200);
  };

  async function handleExecutiveUpload(file: File) {
    if (!talent?.id) return;

    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("PROTOCOL_ERROR: Invalid format. PDF or Word required.");
      return;
    }

    setIsUploading(true);
    setIsParsing(false);
    setParseError(null);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${talent.id}/cv_v3.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(filePath);
      setUploadedFile(publicUrl);
      setIsUploading(false);
      setIsParsing(true);

      const progressInterval = simulateProgress();
      const { data: parseResult, error: invokeError } = await supabase.functions.invoke("parse-cv", {
        body: { cvUrl: publicUrl },
      });
      clearInterval(progressInterval);

      if (invokeError || !parseResult?.success) {
        await updateTalent({ cvUrl: publicUrl });
        setParseError("SYNAPSE_FAULT: Manual entry required for specific attributes.");
        toast.warning("Artifact uploaded. Auto-mapping offline.");
        setIsParsing(false);
        setParseComplete(true);
        return;
      }

      const parsed = parseResult.parsed as ParsedCVData;
      setParsedData(parsed);
      setParseProgress(100);

      // REGISTRY_SYNC: Intelligent Data Merging
      const updatePayload: Record<string, any> = { cvUrl: publicUrl, cvParsedAt: new Date().toISOString() };

      if (parsed.full_name && (!talent.fullName || talent.fullName === talent.email?.split("@")[0])) {
        updatePayload.fullName = parsed.full_name;
      }

      await updateTalent(updatePayload);
      await refreshTalent();

      toast.success("NEURAL_SYNC_COMPLETE");
      setParseComplete(true);
      setIsParsing(false);
    } catch (error) {
      toast.error("DATA_INGRESS_FAULT");
      setIsUploading(false);
      setIsParsing(false);
    }
  }

  const renderArtifactAudit = () => {
    if (!parsedData && !parseComplete) return null;
    if (parseError)
      return (
        <div className="w-full mt-6 p-5 bg-amber-500/5 border-2 border-amber-500/20 rounded-[20px] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 mb-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            <span className="font-black uppercase italic text-[11px] tracking-widest">Ingress_Warning</span>
          </div>
          <p className="text-xs font-medium italic text-muted-foreground">{parseError}</p>
        </div>
      );

    return (
      <div className="w-full mt-6 p-5 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-[24px] animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="h-5 w-5 text-emerald-500" />
          <span className="font-black uppercase italic text-[11px] tracking-widest text-emerald-600">
            Profile_Synchronized
          </span>
        </div>

        {parsedData?.full_name && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-background/50 border border-border/40 rounded-xl">
            <User className="h-4 w-4 text-primary" />
            <span className="text-sm font-black uppercase italic tracking-tighter">{parsedData.full_name}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {parsedData?.skills?.length && (
            <div className="p-3 bg-muted/20 rounded-xl border border-border/10">
              <p className="text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest">Artifacts</p>
              <p className="text-[10px] font-bold italic truncate">{parsedData.skills.length} Knowledge_Nodes</p>
            </div>
          )}
          {parsedData?.experience?.length && (
            <div className="p-3 bg-muted/20 rounded-xl border border-border/10">
              <p className="text-[8px] font-black uppercase text-muted-foreground mb-1 tracking-widest">History</p>
              <p className="text-[10px] font-bold italic truncate">{parsedData.experience.length} Exp_Clusters</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center px-4 py-8 max-w-lg mx-auto text-left">
      <div className="mb-10 space-y-2 text-center">
        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground leading-none">
          Initialize_Talent_Registry
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground italic">
          Sync your professional artifacts for autonomous profile mapping
        </p>
      </div>

      {/* COMPONENT: DROPSHIP_ZONE */}
      <div
        className={cn(
          "relative w-full border-2 border-dashed rounded-[32px] p-12 text-center transition-all duration-700",
          isDragging
            ? "border-primary bg-primary/5 scale-105 shadow-2xl shadow-primary/10"
            : "border-border/40 bg-muted/5",
          (isUploading || isParsing) && "pointer-events-none opacity-50 grayscale",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) handleExecutiveUpload(f);
        }}
      >
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleExecutiveUpload(f);
          }}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-4 animate-in fade-in">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] italic">Commiting_to_Storage...</p>
          </div>
        ) : isParsing ? (
          <div className="flex flex-col items-center gap-6 w-full animate-in zoom-in-95">
            <Sparkles className="h-12 w-12 text-primary animate-pulse" />
            <div className="w-full space-y-3">
              <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${parseProgress}%` }}
                />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary italic text-center">
                {parseMessage}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 group">
            <div className="h-20 w-20 rounded-[24px] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-base font-black uppercase italic tracking-tighter">Authorize_Upload</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                PDF | DOCX (Max 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {renderArtifactAudit()}

      {/* HUD: CATEGORY_LEDGER */}
      <div className="w-full mt-10 p-6 bg-card/40 backdrop-blur-xl border-2 border-border/40 rounded-[32px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Zap className="h-24 w-24 rotate-12" />
        </div>

        <Label className="text-[10px] font-black uppercase italic tracking-[0.2em] text-primary mb-4 flex items-center gap-3">
          <Briefcase className="h-4 w-4" /> Primary_Trajectory_Key <span className="text-destructive">*</span>
        </Label>

        <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isParsing}>
          <SelectTrigger className="h-12 bg-background/50 border-2 rounded-2xl font-bold italic focus:ring-primary/20 transition-all">
            <SelectValue placeholder="Initialize trajectory selection..." />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2 shadow-2xl">
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id} className="font-bold italic text-xs py-3">
                {cat.name.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest mt-3 leading-relaxed italic">
          This key initializes your dedicated AI faculty and global placement vectors.
        </p>
      </div>

      {/* FOOTER: ACTION_INGRESS */}
      <div className="flex flex-col w-full gap-4 mt-10 pt-6 border-t-2 border-border/10">
        <Button
          size="xl"
          onClick={async () => {
            if (selectedCategory === "none") return toast.error("TRAJECTORY_NOT_DEFINED");
            setIsSaving(true);
            await updateTalent({ professionCategoryId: selectedCategory });
            onContinue();
          }}
          disabled={isParsing || isUploading || selectedCategory === "none"}
          className="w-full h-16 rounded-[24px] font-black uppercase italic tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95 gap-3"
        >
          {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-6 w-6" />}
          VERIFY_AND_COMMENCE
        </Button>
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 hover:text-foreground transition-colors"
          disabled={isParsing || isUploading}
        >
          AUTHORIZE_SYNC_SKIP
        </Button>
      </div>
    </div>
  );
}
