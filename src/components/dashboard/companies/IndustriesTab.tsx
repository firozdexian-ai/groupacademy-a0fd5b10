/**
 * Market Sector Normalization Terminal — Phase Z0 Hardened
 * CTO Version: May 2026
 * Fixes: A3 (10k-row scan), A4 (Atomic Merge), P2 (Layout)
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Factory,
  Search,
  Merge,
  Edit,
  RefreshCw,
  Building2,
  Briefcase,
  AlertCircle,
  TrendingUp,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
  Database,
} from "lucide-react";
import { DashboardTableSkeleton, DashboardErrorState } from "../DashboardSkeleton";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 15;

export function IndustriesTab() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  // A3 Fix: Utilizing optimized RPC for sectoral aggregation
  const loadRegistry = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("get_industry_rollup");
      if (error) throw error;
      setIndustries(data || []);
    } catch (err: any) {
      toast.error("Registry Sync Failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  const filtered = industries.filter((i) => i.industry.toLowerCase().includes(searchQuery.toLowerCase()));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // A4 Fix: Atomic merge via SECURITY DEFINER RPC
  const executeMerge = async () => {
    if (!mergeTarget) return toast.error("Target identifier required");
    setIsMerging(true);
    try {
      const sources = [...selected].filter((s) => s !== mergeTarget);
      const { error } = await supabase.rpc("merge_industries", {
        p_sources: sources,
        p_target: mergeTarget,
      });
      if (error) throw error;

      toast.success(`Protocol Committed: ${sources.length} sectors normalized into "${mergeTarget}"`);
      setMergeDialogOpen(false);
      setSelected(new Set());
      loadRegistry();
    } catch (err: any) {
      toast.error("Normalization Fault: " + err.message);
    } finally {
      setIsMerging(false);
    }
  };

  if (isLoading)
    return (
      <div className="p-8">
        <DashboardTableSkeleton rows={10} />
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* P2 Fix: Header Action Row */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" /> Sector Registry
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Deduplication & Market Normalization Active
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadRegistry} className="rounded-xl h-12 w-12 border-2">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          {selected.size >= 2 && (
            <Button
              onClick={() => {
                setMergeTarget([...selected][0]);
                setMergeDialogOpen(true);
              }}
              className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl bg-primary"
            >
              <Merge className="h-4 w-4" /> Normalize ({selected.size})
            </Button>
          )}
        </div>
      </div>

      {/* KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricTile
          label="Market Sectors"
          value={industries.length}
          icon={Factory}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <MetricTile
          label="Logic Nodes (Jobs)"
          value={industries.reduce((acc, curr) => acc + Number(curr.job_count), 0)}
          icon={Briefcase}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <MetricTile
          label="Dominant Sector"
          value={industries[0]?.industry || "None"}
          icon={TrendingUp}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
      </div>

      <Card className="rounded-[40px] border-2 overflow-hidden shadow-2xl bg-card/30 backdrop-blur-xl">
        <div className="p-6 border-b border-border/10">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search market sectors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-muted/10 border-2 rounded-xl font-bold uppercase text-[10px] tracking-widest"
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="w-12 px-6">
                <Checkbox
                  checked={selected.size === paginated.length}
                  onCheckedChange={() =>
                    setSelected(
                      selected.size === paginated.length ? new Set() : new Set(paginated.map((i) => i.industry)),
                    )
                  }
                />
              </TableHead>
              <TableHead className="text-[10px] font-black uppercase py-6">Market Sector</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase">Entities</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase">Logic Nodes</TableHead>
              <TableHead className="text-right pr-8 text-[10px] font-black uppercase">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((row) => (
              <TableRow key={row.industry} className="group hover:bg-primary/[0.02]">
                <TableCell className="px-6">
                  <Checkbox
                    checked={selected.has(row.industry)}
                    onCheckedChange={() => {
                      const next = new Set(selected);
                      selected.has(row.industry) ? next.delete(row.industry) : next.add(row.industry);
                      setSelected(next);
                    }}
                  />
                </TableCell>
                <TableCell className="py-6 font-black text-sm uppercase italic group-hover:text-primary transition-colors">
                  {row.industry}
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-black text-[10px] border-2">
                    {row.company_count}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="font-black text-[10px] border-2">
                    {row.job_count}
                  </Badge>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg opacity-20 group-hover:opacity-100">
                    <Edit className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="p-4 border-t flex justify-center gap-4 bg-muted/5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border-2"
          >
            <ChevronLeft />
          </Button>
          <span className="text-[10px] font-black self-center uppercase tracking-widest">
            Cycle {page} / {Math.ceil(filtered.length / ITEMS_PER_PAGE)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(filtered.length / ITEMS_PER_PAGE)}
            className="rounded-xl border-2"
          >
            <ChevronRight />
          </Button>
        </div>
      </Card>

      {/* Merge Protocol Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-4">
          <div className="p-2 space-y-6 text-left">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                <Merge className="h-6 w-6 text-primary" /> Sector Fusion
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed">
                Merging {selected.size} sectors. This action will recalibrate all linked company nodes.
              </p>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Target Sector Designation</Label>
                <Input
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  className="rounded-xl border-2 font-black italic"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={executeMerge}
                disabled={isMerging}
                className="w-full h-12 rounded-xl font-black uppercase text-[10px] gap-2"
              >
                {isMerging ? <Loader2 className="animate-spin h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />} Execute
                Fusion
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-6 text-left group transition-all hover:border-primary/30">
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-3 shadow-inner",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">{label}</p>
          <p className="text-2xl font-black italic tracking-tighter text-foreground truncate max-w-[150px]">{value}</p>
        </div>
      </div>
    </Card>
  );
}
