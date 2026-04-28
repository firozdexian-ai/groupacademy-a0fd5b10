import {
  PlayCircle,
  BookOpen,
  MessageSquare,
  Brain,
  ClipboardCheck,
  Award,
  Lock,
  Check,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Sequential Trajectory Controller
 * CTO Reference: Authoritative 6-stage navigation protocol for curriculum nodes.
 */

export interface StageInfo {
  number: number;
  name: string;
  icon: typeof PlayCircle;
  isCompleted: boolean;
  isLocked: boolean;
  isCurrent: boolean;
}

const stageConfig = [
  { number: 1, name: "ORIENTATION", icon: PlayCircle },
  { number: 2, name: "LEARN", icon: BookOpen },
  { number: 3, name: "DISCUSS", icon: MessageSquare },
  { number: 4, name: "PRACTICE", icon: Brain },
  { number: 5, name: "ASSESS", icon: ClipboardCheck },
  { number: 6, name: "PROGRESS_SYNC", icon: Award },
];

interface StageNavigationProps {
  currentStage: number;
  completedStages: number[];
  onStageSelect: (stage: number) => void;
  className?: string;
}

export function StageNavigation({ currentStage, completedStages, onStageSelect, className }: StageNavigationProps) {
  const stages: StageInfo[] = stageConfig.map((stage) => ({
    ...stage,
    isCompleted: completedStages.includes(stage.number),
    isLocked: stage.number > 1 && !completedStages.includes(stage.number - 1) && stage.number !== currentStage,
    isCurrent: stage.number === currentStage,
  }));

  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2 p-1", className)}>
      {stages.map((stage, index) => {
        const Icon = stage.icon;
        const isClickable = !stage.isLocked;

        return (
          <div key={stage.number} className="flex items-center group">
            <button
              onClick={() => isClickable && onStageSelect(stage.number)}
              disabled={stage.isLocked}
              className={cn(
                "relative flex flex-col sm:flex-row items-center gap-2 px-3 py-2.5 rounded-[14px] transition-all duration-500 text-[9px] sm:text-[10px] font-black uppercase italic tracking-widest w-full sm:w-auto border-2",
                stage.isCurrent
                  ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105 z-10"
                  : "bg-background/40 backdrop-blur-md border-border/40",
                stage.isCompleted &&
                  !stage.isCurrent &&
                  "border-emerald-500/20 text-emerald-600 bg-emerald-500/5 hover:border-emerald-500/40",
                stage.isLocked && "opacity-30 grayscale cursor-not-allowed border-transparent",
                !stage.isCurrent &&
                  !stage.isCompleted &&
                  !stage.isLocked &&
                  "hover:border-primary/20 hover:bg-muted/50",
              )}
            >
              {/* STAGE_GLOW: Subtle interactive background for current node */}
              {stage.isCurrent && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-[12px]" />
              )}

              <div className="shrink-0">
                {stage.isLocked ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : stage.isCompleted ? (
                  <ShieldCheck className="h-4 w-4 stroke-[2.5px]" />
                ) : stage.isCurrent ? (
                  <Zap className="h-4 w-4 fill-current" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              <span className="truncate">{stage.name}</span>
            </button>

            {/* TRAJECTORY_CONNECTOR */}
            {index < stages.length - 1 && (
              <div
                className={cn(
                  "hidden sm:block w-6 h-[2px] transition-colors duration-1000",
                  completedStages.includes(stage.number) ? "bg-emerald-500/40" : "bg-border/20",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
