import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Lock, PlayCircle, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Modular Progression Ledger
 * CTO Reference: Authoritative navigation hub for linear trajectory enforcement.
 */

interface Module {
  id: string;
  title: string;
  description?: string | null;
  display_order?: number | null;
  duration_minutes?: number | null;
}

interface ModuleProgress {
  completedStages: number[];
  isComplete: boolean;
}

interface ImmersiveModuleListProps {
  modules: Module[];
  currentModuleId: string | undefined;
  moduleProgress: Record<string, ModuleProgress>;
  onModuleSelect: (moduleId: string) => void;
}

export function ImmersiveModuleList({
  modules,
  currentModuleId,
  moduleProgress,
  onModuleSelect,
}: ImmersiveModuleListProps) {
  // PROTOCOL: Linear Trajectory Enforcement
  const isModuleUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevModule = modules[index - 1];
    return moduleProgress[prevModule.id]?.isComplete || false;
  };

  const getModuleStageProgress = (moduleId: string) => {
    const progress = moduleProgress[moduleId];
    if (!progress) return 0;
    // Normalized against our 6-stage institutional framework
    return (progress.completedStages.length / 6) * 100;
  };

  return (
    <Card className="h-full rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
      <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
        <CardTitle className="text-sm font-black uppercase italic tracking-[0.2em] flex items-center gap-3">
          <Zap className="h-4 w-4 text-primary fill-current" /> Curriculum_Nodes
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-5 space-y-3">
            {modules.map((module, index) => {
              const isUnlocked = isModuleUnlocked(index);
              const isCurrent = module.id === currentModuleId;
              const progress = getModuleStageProgress(module.id);
              const isComplete = moduleProgress[module.id]?.isComplete;

              return (
                <button
                  key={module.id}
                  onClick={() => isUnlocked && onModuleSelect(module.id)}
                  disabled={!isUnlocked}
                  className={cn(
                    "w-full text-left p-4 rounded-[22px] transition-all duration-500 border-2",
                    isCurrent
                      ? "bg-primary/10 border-primary shadow-[0_0_25px_-5px_rgba(var(--primary),0.2)]"
                      : "border-transparent",
                    !isCurrent &&
                      isUnlocked &&
                      "bg-muted/40 hover:bg-background hover:border-primary/20 hover:-translate-y-0.5",
                    !isUnlocked && "bg-muted/10 opacity-40 cursor-not-allowed grayscale",
                  )}
                >
                  <div className="flex items-start gap-4">
                    {/* NODE_STATUS_INDICATOR */}
                    <div
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg transition-transform duration-700",
                        isComplete && "bg-emerald-500 text-white",
                        isCurrent && !isComplete && "bg-primary text-primary-foreground animate-pulse",
                        !isCurrent &&
                          !isComplete &&
                          isUnlocked &&
                          "bg-background border border-border/40 text-muted-foreground",
                        !isUnlocked && "bg-muted text-muted-foreground/30",
                      )}
                    >
                      {isComplete ? (
                        <ShieldCheck className="h-5 w-5" />
                      ) : !isUnlocked ? (
                        <Lock className="h-4 w-4" />
                      ) : isCurrent ? (
                        <PlayCircle className="h-5 w-5" />
                      ) : (
                        <span className="text-[10px] font-black">{String(index + 1).padStart(2, "0")}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pt-1">
                      <p
                        className={cn(
                          "text-xs font-black uppercase italic tracking-tight truncate leading-none",
                          isCurrent ? "text-primary" : "text-foreground/80",
                          !isUnlocked && "text-muted-foreground",
                        )}
                      >
                        {module.title}
                      </p>

                      {isUnlocked && (
                        <div className="mt-3 space-y-2 animate-in fade-in duration-1000">
                          <div className="flex items-center justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                            <span>{Math.round(progress)}%_SYNCED</span>
                            <span className="italic">
                              {moduleProgress[module.id]?.completedStages.length || 0}/6_STAGES
                            </span>
                          </div>
                          <Progress value={progress} className="h-1 rounded-full bg-primary/10 shadow-inner" />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
