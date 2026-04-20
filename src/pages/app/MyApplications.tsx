import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Building2,
  Clock,
  ClipboardList,
  Loader2,
  PlayCircle,
  Trophy,
  SearchX,
  Zap,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Platform Logic: Application Registry Ledger
 * High-fidelity orchestrator for job tracking and assessment lifecycle.
 * 2026 Standard: Executive Logic geometry with reinforced polling guards.
 */

interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company_name: string;
  created_at: string;
  application_status: string;
  delivery_status: string;
  ai_assessment_enabled: boolean;
  assessment_id: string | null;
  assessment_status: string | null;
  assessment_score: number | null;
}

const ApplicationTimeline = ({ status, isRejected }: { status: string; isRejected: boolean }) => {
  const steps = [
    { id: "submitted", label: "Registry" },
    { id: "screening", label: "Logic Check" },
    { id: "interview", label: "Synthesis" },
    { id: "offer", label: "Handshake" },
  ];

  const statusMap: Record<string, number> = {
    submitted: 0,
    reviewed: 0,
    screening: 1,
    shortlisted: 2,
    interview: 2,
    offer: 3,
    hired: 3,
    rejected: -1,
  };

  const currentIndex = statusMap[status] ?? 0;

  return (
    <div className="w-full mt-8 mb-6">
      <div className="relative flex justify-between">
        <div className="absolute top-3 left-0 w-full h-[1px] bg-muted/50 -z-10" />
        <div
          className="absolute top-3 left-0 h-[2px] bg-primary -z-10 transition-all duration-1000 ease-in-out"
          style={{ width: isRejected ? "0%" : `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          return (
            <div key={step.id} className="flex flex-col items-center flex-1 relative">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center border-2 bg-background transition-all duration-500 z-10",
                  isActive
                    ? "border-primary text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]"
                    : "border-muted text-muted-foreground/30",
                  isCurrent && !isRejected && "ring-4 ring-primary/10 scale-110",
                  isRejected &&
                    status === step.id &&
                    "border-destructive text-destructive shadow-[0_0_15px_rgba(var(--destructive-rgb),0.3)]",
                )}
              >
                <div className={cn("w-1 h-1 rounded-full bg-current")} />
              </div>
              <span
                className={cn(
                  "text-[8px] font-black uppercase tracking-[0.2em] mt-3 absolute top-6 text-center w-full italic transition-colors duration-500",
                  isActive ? "text-foreground" : "text-muted-foreground/40",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ApplicationCard = ({ application, onGenerate, onTake, onViewResult, isGenerating }: any) => {
  const navigate = useNavigate();
  const isRejected = application.application_status === "rejected";

  return (
    <Card
      className="group rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm hover:border-primary/40 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl"
      onClick={() => navigate(`/app/jobs/${application.job_id}`)}
    >
      <CardContent className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 rotate-3 transition-transform group-hover:rotate-0">
              <Briefcase className="h-7 w-7 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black uppercase tracking-tighter text-lg leading-none group-hover:text-primary transition-colors">
                {application.job_title}
              </h3>
              <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                {application.company_name}
              </p>
            </div>
          </div>
          <Badge
            className={cn(
              "rounded-lg font-black uppercase text-[8px] tracking-[0.2em] px-3 py-1 border-none",
              isRejected ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
            )}
          >
            {application.application_status.replace("_", " ")}
          </Badge>
        </div>
        <ApplicationTimeline status={application.application_status} isRejected={isRejected} />
      </CardContent>

      <CardFooter className="bg-muted/20 px-8 py-5 flex justify-between items-center border-t border-border/10">
        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
          <Clock className="h-3 w-3" />
          Node Created {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
        </div>

        <div className="flex gap-3">
          {application.ai_assessment_enabled &&
            (application.assessment_status === "completed" ? (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-10 border-2 font-black uppercase text-[9px] tracking-widest gap-2 bg-background hover:bg-primary/5"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewResult(application.assessment_id);
                }}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> Result Analysis: {application.assessment_score}%
              </Button>
            ) : application.assessment_id ? (
              <Button
                size="sm"
                className="rounded-xl h-10 font-black uppercase text-[9px] tracking-widest gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onTake(application.assessment_id);
                }}
              >
                <Zap className="w-3.5 h-3.5 fill-current" /> Execute Synthesis
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl h-10 border-2 font-black uppercase text-[9px] tracking-widest gap-2 bg-background"
                disabled={isGenerating}
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerate(application);
                }}
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                )}
                Initialize Interview
              </Button>
            ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default function MyApplications() {
  const { talent } = useTalent();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const applicationsRef = useRef<Application[]>([]);
  const generatingIdRef = useRef<string | null>(null);

  applicationsRef.current = applications;
  generatingIdRef.current = generatingId;

  const fetchApplications = useCallback(
    async (silent = false) => {
      if (!talent?.id) return;
      if (!silent) setLoading(true);
      try {
        const { data: appData } = await supabase
          .from("job_applications")
          .select(
            `id, job_id, created_at, application_status, delivery_status, jobs (title, company_name, ai_assessment_enabled)`,
          )
          .eq("talent_id", talent.id)
          .order("created_at", { ascending: false });

        const { data: assessData } = await supabase
          .from("job_assessments")
          .select("id, job_id, status, ai_score")
          .eq("talent_id", talent.id);

        const assessMap = new Map(assessData?.map((a) => [a.job_id, a]) || []);
        const formatted = appData?.map((app) => {
          const ass = assessMap.get(app.job_id);
          return {
            id: app.id,
            job_id: app.job_id,
            job_title: (app.jobs as any)?.title,
            company_name: (app.jobs as any)?.company_name,
            created_at: app.created_at,
            application_status: app.application_status || "submitted",
            delivery_status: app.delivery_status || "pending",
            ai_assessment_enabled: (app.jobs as any)?.ai_assessment_enabled,
            assessment_id: ass?.id || null,
            assessment_status: ass?.status || null,
            assessment_score: ass?.ai_score || null,
          };
        });
        setApplications(formatted || []);
      } finally {
        setLoading(false);
      }
    },
    [talent?.id],
  );

  useEffect(() => {
    if (!talent?.id) return;
    fetchApplications();

    const pollInterval = setInterval(() => {
      const needsUpdate = applicationsRef.current.some(
        (a) => a.ai_assessment_enabled && (!a.assessment_id || a.assessment_status === "generating"),
      );
      if (needsUpdate || generatingIdRef.current) {
        fetchApplications(true);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [talent?.id, fetchApplications]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in duration-1000">
      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[20px] bg-primary/10 flex items-center justify-center border border-primary/20">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Registry Ledger</h1>
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] mt-2 italic">
              Active Professional Applications
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 p-1.5 h-14 bg-muted/30 backdrop-blur-md rounded-2xl border border-border/40 max-w-2xl">
          {["all", "submitted", "reviewed", "shortlisted"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-xl font-black uppercase text-[9px] tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-lg"
            >
              {tab === "all" ? "Global" : tab === "submitted" ? "Active" : tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-10 space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          {loading ? (
            [1, 2].map((i) => <Skeleton key={i} className="h-60 w-full rounded-[32px] bg-muted/40" />)
          ) : applications.length === 0 ? (
            <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-muted/5 py-24 text-center">
              <CardContent className="space-y-6">
                <SearchX className="h-16 w-16 mx-auto opacity-10 rotate-12" />
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase tracking-tighter">Registry Empty</h3>
                  <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
                    No active career artifacts detected in logic.
                  </p>
                </div>
                <Button
                  onClick={() => navigate("/app/jobs")}
                  className="rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest border-2"
                >
                  Market Discovery
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {applications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  isGenerating={generatingId === app.id}
                  onTake={(id: string) => navigate(`/app/job-assessment/${id}`)}
                  onViewResult={(id: string) => navigate(`/app/job-assessment/${id}/results`)}
                  onGenerate={async (a: Application) => {
                    setGeneratingId(a.id);
                    try {
                      await supabase.functions.invoke("generate-job-assessment", {
                        body: { jobId: a.job_id, talentId: talent!.id, jobApplicationId: a.id },
                      });
                      await fetchApplications(true);
                    } catch (e) {
                      toast.error("Handshake Failed: Analysis generator offline.");
                    } finally {
                      setGeneratingId(null);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Terminal Footer Metadata */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">Telemetry Hub: Application Sync v2.6</p>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
