import { useAbroadGraph } from "./hooks/useAbroadGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Languages, Activity, Mic, Users, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Group Academy â€” Career Abroad Management Dashboard: Language Lab Overview Terminal
 * Version: Phase 10i.2 Hardened (Production Candidate Edition)
 * Surface: /dashboard?tab=language-lab (Admin Command Center View)[cite: 2, 4]
 * Operations Mode: Automated Efficiency metric aggregator syncing real-time user ielts practice attempts[cite: 3].
 */

export function AbroadLanguageLabTab() {
  const { abroadGraphQuery } = useAbroadGraph();
  const { data, isLoading } = abroadGraphQuery;

  // Telemetry loops calculations mapping out state structures natively
  const attempts = data?.ieltsAttempts || [];
  const scoredAttempts = attempts.filter((a) => a.score !== undefined && a.score !== null);
  const avgScore =
    scoredAttempts.length > 0
      ? (scoredAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / scoredAttempts.length).toFixed(1)
      : "0.0";

  const pendingScoring = attempts.length - scoredAttempts.length;
  const activeUsers = new Set(attempts.map((a) => a.user_id)).size;

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500 text-left">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-6 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Languages className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Language Lab Analytics</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Real-Time Proficiency Tracking & IELTS Evaluation Telemetry[cite: 2, 4]
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-muted/40" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Telemetry KPIs System Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricTile
              label="Average Band Score"
              value={avgScore}
              icon={Trophy}
              color="text-primary"
              bg="bg-primary/10"
            />
            <MetricTile
              label="Total Test Submissions"
              value={attempts.length}
              icon={Mic}
              color="text-blue-600"
              bg="bg-blue-500/10"
            />
            <MetricTile
              label="Active Language Learners"
              value={activeUsers}
              icon={Users}
              color="text-emerald-600"
              bg="bg-emerald-500/10"
            />
            <MetricTile
              label="Pending AI Scoring Queue"
              value={pendingScoring}
              icon={Activity}
              color="text-amber-600"
              bg="bg-amber-500/10"
            />
          </div>

          {/* Telemetry Performance Output Stream Frame */}
          <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-600" />
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[260px] text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
                <Activity className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg tracking-tight text-foreground">
                  Active Performance Monitoring Enabled
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  The language metrics console is collecting student audio submission attempts and essay grades. Live
                  telemetry metrics are compiled dynamically through the primary IELTS evaluation frameworks[cite: 2,
                  4].
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

function MetricTile({ label, value, icon: Icon, color, bg }: MetricTileProps) {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden hover:border-primary/30 transition-all group">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center border border-white/5 transition-transform group-hover:scale-105 shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 text-left">
          <p className="text-xs font-semibold text-muted-foreground mb-0.5 truncate">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default AbroadLanguageLabTab;

