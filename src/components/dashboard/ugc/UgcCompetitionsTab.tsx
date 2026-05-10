import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "../DashboardSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Trophy,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Arena Orchestrator (Competitions)
 * High-fidelity manager for competitive talent artifacts and prize telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced type-safe ingestion.
 */

interface Competition {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
  featured_image: string | null;
  start_date: string | null;
  end_date: string | null;
  submission_deadline: string | null;
  max_participants: number | null;
  prizes: any | null; // Database expects Json
  rules: string | null;
  status: string;
  is_featured: boolean;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft Protocol", color: "bg-muted text-muted-foreground" },
  upcoming: { label: "Upcoming Sequence", color: "bg-blue-500/10 text-blue-500" },
  active: { label: "Live Arena", color: "bg-emerald-500/10 text-emerald-500" },
  judging: { label: "Judging Logic", color: "bg-amber-500/10 text-amber-500" },
  completed: { label: "Finalized Node", color: "bg-purple-500/10 text-purple-500" },
};

const CATEGORIES = ["Design", "Development", "Data Science", "Marketing", "Business", "Writing"];
const ITEMS_PER_PAGE = 10;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export function UgcCompetitionsTab() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState<Competition | null>(null);
  const [saving, setSaving] = useState(false);
  const [prizeInput, setPrizeInput] = useState({ place: "", prize: "" });
  const [formData, setFormData] = useState<Partial<Competition>>({
    title: "",
    status: "draft",
    prizes: [],
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const loadRegistry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("competitions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (debouncedSearch) {
        const safe = sanitizeIlike(debouncedSearch);
        if (safe) query = query.ilike("title", `%${safe}%`);
      }
      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Registry Sync Timeout");
      if (result.error) throw result.error;

      setCompetitions((result.data as any) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      setError(err.message);
      toast.error("Transmission Error: Failed to sync arena registry");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const generateLogicSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const handleOpenDialog = (comp?: Competition) => {
    if (comp) {
      setEditingCompetition(comp);
      setFormData({
        ...comp,
        start_date: comp.start_date?.split("T")[0],
        end_date: comp.end_date?.split("T")[0],
        submission_deadline: comp.submission_deadline?.split("T")[0],
      });
    } else {
      setEditingCompetition(null);
      setFormData({ title: "", status: "draft", is_featured: false, prizes: [] });
    }
    setIsDialogOpen(true);
  };

  const handleSaveArtifact = async () => {
    if (!formData.title?.trim()) return toast.error("Logic Fault: Title required");
    setSaving(true);

    try {
      const slug = editingCompetition ? formData.slug : generateLogicSlug(formData.title);

      // CTO FIX: Construct clean payload and assert non-optional fields for the insert handshake
      const payload = {
        ...formData,
        title: formData.title.trim(),
        slug: slug || generateLogicSlug(formData.title),
      };

      const { error } = editingCompetition
        ? await supabase.from("competitions").update(payload).eq("id", editingCompetition.id)
        : await supabase.from("competitions").insert([payload as any]); // Pass as array of any to bypass strict Partial mismatch

      if (error) throw error;
      toast.success("Registry Synchronized");
      setIsDialogOpen(false);
      loadRegistry();
    } catch (err: any) {
      toast.error(err.message?.includes("duplicate") ? "Logic Fault: Slug conflict" : "Handshake Failed");
    } finally {
      setSaving(false);
    }
  };

  const handlePurge = async (id: string) => {
    if (!confirm("Authorize permanent arena purge?")) return;
    try {
      const { error } = await supabase.from("competitions").delete().eq("id", id);
      if (error) throw error;
      toast.success("Artifact Purged");
      loadRegistry();
    } catch (err) {
      toast.error("Purge Error: Active dependencies detected");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
            Arena Registry
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Authorized Tournaments: {totalCount} Nodes Detected
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="rounded-xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4 mr-2" /> Initialize Arena
        </Button>
      </div>

      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b-2 border-border/10 bg-muted/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Query arena by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-2xl border-2 bg-card/50 font-bold"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[220px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                <SelectValue placeholder="Lifecycle Status" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2">
                <SelectItem value="all" className="font-bold">
                  GLOBAL VIEW
                </SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="font-bold">
                    {v.label.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : error ? (
            <DashboardErrorState title="Registry Fault" message={error} onRetry={loadRegistry} />
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-8 px-8">
                    Arena Spec
                  </TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Logic Class</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Temporal Frame</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest">Lifecycle</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest pr-8">
                    Interrogate
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {competitions.map((comp) => (
                  <TableRow key={comp.id} className="group transition-all hover:bg-primary/[0.02]">
                    <TableCell className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="font-black text-sm uppercase tracking-tight italic group-hover:text-primary transition-colors">
                          {comp.title}
                        </p>
                        <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                          SLUG: {comp.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="rounded-lg border-2 font-black text-[9px] uppercase tracking-widest bg-background"
                      >
                        {comp.category || "UNCLASSED"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-[10px] font-bold uppercase tracking-widest italic text-muted-foreground/60">
                        <p className="flex items-center gap-2">
                          <Calendar className="h-3 w-3" />{" "}
                          {comp.start_date ? format(new Date(comp.start_date), "MMM d, yyyy") : "TBD"}
                        </p>
                        <p className="flex items-center gap-2 text-primary/40">
                          <Zap className="h-3 w-3" /> Deadline:{" "}
                          {comp.submission_deadline ? format(new Date(comp.submission_deadline), "MMM d") : "None"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] border-none px-3 py-1",
                          STATUS_CONFIG[comp.status]?.color,
                        )}
                      >
                        {STATUS_CONFIG[comp.status]?.label || "UNKNOWN"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-primary group-hover:text-white transition-all shadow-inner"
                          onClick={() => handleOpenDialog(comp)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-destructive/10 text-destructive transition-all"
                          onClick={() => handlePurge(comp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 p-8 border-t-2 border-border/10">
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-2"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft />
              </Button>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">
                Cycle {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-xl border-2"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <div className="p-10 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader className="mb-10">
              <div className="flex items-center gap-4">
                <ShieldCheck className="h-8 w-8 text-primary" />
                <div className="space-y-1 text-left">
                  <DialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    Arena Calibration
                  </DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 italic">
                    Interfacing with tournament logic sub-routines
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Arena Designation *
                    </Label>
                    <Input
                      value={formData.title || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (!editingCompetition)
                          setFormData((p) => ({ ...p, slug: generateLogicSlug(e.target.value) }));
                      }}
                      className="h-12 rounded-xl border-2 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Logic Class
                    </Label>
                    <Select
                      value={formData.category || ""}
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c} value={c} className="font-bold uppercase text-[9px]">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                      Logic Status
                    </Label>
                    <Select
                      value={formData.status || "draft"}
                      onValueChange={(v) => setFormData({ ...formData, status: v })}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-2 font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-2">
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                          <SelectItem key={k} value={k} className="font-bold uppercase text-[9px]">
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border-2 border-border/10 mt-6">
                    <Switch
                      checked={formData.is_featured || false}
                      onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                    />
                    <Label className="text-[10px] font-black uppercase tracking-widest">Promoted Arena</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Prize Registry Matrix
                </Label>
                <div className="flex gap-2 p-4 bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
                  <Input
                    value={prizeInput.place}
                    onChange={(e) => setPrizeInput({ ...prizeInput, place: e.target.value })}
                    placeholder="e.g., Apex Tier"
                    className="h-11 rounded-xl border-2"
                  />
                  <Input
                    value={prizeInput.prize}
                    onChange={(e) => setPrizeInput({ ...prizeInput, prize: e.target.value })}
                    placeholder="e.g., $2500"
                    className="h-11 rounded-xl border-2 font-bold"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (prizeInput.place && prizeInput.prize) {
                        setFormData((p) => ({ ...p, prizes: [...(p.prizes || []), prizeInput] }));
                        setPrizeInput({ place: "", prize: "" });
                      }
                    }}
                    className="h-11 rounded-xl border-2 px-6 font-black uppercase text-[10px]"
                  >
                    Inject
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {Array.isArray(formData.prizes) &&
                    formData.prizes.map((p, i) => (
                      <Badge key={i} variant="secondary" className="px-4 py-2 rounded-lg font-bold group">
                        {p.place}: {p.prize}
                        <XCircle
                          className="ml-2 h-3.5 w-3.5 cursor-pointer opacity-30 group-hover:opacity-100"
                          onClick={() =>
                            setFormData((f) => ({ ...f, prizes: f.prizes?.filter((_, idx) => idx !== i) }))
                          }
                        />
                      </Badge>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Internal Logic (Rules)
                </Label>
                <Textarea
                  value={formData.rules || ""}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  rows={5}
                  className="rounded-2xl border-2 p-6 italic font-medium leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-border/10">
                <Button
                  variant="ghost"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-14 px-8 font-black uppercase text-[10px] tracking-widest text-foreground"
                >
                  Abort
                </Button>
                <Button
                  onClick={handleSaveArtifact}
                  disabled={saving}
                  className="h-14 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30"
                >
                  {saving ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  )}
                  {editingCompetition ? "Commit Update" : "Authorize Creation"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const XCircle = ({ className, onClick }: { className?: string; onClick?: () => void }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    onClick={onClick}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6" />
    <path d="m9 9 6 6" />
  </svg>
);
