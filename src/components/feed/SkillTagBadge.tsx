import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

/**
 * GroUp Academy: Skill Artifact Node (SkillTagBadge)
 * CTO Reference: High-fidelity visualization for registered technical skill sets.
 */

interface SkillTagBadgeProps {
  skills: string[];
  maxVisible?: number;
  className?: string;
}

export function SkillTagBadge({ skills, maxVisible = 3, className }: SkillTagBadgeProps) {
  // PROTOCOL: Structural Data Guard
  if (!skills || !Array.isArray(skills) || skills.length === 0) return null;

  const visibleSkills = skills.slice(0, maxVisible);
  const remaining = skills.length - maxVisible;

  return (
    <div className={cn("flex flex-wrap gap-2 items-center animate-in fade-in duration-500", className)}>
      {visibleSkills.map((skill, index) => {
        const sanitizedSkill = skill.trim();
        if (!sanitizedSkill) return null;

        return (
          <div
            key={`${sanitizedSkill}-${index}`}
            title={sanitizedSkill}
            className={cn(
              "group relative px-3 py-1 text-[9px] font-black uppercase italic tracking-[0.1em] rounded-lg transition-all duration-300",
              "bg-primary/5 text-primary border-2 border-primary/10",
              "hover:bg-primary hover:text-white hover:border-primary hover:scale-105 cursor-default shadow-sm",
              "truncate max-w-[130px] flex items-center gap-1.5",
            )}
          >
            <Zap className="h-2.5 w-2.5 fill-current opacity-50 group-hover:opacity-100 transition-opacity" />
            <span className="truncate">{sanitizedSkill}</span>
          </div>
        );
      })}

      {/* METRIC: Remaining Node Counter */}
      {remaining > 0 && (
        <span
          className={cn(
            "px-2.5 py-1 text-[9px] font-black italic rounded-lg uppercase tracking-tighter",
            "bg-muted/30 text-muted-foreground/60 border-2 border-dashed border-border/40",
            "hover:bg-muted hover:text-muted-foreground transition-all duration-300",
          )}
        >
          +{remaining} Nodes
        </span>
      )}
    </div>
  );
}
