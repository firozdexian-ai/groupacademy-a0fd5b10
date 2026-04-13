import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import StatsCard from "./StatsCard";
import { TalentDetailDialog } from "./TalentDetailDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Search,
  Target,
  Loader2,
  Star,
  Download,
  Sparkles,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  ChevronLeft,
  Trash2,
  Users,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { downloadFile } from "@/lib/downloadFile";
import { useIsMobile } from "@/hooks/use-mobile";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface LeadHuntSession {
  id: string;
  job_title: string;
  company_name: string | null;
  job_description: string;
  leads_requested: number;
  status: string;
  created_at: string;
  match_count?: number;
}

interface LeadMatch {
  id: string;
  initial_score: number | null;
  ai_match_score: number | null;
  ai_analysis: any;
  shortlisted: boolean;
  talent: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    skills: string[];
    experience: any[];
    cv_url: string | null;
  };
}

const ITEMS_PER_PAGE = 10;

export function LeadHunterManager() {
  const isMobile = useIsMobile();
  const [sessions, setSessions] = useState<LeadHuntSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpiTotalMatches, setKpiTotalMatches] = useState(0);
  const [kpiShortlisted, setKpiShortlisted] = useState(0);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sessionSearch, setSessionSearch] = useState("");
  const debouncedSearch = useDebounce(sessionSearch, 300);
  const [showNewHunt, setShowNewHunt] = useState(false);
  const [rawJD, setRawJD] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [leadsRequested, setLeadsRequested] = useState(20);
  const [isSearching, setIsSearching] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [jdParsed, setJdParsed] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LeadHuntSession | null>(null);
  const [matches, setMatches] = useState<LeadMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [scoringMatch, setScoringMatch] = useState<string | null>(null);
  const [scoringAll, setScoringAll] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<LeadMatch | null>(null);
  const [talentDetailOpen, setTalentDetailOpen] = useState(false);
  const [talentDetailEmail, setTalentDetailEmail] = useState("");
  const [talentDetailName, setTalentDetailName] = useState("");
  const [deletingSession, setDeletingSession] = useState<string | null>(null);

  // Computed Variables
  const unscoredCount = useMemo(() => matches.filter((m) => !m.ai_match_score).length, [matches]);
  const totalPages = useMemo(() => Math.ceil(totalCount / ITEMS_PER_PAGE), [totalCount]);

  const loadKPIs = useCallback(async () => {
    try {
      const [matchesRes, shortlistRes] = await Promise.all([
        supabase.from("lead_hunt_matches").select("id", { count: "exact", head: true }),
        supabase.from("lead_hunt_matches").select("id", { count: "exact", head: true }).eq("shortlisted", true),
      ]);
      setKpiTotalMatches(matchesRes.count || 0);
      setKpiShortlisted(shortlistRes.count || 0);
    } catch (err) {
      console.error("KPI load error:", err);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("lead_hunt_sessions" as any)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });
      if (debouncedSearch.trim()) query = query.ilike("job_title", `%${debouncedSearch.trim()}%`);
      const from = (page - 1) * ITEMS_PER_PAGE;
      const result = (await withTimeout(
        query.range(from, from + ITEMS_PER_PAGE - 1) as any,
        TIMEOUTS.DEFAULT,
        "Loading sessions timed out",
      )) as any;
      if (result.error) throw result.error;
      const sessionData = result.data || [];
      if (sessionData.length > 0) {
        const { data: matchCounts } = await supabase
          .from("lead_hunt_matches" as any)
          .select("session_id")
          .in(
            "session_id",
            sessionData.map((s: any) => s.id),
          );
        const countMap: Record<string, number> = {};
        (matchCounts || []).forEach((m: any) => {
          countMap[m.session_id] = (countMap[m.session_id] || 0) + 1;
        });
        sessionData.forEach((s: any) => {
          s.match_count = countMap[s.id] || 0;
        });
      }
      setSessions(sessionData);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    loadSessions();
    loadKPIs();
  }, [loadSessions, loadKPIs]);

  const loadSessionMatches = async (session: LeadHuntSession) => {
    setSelectedSession(session);
    setLoadingMatches(true);
    try {
      const { data, error } = await supabase
        .from("lead_hunt_matches")
        .select(
          `id, initial_score, ai_match_score, ai_analysis, shortlisted, talent:talents ( id, full_name, email, phone, skills, experience, cv_url )`,
        )
        .eq("session_id", session.id)
        .order("ai_match_score", { ascending: false });
      if (error) throw error;
      setMatches((data || []).filter((m: any) => m.talent) as unknown as LeadMatch[]);
    } catch (err) {
      toast.error("Failed to load matches");
    } finally {
      setLoadingMatches(false);
    }
  };

  const parseJD = async () => {
    if (!rawJD.trim()) return toast.error("Paste JD text first");
    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-job-post", { body: { rawText: rawJD } });
      if (error) throw error;
      setJobTitle(data.title || "");
      setCompanyName(data.company_name || "");
      setJobDescription(data.description || rawJD);
      setJdParsed(true);
      toast.success("AI specifications extracted");
    } catch (err) {
      setJobDescription(rawJD);
      setJdParsed(true);
    } finally {
      setIsParsing(false);
    }
  };

  const startNewHunt = async () => {
    if (!jobDescription.trim()) return toast.error("Enter a job description");
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("lead-hunt-match", {
        body: { jobTitle: jobTitle || "Executive Search", companyName, jobDescription, leadsRequested },
      });
      if (error) throw error;
      toast.success(`Search complete. Pipeline ready.`);
      await loadSessions();
      loadKPIs();
      const { data: newSession } = await supabase
        .from("lead_hunt_sessions")
        .select("*")
        .eq("id", data.sessionId)
        .single();
      if (newSession) loadSessionMatches(newSession);
      setShowNewHunt(false);
    } catch (err: any) {
      toast.error("Lead hunter engine timed out");
    } finally {
      setIsSearching(false);
    }
  };

  const scoreCandidate = async (match: LeadMatch) => {
    setScoringMatch(match.id);
    try {
      const { data, error } = await supabase.functions.invoke("score-talent-match", { body: { matchId: match.id } });
      if (error) throw error;
      setMatches((prev) =>
        prev.map((m) => (m.id === match.id ? { ...m, ai_match_score: data.score, ai_analysis: data.analysis } : m)),
      );
    } catch (err) {
      toast.error("Analysis service unavailable");
    } finally {
      setScoringMatch(null);
    }
  };

  const scoreAllUnscored = async () => {
    const unscored = matches.filter((m) => !m.ai_match_score);
    if (unscored.length === 0) return toast.info("All candidates scored");
    setScoringAll(true);
    for (const match of unscored) {
      await scoreCandidate(match);
    }
    setScoringAll(false);
    toast.success("Pipeline scoring complete");
  };

  const exportMatches = (onlyShortlisted: boolean = false) => {
    const listToExport = onlyShortlisted ? matches.filter((m) => m.shortlisted) : matches;
    if (listToExport.length === 0) return toast.warning("No matches found to export");
    const headers = ["Name", "Email", "Phone", "Initial Score", "AI Score", "Shortlisted"];
    const rows = listToExport.map((m) => [
      m.talent.full_name,
      m.talent.email,
      m.talent.phone || "",
      m.initial_score?.toString() || "",
      m.ai_match_score?.toString() || "",
      m.shortlisted ? "Yes" : "No",
    ]);
    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lead-hunt-export.csv`;
    a.click();
    toast.success("CSV Downloaded");
  };

  const toggleShortlist = async (match: LeadMatch) => {
    try {
      const { error } = await supabase
        .from("lead_hunt_matches")
        .update({ shortlisted: !match.shortlisted })
        .eq("id", match.id);
      if (error) throw error;
      setMatches((prev) => prev.map((m) => (m.id === match.id ? { ...m, shortlisted: !m.shortlisted } : m)));
      loadKPIs();
    } catch (err) {
      toast.error("Shortlist update failed");
    }
  };

  const deleteSession = async (sessionId: string) => {
    setDeletingSession(sessionId);
    try {
      const { error } = await supabase.from("lead_hunt_sessions").delete().eq("id", sessionId);
      if (error) throw error;
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      loadKPIs();
    } finally {
      setDeletingSession(null);
    }
  };

  const openTalentDetail = (match: LeadMatch) => {
    setTalentDetailEmail(match.talent.email);
    setTalentDetailName(match.talent.full_name);
    setTalentDetailOpen(true);
  };

  const viewAnalysis = (match: LeadMatch) => {
    setSelectedMatch(match);
    setShowAnalysis(true);
  };

  if (isLoading && !selectedSession) return <DashboardTableSkeleton rows={8} columns={4} />;

  if (selectedSession) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-muted/20 p-4 rounded-xl border">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate text-foreground">{selectedSession.job_title}</h2>
            <p className="text-sm font-medium text-muted-foreground">
              {selectedSession.company_name || "Internal Role"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {unscoredCount > 0 && (
              <Button
                size="sm"
                onClick={scoreAllUnscored}
                disabled={scoringAll}
                className="bg-primary shadow-lg shadow-primary/20"
              >
                {scoringAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
                Score Pipeline ({unscoredCount})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportMatches(true)}
              className="font-bold border-primary/20 text-primary"
            >
              <Star className="w-4 h-4 mr-2 fill-primary" /> Export Shortlist
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-12">
                  <Star className="w-4 h-4" />
                </TableHead>
                <TableHead className="font-bold text-foreground">Candidate Profile</TableHead>
                <TableHead className="font-bold text-foreground">Initial Match</TableHead>
                <TableHead className="font-bold text-foreground">AI Precision Score</TableHead>
                <TableHead className="text-right font-bold text-foreground px-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id} className={match.shortlisted ? "bg-primary/5" : ""}>
                  <TableCell>
                    <Checkbox checked={match.shortlisted} onCheckedChange={() => toggleShortlist(match)} />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <button
                        className="font-bold text-primary hover:underline"
                        onClick={() => openTalentDetail(match)}
                      >
                        {match.talent.full_name}
                      </button>
                      <div className="flex flex-wrap gap-1">
                        {(match.talent.skills as string[])?.slice(0, 3).map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] py-0">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {match.initial_score || 0}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {match.ai_match_score ? (
                      <Button
                        variant="ghost"
                        className="h-auto p-0 hover:bg-transparent group"
                        onClick={() => viewAnalysis(match)}
                      >
                        <Badge
                          className={`${match.ai_match_score >= 80 ? "bg-emerald-500" : "bg-amber-500"} text-white font-bold px-3 py-1 group-hover:scale-105 transition-transform`}
                        >
                          {match.ai_match_score}% <ChevronRight className="w-3 h-3 ml-1" />
                        </Badge>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[10px] font-bold"
                        onClick={() => scoreCandidate(match)}
                        disabled={scoringMatch === match.id}
                      >
                        {scoringMatch === match.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 mr-1" />
                            Score AI
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="text-right px-4">
                    <div className="flex justify-end gap-2">
                      {match.talent.cv_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => downloadFile(match.talent.cv_url!, `${match.talent.full_name}-CV.pdf`)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Restore Analysis Dialog */}
        <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
          <DialogContent className="max-w-2xl border-none shadow-2xl">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="text-primary" /> AI Evaluation Report
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] p-4">
              {selectedMatch?.ai_analysis && (
                <div className="space-y-6">
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-center">
                    <p className="text-3xl font-black text-primary">{selectedMatch.ai_match_score}% Precision Score</p>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <h4 className="text-sm font-bold mb-2">Strengths Alignment</h4>
                    <ul className="space-y-2">
                      {selectedMatch.ai_analysis.strengths?.map((s: string, i: number) => (
                        <li key={i} className="text-sm font-medium">
                          • {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-primary p-4 rounded-xl text-white">
                    <p className="text-sm font-bold">{selectedMatch.ai_analysis.recommendation}</p>
                  </div>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <TalentDetailDialog
          open={talentDetailOpen}
          onOpenChange={setTalentDetailOpen}
          talentEmail={talentDetailEmail}
          talentName={talentDetailName}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Pipeline Hunts" value={totalCount} icon={Target} variant="default" />
        <StatsCard title="Total Matches" value={kpiTotalMatches} icon={Users} variant="secondary" />
        <StatsCard title="Shortlisted" value={kpiShortlisted} icon={Star} variant="accent" />
      </div>

      <Card className="shadow-sm border-muted">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-muted/20">
          <div>
            <CardTitle className="flex items-center gap-2 font-bold text-foreground">
              <Target className="w-5 h-5 text-primary" /> Proactive Lead Hunter
            </CardTitle>
            <CardDescription className="font-medium">Managing talent pipelines via AI-matching.</CardDescription>
          </div>
          <Button
            onClick={() => setShowNewHunt(true)}
            className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold"
          >
            <Zap className="w-4 h-4 mr-2" /> Start New Hunt
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6">
            <Input
              placeholder="Search recruitment sessions..."
              value={sessionSearch}
              onChange={(e) => setSessionSearch(e.target.value)}
              className="max-w-md bg-muted/30"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((session) => (
              <Card
                key={session.id}
                className="group hover:border-primary/50 transition-all cursor-pointer bg-card"
                onClick={() => loadSessionMatches(session)}
              >
                <div className="p-4 space-y-4">
                  <p className="font-bold text-foreground truncate">{session.job_title}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-muted">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                      {session.company_name || "Internal Role"}
                    </p>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {session.match_count || 0} Matches
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 gap-4 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 rounded-full px-4"
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-xs font-bold">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="h-8 rounded-full px-4"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewHunt} onOpenChange={setShowNewHunt}>
        <DialogContent className="max-w-2xl border-none shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
              <Sparkles className="text-primary h-5 w-5" /> AI Specs Generator
            </DialogTitle>
          </DialogHeader>
          {!jdParsed ? (
            <div className="space-y-6 pt-4">
              <Textarea
                value={rawJD}
                onChange={(e) => setRawJD(e.target.value)}
                placeholder="Paste JD text here..."
                rows={10}
                className="bg-muted/30"
              />
              <DialogFooter>
                <Button onClick={parseJD} disabled={isParsing || !rawJD.trim()} className="bg-primary font-bold w-full">
                  {isParsing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Extract Specifications"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Title" />
                <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Company" />
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t">
                <Button
                  variant="ghost"
                  onClick={() => setJdParsed(false)}
                  className="font-bold text-primary sm:mr-auto"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Refine
                </Button>
                <Button
                  onClick={startNewHunt}
                  disabled={isSearching}
                  className="bg-primary font-black shadow-lg shadow-primary/20 px-8"
                >
                  {isSearching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Finalize Hunt"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
