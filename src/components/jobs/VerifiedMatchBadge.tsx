import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface VerifiedCredential {
  topic_tag: string;
  level: string;
  verify_code?: string;
}

interface VerifiedMatchBadgeProps {
  credentials?: VerifiedCredential[];
  masteryScore?: number;
  className?: string;
  compact?: boolean;
}

export function VerifiedMatchBadge({
  credentials = [],
  masteryScore = 0,
  className,
  compact,
}: VerifiedMatchBadgeProps) {
  const hasCredentials = credentials.length > 0;
  const hasMastery = masteryScore >= 60;
  if (!hasCredentials && !hasMastery) return null;

  const label = hasCredentials
    ? `${credentials.length} verified skill${credentials.length > 1 ? "s" : ""}`
    : `${masteryScore}% verified mastery`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              compact ? "text-[9px] h-5 font-bold uppercase tracking-wide" : "text-[10px] font-semibold",
              className,
            )}
          >
            <ShieldCheck className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
            {compact ? "Verified" : label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs font-semibold mb-1">Verified skill match</p>
          {hasCredentials ? (
            <ul className="text-xs space-y-0.5">
              {credentials.slice(0, 5).map((c) => (
                <li key={c.topic_tag + c.level}>
                  • {c.topic_tag} <span className="opacity-60">({c.level})</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs">Mastery score: {masteryScore}/100</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
