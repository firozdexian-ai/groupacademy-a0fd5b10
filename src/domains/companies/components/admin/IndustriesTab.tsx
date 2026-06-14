/**
 * Industry Sectors Management Terminal â€” Phase Z0 Hardened
 * Version: 2024 Highly Professional SAAS UI
 * Fixes: A3 (Scaling Aggregates), A4 (Atomic Fusion), S1 (Rename Restoration)
 * Features: Restored Rename Protocol & Unassigned KPI
 */
import { useState, useEffect, useCallback } from "react";
import {
  countCompaniesWithNullIndustry,
  renameCompanyIndustry,
  getIndustryRollup,
  mergeIndustries,
} from "@/domains/companies/repo/companiesRepo";
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
  AlertCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Activity,
  Database,
  Zap,
} from "lucide-react";
import { DashboardTableSkeleton } from "@/platform/admin/chrome/DashboardSkeleton";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

const ITEMS_PER_PAGE = 15;

export function IndustriesTab() {
  const [industries, setIndustries] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [unassignedCount, setUnassignedCount] = useState(0);

  // Normalization State (Merge)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [mergeTarget, setMergeTarget] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  // Recalibration State (Rename - Restored)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const loadRegistry = useCallback(async () => {
    setIsLoading(true);
    try {
      // A3 Fix: Single RPC for aggregates + Parallel head query for unassigned
      const [rollupData, unassignedCountVal] = await Promise.all([
        getIndustryRollup(),
        countCompaniesWithNullIndustry(),
      ]);

      setIndustries(rollupData || []);
      setUnassignedCount(unassignedCountVal);
    } catch (err: unknown) {
      toast.error("Could not load industry registry data. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);

  // Recalibration Handler (Restored)
  const executeRename = async () => {
    if (!renameTo.trim() || renameTo === renameFrom) {
      return toast.error("Invalid name. Please input a distinct industry designation.");
    }
    setIsRenaming(true);
    try {
      await renameCompanyIndustry(renameFrom, renameTo.trim());
      toast.success(`Industry successfully renamed: "${renameFrom}" â†’ "${renameTo}"`);
      setRenameDialogOpen(false);
      loadRegistry();
    } catch (err: unknown) {
      toast.error("Could not complete rename: " + err.message);
    } finally {
      setIsRenaming(false);
    }
  };

  // Fusion Handler (Merge - RPC Optimized)
  const executeMerge = async () => {
    if (!mergeTarget.trim()) return toast.error("Please enter a target industry category name.");
    setIsMerging(true);
    try {
      const sources = [...selected].filter((s) => s !== mergeTarget.trim());
      // A4 Fix: Single atomic transaction via RPC
      await mergeIndustries(sources, mergeTarget.trim());

      toast.success(`Successfully merged ${sources.length} industry sectors into "${mergeTarget}"`);
      setMergeDialogOpen(false);
      setSelected(new Set());
      loadRegistry();
    } catch (err: unknown) {
      toast.error("Merge error encountered: " + err.message);
    } finally {
      setIsMerging(false);
    }
  };

  const filtered = industries.filter((i) => i.industry.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleSelect = (industry: string) => {
    const next = new Set(selected);
    if (selected.has(industry)) {
      next.delete(industry);
    } else {
      next.add(industry);
    }
    setSelected(next);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header - Renders immediately to fix R4 loading regression */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-2xl border border-border/60">
        <div className="text-left">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
            <Database className="h-6 w-6 text-primary" /> Industry Sectors
          </h2>
          <p className="text-[10px] font-semibold text-muted-foreground/60 italic uppercase tracking-wider">
            Manage, rename, and merge industry categories across the ecosystem
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Refresh list" onClick={loadRegistry} className="rounded-xl h-12 w-12 border bg-transparent">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          {selected.size >= 2 && (
            <Button
              onClick={() => {
                setMergeTarget([...selected][0]);
                setMergeDialogOpen(true);
              }}
              className="rounded-xl h-12 px-6 font-semibold uppercase text-xs gap-2 bg-primary text-primary-foreground shadow-sm"
            >
              <Merge className="h-4 w-4" /> Merge Categories ({selected.size})
            </Button>
          )}
        </div>
      </div>

      {/* KPI dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricTile
          label="Active Industry Sectors"
          value={industries.length}
          icon={Factory}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <MetricTile
          label="Unassigned Company Profiles"
          value={unassignedCount}
          icon={AlertCircle}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <MetricTile
          label="Most Frequent Sector"
          value={industries[0]?.industry || "None"}
          icon={TrendingUp}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
      </div>

      <Card className="rounded-2xl border overflow-hidden shadow-sm bg-card">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <div className="p-6 border-b border-border/10">
          <div className="relative group max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search industries..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-12 h-12 bg-muted/10 border rounded-xl font-medium"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8">
            <DashboardTableSkeleton rows={8} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="border-b text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  <th className="w-12 px-6">
                    <Checkbox
                      checked={selected.size === paginated.length && paginated.length > 0}
                      onCheckedChange={() =>
                        setSelected(
                          selected.size === paginated.length ? new Set() : new Set(paginated.map((i) => i.industry)),
                        )
                      }
                    />
                  </th>
                  <TableHead className="py-6 pl-0 text-left">Industry Sector Name</TableHead>
                  <TableHead className="text-center">Associated Companies</TableHead>
                  <TableHead className="text-center">Active Jobs</TableHead>
                  <th className="text-right pr-8">Actions</th>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((row) => (
                  <TableRow key={row.industry} className="group hover:bg-primary/[0.02] border-b border-border/5 transition-colors">
                    <TableCell className="px-6 text-left">
                      <Checkbox
                        checked={selected.has(row.industry)}
                        onCheckedChange={() => toggleSelect(row.industry)}
                      />
                    </TableCell>
                    <TableCell className="py-6 font-semibold text-sm uppercase italic group-hover:text-primary transition-colors text-left text-foreground">
                      {row.industry}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="font-semibold text-[10px] border bg-background/50 text-foreground" variant="outline">
                        {row.company_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="font-semibold text-[10px] border bg-background/50 text-foreground" variant="outline">
                        {row.job_count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button
                        variant="ghost"
                        size="icon" aria-label="Edit industry name"
                        onClick={() => {
                          setRenameFrom(row.industry);
                          setRenameTo(row.industry);
                          setRenameDialogOpen(true);
                        }}
                        className="h-10 w-10 border rounded-xl opacity-20 group-hover:opacity-100 transition-all bg-transparent"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="p-6 border-t flex justify-center items-center gap-6 bg-muted/5">
          <Button
            variant="ghost"
            size="icon" aria-label="Go to previous page"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border h-9 w-12"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-[10px] font-semibold uppercase italic opacity-40">
            Page {page} of {totalPages || 1}
          </span>
          <Button
            variant="ghost"
            size="icon" aria-label="Go to next page"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-xl border h-9 w-12"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Recalibration Dialog (Rename - Restored Logic) */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-4 bg-background text-left">
          <div className="p-2 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold tracking-tight uppercase flex items-center gap-2 text-foreground">
                <Zap className="h-6 w-6 text-primary" /> Rename Industry Sector
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                Renaming "{renameFrom}" will recursively update all linked employer profiles.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-semibold uppercase ml-1">New Sector Title</Label>
                <Input
                  value={renameTo}
                  onChange={(e) => setRenameTo(e.target.value)}
                  className="rounded-xl border font-semibold uppercase h-12"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                onClick={executeRename}
                disabled={isRenaming}
                className="w-full h-12 rounded-xl font-semibold uppercase text-xs gap-2 shadow-md"
              >
                {isRenaming ? <InlineSpinner size="sm" /> : <ShieldCheck className="h-4 w-4" />} Save Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fusion Dialog (Merge) */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-4 bg-background text-left">
          <div className="p-2 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold tracking-tight uppercase flex items-center gap-2 text-foreground">
                <Merge className="h-6 w-6 text-primary" /> Merge Industry Categories
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
                Merging {selected.size} industrial categories. This will combine multiple sectors into one primary label.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-semibold uppercase ml-1">Primary Destination Category</Label>
                <Input
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  className="rounded-xl border font-semibold h-12 uppercase"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                onClick={executeMerge}
                disabled={isMerging}
                className="w-full h-12 rounded-xl font-semibold uppercase text-xs gap-2 shadow-md"
              >
                {isMerging ? <InlineSpinner size="sm" /> : <Activity className="h-4 w-4" />} Confirm and Merge
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: unknown) {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card p-6 text-left group hover:border-primary/30 transition-all shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="h-12 w-12" />
      </div>
      <div className="flex items-center gap-5 relative z-10">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border transition-transform group-hover:rotate-3 shadow-inner",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold text-muted-foreground italic mb-1 truncate">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight text-foreground truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}

