/**
 * Module Drop-off Analytics Table (Phase 10i — Hardened).
 * Tracks pedagogical efficacy and drop-off markers across module sub-nodes.
 * Aligns with 2024 Professional SaaS UI/UX specifications.
 */
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ModuleStat } from "@/lib/coursePerformance";
import { cn } from "@/lib/utils";

interface Props {
  modules: ModuleStat[];
}

export default function ModuleDropoffTable({ modules }: Props) {
  if (!modules || modules.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl bg-muted/5">
        No module performance data currently recorded.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12 text-xs font-semibold">#</TableHead>
            <TableHead className="text-xs font-semibold">Module Title</TableHead>
            <TableHead className="text-right text-xs font-semibold">Reached</TableHead>
            <TableHead className="text-right text-xs font-semibold">Drop-off</TableHead>
            <TableHead className="text-right text-xs font-semibold">Quiz Perf.</TableHead>
            <TableHead className="text-right text-xs font-semibold">Scenario Perf.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((m, idx) => (
            <TableRow key={m.id} className="hover:bg-muted/20 transition-colors">
              <TableCell className="text-muted-foreground tabular-nums text-xs">{idx + 1}</TableCell>
              <TableCell className="font-medium text-foreground truncate max-w-[220px]">{m.title}</TableCell>
              <TableCell className="text-right tabular-nums text-foreground">
                {m.reachedCount.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className={cn("font-semibold", m.dropoffPct > 0.3 ? "text-destructive" : "text-foreground")}>
                  {(m.dropoffPct * 100).toFixed(0)}%
                </span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="text-foreground">{m.quizAttempts}</span>
                {m.quizAvgScore != null && (
                  <span className="text-muted-foreground text-xs ml-1.5">({m.quizAvgScore.toFixed(0)}%)</span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <span className="text-foreground">{m.scenarioRuns}</span>
                {m.scenarioAvgScore != null && (
                  <span className="text-muted-foreground text-xs ml-1.5">({m.scenarioAvgScore.toFixed(0)})</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

