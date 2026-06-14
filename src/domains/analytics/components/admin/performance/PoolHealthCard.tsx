/**
 * Pool Health Dashboard Component (Phase 10i — Hardened).
 * Monitors pedagogical item pool density and quality alerts for Academies & Schools Dean.
 * Aligns strictly with 2024 SaaS Professional design tokens.
 */
import { poolStatusColor, QUIZ_POOL_TARGET, SCENARIO_POOL_TARGET, type ModuleStat } from "@/lib/coursePerformance";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Props {
  modules: ModuleStat[];
}

const STATUS_INDICATOR = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-destructive",
};

export default function PoolHealthCard({ modules }: Props) {
  if (!modules || modules.length === 0) {
    return <div className="p-4 text-xs text-muted-foreground italic">No module health data recorded.</div>;
  }

  return (
    <div className="space-y-3">
      {modules.map((m) => {
        const qColor = poolStatusColor(m.quizPoolSize, QUIZ_POOL_TARGET);
        const sColor = poolStatusColor(m.scenarioPoolSize, SCENARIO_POOL_TARGET);

        return (
          <Card
            key={m.id}
            className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3 transition-colors hover:bg-muted/40"
          >
            <h4 className="text-xs font-semibold text-foreground truncate">{m.title}</h4>

            <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground">
              {/* Quiz Health Section */}
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_INDICATOR[qColor])} />
                <span className="font-medium text-foreground w-12">Quiz</span>
                <span className="tabular-nums font-semibold">
                  {m.quizPoolSize} / {QUIZ_POOL_TARGET}
                </span>
                {m.quizPoolLowQuality > 0 && (
                  <span className="text-destructive font-medium ml-auto">{m.quizPoolLowQuality} needs review</span>
                )}
                <span className="ml-auto text-muted-foreground/60 text-[10px]">
                  Served: {m.quizPoolServed.toLocaleString()}
                </span>
              </div>

              {/* Scenario Health Section */}
              <div className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full shrink-0", STATUS_INDICATOR[sColor])} />
                <span className="font-medium text-foreground w-12">Scen.</span>
                <span className="tabular-nums font-semibold">
                  {m.scenarioPoolSize} / {SCENARIO_POOL_TARGET}
                </span>
                {m.scenarioPoolLowQuality > 0 && (
                  <span className="text-destructive font-medium ml-auto">{m.scenarioPoolLowQuality} needs review</span>
                )}
                <span className="ml-auto text-muted-foreground/60 text-[10px]">
                  Served: {m.scenarioPoolServed.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

