import { useState } from "react";
import { useAbroadGraph } from "./hooks/useAbroadGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Mic, ShieldCheck, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * Group Academy â€” Abroad Group Tab: IELTS Mock Attempts Assessment Console
 * Version: Phase 10i.2 Hardened (Production Candidate Edition)
 * Surface: /dashboard?tab=ielts (Admin Command Center Layout)
 * Operations Mode: Human-in-the-loop scoring bypass for specialized English proficiency evaluations.
 */

export function AbroadIELTSPromptsTab() {
  const {
    abroadGraphQuery,
    mutations: { upsertIeltsAttempt, deleteIeltsAttempt },
  } = useAbroadGraph();

  const { data, isLoading } = abroadGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<unknown>({ score: 0 });

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-6 rounded-2xl border border-border/60">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Mic className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">IELTS Mock Attempts</h2>
          </div>
          <p className="text-xs text-muted-foreground">Review and Evaluate Student English Proficiency Submissions</p>
        </div>
        <Button
          onClick={() => {
            setDraft({ score: 0 });
            setOpen(true);
          }}
          className="h-10 px-6 rounded-xl font-semibold text-xs gap-2 bg-primary hover:bg-primary/90 text-white transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> Log Test Score
        </Button>
      </header>

      <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-600" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30 border-b border-border/40">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="font-semibold text-xs py-4 pl-6 text-muted-foreground">
                    Prompt Reference
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Student User ID</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Assessed Grade</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground text-right py-4 pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data?.ieltsAttempts?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-12 text-center text-sm font-medium text-muted-foreground/60 italic"
                    >
                      No recorded IELTS practice attempts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.ieltsAttempts?.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted border border-border/40 flex items-center justify-center shrink-0">
                            <Mic className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-mono text-xs font-semibold text-muted-foreground">
                            {row.prompt_id?.substring(0, 8) || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-foreground flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />{" "}
                          {row.user_id ? row.user_id.substring(0, 8) : "Anonymous Student"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {row.score ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-none font-bold text-xs tracking-wider px-2.5 py-0.5 rounded-full"
                          >
                            Band {row.score}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="text-amber-700 bg-amber-500/10 hover:bg-amber-500/10 font-bold uppercase text-[10px] tracking-wider px-2.5 py-0.5 rounded-full border-none"
                          >
                            Awaiting Evaluation
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit score"
                            onClick={() => {
                              setDraft(row);
                              setOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Delete test attempt record"
                            className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this specific test attempt record?")) {
                                deleteIeltsAttempt.mutate(row.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-border/60 text-left">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" /> Evaluate Practice Attempt
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Review and adjust the standard proficiency band score variables.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Prompt Reference Key</Label>
                <Input
                  placeholder="UUID Format"
                  value={draft.prompt_id || ""}
                  onChange={(e) => setDraft({ ...draft, prompt_id: e.target.value })}
                  className="h-10 rounded-xl border font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Student Account ID</Label>
                <Input
                  placeholder="UUID Format"
                  value={draft.user_id || ""}
                  onChange={(e) => setDraft({ ...draft, user_id: e.target.value })}
                  className="h-10 rounded-xl border font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Assigned Band Score (0.0 - 9.0)</Label>
              <Input
                type="number"
                step="0.5"
                min="0"
                max="9"
                placeholder="e.g. 7.5"
                value={draft.score || ""}
                onChange={(e) => setDraft({ ...draft, score: Number(e.target.value) })}
                className="h-11 rounded-xl border border-emerald-500/20 bg-emerald-500/5 font-bold text-emerald-700 text-base focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              disabled={!draft.user_id || upsertIeltsAttempt.isPending}
              onClick={() => {
                const payload = { ...draft, ai_band_score: draft.score };
                delete payload.score;
                delete payload.status;
                upsertIeltsAttempt.mutate(payload, { onSuccess: () => setOpen(false) });
              }}
              className="h-10 px-5 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-white text-xs flex items-center gap-2 shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" /> Confirm & Save Score
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AbroadIELTSPromptsTab;


