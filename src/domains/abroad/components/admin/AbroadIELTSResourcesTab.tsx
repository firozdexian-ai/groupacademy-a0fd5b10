import { useState } from "react";
import { useAbroadGraph } from "./hooks/useAbroadGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, BookOpen, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { trackError } from "@/lib/errorTracking";

/**
 * Group Academy — Career Abroad: IELTS Resources Management Tab
 * Version: Phase 10i.2 Hardened (Production Candidate Edition)
 * Surface: /dashboard?tab=ielts-resources (Admin Command Center Surface)[cite: 2, 4]
 * Operations Mode: Automated Efficiency catalog manager backing language prep tracks[cite: 4].
 */

export function AbroadIELTSResourcesTab() {
  const {
    abroadGraphQuery,
    mutations: { upsertIeltsResource, deleteIeltsResource },
  } = useAbroadGraph();

  const { data, isLoading } = abroadGraphQuery;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({ status: "active", resource_type: "pdf" });

  const handleOpenChange = (nextOpenState: boolean) => {
    if (upsertIeltsResource.isPending) return;
    setOpen(nextOpenState);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-6 rounded-2xl border border-border/60">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <BookOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">IELTS Resources</h2>
          </div>
          <p className="text-xs text-muted-foreground">Language Prep Material Catalog & Student Study Guides</p>
        </div>
        <Button
          onClick={() => {
            setDraft({ status: "active", resource_type: "pdf" });
            setOpen(true);
          }}
          className="h-10 px-6 rounded-xl font-semibold text-xs gap-2 bg-primary hover:bg-primary/90 text-white transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Resource Material
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
                    Resource Title
                  </TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Format Type</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground text-right py-4 pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/40">
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center">
                      <Skeleton className="h-5 w-32 mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : data?.ieltsResources?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-12 text-center text-sm font-medium text-muted-foreground/60 italic"
                    >
                      No resource entries cataloged in the system database.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.ieltsResources?.map((row) => (
                    <TableRow key={row.id} className="group hover:bg-muted/20 transition-colors">
                      <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted border border-border/40 flex items-center justify-center shrink-0">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">{row.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="font-mono text-[10px] tracking-wide uppercase px-2 py-0.5 rounded border border-border/60 bg-muted/10 text-muted-foreground"
                        >
                          {row.resource_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full border-none",
                            row.status === "active"
                              ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10"
                              : "bg-amber-500/10 text-amber-700 hover:bg-amber-500/10",
                          )}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Edit resource"
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
                            aria-label="Delete resource"
                            className="h-8 w-8 rounded-lg text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                            onClick={() => {
                              if (confirm("Are you sure you want to permanently delete this resource material?")) {
                                deleteIeltsResource.mutate(row.id, {
                                  onError: (err) =>
                                    trackError("ielts-resource-deletion-error", { error: err.message, id: row.id }),
                                });
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

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md rounded-2xl p-6 border border-border/60 text-left">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" /> Edit Resource Metadata
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modify the learning parameters for this specific reference catalog entry.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Resource Document Title</Label>
              <Input
                placeholder="e.g. Master Class Writing Task 2"
                value={draft.title || ""}
                disabled={upsertIeltsResource.isPending}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="h-10 rounded-xl border font-semibold text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Asset File Type</Label>
                <Select
                  value={draft.resource_type}
                  disabled={upsertIeltsResource.isPending}
                  onValueChange={(v) => setDraft({ ...draft, resource_type: v })}
                >
                  <SelectTrigger className="h-10 rounded-xl border font-semibold text-xs uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="pdf" className="font-semibold text-xs">
                      PDF Document
                    </SelectItem>
                    <SelectItem value="video" className="font-semibold text-xs">
                      Video Stream
                    </SelectItem>
                    <SelectItem value="audio" className="font-semibold text-xs">
                      Audio Podcast
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Catalog Display Status</Label>
                <Select
                  value={draft.status}
                  disabled={upsertIeltsResource.isPending}
                  onValueChange={(v) => setDraft({ ...draft, status: v })}
                >
                  <SelectTrigger className="h-10 rounded-xl border font-semibold text-xs uppercase">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem
                      value="active"
                      className="font-semibold text-xs text-emerald-600 focus:text-emerald-700"
                    >
                      Active
                    </SelectItem>
                    <SelectItem value="inactive" className="font-semibold text-xs text-amber-600 focus:text-amber-700">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              disabled={upsertIeltsResource.isPending}
              onClick={() => setOpen(false)}
              className="h-10 px-4 rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              disabled={!draft.title || upsertIeltsResource.isPending}
              onClick={() => {
                const payload = { ...draft, content_type: draft.resource_type, is_active: draft.status === "active" };
                delete payload.resource_type;
                delete payload.status;
                upsertIeltsResource.mutate(payload, {
                  onSuccess: () => setOpen(false),
                  onError: (err) => trackError("ielts-resource-upsert-error", { error: err.message, payload }),
                });
              }}
              className="h-10 px-5 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-white text-xs flex items-center gap-2 shadow-sm"
            >
              <ShieldCheck className="h-4 w-4" /> Save Resource Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AbroadIELTSResourcesTab;
