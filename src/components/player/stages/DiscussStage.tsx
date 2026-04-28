import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResourceViewer } from "../ResourceViewer";
import { AIChatPanel } from "@/components/ai-instructor/AIChatPanel";
import { CheckCircle, MessageSquare, Headphones, Bot, Zap, ShieldCheck } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Knowledge Synthesis Node (DiscussStage)
 * CTO Reference: Authoritative node for bimodal discussion and AI interaction.
 */

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

interface DiscussStageProps {
  resources: ModuleResource[];
  onComplete: () => void;
  isCompleted: boolean;
  professionLineId: string;
  moduleId: string;
  instructorName?: string;
}

export function DiscussStage({
  resources,
  onComplete,
  isCompleted,
  professionLineId,
  moduleId,
  instructorName = "AI_INSTRUCTOR_V3",
}: DiscussStageProps) {
  const [audioListened, setAudioListened] = useState(false);
  const [aiMessageCount, setAiMessageCount] = useState(0);

  const audioResource = resources.find((r) => r.resource_type === "audio_podcast");

  // PROTOCOL: Bimodal Completion Logic
  const canComplete = audioListened || aiMessageCount >= 3 || resources.length === 0;

  const handleAudioSync = () => {
    setAudioListened(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-left">
      {/* HUD: STAGE_HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3 text-foreground">
            <MessageSquare className="h-6 w-6 text-primary" /> Stage_03: Knowledge_Synthesis
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Deepen understanding via Auditory Artifacts or Neural Dialogue
          </p>
        </div>
        {isCompleted && (
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center gap-2 text-emerald-500 shadow-lg">
            <ShieldCheck className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Node_Verified</span>
          </div>
        )}
      </div>

      {!resources.length && !professionLineId ? (
        <Card className="border-2 border-dashed border-border/40 bg-muted/5 rounded-[40px] p-24 text-center">
          <div className="flex flex-col items-center gap-6">
            <Zap className="h-12 w-12 text-muted-foreground/20 animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
              Registry_Empty: No_Discussion_Content
            </p>
            <Button
              onClick={onComplete}
              className="h-12 px-10 rounded-2xl font-black uppercase italic tracking-[0.2em] shadow-2xl"
            >
              Sync_Next_Stage
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-2">
          {/* COMPONENT: AUDITORY_ARTIFACT */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <Headphones className="h-4 w-4 text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60 italic">
                Auditory_Sync
              </h3>
            </div>

            {audioResource ? (
              <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden hover:border-primary/20 transition-all shadow-xl">
                <CardHeader className="p-6 pb-3 border-b border-border/10">
                  <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Headphones className="h-4 w-4" />
                    </div>
                    {audioResource.title}
                    {audioListened && <CheckCircle className="h-4 w-4 text-emerald-500 animate-in zoom-in" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {audioResource.resource_url && (
                    <ResourceViewer
                      type="audio_podcast"
                      url={audioResource.resource_url}
                      title={audioResource.title}
                      onComplete={handleAudioSync}
                    />
                  )}
                  {audioResource.description && (
                    <p className="text-xs font-medium text-muted-foreground mt-4 leading-relaxed italic opacity-70">
                      {audioResource.description}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-[32px] border-2 border-dashed border-border/20 bg-muted/5 flex flex-col items-center justify-center p-12 text-center">
                <Headphones className="h-10 w-10 text-muted-foreground/10 mb-4" />
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30 italic">
                  No_Audio_Node_Active
                </p>
              </Card>
            )}

            {/* TELEMETRY_HINT */}
            <Card className="rounded-[24px] border-2 border-primary/20 bg-primary/5 shadow-inner">
              <CardContent className="p-5 space-y-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest italic">
                  <span className="text-primary">Executive_Guidance:</span> Complete this stage by synchronizing with
                  the Audio Podcast OR initiating a conversation with the {instructorName}.
                </p>
                <div className="flex gap-6">
                  <div
                    className={cn(
                      "flex items-center gap-2 text-[9px] font-black uppercase italic tracking-tighter transition-colors",
                      audioListened ? "text-emerald-500" : "text-muted-foreground/40",
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                        audioListened ? "border-emerald-500 bg-emerald-500/10" : "border-border/40",
                      )}
                    >
                      {audioListened && "✓"}
                    </div>{" "}
                    AUDIO_SYNCED
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-2 text-[9px] font-black uppercase italic tracking-tighter transition-colors",
                      aiMessageCount >= 3 ? "text-emerald-500" : "text-muted-foreground/40",
                    )}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                        aiMessageCount >= 3 ? "border-emerald-500 bg-emerald-500/10" : "border-border/40",
                      )}
                    >
                      {aiMessageCount >= 3 && "✓"}
                    </div>{" "}
                    NEURAL_BURST: {aiMessageCount}/3
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* COMPONENT: NEURAL_INTERFACE */}
          <div className="space-y-6 flex flex-col h-full">
            <div className="flex items-center gap-3 px-1">
              <Bot className="h-4 w-4 text-primary" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/60 italic">
                Neural_Dialogue
              </h3>
            </div>
            <Card className="flex-1 min-h-[450px] rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col hover:border-primary/20 transition-all">
              <CardHeader className="p-6 pb-3 border-b border-border/10 shrink-0">
                <CardTitle className="text-sm font-black uppercase italic tracking-tight flex items-center gap-3 text-foreground">
                  <Bot className="h-5 w-5 text-primary" /> Synchronize_With_{instructorName}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0 relative">
                <AIChatPanel
                  professionLineId={professionLineId}
                  contextType="module"
                  contextId={moduleId}
                  instructorName={instructorName}
                  placeholder="Initiate knowledge inquiry..."
                  className="h-full border-0 rounded-none bg-transparent"
                  onMessageSent={() => setAiMessageCount((prev) => prev + 1)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* FOOTER: ACTION_INGRESS */}
      {!isCompleted && (
        <div className="flex justify-end pt-4 border-t-2 border-border/10">
          <Button
            onClick={onComplete}
            disabled={!canComplete}
            className="h-14 px-10 rounded-2xl font-black uppercase italic text-xs tracking-widest shadow-2xl active:scale-95 transition-all gap-3"
          >
            {canComplete ? <Zap className="h-5 w-5 fill-current" /> : <Bot className="h-5 w-5" />}
            {canComplete ? "AUTHORIZE_CONTINUE" : "SYNC_REQUIRED: LISTEN_AUDIO_OR_CHAT_AI"}
          </Button>
        </div>
      )}
    </div>
  );
}
