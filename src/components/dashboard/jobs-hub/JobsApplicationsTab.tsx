import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, ExternalLink, Mail, Phone, Loader2, FileText, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { DashboardTableSkeleton } from "../DashboardSkeleton";
import { AIRelevanceScore } from "./AIRelevanceScore";
import { AddExternalApplicationDialog } from "./AddExternalApplicationDialog";

interface AppRow {
  id: string;
  job_id: string;
  talent_id: string | null;
  application_status: string | null;
  delivery_status: string | null;
  created_at: string | null;
  cv_url: string | null;
  source: string | null;
  ai_match_score: number | null;
  ai_match_rationale: string | null;
  external_notes: string | null;
  jobs: { title: string; company_name: string } | null;
  talents: { full_name: string; email: string; phone: string | null } | null;
}

const STATUS_OPTIONS = ["submitted", "sent_to_employer", "viewed", "shortlisted", "rejected"] as const;

export function JobsApplicationsTab() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [jobsList, setJobsList] = useState<{ id: string; title: string; company_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [sortByScore, setSortByScore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [bulkScoring, setBulkScoring] = useState(false);
  const [externalDialogOpen, setExternalDialogOpen] = useState(false);

  const PAGE_SIZE = 20;

  const loadJobs = useCallback(async () => {
    const { data } = await supabase.from("jobs").select("id,title,company_name").eq("is_active", true).order("created_at", { ascending: false }).limit(500);
    setJobsList((data || []) as any);
  }, []);

  const loadApps = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("job_applications")
        .select(
          `id, job_id, talent_id, application_status, delivery_status, created_at, cv_url, source, ai_match_score, ai_match_rationale, external_notes,
           jobs (title, company_name),
           talents (full_name, email, phone)`,
          { count: "exact" }
        );

      if (statusFilter !== "all") query = query.eq("application_status", statusFilter as any);
      if (sourceFilter !== "all") query = query.eq("source", sourceFilter);
      if (jobFilter !== "all") query = query.eq("job_id", jobFilter);
      if (scoreFilter === "scored") query = query.not("ai_match_score", "is", null);
      else if (scoreFilter === "unscored") query = query.is("ai_match_score", null);
      else if (scoreFilter === "strong") query = query.gte("ai_match_score", 80);
      else if (scoreFilter === "weak") query = query.lt("ai_match_score", 40);

      if (search.trim()) {
        const safe = sanitizeIlike(search.trim());
        const [tMatch, jMatch] = await Promise.all([
          supabase.from("talents").select("id").or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`).limit(200),
          supabase.from("jobs").select("id").or(`title.ilike.%${safe}%,company_name.ilike.%${safe}%`).limit(200),
        ]);
        const tIds = (tMatch.data || []).map((t) => t.id);
        const jIds = (jMatch.data || []).map((j) => j.id);
        const orParts: string[] = [];
        if (tIds.length) orParts.push(`talent_id.in.(${tIds.join(",")})`);
        if (jIds.length) orParts.push(`job_id.in.(${jIds.join(",")})`);
        if (orParts.length) query = query.or(orParts.join(","));
        else {
          setApps([]); setTotalCount(0); setLoading(false); return;
        }
      }

      if (sortByScore) query = query.order("ai_match_score", { ascending: false, nullsFirst: false });
      else query = query.order("created_at", { ascending: false });

      const from = (page - 1) * PAGE_SIZE;
      const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      setApps((data as any) || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      toast.error(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter, jobFilter, scoreFilter, sortByScore, page]);

  useEffect(() => { loadJobs(); }, [loadJobs]);
  useEffect(() => { loadApps(); }, [loadApps]);

  const updateStatus = async (id: string, st: string) => {
    const { error } = await supabase.from("job_applications").update({ application_status: st as any }).eq("id", id);
    if (error) return toast.error(error.message);
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, application_status: st } : a)));
    toast.success("Status updated");
  };

  const handleBulkScore = async () => {
    const unscored = apps.filter((a) => a.ai_match_score == null && a.talent_id);
    if (!unscored.length) return toast.info("All visible applications are already scored");
    setBulkScoring(true);
    let done = 0;
    const tid = toast.loading(`Scoring 0/${unscored.length}...`);
    for (const a of unscored) {
      try {
        const { data, error } = await supabase.functions.invoke("score-job-match", {
          body: { jobId: a.job_id, talentId: a.talent_id },
        });
        if (error) throw error;
        const overall = Math.round(Number(data?.overall_match ?? data?.score ?? 0));
        const reco = data?.recommendation || "";
        await supabase.from("job_applications").update({
          ai_match_score: overall,
          ai_match_rationale: reco,
          ai_scored_at: new Date().toISOString(),
        }).eq("id", a.id);
        done++;
        toast.loading(`Scoring ${done}/${unscored.length}...`, { id: tid });
      } catch {
        // continue
      }
    }
    toast.success(`Scored ${done}/${unscored.length}`, { id: tid });
    setBulkScoring(false);
    loadApps();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <Input
                placeholder="Search candidate or job..."
                className="max-w-xs h-9"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
              <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px] h-9"><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  <SelectItem value="platform">Platform</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={scoreFilter} onValueChange={(v) => { setScoreFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="AI score" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any score</SelectItem>
                  <SelectItem value="scored">Scored</SelectItem>
                  <SelectItem value="unscored">Unscored</SelectItem>
                  <SelectItem value="strong">Strong (80+)</SelectItem>
                  <SelectItem value="weak">Weak (&lt;40)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={jobFilter} onValueChange={(v) => { setJobFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Filter by job" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All jobs</SelectItem>
                  {jobsList.slice(0, 100).map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button size="sm" variant={sortByScore ? "default" : "outline"} className="h-9" onClick={() => setSortByScore((v) => !v)}>
                Sort by score
              </Button>
              <Badge variant="secondary">{totalCount} apps</Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleBulkScore} disabled={bulkScoring}>
                {bulkScoring ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Score visible
              </Button>
              <Button size="sm" onClick={() => setExternalDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" /> Add external
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <DashboardTableSkeleton rows={6} columns={6} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Job</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>AI Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell>
                        <p className="font-semibold text-sm">{app.talents?.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{app.talents?.email}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{app.jobs?.title}</p>
                        <p className="text-xs text-muted-foreground">{app.jobs?.company_name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={app.source === "external" ? "default" : "secondary"} className="text-[10px] capitalize">
                          {app.source || "platform"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <AIRelevanceScore
                          applicationId={app.id}
                          jobId={app.job_id}
                          talentId={app.talent_id}
                          score={app.ai_match_score}
                          rationale={app.ai_match_rationale}
                          onScored={(s, r) => setApps((prev) => prev.map((x) => x.id === app.id ? { ...x, ai_match_score: s, ai_match_rationale: r } : x))}
                        />
                      </TableCell>
                      <TableCell>
                        <Select value={app.application_status || "submitted"} onValueChange={(v) => updateStatus(app.id, v)}>
                          <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="text-xs">{s.replace(/_/g, " ")}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {app.created_at ? format(new Date(app.created_at), "MMM d") : ""}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        {app.cv_url && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="View CV">
                            <a href={app.cv_url} target="_blank" rel="noreferrer"><FileText className="h-3.5 w-3.5" /></a>
                          </Button>
                        )}
                        {app.talents?.email && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Email">
                            <a href={`mailto:${app.talents.email}`}><Mail className="h-3.5 w-3.5" /></a>
                          </Button>
                        )}
                        {app.talents?.phone && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="WhatsApp">
                            <a href={`https://wa.me/${app.talents.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {apps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                        No applications match the filters
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

      <AddExternalApplicationDialog
        open={externalDialogOpen}
        onOpenChange={setExternalDialogOpen}
        jobs={jobsList}
        onCreated={loadApps}
      />
    </div>
  );
}
