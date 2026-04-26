import { useState, useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ChannelPromotionCard } from "./ChannelPromotionCard";

const CVOutreachGenerator = lazy(() =>
  import("../CVOutreachGenerator").then((m) => ({ default: m.CVOutreachGenerator }))
);

interface JobOption {
  id: string; title: string; company_name: string; location: string | null; job_type: string | null;
  application_type: string; application_url: string | null; application_email: string | null;
}

export function JobsOutreachTab() {
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");

  useEffect(() => {
    supabase
      .from("jobs")
      .select("id,title,company_name,location,job_type,application_type,application_url,application_email")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        const list = (data || []) as JobOption[];
        setJobs(list);
        if (list.length && !selectedJobId) setSelectedJobId(list[0].id);
      });
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Job Promotion — Multi-Channel</CardTitle>
          <p className="text-xs text-muted-foreground">
            Generate channel-specific captions powered by AI, copy them, and log each post so you can track distribution.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-full max-w-md"><SelectValue placeholder="Pick a job to promote" /></SelectTrigger>
            <SelectContent>
              {jobs.map((j) => (
                <SelectItem key={j.id} value={j.id}>{j.title} — {j.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedJob && <ChannelPromotionCard job={selectedJob} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">CV-Driven Outreach (Reusable)</CardTitle>
          <p className="text-xs text-muted-foreground">
            Parse a CV and generate tailored WhatsApp / Email / LinkedIn outreach for that candidate.
          </p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
            <CVOutreachGenerator />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
