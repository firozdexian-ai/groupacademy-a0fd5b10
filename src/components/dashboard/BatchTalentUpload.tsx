import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Upload,
  FileText,
  Link as LinkIcon,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  FileUp,
  FileJson2,
  ShieldCheck,
  Zap,
  Database,
  ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LinkedInJsonUpload } from "./LinkedInJsonUpload";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Talent Registry Ingestion Node
 * High-fidelity orchestrator for bulk CV parsing and talent artifact synchronization.
 * 2026 Standard: Executive Logic geometry with reinforced storage telemetry.
 */

interface BatchUpload {
  id: string;
  file_count: number;
  processed_count: number;
  skipped_count: number;
  failed_count: number;
  status: string;
  error_log: any[] | null;
  created_at: string;
  completed_at: string | null;
}

interface BatchTalentUploadProps {
  onComplete?: () => void;
}

const MAX_FILES = 20;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function BatchTalentUpload({ onComplete }: BatchTalentUploadProps) {
  const [urlsInput, setUrlsInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<BatchUpload | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [showErrorLog, setShowErrorLog] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCvUrls = (input: string): string[] => {
    return input
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && (line.startsWith("http://") || line.startsWith("https://")));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        errors.push(`${file.name}: Protocol Mismatch (PDF Required)`);
      } else if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: Payload Exceeds ${MAX_FILE_SIZE_MB}MB`);
      } else {
        validFiles.push(file);
      }
    });

    setSelectedFiles(validFiles.slice(0, MAX_FILES));
    if (errors.length > 0) errors.forEach((err) => toast.error(err));
  };

  const uploadFilesAndProcess = async () => {
    if (selectedFiles.length === 0) return toast.error("Select PDF artifacts to ingest");

    setUploadingFiles(true);
    setIsUploading(true);
    setShowProgress(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Registry Access Denied: Unauthorized");

      const urls: string[] = [];
      for (const file of selectedFiles) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${user.id}/${timestamp}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("talent-cvs")
          .upload(filePath, file, { contentType: "application/pdf" });

        if (uploadError) continue;

        const { data: signedUrlData } = await supabase.storage
          .from("talent-cvs")
          .createSignedUrl(filePath, 60 * 60 * 24 * 365);

        if (signedUrlData?.signedUrl) urls.push(signedUrlData.signedUrl);
      }

      if (urls.length === 0) throw new Error("Payload Upload Failed");

      setUploadingFiles(false);

      const { data: batch, error: batchError } = await supabase
        .from("batch_uploads")
        .insert({ uploaded_by: user.id, file_count: urls.length, status: "pending" })
        .select()
        .single();

      if (batchError) throw batchError;
      setCurrentBatch(batch as BatchUpload);

      await supabase.functions.invoke("batch-parse-cvs", {
        body: { cvUrls: urls, batchId: batch.id },
      });

      toast.success(`Ingestion Initialized: ${urls.length} Artifacts Syncing`);
      pollBatchProgress(batch.id);
    } catch (error: any) {
      toast.error(error.message || "Transmission Fault");
      setIsUploading(false);
      setUploadingFiles(false);
      setShowProgress(false);
    }
  };

  const pollBatchProgress = useCallback(
    async (batchId: string) => {
      const pollInterval = setInterval(async () => {
        const { data: batch } = await supabase.from("batch_uploads").select("*").eq("id", batchId).single();
        if (batch) {
          setCurrentBatch(batch as BatchUpload);
          if (batch.status === "completed" || batch.status === "failed") {
            clearInterval(pollInterval);
            setIsUploading(false);
            if (batch.status === "completed") {
              toast.success("Registry Sync Complete");
              onComplete?.();
            }
          }
        }
      }, 3000);
      setTimeout(() => clearInterval(pollInterval), 600000);
    },
    [onComplete],
  );

  const getProgressPercentage = () => {
    if (!currentBatch || currentBatch.file_count === 0) return 0;
    const total = currentBatch.processed_count + currentBatch.skipped_count + currentBatch.failed_count;
    return Math.round((total / currentBatch.file_count) * 100);
  };

  return (
    <Card className="rounded-[32px] border-2 border-border/40 shadow-2xl overflow-hidden bg-card/30 backdrop-blur-xl">
      <div className="h-1.5 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
      <CardHeader className="p-8 pb-4">
        <div className="flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Database className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">Registry Ingestion</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
              Bulk CV Artifact Synchronization Node v2.6
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8 pt-0 space-y-8">
        <Tabs defaultValue="links" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-16 bg-muted/30 backdrop-blur-md rounded-[24px] border-2 border-border/40 p-1.5 shadow-xl">
            <TabsTrigger
              value="links"
              disabled={isUploading}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <LinkIcon className="w-4 h-4" /> Paste Links
            </TabsTrigger>
            <TabsTrigger
              value="files"
              disabled={isUploading}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <FileUp className="w-4 h-4" /> Upload Files
            </TabsTrigger>
            <TabsTrigger
              value="linkedin"
              disabled={isUploading}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              <FileJson2 className="w-4 h-4" /> LinkedIn
            </TabsTrigger>
          </TabsList>

          <TabsContent value="links" className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                Payload URLs (One per line)
              </Label>
              <Textarea
                placeholder={"https://storage.node.com/cv-alpha.pdf\nhttps://storage.node.com/cv-beta.pdf"}
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
                disabled={isUploading}
                className="min-h-[160px] rounded-2xl border-2 bg-muted/5 font-mono text-xs p-6 italic focus:border-primary/40 transition-all"
              />
            </div>
            <Button
              onClick={() => {
                /* Logic for URL batch start */
              }}
              disabled={isUploading || !urlsInput.trim()}
              className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                {isUploading ? <Loader2 className="animate-spin h-5 w-5" /> : <Upload className="h-5 w-5" />}
                Authorize URL Ingestion
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-50 group-hover:opacity-100 transition-opacity" />
            </Button>
          </TabsContent>

          <TabsContent value="files" className="mt-8 space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="group relative border-4 border-dashed rounded-[32px] p-16 text-center transition-all hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="space-y-6">
                  <div className="h-20 w-20 rounded-[24px] bg-muted/50 flex items-center justify-center mx-auto border-2 border-border/40 group-hover:rotate-6 transition-transform">
                    <FileUp className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xl font-black uppercase tracking-tight italic">Inject PDF Payloads</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">
                      Max {MAX_FILES} Artifacts · {MAX_FILE_SIZE_MB}MB Limit
                    </p>
                  </div>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border border-border/10"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-primary opacity-40 shrink-0" />
                        <span className="text-[11px] font-black uppercase tracking-tight truncate italic">
                          {file.name}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[8px] font-mono opacity-40">
                        {(file.size / (1024 * 1024)).toFixed(1)}MB
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={uploadFilesAndProcess}
              disabled={isUploading || selectedFiles.length === 0}
              className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/30 group"
            >
              {uploadingFiles ? (
                <Loader2 className="animate-spin mr-3 h-5 w-5" />
              ) : (
                <ShieldCheck className="mr-3 h-5 w-5" />
              )}
              Commit Ingestion Protocol
            </Button>
          </TabsContent>

          <TabsContent value="linkedin" className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
            <LinkedInJsonUpload mode="talent" onComplete={onComplete} />
          </TabsContent>
        </Tabs>

        {showProgress && currentBatch && (
          <div className="p-8 rounded-[32px] border-2 bg-muted/10 space-y-6 shadow-inner animate-in zoom-in-95 duration-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Zap className="h-5 w-5 text-amber-500 fill-current animate-pulse" />
                <span className="text-xl font-black uppercase tracking-tighter italic">Process Telemetry</span>
              </div>
              <Badge
                className={cn(
                  "rounded-lg font-black uppercase text-[8px] tracking-widest px-4 py-1.5 border-none shadow-sm",
                  currentBatch.status === "completed"
                    ? "bg-emerald-500 text-white"
                    : currentBatch.status === "failed"
                      ? "bg-destructive text-white"
                      : "bg-primary text-white",
                )}
              >
                {currentBatch.status}_NODE
              </Badge>
            </div>

            <Progress value={getProgressPercentage()} className="h-4 rounded-full bg-primary/10" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Database, label: "Total Rows", val: currentBatch.file_count, color: "text-muted-foreground" },
                { icon: CheckCircle, label: "Synced", val: currentBatch.processed_count, color: "text-emerald-500" },
                { icon: AlertCircle, label: "Skipped", val: currentBatch.skipped_count, color: "text-amber-500" },
                { icon: XCircle, label: "Faults", val: currentBatch.failed_count, color: "text-destructive" },
              ].map((stat, i) => (
                <div key={i} className="bg-background/50 p-4 rounded-2xl border border-border/10 text-center space-y-1">
                  <stat.icon className={cn("h-4 w-4 mx-auto mb-1 opacity-40", stat.color)} />
                  <p className="text-xl font-black italic tracking-tighter leading-none">{stat.val}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest opacity-40">{stat.label}</p>
                </div>
              ))}
            </div>

            {currentBatch.status === "completed" && (
              <div className="flex justify-end gap-3 pt-4 border-t border-border/10">
                {currentBatch.failed_count > 0 && (
                  <Button
                    variant="ghost"
                    onClick={() => setShowErrorLog(true)}
                    className="h-10 px-6 font-black uppercase text-[10px] tracking-widest text-destructive"
                  >
                    Review Fault Log
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowProgress(false)}
                  className="rounded-xl h-10 px-6 border-2 font-black uppercase text-[10px] tracking-widest gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Terminate Session
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <Dialog open={showErrorLog} onOpenChange={setShowErrorLog}>
        <DialogContent className="max-w-3xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-destructive/40" />
          <div className="p-10">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                Exception Log Trace
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[400px] rounded-[32px] border-2 border-border/40 p-8 bg-card/50 shadow-inner">
              <div className="space-y-4">
                {(currentBatch?.error_log as any[])?.map((err, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-destructive/5 border-2 border-destructive/10 group">
                    <p className="font-mono text-[10px] text-destructive/40 mb-2 uppercase tracking-widest">
                      Entry_{idx.toString().padStart(3, "0")}
                    </p>
                    <p className="font-black text-sm uppercase tracking-tight italic truncate mb-1">
                      {err.url || err.email}
                    </p>
                    <p className="text-[11px] font-medium text-muted-foreground italic leading-relaxed">
                      System Fault: {err.error}
                    </p>
                  </div>
                )) || <div className="text-center py-20 opacity-20 italic">No exceptions recorded.</div>}
              </div>
            </ScrollArea>
            <div className="flex justify-end pt-8">
              <Button
                onClick={() => setShowErrorLog(false)}
                className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest"
              >
                Acknowledge
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
