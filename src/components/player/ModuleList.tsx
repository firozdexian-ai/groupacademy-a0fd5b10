import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Circle, Play, Zap, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Curriculum Content Registry
 * CTO Reference: Authoritative sidebar for trajectory navigation and module verification.
 */

interface Module {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  display_order: number;
  is_preview: boolean;
}

interface Progress {
  module_id: string;
  completed_at: string | null;
}

interface ModuleListProps {
  modules: Module[];
  progress: Progress[];
  currentModuleId?: string;
  onModuleSelect: (module: Module) => void;
}

export function ModuleList({ modules, progress, currentModuleId, onModuleSelect }: ModuleListProps) {
  // PROTOCOL: Verified Node Check
  const isCompleted = (moduleId: string) => {
    return progress.some((p) => p.module_id === moduleId && p.completed_at);
  };

  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-full">
      <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
        <CardTitle className="text-sm font-black uppercase italic tracking-[0.2em] flex items-center gap-3">
          <Zap className="h-4 w-4 text-primary fill-current" /> Curriculum_Registry
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-[600px] lg:h-full">
          <div className="p-5 space-y-3">
            {modules.map((module) => {
              const completed = isCompleted(module.id);
              const isCurrent = module.id === currentModuleId;

              return (
                <button
                  key={module.id}
                  onClick={() => onModuleSelect(module)}
                  className={cn(
                    "w-full text-left p-4 rounded-[22px] border-2 transition-all duration-500 group",
                    "flex items-start gap-4",
                    isCurrent
                      ? "bg-primary/10 border-primary shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)] scale-[1.02]"
                      : "bg-background/40 border-transparent hover:border-primary/20 hover:bg-background hover:-translate-y-0.5 active:scale-[0.98]",
                  )}
                >
                  {/* NODE_STATUS_INDICATOR */}
                  <div className="mt-1 shrink-0">
                    {completed ? (
                      <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-500">
                        <ShieldCheck className="h-5 w-5 stroke-[2.5px]" />
                      </div>
                    ) : isCurrent ? (
                      <div className="p-1 rounded-full bg-primary text-white shadow-lg animate-pulse">
                        <Play className="h-5 w-5 fill-current" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-full text-muted-foreground/30 group-hover:text-primary/40 transition-colors">
                        <Circle className="h-5 w-5 stroke-[2.5px]" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <p
                      className={cn(
                        "text-xs font-black uppercase italic tracking-tight leading-tight truncate transition-colors",
                        isCurrent ? "text-primary" : "text-foreground/80",
                        completed && !isCurrent && "text-emerald-600/70",
                      )}
                    >
                      {module.title}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      {module.duration_minutes && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                          <Clock className="h-3 w-3" />
                          <span>{module.duration_minutes}_MIN_SYNC</span>
                        </div>
                      )}
                      {completed && (
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-tighter italic">
                          Verified_Node
                        </span>
                      )}
                    </div>
                  </div>

                  {isCurrent && (
                    <div className="ml-auto flex items-center h-full">
                      <Zap className="h-3 w-3 text-primary animate-bounce" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
