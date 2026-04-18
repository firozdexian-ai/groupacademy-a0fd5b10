import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Loader2,
  Briefcase,
  MapPin,
  Clock,
  CheckCircle,
  ImagePlus,
  RotateCcw,
  AlertCircle,
  Camera,
  Type,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobPostingGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

export function JobPostingGigForm({ gig, talentId, onSubmitted }: JobPostingGigFormProps) {
  const [inputMode, setInputMode] = useState<"text" | "image">("text");
  const [jobText, setJobText] = useState("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [sourceImageUrl, setSourceImageUrl] = useState("");

  // Editable parsed fields
  const [parsedRaw, setParsedRaw] = useState<any>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editJobType, setEditJobType] = useState("");

  const MIN_CHARS = 20;
  const hasParsed = !!parsedRaw;
  const canSubmit = editTitle.trim() && editCompany.trim() && !isSubmitting;

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const processIntelligence = async () => {
    setIsParsing(true);
    setParseError(null);

    try {
      let body: any = {};

      if (inputMode === "image" && screenshotFile) {
        toast.info("Syncing vision data...");
        const fileName = `gig-job-screenshots/${talentId}/${Date.now()}-${screenshotFile.name}`;
        const { error: uploadError } = await supabase.storage.from("job-assets").upload(fileName, screenshotFile);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("job-assets").getPublicUrl(fileName);
        setSourceImageUrl(publicUrl);
        body = { imageUrl: publicUrl };
      } else {
        if (jobText.length < MIN_CHARS) throw new Error(`Requires at least ${MIN_CHARS} characters.`);
        body = { rawText: jobText };
      }

      const { data, error } = await supabase.functions.invoke("parse-job-post", { body });
      if (error) throw error;

      const parsed = data.parsed || data;
      setParsedRaw(parsed);
      setEditTitle(parsed.title || "");
      setEditCompany(parsed.company_name || "");
      setEditLocation(parsed.location || "");
      setEditJobType(parsed.job_type || "");

      toast.success("AI extraction complete");
    } catch (err: any) {
      setParseError(err.message || "Parse failed");
      toast.error("Intelligence sync failed");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          input_method: inputMode,
          source: inputMode === "text" ? jobText : sourceImageUrl,
          curated_data: {
            title: editTitle,
            company: editCompany,
            location: editLocation,
            type: editJobType,
          },
          ai_meta: parsedRaw,
        },
      });

      if (error) throw error;
      toast.success("Mission accomplished! Credits pending.");
      onSubmitted();
    } catch (err: any) {
      toast.error("Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {!hasParsed ? (
        <div className="space-y-6">
          {/* Toggle Switch */}
          <div className="p-1.5 bg-muted/50 rounded-2xl flex gap-1 border border-border/40">
            {(["text", "image"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  inputMode === mode ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "text" ? <Type className="h-3.5 w-3.5" /> : <Camera className="h-3.5 w-3.5" />}
                {mode === "text" ? "Raw Text" : "Screenshot"}
              </button>
            ))}
          </div>

          {inputMode === "text" ? (
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Paste Job Data
              </Label>
              <Textarea
                placeholder="Paste the LinkedIn or Facebook job description here..."
                className="rounded-2xl border-border/40 min-h-[160px] resize-none focus-visible:ring-primary/20"
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Evidence Capture
              </Label>
              <div className="relative group">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotChange}
                  className="hidden"
                  id="screenshot-capture"
                />
                <label
                  htmlFor="screenshot-capture"
                  className={cn(
                    "flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-[32px] cursor-pointer transition-all",
                    screenshotFile
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/40 hover:border-primary/20 bg-card",
                  )}
                >
                  {screenshotPreview ? (
                    <img src={screenshotPreview} className="h-32 w-full object-contain rounded-xl" alt="Preview" />
                  ) : (
                    <>
                      <ImagePlus className="h-8 w-8 text-muted-foreground mb-3 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Upload Image Evidence
                      </span>
                    </>
                  )}
                </label>
              </div>
            </div>
          )}

          {parseError && (
            <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-2xl flex gap-3 items-center animate-in shake-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-xs font-bold text-destructive leading-tight">{parseError}</p>
            </div>
          )}

          <Button
            onClick={processIntelligence}
            disabled={isParsing || (inputMode === "text" ? jobText.length < MIN_CHARS : !screenshotFile)}
            className="w-full rounded-2xl h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            {isParsing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Extract Intelligence
          </Button>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-top-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5" /> Curate Extracted Info
            </h4>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg text-[9px] font-black uppercase tracking-tighter"
              onClick={() => setParsedRaw(null)}
            >
              <RotateCcw className="h-3 w-3 mr-1.5" /> Start Over
            </Button>
          </div>

          <div className="bg-card border border-border/40 rounded-[28px] p-6 space-y-5 shadow-inner">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                <Briefcase className="h-3 w-3" /> Targeted Role
              </Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded-xl border-border/40 font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Organization
              </Label>
              <Input
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value)}
                className="rounded-xl border-border/40 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" /> Location
                </Label>
                <Input
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="rounded-xl border-border/40 text-xs font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Type
                </Label>
                <Input
                  value={editJobType}
                  onChange={(e) => setEditJobType(e.target.value)}
                  className="rounded-xl border-border/40 text-xs font-bold uppercase"
                />
              </div>
            </div>

            {sourceImageUrl && (
              <div className="pt-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-2">
                  Source Attachment
                </p>
                <img
                  src={sourceImageUrl}
                  className="rounded-xl h-24 w-full object-cover border border-border/30 opacity-60"
                />
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-2xl h-12 font-black uppercase tracking-widest shadow-xl shadow-primary/20 group"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
            )}
            Confirm Mission Completion
          </Button>
        </div>
      )}
    </div>
  );
}
