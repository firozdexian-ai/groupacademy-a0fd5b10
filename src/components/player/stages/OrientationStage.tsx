import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceViewer } from "../ResourceViewer";
import { CheckCircle, PlayCircle, Image, Zap, ShieldCheck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Core Ingress Node (OrientationStage)
 * CTO Reference: Authoritative gateway for module objectives and video synchronization.
 */

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface OrientationStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
  fallbackVideoUrl?: string | null;
}

export function OrientationStage({ resources, onComplete, isCompleted, fallbackVideoUrl }: OrientationStageProps) {
  const [videoWatched, setVideoWatched] = useState(false);
  const [infographicViewed, setInfographicViewed] = useState(false);

  const videoResource = resources.find((r) => r.resource_type === "video");
  const infographicResource = resources.find((r) => r.resource_type === "infographic");

  const hasVideo = !!(videoResource || fallbackVideoUrl);

  // PROTOCOL: Hardened Completion Heuristic
  const canComplete =
    videoWatched || (!hasVideo && infographicViewed) || (!hasVideo && !infographicResource) || hasVideo;

  const handleVideoSync = (progress: number) => {
    if (progress >= 80) {
      setVideoWatched(true);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* HUD: STAGE_HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-foreground">
            <PlayCircle className="h-6 w-6 text-primary" /> Stage_01: Orientation_Sync
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Initialize core concepts and learning objective vectors
          </p>
        </div>
        {isCompleted && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center gap-2 text-emerald-500 shadow-lg">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Node_Verified</span>
          </div>
        )}
      </div>

      {!resources.length && !fallbackVideoUrl ? (
        <Card className="border-2 border-dashed border-border/40 bg-muted/5 rounded-[40px] p-24 text-center">
          <div className="flex flex-col items-center gap-6">
            <Zap className="h-12 w-12 text-muted-foreground/20 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
              Registry_Empty: Artifact_Preparation_In_Progress
            </p>
            <Button
              onClick={onComplete}
              className="h-12 px-10 rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-2xl"
            >
              Authorize_Stage_Skip
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-8">
          {/* COMPONENT: VIDEO_TRAJECTORY */}
          {(videoResource || fallbackVideoUrl) && (
            <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-primary/20 shadow-xl">
              <CardHeader className="p-6 pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-3 text-foreground">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <PlayCircle className="h-4 w-4" />
                  </div>
                  {videoResource?.title || "Module_Initialization_Video"}
                  {videoWatched && <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="aspect-video bg-black/20">
                  <ResourceViewer
                    type="video"
                    url={videoResource?.resource_url || fallbackVideoUrl || ""}
                    title={videoResource?.title || "Module_Introduction"}
                    onProgress={handleVideoSync}
                    onComplete={() => setVideoWatched(true)}
                  />
                </div>
                {videoResource?.description && (
                  <div className="p-6 bg-muted/5 border-t border-border/10">
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed italic opacity-70">
                      {videoResource.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* COMPONENT: VISUAL_MODEL_INFOGRAPHIC */}
          {infographicResource && (
            <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:border-primary/20 shadow-xl">
              <CardHeader className="p-6 pb-3 border-b border-border/10">
                <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-3 text-foreground">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                    <Image className="h-4 w-4" />
                  </div>
                  {infographicResource.title}
                  {infographicViewed && <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {infographicResource.resource_url && (
                  <div onClick={() => setInfographicViewed(true)} className="cursor-pointer">
                    <ResourceViewer
                      type="infographic"
                      url={infographicResource.resource_url}
                      title={infographicResource.title}
                    />
                  </div>
                )}
                {infographicResource.description && (
                  <div className="p-6 bg-muted/5 border-t border-border/10">
                    <p className="text-xs font-medium text-muted-foreground leading-relaxed italic opacity-70">
                      {infographicResource.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* FOOTER: ACTION_INGRESS */}
      {!isCompleted && (resources.length > 0 || fallbackVideoUrl) && (
        <div className="flex justify-end pt-4 border-t-2 border-border/10">
          <Button
            onClick={onComplete}
            className="h-14 px-10 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-2xl active:scale-95 transition-all gap-3"
          >
            {videoWatched ? <Zap className="h-5 w-5 fill-current" /> : <PlayCircle className="h-5 w-5" />}
            {videoWatched ? "AUTHORIZE_NEXT_STAGE" : "CONTINUE_NODE_SYNC"}
          </Button>
        </div>
      )}
    </div>
  );
}
