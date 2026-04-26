import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Linkedin, MousePointer2, Bookmark, Brain } from "lucide-react";
import { toast } from "sonner";
import { DashboardTableSkeleton } from "../DashboardSkeleton";
import { JobFormDialog } from "./JobFormDialog";

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  application_type: string;
  source_platform: string | null;
  deadline: string | null;
}

interface EngagementData { clicks: number; saves: number; recommendations: number; }

export function JobsManageTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [engagement, setEngagement] = useState<Record<string, EngagementData>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const PAGE_SIZE = 20;

  const fetchEngagement = useCallback(async (jobIds: string[]) => {
    if (!jobIds.length) return;
    const [clicksRes, savesRes, recsRes] = await Promise.all([
      supabase.from("job_analytics").select("job_id").in("job_id", jobIds),
      (supabase.from("saved_items") as any).select("item_id").eq("kind", "job").in("item_id", jobIds),
      supabase.from("ai_job_recommendations").select("job_id").in("job_id", jobIds),
    ]);
    const stats: Record<string, EngagementData> = {};
    jobIds.forEach((id) => (stats[id] = { clicks: 0, saves: 0, recommendations: 0 }));
    ((clicksRes.data ?? []) as any[]).forEach((c) => stats[c.job_id] && stats[c.job_id].clicks++);
    ((savesRes.data ?? []) as any[]).forEach((s) => stats[s.item_id] && stats[s.item_id].saves++);
    ((recsRes.data ?? []) as any[]).forEach((r) => stats[r.job_id] && stats[r.job_id].recommendations++);
    setEngagement(stats);
  }, []);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("jobs")
        .select("id,title,company_name,location,is_active,is_featured,created_at,application_type,source_platform,deadline", { count: "exact" })
        .order("created_at", { ascending: false });
      if (searchQuery) {
        const safe = sanitizeIlike(searchQuery);
        query = query.or(`title.ilike.%${safe}%,company_name.ilike.%${safe}%`);
      }
      if (statusFilter === "active") query = query.eq("is_active", true);
      else if (statusFilter === "inactive") query = query.eq("is_active", false);
      else if (statusFilter === "featured") query = query.eq("is_featured", true);
      else if (statusFilter === "stale") {
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
        query = query.lt("created_at", sixtyDaysAgo);
      } else if (statusFilter === "expired") {
        query = query.not("deadline", "is", null).lt("deadline", new Date().toISOString());
      }
      const from = (page - 1) * PAGE_SIZE;
      const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      setJobs((data || []) as Job[]);
      setTotalCount(count || 0);
      if (data?.length) fetchEngagement(data.map((j) => j.id));
    } catch (err: any) {
      toast.error(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, page, fetchEngagement]);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  const toggleSelected = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const bulkUpdate = async (patch: Partial<Pick<Job, "is_active" | "is_featured">>) => {
    if (!selected.size) return;
    const ids = Array.from(selected);
    const { error } = await supabase.from("jobs").update(patch).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} jobs updated`);
    setSelected(new Set());
    loadJobs();
  };

  const bulkDelete = async () => {
    if (!selected.size) return;
    if (!confirm(`Delete ${selected.size} jobs?`)) return;
    const { error } = await supabase.from("jobs").delete().in("id", Array.from(selected));
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    setSelected(new Set());
    loadJobs();
  };

  const inlineToggle = async (id: string, field: "is_active" | "is_featured", value: boolean) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, [field]: value } : j)));
    const { error } = await supabase.from("jobs").update({ [field]: value }).eq("id", id);
    if (error) {
      toast.error(error.message);
      loadJobs();
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2 justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                placeholder="Search title or company..."
                className="max-w-xs h-9"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              />
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Postings</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="stale">Stale (&gt;60d)</SelectItem>
                  <SelectItem value="expired">Past deadline</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary">{totalCount} total</Badge>
            </div>
            <Button size="sm" onClick={() => { setEditingJobId(null); setDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" /> New Job
            </Button>
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap gap-2 mt-3 p-2 bg-muted/50 rounded-lg">
              <Badge>{selected.size} selected</Badge>
              <Button size="sm" variant="outline" onClick={() => bulkUpdate({ is_active: true })}>Activate</Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdate({ is_active: false })}>Deactivate</Button>
              <Button size="sm" variant="outline" onClick={() => bulkUpdate({ is_featured: true })}>Feature</Button>
              <Button size="sm" variant="destructive" onClick={bulkDelete}>Delete</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <Checkbox
                        checked={jobs.length > 0 && selected.size === jobs.length}
                        onCheckedChange={(v) => setSelected(v ? new Set(jobs.map((j) => j.id)) : new Set())}
                      />
                    </TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-center">Active</TableHead>
                    <TableHead className="text-center">Featured</TableHead>
                    <TableHead className="text-center" title="Clicks · Saves · AI hits">
                      <div className="flex justify-center gap-2 text-xs">
                        <MousePointer2 className="w-3 h-3" /> <Bookmark className="w-3 h-3" /> <Brain className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const e = engagement[job.id] || { clicks: 0, saves: 0, recommendations: 0 };
                    return (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Checkbox checked={selected.has(job.id)} onCheckedChange={() => toggleSelected(job.id)} />
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-sm">{job.title}</p>
                          <p className="text-xs text-muted-foreground">{job.company_name} · {job.location || "Remote"}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {job.source_platform === "linkedin" && <Linkedin className="w-3 h-3 mr-1" />}
                            {(job.source_platform || "other").replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch checked={job.is_active} onCheckedChange={(v) => inlineToggle(job.id, "is_active", v)} />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch checked={job.is_featured} onCheckedChange={(v) => inlineToggle(job.id, "is_featured", v)} />
                        </TableCell>
                        <TableCell className="text-center text-xs text-muted-foreground">
                          {e.clicks} · {e.saves} · {e.recommendations}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingJobId(job.id); setDialogOpen(true); }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={async () => {
                              if (confirm("Remove listing?")) {
                                await supabase.from("jobs").delete().eq("id", job.id);
                                loadJobs();
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                        No jobs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                    <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <JobFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        jobId={editingJobId}
        onSaved={loadJobs}
      />
    </div>
  );
}
