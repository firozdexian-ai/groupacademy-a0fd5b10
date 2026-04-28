import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Trash2, ShieldCheck, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Identity Artifact Provisioner (ProfilePhotoUpload)
 * CTO Reference: Authoritative node for profile photo ingestion and sync.
 */

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  fullName?: string;
  onPhotoChange: (url: string | null) => void;
}

export function ProfilePhotoUpload({ currentPhotoUrl, fullName, onPhotoChange }: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PROTOCOL: Neural Identity Initials
  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleArtifactIngestion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // VALIDATION: Format Protocol
    if (!file.type.startsWith("image/")) {
      toast.error("Format Rejected: Node requires image artifact.");
      return;
    }

    // VALIDATION: Payload Threshold
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Payload Exceeded: Artifact must be < 5MB.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Synchronizing identity artifact...");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // STORAGE EXECUTION
      const { error: uploadError } = await supabase.storage.from("portfolio-uploads").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("portfolio-uploads").getPublicUrl(filePath);

      setPreviewUrl(publicUrl);
      onPhotoChange(publicUrl);
      toast.success("Identity Node Synced", { id: toastId });
    } catch (error: any) {
      console.error("[Registry Fault]:", error);
      toast.error(error.message || "Transmission Fault", { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleTermination = () => {
    setPreviewUrl(null);
    onPhotoChange(null);
    toast.success("Identity Artifact Purged");
  };

  return (
    <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
      <div className="relative group">
        {/* IDENTITY: Visual Node */}
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-background shadow-2xl transition-all duration-500 group-hover:ring-4 group-hover:ring-primary/20">
            <AvatarImage src={previewUrl || undefined} alt={fullName || "Identity"} className="object-cover" />
            <AvatarFallback className="text-3xl font-black italic bg-primary/5 text-primary border-2 border-primary/20 backdrop-blur-md">
              {getInitials(fullName)}
            </AvatarFallback>
          </Avatar>

          {/* SYNC INDICATOR */}
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 shadow-lg">
            <div
              className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center",
                previewUrl ? "bg-emerald-500" : "bg-primary/20",
              )}
            >
              <ShieldCheck className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>

        {/* LOADING OVERLAY */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl rounded-full z-10 border-4 border-primary/20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-[8px] font-black uppercase tracking-widest text-primary mt-2">Syncing...</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleArtifactIngestion}
        className="hidden"
        disabled={isUploading}
      />

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-10 px-6 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 shadow-lg active:scale-95 transition-all"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Camera className="h-4 w-4" />
          {previewUrl ? "Update_Artifact" : "Ingest_Identity"}
        </Button>

        {previewUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleTermination}
            disabled={isUploading}
            className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10 transition-colors active:scale-90"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 rounded-full border border-border/10">
        <Zap className="h-3 w-3 text-amber-500 fill-current animate-pulse" />
        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
          Optimized JPG/PNG/GIF | Max 5MB
        </p>
      </div>
    </div>
  );
}
