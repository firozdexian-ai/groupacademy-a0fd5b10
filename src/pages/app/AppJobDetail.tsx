import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Briefcase,
  Bookmark,
  Brain,
  ArrowRight,
  ShieldCheck,
  Flame,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AIJobInsights } from "@/components/jobs/AIJobInsights";
import { ExternalApplicationPrep } from "@/components/jobs/ExternalApplicationPrep";
import { useCredits } from "@/hooks/useCredits";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { RelatedJobs } from "@/components/jobs/RelatedJobs";
import { getJobTypeLabel, getExperienceLevelLabel, isDeadlinePassed } from "@/lib/constants/jobTypes";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  company_id: string | null;
  location: string | null;
  job_type: string;
  experience_level: string;
  salary_range_min: number | null;
  salary_range_max: number | null;
  salary_currency: string | null;
  description: string;
  ai_enhanced_description: string | null;
  requirements: any;
  application_type: string;
  application_email: string | null;
  application_url: string | null;
  deadline: string | null;
  is_featured: boolean;
  created_at: string;
  ai_assessment_enabled: boolean;
}

interface ExistingApplication {
  id: string;
  application_status: string;
  assessment_id?: string;
  assessment_status?: string;
}

export default function AppJobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { isSaved: checkIsSaved, toggleSave, isLoading: saveLoading } = useSavedItems();
  const { balance } = useCredits();

  const [job, setJob] = useState<Job | null>(null);
  const [existingApp, setExistingApp] = useState<ExistingApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplyAI, setShowApplyAI] = useState(false);

  const isSaved = id ? checkIsSaved(id, "job") : false;
  const deadlinePassed = job?.deadline ? isDeadlinePassed(job.deadline) : false;

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: jobData, error: jobError } = await supabase.from("jobs").select("*").eq("id", id).single();
      if (jobError) throw jobError;
      setJob(jobData as Job);

      if (talent?.id) {
        const { data: appData } = await supabase
          .from("job_applications")
          .select(`id, application_status, job_assessments(id, status)`)
          .eq("job_id", id)
          .eq("talent_id", talent.id)
          .maybeSingle();

        if (appData) {
          const assessment = (appData as any).job_assessments?.[0];
          setExistingApp({
            id: appData.id,
            application_status: appData.application_status,
            assessment_id: assessment?.id,
            assessment_status: assessment?.status,
          });
        }
      }
    } catch (error) {
      toast.error("Failed to load job details");
    } finally {
      setLoading(false);
    }
  }, [id, talent?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApply = () => {
    if (job?.application_type === "link") {
      const cost = CREDIT_CONFIG.SERVICES.EXTERNAL_APPLICATION.cost;
      if ((balance ?? 0) < cost) return toast.error(`Need ${cost} credits`);
      setShowApplyAI(true);
    } else {
      navigate(`/app/jobs/${id}/apply`);
    }
  };

  if (loading)
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  if (!job) return <div className="p-20 text-center">Job not found.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 space-y-8">
      {/* Header / Hero */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex gap-4 items-start">
          <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center border shrink-0 overflow-hidden">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} alt="logo" className="object-cover w-full h-full" />
            ) : (
              <Building2 className="text-primary w-8 h-8" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              {job.is_featured && (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 gap-1">
                  <Flame className="w-3 h-3" /> Featured
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <span className="font-semibold text-foreground">{job.company_name}</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              <MapPin className="w-3.5 h-3.5" /> {job.location || "Remote"}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant={isSaved ? "default" : "outline"}
            className="flex-1 md:flex-none"
            onClick={() => toggleSave(job.id, "job")}
          >
            <Bookmark className={isSaved ? "fill-current" : ""} />
          </Button>
          <Button
            size="lg"
            className="flex-1 md:min-w-[160px]"
            onClick={handleApply}
            disabled={deadlinePassed || !!existingApp}
          >
            {deadlinePassed ? "Closed" : existingApp ? "Applied" : "Apply Now"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {talent?.id && <AIJobInsights jobId={job.id} talentId={talent.id} />}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Description</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {job.ai_enhanced_description || job.description}
            </CardContent>
          </Card>

          {/* CTO FIX: Satisfying RelatedJobsProps interface requirements */}
          <RelatedJobs
            currentJobId={job.id}
            companyName={job.company_name}
            location={job.location || "Remote"}
            linkPrefix="/app/jobs"
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {existingApp && job.ai_assessment_enabled && existingApp.assessment_status !== "completed" && (
            <Card className="border-primary bg-primary/5 shadow-md">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <Brain className="w-5 h-5 animate-pulse" />
                  <span className="font-bold">AI Interview Pending</span>
                </div>
                <p className="text-sm">
                  This employer uses AI interviewing. Take it now to appear at the top of their list.
                </p>
                <Button className="w-full" onClick={() => navigate(`/app/job-assessment/${existingApp.assessment_id}`)}>
                  Take Assessment <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground">Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" /> Type
                </span>
                <Badge variant="secondary">{getJobTypeLabel(job.job_type)}</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Experience
                </span>
                <span className="font-medium">{getExperienceLevelLabel(job.experience_level)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Deadline
                </span>
                <span className={deadlinePassed ? "text-destructive font-bold" : ""}>
                  {job.deadline ? new Date(job.deadline).toLocaleDateString() : "Open"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {showApplyAI && job.application_url && (
        <ExternalApplicationPrep
          open={showApplyAI}
          onOpenChange={setShowApplyAI}
          jobId={job.id}
          applicationUrl={job.application_url}
          jobTitle={job.title}
          companyName={job.company_name}
        />
      )}
    </div>
  );
}
