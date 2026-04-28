import { BookOpen, Award, Clock, Trophy, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Academic Yield Telemetry (QuickStats)
 * CTO Reference: Authoritative node for learning performance metrics.
 */

interface QuickStatsProps {
  coursesCompleted: number;
  hoursLearned: number;
  modulesCompleted: number;
  className?: string;
}

export function QuickStats({ coursesCompleted, hoursLearned, modulesCompleted, className }: QuickStatsProps) {
  const stats = [
    {
      label: "GRADUATIONS",
      value: coursesCompleted,
      icon: Award,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "SYNC_HOURS",
      value: hoursLearned % 1 === 0 ? hoursLearned : hoursLearned.toFixed(1),
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "SKILL_NODES",
      value: modulesCompleted,
      icon: BookOpen,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
  ];

  // PROTOCOL: Data Ingress Guard
  if (!coursesCompleted && !hoursLearned && !modulesCompleted) {
    return null;
  }

  return (
    <section className={cn("space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-1000", className)}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <h2 className="text-[10px] font-black uppercase italic tracking-[0.3em] text-muted-foreground/60">
            Performance_Ledger
          </h2>
        </div>
        <Zap className="h-3 w-3 text-primary opacity-20" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="group relative overflow-hidden border-2 border-border/40 bg-card/30 backdrop-blur-xl rounded-[28px] transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1"
            >
              {/* INTERACTIVE_GLOW */}
              <div
                className={cn(
                  "absolute -top-10 -right-10 w-20 h-20 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity",
                  stat.bgColor,
                )}
              />

              <CardContent className="p-5 flex flex-col items-center text-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-[18px] flex items-center justify-center mb-4 transition-all duration-700 group-hover:rotate-6 group-hover:scale-110 shadow-lg border border-white/5",
                    stat.bgColor,
                  )}
                >
                  <Icon className={cn("h-6 w-6 stroke-[2.5px]", stat.color)} />
                </div>

                <div className="space-y-1">
                  <span className="text-3xl font-black tracking-tighter block leading-none tabular-nums italic">
                    {stat.value}
                  </span>
                  <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                    {stat.label}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
