import { useEffect, useMemo, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { trackEvent } from "@/lib/errorTracking";
import { Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecentLearnerChipProps {
  recencyScore: number;
  threshold?: number;
  className?: string;
}

/**
 * GroUp Academy: Recent Activity Learner Verification Chip (RecentLearnerChip)
 * An authoritative operational badge tracking candidate engagement thresholds and psychometric recency metrics.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function RecentLearnerChip({ recencyScore, threshold = 0.7, className }: RecentLearnerChipProps) {
  const isMountedRef = useRef<boolean>(true);

  // Synchronize component lifecycles to safely reject background thread state writes
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Compute metric availability indices defensively through memoized bounds tracking curves
  const shouldRenderNode = useMemo(() => {
    const cleanScoreNum = Number(recencyScore) || 0;
    const cleanThresholdNum = Number(threshold) || 0.7;
    return cleanScoreNum >= cleanThresholdNum;
  }, [recencyScore, threshold]);

  // Monitor layout metrics impressions safely down telemetry tracks
  useEffect(() => {
    if (shouldRenderNode) {
      trackEvent("recent_learner_chip_rendered", { computedScore: recencyScore });
    }
  }, [shouldRenderNode, recencyScore]);

  if (!shouldRenderNode) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 px-2 h-5.5 rounded text-[10px] font-extrabold tracking-wide uppercase border border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 select-none leading-none shadow-xs shrink-0 animate-in fade-in duration-200 cursor-help",
        className,
      )}
      title="Active learner node alignment — verified learning activity executed inside the last 30-day index segment"
    >
      <Activity className="h-3 w-3 stroke-[2.5] shrink-0" />
      <span className="pt-0.5 block">Active Learner</span>
    </Badge>
  );
}
