import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { trackError, trackEvent } from "@/lib/errorTracking";

interface CircularMatchBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  contextData?: {
    talentId?: string;
    jobId?: string;
    companyId?: string;
  };
}

/**
 * Animated circular badge representing a talent match score compatibility percentage.
 * Integrates automated high-value candidate signal tracking into systemic logs.
 */
export function CircularMatchBadge({ score, size = "md", className, contextData }: CircularMatchBadgeProps) {
  const thresholdConfig = {
    high: { color: "text-emerald-500", stroke: "stroke-emerald-500", threshold: 80 },
    medium: { color: "text-amber-500", stroke: "stroke-amber-500", threshold: 60 },
    low: { color: "text-muted-foreground/60", stroke: "stroke-muted/40", threshold: 0 },
  };

  // Ensure values fall strictly within a manageable 0-100 numerical array block
  const sanitizedScore = Math.max(0, Math.min(100, isNaN(score) ? 0 : score));

  const getActiveVariant = () => {
    if (sanitizedScore >= thresholdConfig.high.threshold) return thresholdConfig.high;
    if (sanitizedScore >= thresholdConfig.medium.threshold) return thresholdConfig.medium;
    return thresholdConfig.low;
  };

  const activeVariant = getActiveVariant();

  const dimensions = {
    sm: { size: 36, stroke: 3, radius: 14, fontSize: "text-[10px]" },
    md: { size: 44, stroke: 3.5, radius: 17, fontSize: "text-xs" },
    lg: { size: 56, stroke: 4, radius: 22, fontSize: "text-sm" },
  };

  const currentLayout = dimensions[size];
  const circumference = 2 * Math.PI * currentLayout.radius;
  const strokeDashoffset = circumference - (sanitizedScore / 100) * circumference;

  useEffect(() => {
    // Flag payload boundary errors silently via logging channels
    if (isNaN(score) || score < 0 || score > 100) {
      trackError(`Match score validation failure: raw payload score is out of bounds [${score}]`, {
        component: "CircularMatchBadge",
        action: "lifecycle_mount",
        ...contextData,
      });
      return;
    }

    // High-value recruitment routing signal: track exceptional match profiles
    if (score >= 90 && contextData?.talentId && contextData?.jobId) {
      trackEvent("high_value_match_detected", { ...contextData, score });
    }
  }, [score, contextData]);

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0 animate-in fade-in zoom-in-95 duration-500 select-none",
        className,
      )}
      style={{ width: currentLayout.size, height: currentLayout.size }}
    >
      <svg className="w-full h-full -rotate-90 transform-gpu" viewBox={`0 0 ${currentLayout.size} ${currentLayout.size}`}>
        {/* Background track indicator */}
        <circle
          cx={currentLayout.size / 2}
          cy={currentLayout.size / 2}
          r={currentLayout.radius}
          fill="none"
          className="stroke-muted/20"
          strokeWidth={currentLayout.stroke}
        />
        {/* Foreground progress matching segment */}
        <circle
          cx={currentLayout.size / 2}
          cy={currentLayout.size / 2}
          r={currentLayout.radius}
          fill="none"
          className={cn("transition-all duration-[1500ms] ease-in-out", activeVariant.stroke)}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: strokeDashoffset,
          }}
          strokeWidth={currentLayout.stroke}
          strokeLinecap="round"
        />
      </svg>

      {/* Numeric text value rendering box */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center font-bold tabular-nums tracking-tight",
          currentLayout.fontSize,
          activeVariant.color,
        )}
      >
        <span className="flex items-start">
          {sanitizedScore}
          <span className="text-[0.55em] mt-0.5 ml-0.5 font-medium opacity-70">%</span>
        </span>
      </div>
    </div>
  );
}