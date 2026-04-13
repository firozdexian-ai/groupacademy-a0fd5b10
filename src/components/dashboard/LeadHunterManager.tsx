import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
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
  Sparkles,
  CheckCircle,
  ChevronRight,
  ArrowLeft,
  ChevronLeft,
  Zap,
  Database,
  Type,
  MoreHorizontal,
  MessageSquare,
  Mail,
  Linkedin,
  AlertCircle,
  X,
  Eye,
  Download,
} from "lucide-react";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getOutreachWhatsAppLink, getOutreachEmailLink, getOutreachLinkedInMessage } from "@/lib/outreachTemplates";
import { extractFirstName } from "@/lib/utils";

export function LeadHunterManager() {
  // Data State
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [huntMode, setHuntMode] = useState<"select" | "paste">("select");

  // Status State
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewHunt, setShowNewHunt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedJobId, setSelectedJobId] = useState("");
  const [rawJD, setRawJD] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [leadsRequested, setLeadsRequested] = useState(20);

  // Detail View State
  const [selectedSession, setSelectedSession] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [talentDetailOpen, setTalentDetailOpen] = useState(false);
  const [selectedTalent, setSelectedTalent] = useState<any>(null); // FIXED: Restored missing state

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sessionsRes, jobsRes] = await Promise.all([
        supabase.from("lead_hunt_sessions").select("*").order("created_at", { ascending: false }),
        supabase
          .from("jobs")
          .select("id, title, company_name, description")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);
      if (sessionsRes.error) throw sessionsRes.error;
      setSessions(sessionsRes.data || []);
      setActiveJobs(jobsRes.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadSessionMatches = async (session: any) => {
    setSelectedSession(session);
    setLoadingMatches(true);
    try {
      const { data, error: matchErr } = await supabase
        .from("lead_hunt_matches")
        .select(`id, ai_match_score, shortlisted, talent:talents ( id, full_name, email, phone, country, cv_url )`)
        .eq("session_id", session.id)
        .order("ai_match_score", { ascending: false });
      if (matchErr) throw matchErr;
      setMatches(data || []);
    } catch (err) {
      toast.error("Failed to load match results");
    } finally {
      setLoadingMatches(false);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!jobSearch) return activeJobs;
    const term = jobSearch.toLowerCase();
    return activeJobs.filter(
      (j) => j.title?.toLowerCase().includes(term) || j.company_name?.toLowerCase().includes(term),
    );
  }, [activeJobs, jobSearch]);

  const handleJobSelection = (job: any) => {
    setSelectedJobId(job.id);
    setJobTitle(job.title);
    setCompanyName(job.company_name);
    setJobDescription(job.description);
    toast.success("Job specs imported");
  };

  const startHunt = async () => {
    setIsSearching(true);
    try {
      const { data, error: huntError } = await supabase.functions.invoke("lead-hunt-match", {
        body: {
          jobTitle: huntMode === "select" ? jobTitle : "External Hunt",
          companyName: huntMode === "select" ? companyName : "Manual",
          jobDescription: huntMode === "select" ? jobDescription : rawJD,
          leadsRequested,
        },
      });
      if (huntError) throw huntError;
      toast.success("AI matching complete!");
      loadData();
      setShowNewHunt(false);
    } catch (err) {
      toast.error("Match engine failed.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (match: any, channel: "whatsapp" | "email" | "linkedin") => {
    const name = extractFirstName(match.talent.full_name);
    const title = selectedSession?.job_title || jobTitle;
    try {
      if (channel === "whatsapp" && match.talent.phone) {
        window.open(
          getOutreachWhatsAppLink(match.talent.phone, "welcome", name, match.talent.country, `Opportunity: ${title}`),
          "_blank",
        );
      } else if (channel === "email" && match.talent.email) {
        window.open(
          getOutreachEmailLink(match.talent.email, "welcome", name, match.talent.country, `Opportunity: ${title}`),
          "_blank",
        );
      } else if (channel === "linkedin") {
        const msg = getOutreachLinkedInMessage("welcome", name, match.talent.country, `Opportunity: ${title}`);
        await navigator.clipboard.writeText(msg);
        toast.success("Invite copied!");
      }
      await supabase.from("outreach_messages").insert({ talent_id: match.talent.id, product: "welcome", channel });
    } catch (err) {
      toast.error("Outreach failed");
    }
  };

  if (error) return <DashboardErrorState title="Connection Error" message={error} onRetry={loadData} />;

  if (selectedSession) {
    return (
      <div className="space-y-6 animate-in slide-in-from-left-2 duration-300">
        <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-xl border">
          <Button variant="ghost" size="sm" onClick={() => setSelectedSession(null)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{selectedSession.job_title}</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase">{selectedSession.company_name}</p>
          </div>
        </div>

        <Card>
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold">Candidate</TableHead>
                <TableHead className="font-bold">Score</TableHead>
                <TableHead className="text-right font-bold px-6">Outreach</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingMatches ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10">
                    <Loader2 className="animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                matches.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <div className="font-bold">{m.talent.full_name}</div>
                      <div className="text-[10px] text-muted-foreground">{m.talent.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={m.ai_match_score >= 80 ? "bg-emerald-500" : "bg-amber-500"}>
                        {m.ai_match_score}% Match
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTalent(m.talent);
                              setTalentDetailOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" /> View Profile
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleInvite(m, "whatsapp")}>
                            <MessageSquare className="w-4 h-4 mr-2 text-emerald-500" /> WhatsApp Invite
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleInvite(m, "email")}>
                            <Mail className="w-4 h-4 mr-2 text-blue-500" /> Email Invite
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleInvite(m, "linkedin")}>
                            <Linkedin className="w-4 h-4 mr-2 text-indigo-500" /> LinkedIn Pitch
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        <TalentDetailDialog open={talentDetailOpen} onOpenChange={setTalentDetailOpen} talent={selectedTalent} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-muted bg-card shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/20 pb-4">
          <div>
            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" /> Executive Hunter
            </CardTitle>
            <CardDescription className="font-bold">Identify matches across our 2,211 talent profiles.</CardDescription>
          </div>
          <Button onClick={() => setShowNewHunt(true)} className="bg-primary font-black shadow-lg shadow-primary/30">
            <Zap className="w-4 h-4 mr-2" /> New Hunt
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.map((s) => (
              <Card
                key={s.id}
                className="hover:border-primary/50 cursor-pointer bg-background border-muted"
                onClick={() => loadSessionMatches(s)}
              >
                <div className="p-4 space-y-3">
                  <p className="font-bold text-foreground truncate">{s.job_title}</p>
                  <div className="flex justify-between items-center pt-3 border-t border-muted/50">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">{s.company_name}</p>
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      {s.leads_requested} Target
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={showNewHunt} onOpenChange={setShowNewHunt}>
        <DialogContent className="max-w-2xl h-[85vh] p-0 flex flex-col border-none shadow-2xl overflow-hidden bg-background">
          <div className="bg-primary p-6 text-white shrink-0 relative">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-5 h-5" /> AI Lead Engine
            </h2>
            <p className="text-xs font-bold opacity-80 mt-1">Select from {activeJobs.length} active platform jobs.</p>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-white hover:bg-white/20"
              onClick={() => setShowNewHunt(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={huntMode === "select" ? "default" : "outline"}
                className={`h-16 flex flex-col gap-1 font-bold ${huntMode === "select" ? "bg-primary" : "border-primary/20 text-primary"}`}
                onClick={() => setHuntMode("select")}
              >
                <Database className="w-4 h-4" /> Internal Database
              </Button>
              <Button
                variant={huntMode === "paste" ? "default" : "outline"}
                className={`h-16 flex flex-col gap-1 font-bold ${huntMode === "paste" ? "bg-primary" : "border-primary/20 text-primary"}`}
                onClick={() => setHuntMode("paste")}
              >
                <Type className="w-4 h-4" /> Manual Paste
              </Button>
            </div>

            {huntMode === "select" ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search through 4,547 listed jobs..."
                    value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="pl-9 bg-muted/30 border-muted-foreground/20 h-11"
                  />
                </div>
                <div className="border border-muted rounded-xl overflow-hidden bg-muted/5">
                  <ScrollArea className="h-[300px]">
                    <div className="p-2 space-y-1">
                      {filteredJobs.length > 0 ? (
                        filteredJobs.map((job) => (
                          <div
                            key={job.id}
                            onClick={() => handleJobSelection(job)}
                            className={`p-4 rounded-lg cursor-pointer transition-all flex items-center justify-between group ${selectedJobId === job.id ? "bg-primary text-white shadow-lg" : "hover:bg-muted"}`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm truncate">{job.title}</p>
                              <p
                                className={`text-[10px] uppercase font-bold mt-0.5 ${selectedJobId === job.id ? "text-white/80" : "text-muted-foreground"}`}
                              >
                                {job.company_name}
                              </p>
                            </div>
                            {selectedJobId === job.id && <CheckCircle className="h-5 w-5 ml-3" />}
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-xs font-bold italic">No matching listings found.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Label className="font-bold text-xs uppercase text-muted-foreground tracking-widest">
                  Requirements Specification
                </Label>
                <Textarea
                  value={rawJD}
                  onChange={(e) => setRawJD(e.target.value)}
                  placeholder="Paste skills, tools, and experience requirements here..."
                  className="min-h-[250px] bg-muted/20 border-muted-foreground/20 text-sm p-4"
                />
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-muted/20 border-t shrink-0 flex flex-row items-center justify-end gap-3">
            <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => setShowNewHunt(false)}>
              Discard
            </Button>
            <Button
              onClick={startHunt}
              disabled={isSearching || (huntMode === "select" && !selectedJobId) || (huntMode === "paste" && !rawJD)}
              className="bg-primary font-black px-12 h-11 shadow-lg shadow-primary/40"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}{" "}
              Launch Hunt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
