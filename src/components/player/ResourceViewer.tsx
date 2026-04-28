import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ExternalLink,
  CheckCircle,
  Download,
  X,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Multi-Modal Artifact Interface
 * CTO Reference: Authoritative node for visual, auditory, and document synchronization.
 */

interface ResourceViewerProps {
  type: "video" | "slides" | "infographic" | "mindmap" | "audio_podcast";
  url: string;
  title: string;
  onProgress?: (progress: number) => void;
  onComplete?: (total_yield?: number) => void;
  className?: string;
}

export function ResourceViewer({ type, url, title, onProgress, onComplete, className }: ResourceViewerProps) {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioMuted, setAudioMuted] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // REGISTRY: Document Detection
  const isPDF = url?.toLowerCase().includes(".pdf");

  const getViewerUrl = (docUrl: string) => {
    if (isPDF || type === "slides") {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`;
    }
    return docUrl;
  };

  const getYouTubeId = (youtubeUrl: string) => {
    const match = youtubeUrl.match(
      /(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([\w-]{11})/,
    );
    return match ? match[1] : null;
  };

  const handleAudioSyncUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
      onProgress?.(progress);

      // Threshold: 80% Synchronization for Verification
      if (progress >= 80) {
        onComplete?.(100);
      }
    }
  };

  const toggleAudioHandshake = () => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setAudioPlaying(!audioPlaying);
    }
  };

  // NODE: VIDEO_TRAJECTORY
  if (type === "video") {
    const videoId = getYouTubeId(url);
    if (!videoId) {
      return (
        <Card className={cn("rounded-[32px] border-2 border-dashed border-destructive/20 bg-destructive/5", className)}>
          <CardContent className="p-8 text-center flex flex-col items-center gap-3">
            <Zap className="h-8 w-8 text-destructive/40" />
            <p className="text-[10px] font-black uppercase tracking-widest text-destructive">
              Artifact_Sync_Fault: Invalid_ID
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn("overflow-hidden rounded-[32px] border-2 border-border/40 bg-card/30 shadow-2xl", className)}>
        <div className="aspect-video bg-black/20">
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1&modestbranding=1`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <CardContent className="p-5 flex items-center justify-between bg-muted/5 border-t border-border/10">
          <p className="text-xs font-black uppercase italic tracking-tighter text-foreground/80 truncate mr-4">
            {title}
          </p>
          {onComplete && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onComplete(100)}
              className="h-8 rounded-xl border-2 font-black uppercase italic text-[9px] tracking-widest gap-2 shadow-lg active:scale-95 transition-all"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Mark_Verified
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // NODE: DOCUMENT_AUDIT
  if (type === "slides") {
    const viewerUrl = getViewerUrl(url);
    return (
      <>
        <Card
          className={cn(
            "overflow-hidden rounded-[32px] border-2 border-border/40 bg-card/30 shadow-2xl group",
            className,
          )}
        >
          <div className="aspect-video bg-muted relative">
            <iframe src={viewerUrl} title={title} className="w-full h-full" allowFullScreen />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm flex items-center justify-center gap-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setFullscreenOpen(true)}
                className="h-10 px-5 rounded-xl font-black uppercase italic text-[10px] shadow-2xl"
              >
                <Maximize className="h-4 w-4 mr-2" /> Audit_Fullscreen
              </Button>
              <Button variant="secondary" size="sm" asChild className="h-10 w-10 rounded-xl shadow-2xl p-0">
                <a href={url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
          <CardContent className="p-5 flex items-center justify-between border-t border-border/10 bg-muted/5">
            <p className="text-xs font-black uppercase italic tracking-tighter text-foreground/80 truncate flex-1">
              {title}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 font-black uppercase italic text-[9px] tracking-widest opacity-40 hover:opacity-100"
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  External_Ingress <ExternalLink className="h-3 w-3 ml-1.5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
          <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full p-0 border-0 bg-background/95 backdrop-blur-2xl rounded-none">
            <DialogTitle className="sr-only">{title}</DialogTitle>
            <div className="relative w-full h-full flex flex-col">
              <div className="flex items-center justify-between p-4 bg-muted/10 border-b border-border/10">
                <p className="text-[10px] font-black uppercase italic tracking-widest text-primary">
                  Fullscreen_Audit_Active
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setFullscreenOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <iframe src={viewerUrl} title={title} className="w-full flex-1" allowFullScreen />
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // NODE: VISUAL_MODEL
  if (type === "infographic" || type === "mindmap") {
    return (
      <Card
        className={cn(
          "overflow-hidden rounded-[32px] border-2 border-border/40 bg-card/30 shadow-2xl group",
          className,
        )}
      >
        <CardContent className="p-0">
          <div className="relative cursor-zoom-in overflow-hidden" onClick={() => window.open(url, "_blank")}>
            <img
              src={url}
              alt={title}
              className="w-full h-auto transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                className="h-10 px-6 rounded-xl font-black uppercase italic text-[10px]"
              >
                <Maximize className="h-4 w-4 mr-2" /> Ingest_Full_Node
              </Button>
            </div>
          </div>
          <div className="p-5 border-t border-border/10 bg-muted/5">
            <p className="text-xs font-black uppercase italic tracking-tighter text-foreground/80">{title}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // NODE: AUDITORY_ARTIFACT
  if (type === "audio_podcast") {
    return (
      <Card className={cn("rounded-[28px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-xl", className)}>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="h-4 w-4 fill-current" />
            </div>
            <p className="text-xs font-black uppercase italic tracking-tighter text-foreground/80 truncate">{title}</p>
          </div>

          <audio
            ref={audioRef}
            src={url}
            onTimeUpdate={handleAudioSyncUpdate}
            onEnded={() => {
              setAudioPlaying(false);
              onComplete?.(100);
            }}
            className="hidden"
          />

          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleAudioHandshake}
              className="h-14 w-14 rounded-2xl border-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95"
            >
              {audioPlaying ? (
                <Pause className="h-6 w-6 fill-current" />
              ) : (
                <Play className="h-6 w-6 fill-current ml-1" />
              )}
            </Button>

            <div className="flex-1 space-y-2">
              <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-muted-foreground italic">
                <span>Auditory_Yield</span>
                <span className="tabular-nums text-primary">{Math.round(audioProgress)}%</span>
              </div>
              <div className="h-2 bg-primary/10 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-primary transition-all duration-1000 ease-out"
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !audioMuted;
                  setAudioMuted(!audioMuted);
                }
              }}
            >
              {audioMuted ? (
                <VolumeX className="h-5 w-5 text-destructive" />
              ) : (
                <Volume2 className="h-5 w-5 text-primary" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
