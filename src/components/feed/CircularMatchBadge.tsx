import { cn } from "@/lib/utils";

interface CircularMatchBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function CircularMatchBadge({ score, size = "md", className }: CircularMatchBadgeProps) {
  // CTO Note: Centralized color logic for system-wide consistency
  const config = {
    high: { color: "text-success", stroke: "stroke-success", threshold: 80 },
    medium: { color: "text-warning", stroke: "stroke-warning", threshold: 60 },
    low: { color: "text-muted-foreground", stroke: "stroke-muted-foreground", threshold: 0 },
  };

  const getVariant = () => {
    if (score >= config.high.threshold) return config.high;
    if (score >= config.medium.threshold) return config.medium;
    return config.low;
  };

  const variant = getVariant();

  const dimensions = {
    sm: { size: 36, stroke: 3, radius: 14, fontSize: "text-[10px]" },
    md: { size: 44, stroke: 3.5, radius: 17, fontSize: "text-xs" },
    lg: { size: 56, stroke: 4, radius: 22, fontSize: "text-sm" },
  };

  const d = dimensions[size];
  const circumference = 2 * Math.PI * d.radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      className={cn("relative flex items-center justify-center shrink-0", className)}
      style={{ width: d.size, height: d.size }}
    >
      <svg
        className="w-full h-full -rotate-90 transform-gpu" // Hardware acceleration
        viewBox={`0 0 ${d.size} ${d.size}`}
      >
        {/* Track (Background) */}
        <circle
          cx={d.size / 2}
          cy={d.size / 2}
          r={d.radius}
          fill="none"
          className="stroke-muted/30"
          strokeWidth={d.stroke}
        />
        {/* Progress (Foreground) */}
        <circle
          cx={d.size / 2}
          cy={d.size / 2}
          r={d.radius}
          fill="none"
          className={cn(
            "transition-all duration-1000 ease-out",
            variant.stroke,
            score >= 80 && "drop-shadow-[0_0_2px_rgba(var(--success),0.5)]",
          )}
          strokeWidth={d.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Percentage Label */}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center font-black tracking-tighter",
          d.fontSize,
          variant.color,
        )}
      >
        {score}
        <span className="text-[0.6em] opacity-70 ml-0.5">%</span>
      </span>
    </div>
  );
}
