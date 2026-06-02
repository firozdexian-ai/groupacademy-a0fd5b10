/**
 * KPI Strip Dashboard Component (Phase 10i — Hardened).
 * Presents macro course metrics and tracking metrics layout arrays for admin panels.
 * Fully aligned with 2024 Highly Professional SaaS UI guidelines.
 */
import { Card } from "@/components/ui/card";
import { Users, Activity, CheckCircle2, TrendingUp } from "lucide-react";

interface KPIStripProps {
  totalEnrollments: number;
  activeLast7d: number;
  completionRate: number;
  avgProgress: number;
}

export default function KPIStrip({ totalEnrollments, activeLast7d, completionRate, avgProgress }: KPIStripProps) {
  // Assemble the immutable data matrices into system tokens
  const metricsTiles = [
    {
      label: "Total Enrollments",
      value: (totalEnrollments ?? 0).toLocaleString("en-US"),
      icon: Users,
    },
    {
      label: "Active Enrolled (7d)",
      value: (activeLast7d ?? 0).toLocaleString("en-US"),
      icon: Activity,
    },
    {
      label: "Completion Rate",
      // Prevent calculation anomalies via clean rounding guards before truncation string clamps
      value: `${Math.round((completionRate ?? 0) * 100).toFixed(0)}%`,
      icon: CheckCircle2,
    },
    {
      label: "Average Progress",
      value: `${Math.round(avgProgress ?? 0).toFixed(0)}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {metricsTiles.map((tile) => (
        <Card
          key={tile.label}
          className="rounded-xl border border-border p-4 flex items-center gap-3 bg-card shadow-sm"
        >
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <tile.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="text-xs font-medium text-muted-foreground truncate">{tile.label}</div>
            <div className="text-xl font-bold tracking-tight text-foreground leading-tight">{tile.value}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
