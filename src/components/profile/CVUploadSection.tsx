import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { downloadFile } from "@/lib/downloadFile";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Neural Artifact Ingress (CVUploadSection)
 * CTO Reference: Authoritative node for CV ingestion and automated profile hydration.
 */

interface ParsedCVData {
  fullName?: string;
  phone?: string;
  email?: string;
  education?: any[];
  experience?: any[];
  skills?: any[];
  linkedinUrl?: string;
  portfolioUrl?: string;
  summary?: string;
  achievements?: any[];
  profileType?: string;
  currentStatus?: string;
  institution?: string;
  fieldOfStudy?: string;
  customProfession?: string;
  professionCategoryId?: string;
}

const PARSING_STAGES = [
  { progress: 0, message: "INITIALIZING_UPLOAD..." },
  { progress: 20, message: "READING_ARTIFACT_NODE..." },
  { progress: 40, message: "EXTRACTING_NEURAL_DATA..." },
  { progress: 60, message: "ANALYZING_SKILL_MATRIX..." },
  { progress: 80, message: "MAPPING_PROFESSIONAL_NODES..." },
  { progress: 95, message: "HYDRATING_PROFILE_LEDGER..." },
];

export function CVUploadSection() {
  const { talent, updateTalent, refreshTalent } = useTalent();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const hasCV = !!talent?.cvUrl;

  const simulateHandshake = () => {
    let stage = 0;
    const interval = setInterval(() => {
      if (stage < PARSING_STAGES.length - 1) {
        stage++;
        setCurrentStage(stage);
        setUploadProgress(PARSING_STAGES[stage].progress);
      } else {
        clearInterval(interval);
      }
    }, 2000);
    return interval;
  };

  const handleArtifactIngestion = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // PROTOCOL: Payload Validation
    const allowedMime = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!allowedMime.includes(file.type)) {
      toast.error("Format Rejected: Ingest PDF or Word artifacts only.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Payload Threshold Exceeded: Max 5MB per ingestion.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    setCurrentStage(0);

    const syncInterval = simulateHandshake();

    try {
      // REGISTRY: Supabase Storage Synchronisation
      const fileExt = file.name.split(".").pop();
      const fileName = `${talent?.id || "node"}-${Date.now()}.${fileExt}`;
      const filePath = `cvs/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("portfolio-uploads")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw new Error(`Transmission Fault: ${uploadError.message}`);

      const { data: urlData } = supabase.storage.from("portfolio-uploads").getPublicUrl(filePath);

      const cvUrl = urlData?.publicUrl;

      // INTELLIGENCE: Execute Neural Extraction Edge Function
      setCurrentStage(2);
      setUploadProgress(40);

      const { data: parseData, error: parseError } = await supabase.functions.invoke("parse-cv", { body: { cvUrl } });

      if (parseError) throw parseError;

      clearInterval(syncInterval);
      setCurrentStage(5);
      setUploadProgress(95);

      // HYDRATION: Update Talent Registry
      if (parseData?.success && parseData?.parsedData) {
        const parsed: ParsedCVData = parseData.parsedData;
        const syncPayload: any = { cvUrl, cvParsedAt: new Date().toISOString() };

        if (parsed.fullName) syncPayload.fullName = parsed.fullName;
        if (parsed.phone) syncPayload.phone = parsed.phone;
        if (parsed.education?.length) syncPayload.education = parsed.education;
        if (parsed.experience?.length) syncPayload.experience = parsed.experience;
        if (parsed.skills?.length) syncPayload.skills = parsed.skills;
        if (parsed.linkedinUrl) syncPayload.linkedinUrl = parsed.linkedinUrl;
        if (parsed.customProfession) syncPayload.customProfession = parsed.customProfession;
        if (parsed.professionCategoryId) syncPayload.professionCategoryId = parsed.professionCategoryId;

        await updateTalent(syncPayload);
        await refreshTalent();

        setUploadProgress(100);
        toast.success("Identity Matrix Synced: Profile hydrated from CV.");
      } else {
        await updateTalent({ cvUrl, cvParsedAt: new Date().toISOString() });
        await refreshTalent();
        toast.success("Artifact Stored: Full extraction incomplete, node saved.");
      }
    } catch (err: any) {
      clearInterval(syncInterval);
      console.error("[Ingress Node Error]:", err);
      setError(err.message || "Encryption/Processing Error. Protocol Aborted.");
      toast.error("Handshake Failed", { description: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-md shadow-2xl overflow-hidden transition-all duration-500 hover:border-primary/20">
      <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <Zap className="h-7 w-7 text-primary fill-current" /> Neural_Artifact_Sync
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
              Automated profile hydration via AI-orchestrated artifact parsing
            </CardDescription>
          </div>
          {hasCV && (
            <Badge
              variant="outline"
              className="h-10 px-5 rounded-xl border-2 font-black italic gap-2 bg-background/50 uppercase text-emerald-500 border-emerald-500/20"
            >
              <ShieldCheck className="h-4 w-4" /> Node_Verified
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-8">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleArtifactIngestion}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="space-y-6 py-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm font-black uppercase italic tracking-widest">
                  {PARSING_STAGES[currentStage]?.message}
                </span>
              </div>
              <span className="text-xs font-black tabular-nums text-primary">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-3 rounded-full bg-primary/10 shadow-inner" />
            <p className="text-[10px] text-muted-foreground uppercase font-black text-center tracking-[0.3em] opacity-50 animate-pulse">
              EXTRACTING_IDENTITY_NODES...
            </p>
          </div>
        ) : error ? (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
            <div className="flex items-center gap-4 p-6 bg-destructive/5 border-2 border-destructive/20 rounded-[24px]">
              <AlertCircle className="h-8 w-8 text-destructive shrink-0" />
              <div className="flex-1">
                <p className="font-black text-sm uppercase italic text-destructive">PROTOCOL_FAULT</p>
                <p className="text-xs font-bold text-muted-foreground/70 uppercase leading-relaxed mt-1">{error}</p>
              </div>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full h-14 rounded-2xl border-2 font-black uppercase text-xs tracking-widest gap-2 hover:bg-destructive/5 hover:text-destructive"
            >
              <RefreshCw className="h-4 w-4" /> RE_INITIALIZE_SYNC
            </Button>
          </div>
        ) : hasCV ? (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="flex items-center gap-5 p-6 bg-emerald-500/5 border-2 border-emerald-500/20 rounded-[24px]">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="font-black text-sm uppercase italic text-emerald-600">ARTIFACT_SYNCED</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">
                  Identity ledger updated via neural extraction
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1 h-14 rounded-2xl border-2 font-black uppercase text-xs tracking-widest gap-3 shadow-lg active:scale-95 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-5 w-5" /> Protocol_Update
              </Button>
              {talent?.cvUrl && (
                <Button
                  variant="outline"
                  className="h-14 w-14 rounded-2xl border-2 shadow-lg active:scale-95 transition-all"
                  onClick={() => downloadFile(talent.cvUrl!, `${talent.fullName || "ARTIFACT"}.pdf`)}
                >
                  <Download className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div
            className="group relative border-2 border-dashed rounded-[32px] p-16 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-500 overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 space-y-5">
              <div className="h-20 w-20 bg-muted/20 border-2 border-border/10 rounded-[28px] flex items-center justify-center mx-auto transition-all duration-700 group-hover:rotate-6 group-hover:scale-110 shadow-xl group-hover:shadow-primary/10">
                <Upload className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="font-black text-lg uppercase italic tracking-tighter text-foreground">
                  Deploy_CV_Artifact
                </p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 opacity-60">
                  PDF_DOC_DOCX | MAX_PAYLOAD_5MB
                </p>
              </div>
              <Button
                variant="secondary"
                className="h-10 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md"
              >
                Select_Source_Node
              </Button>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-3 py-3 border-t border-border/10">
          <Zap className="h-3.5 w-3.5 text-amber-500 fill-current animate-pulse" />
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 italic">
            Neural Engine: Professional Data Ingress Protocol v2.6
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
