import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame } from "lucide-react";

export function StreakBadge({ current, longest }: { current: number; longest: number }) {
  if (!current || current < 2) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-xs font-medium">
          <Flame className="h-3 w-3" /> {current}d
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Posting streak: {current} days · Best: {longest}</p>
      </TooltipContent>
    </Tooltip>
  );
}
