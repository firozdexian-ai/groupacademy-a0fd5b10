import { useState, useEffect, useCallback } from "react";
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
  SendHorizontal,
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
      toast.success("AI parsed extraction complete");
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
        body: { jobTitle: jobTitle || "Proactive Lead Hunt", companyName, jobDescription, leadsRequested },
      });
      if (error) throw error;
      toast.success(`Pipeline populated with ${data.matchCount} candidates`);
      await loadSessions();
      loadKPIs();
      const { data: newSession } = await supabase
        .from("lead_hunt_sessions")
        .select("*")
        .eq("id", data.sessionId)
        .single();
      if (newSession) loadSessionMatches(newSession);
      setShowNewHunt(false);
      setRawJD("");
      setJobTitle("");
      setCompanyName("");
      setJobDescription("");
      setJdParsed(false);
    } catch (err: any) {
      toast.error("Match engine failed to start");
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
      toast.success(`${match.talent.full_name}: AI Score ${data.score}%`);
    } catch (err) {
      toast.error("AI Scoring busy");
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
      setTotalCount((c) => c - 1);
      loadKPIs();
      toast.success("Hunt session archived");
    } finally {
      setDeletingSession(null);
    }
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
              {selectedSession.company_name || "Internal Hunt"}
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
                <TableRow key={match.id} className={match.shortlisted ? "bg-primary/5 transition-colors" : ""}>
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

        <Dialog open={showAnalysis} onOpenChange={setShowAnalysis}>
          <DialogContent className="max-w-2xl border-none shadow-2xl">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="text-primary" /> AI Candidate Evaluation
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[50vh] p-4">
              {selectedMatch?.ai_analysis && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-center">
                      <p className="text-[10px] font-bold uppercase text-primary">Skills Alignment</p>
                      <p className="text-3xl font-black text-primary">
                        {selectedMatch.ai_analysis.breakdown?.skills_match || 0}%
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-xl border text-center">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Experience Fit</p>
                      <p className="text-3xl font-black text-foreground">
                        {selectedMatch.ai_analysis.breakdown?.experience_fit || 0}%
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" /> Executive Highlights
                    </h4>
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm leading-relaxed">
                      <ul className="space-y-2">
                        {selectedMatch.ai_analysis.strengths?.map((s: string, i: number) => (
                          <li key={i} className="flex gap-2 font-medium">
                            • {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="bg-primary p-4 rounded-xl text-white">
                    <h4 className="text-xs font-black uppercase tracking-widest mb-1 opacity-80">
                      Final Recommendation
                    </h4>
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
              <Target className="w-5 h-5 text-primary" /> Executive Lead Hunter
            </CardTitle>
            <CardDescription className="font-medium">
              AI-powered talent extraction from internal database.
            </CardDescription>
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
                className="group hover:border-primary/50 transition-all cursor-pointer bg-card overflow-hidden"
                onClick={() => loadSessionMatches(session)}
              >
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate">{session.job_title}</p>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase">
                        {session.company_name || "Internal Role"}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {session.match_count || 0} Leads
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-muted">
                    <p className="text-[10px] font-bold text-muted-foreground">
                      {new Date(session.created_at).toLocaleDateString()}
                    </p>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()} className="border-none shadow-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-bold">Archive Hunt Session?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove "{session.job_title}" and its AI candidate analysis.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="font-bold">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSession(session.id)}
                            className="bg-destructive font-bold"
                          >
                            Archives Hunt
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                Page {page} / {totalPages}
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

      <Dialog
        open={showNewHunt}
        onOpenChange={(open) => {
          setShowNewHunt(open);
          if (!open) {
            setRawJD("");
            setJdParsed(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl border-none shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
              <Sparkles className="text-primary h-5 w-5" /> AI Pipeline Generator
            </DialogTitle>
          </DialogHeader>
          {!jdParsed ? (
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">
                  Internal or Client Job Description
                </Label>
                <Textarea
                  value={rawJD}
                  onChange={(e) => setRawJD(e.target.value)}
                  placeholder="Paste the full job posting to let AI extract matching requirements..."
                  rows={10}
                  className="bg-muted/30 focus:bg-background transition-colors"
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowNewHunt(false)} className="font-bold">
                  Discard
                </Button>
                <Button
                  onClick={parseJD}
                  disabled={isParsing || !rawJD.trim()}
                  className="bg-primary font-bold shadow-lg shadow-primary/20"
                >
                  {isParsing ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Extract Job Specs
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase">Position Title</Label>
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="bg-muted/30" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-[10px] uppercase">Employer</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="bg-muted/30" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-[10px] uppercase">Candidate Scarcity Threshold</Label>
                <Input
                  type="number"
                  min={5}
                  max={50}
                  value={leadsRequested}
                  onChange={(e) => setLeadsRequested(parseInt(e.target.value) || 20)}
                  className="bg-muted/30"
                />
                <p className="text-[10px] text-muted-foreground">
                  Select how many candidates the AI should hunt for (Max 50).
                </p>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setJdParsed(false)}
                  className="sm:mr-auto font-bold text-primary"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" /> Refine JD
                </Button>
                <Button
                  onClick={startNewHunt}
                  disabled={isSearching}
                  className="bg-primary font-black shadow-lg shadow-primary/20 px-8"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Finalize Hunt
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
