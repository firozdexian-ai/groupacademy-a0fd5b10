import React, { useState, useRef } from "react";
import { Upload, X, FileText, Link, AlertCircle, CheckCircle, Loader2, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Lightweight Artifact Ingress Node
 * CTO Reference: Authoritative component for singleton CV deployment and URL mapping.
 */

interface SimpleFileUploadProps {
  onFileUploaded: (url: string) => void;
  onUrlProvided: (url: string) => void;
  currentValue?: string;
  accept?: string;
  maxSizeMB?: number;
}

type UploadMode = "choose" | "uploading" | "url-input" | "success" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
  onFileUploaded,
  onUrlProvided,
  currentValue,
  accept = ".pdf,.doc,.docx",
  maxSizeMB = 10,
}) => {
  const [mode, setMode] = useState<UploadMode>(currentValue ? "success" : "choose");
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState(currentValue || "");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const executeDataIngress = async (file: File) => {
    // PROTOCOL: Data Volume Verification
    if (file.size > maxSizeMB * 1024 * 1024) {
      setMode("error");
      setErrorMessage(`DATA_OVERFLOW: Limit is ${maxSizeMB}MB.`);
      return;
    }

    setMode("uploading");
    setProgress(0);
    setStatusMessage("Syncing_Registry...");

    // PROTOCOL: Deterministic ID Mapping
    const sanitizedName = `NODE_CV_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const targetEndpoint = `${SUPABASE_URL}/storage/v1/object/portfolio-uploads/${sanitizedName}`;

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
        setStatusMessage(`INGRESS_SYNC: ${percent}%`);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicArtifactUrl = `${SUPABASE_URL}/storage/v1/object/public/portfolio-uploads/${sanitizedName}`;
        setUploadedUrl(publicArtifactUrl);
        setMode("success");
        setStatusMessage("SYNC_VERIFIED");
        onFileUploaded(publicArtifactUrl);
      } else {
        setMode("error");
        setErrorMessage(`INGRESS_FAULT_CODE: ${xhr.status}`);
      }
    };

    xhr.onerror = () => {
      setMode("error");
      setErrorMessage("UPLINK_TERMINATED: Possible proxy interference.");
    };

    xhr.timeout = 120000; // 120s Synapse Timeout
    xhr.ontimeout = () => {
      setMode("error");
      setErrorMessage("SYNC_TIMEOUT: Recommend URL_MAPPING fallback.");
    };

    xhr.open("POST", targetEndpoint);
    xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.send(file);
  };

  const executeUrlSync = () => {
    const rawUrl = urlInput.trim();
    if (!rawUrl) return setErrorMessage("SYNC_ID_REQUIRED");

    try {
      new URL(rawUrl); // Protocol validation
      setUploadedUrl(rawUrl);
      setMode("success");
      onUrlProvided(rawUrl);
    } catch {
      setErrorMessage("MALFORMED_URL: Required: https://...");
    }
  };

  // VIEW: CHOOSE_INGRESS_PROTOCOL
  if (mode === "choose") {
    return (
      <div className="space-y-4 animate-in fade-in duration-500">
        <div
          className={cn(
            "group relative border-2 border-dashed border-border/40 rounded-[20px] p-10 text-center cursor-pointer",
            "bg-muted/5 transition-all duration-500 hover:border-primary/40 hover:bg-primary/5 active:scale-95 shadow-inner",
          )}
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => {
            e.preventDefault();
            e.dataTransfer.files[0] && executeDataIngress(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={(e) => e.target.files?.[0] && executeDataIngress(e.target.files[0])}
            className="hidden"
          />
          <div className="h-16 w-16 bg-background rounded-2xl border-2 border-border/10 flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
            <Upload className="h-6 w-6 text-primary/40 group-hover:text-primary transition-colors" />
          </div>
          <p className="text-sm font-black uppercase italic tracking-tighter">Initialize_Binary_Ingress</p>
          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em] mt-2">
            PDF | DOCX | MAX {maxSizeMB}MB
          </p>
        </div>

        <div className="flex items-center gap-4 px-2">
          <div className="flex-1 h-[1px] bg-border/20" />
          <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.5em]">OR_FALLBACK</span>
          <div className="flex-1 h-[1px] bg-border/20" />
        </div>

        <Button
          variant="outline"
          className="w-full h-12 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 hover:bg-muted/10 transition-all"
          onClick={() => setMode("url-input")}
        >
          <Link className="h-4 w-4" /> MAP_EXTERNAL_STORAGE_URL
        </Button>
      </div>
    );
  }

  // VIEW: INGRESS_SYNC_ACTIVE
  if (mode === "uploading") {
    return (
      <div className="border-2 border-primary/20 bg-primary/5 rounded-[24px] p-8 space-y-6 animate-in zoom-in-95 duration-500">
        <div className="flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="flex-1 space-y-3">
            <div className="flex justify-between items-end">
              <p className="text-[10px] font-black uppercase italic text-primary tracking-widest">{statusMessage}</p>
              <span className="text-[10px] font-mono font-bold text-primary/60">{progress}%</span>
            </div>
            <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            xhrRef.current?.abort();
            setMode("choose");
          }}
          className="w-full h-8 text-[9px] font-black uppercase italic tracking-widest text-muted-foreground/60 hover:text-rose-500"
        >
          <X className="h-3 w-3 mr-2" /> ABORT_SYNC
        </Button>
      </div>
    );
  }

  // VIEW: URL_MAPPING_PROTOCOL
  if (mode === "url-input") {
    return (
      <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-500 text-left">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic ml-1">
            Registry_Link_Mapping
          </p>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://drive.google.com/..."
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setErrorMessage("");
              }}
              className="h-12 bg-muted/20 border-2 rounded-xl font-bold italic focus:ring-primary/20"
            />
            <Button className="h-12 px-6 rounded-xl font-black uppercase italic" onClick={executeUrlSync}>
              <ShieldCheck className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {errorMessage && (
          <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest ml-1">{errorMessage}</p>
        )}
        <p className="text-[9px] font-medium leading-relaxed italic text-muted-foreground/40 px-1">
          Authorized domains: Google Drive, Dropbox, OneDrive. Artifact must be public.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMode("choose")}
          className="text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 h-8"
        >
          ← REVERT_TO_BINARY
        </Button>
      </div>
    );
  }

  // VIEW: INGRESS_FAULT
  if (mode === "error") {
    return (
      <div className="space-y-4 animate-in shake-2 duration-500">
        <div className="border-2 border-rose-500/20 bg-rose-500/5 rounded-[20px] p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-rose-500 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs font-black uppercase italic text-rose-500 tracking-tight">Ingress_Registry_Fault</p>
              <p className="text-[10px] font-medium text-muted-foreground italic">{errorMessage}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 rounded-xl border-2 font-black uppercase text-[10px] italic"
            onClick={() => setMode("choose")}
          >
            RETRY_SYNC
          </Button>
          <Button
            className="flex-1 h-12 rounded-xl font-black uppercase text-[10px] italic gap-2"
            onClick={() => setMode("url-input")}
          >
            <Link className="h-4 w-4" /> USE_URL
          </Button>
        </div>
      </div>
    );
  }

  // VIEW: SYNC_VERIFIED
  if (mode === "success") {
    return (
      <div className="border-2 border-emerald-500/20 bg-emerald-500/5 rounded-[24px] p-6 animate-in zoom-in-95 duration-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-lg">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black uppercase italic text-emerald-700 leading-none">Artifact_Synced</p>
              <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1 truncate max-w-[180px]">
                {uploadedUrl.includes("storage") ? "REGISTRY_BINARY_NODE" : "EXTERNAL_MAPPED_URL"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setMode("choose");
              setUploadedUrl("");
              onFileUploaded("");
            }}
            className="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return null;
};
