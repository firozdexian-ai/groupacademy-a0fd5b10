import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import { trackError, trackEvent } from "@/lib/errorTracking";

interface SkillTagBadgeProps {
  skills: string[];
  maxVisible?: number;
  className?: string;
  contextData?: {
    postId?: string;
    talentId?: string;
  };
}

/**
 * Component to render a clean row of skill badges.
 * Automatically slices arrays exceeding visibility thresholds and provides an overflow badge.
 */
export function SkillTagBadge({ skills = [], maxVisible = 3, className, contextData }: SkillTagBadgeProps) {
  
  // Guard against excessive array lengths and log visibility metrics
  useEffect(() => {
    if (skills && Array.isArray(skills)) {
      if (skills.length > 25) {
        trackError(`Abnormally large skill array density detected inside UI container: [${skills.length}]`, {
          component: "SkillTagBadge",
          action: "payload_density_check",
          arrayLength: skills.length,
          ...contextData,
        });
      } else if (skills.length > 0) {
        trackEvent("skill_tag_badge_rendered", {
          totalSkillsCount: skills.length,
          visibleSliceLimit: maxVisible,
          ...contextData,
        });
      }
    }
  }, [skills, maxVisible, contextData]);

  if (!skills || !Array.isArray(skills) || skills.length === 0) return null;

  const visibleSkills = skills.slice(0, maxVisible);
  const remaining = skills.length - maxVisible;

  return (
    <div
      className={cn(
        "flex flex-wrap gap-1.5 items-center select-none antialiased animate-in fade-in duration-300 w-full max-w-full",
        className,
      )}
    >
      {visibleSkills.map((skill, index) => {
        if (typeof skill !== "string") return null;
        const sanitizedSkill = skill.trim();
        if (!sanitizedSkill) return null;

        return (
          <div
            key={`${sanitizedSkill}-${index}`}
            title={sanitizedSkill}
            className={cn(
              "px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all duration-200 transform-gpu cursor-default",
              "bg-primary/5 text-primary border border-primary/10 dark:border-primary/20",
              "hover:bg-primary/10 tracking-tight flex items-center gap-1.5 max-w-[150px] truncate text-ellipsis",
            )}
          >
            <Zap className="h-3 w-3 opacity-70 shrink-0 text-primary/80 fill-primary/5 animate-pulse" />
            <span className="truncate text-ellipsis w-full select-text selection:bg-primary/20">{sanitizedSkill}</span>
          </div>
        );
      })}

      {/* Overflow item count badge */}
      {remaining > 0 && (
        <span
          className={cn(
            "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl select-none tabular-nums shrink-0",
            "bg-muted/30 dark:bg-muted/10 text-muted-foreground/90 border border-dashed border-border/40 shadow-sm",
          )}
        >
          +{remaining} more
        </span>
      )}
    </div>
  );
}
