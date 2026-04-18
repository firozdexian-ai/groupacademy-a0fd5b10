import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Coins,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  MousePointerClick,
  Copy,
  Check,
  Link2,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MySubmissionsProps {
  talentId?: string;
}

const statusConfig = {
  pending: { label: "In Review", icon: Clock, className: "bg-amber-500/10 text-amber-600 border-none" },
  approved: { label: "Completed", icon: CheckCircle2, className: "bg-emerald-500/10 text-emerald-600 border-none" },
  rejected: { label: "Correction", icon: XCircle, className: "bg-rose-500/10 text-rose-600 border-none" },
};

export function MySubmissions({ talentId }: MySubmissionsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["my-gig-submissions", talentId],
    enabled: !!talentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gig_submissions")
        .select("*, gigs(title, credit_reward, icon, category)")
        .eq("talent_id", talentId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: talentRefCode } = useQuery({
    queryKey: ["talent-ref-code", talentId],
    enabled: !!talentId,
    queryFn: async () => {
      const { data } = await supabase.from("talents").select("ref_code").eq("id", talentId!).single();
      return data?.ref_code;
    },
  });

  // CTO Strategy: Real-time campaign tracking for Job Sharing
  const jobShareIds =
    submissions?.filter((s) => s.gigs?.category === "job_sharing").map((s) => (s.submission_data as any)?.job_id) || [];

  const { data: clickCounts } = useQuery({
    queryKey: ["share-click-counts", talentId, jobShareIds],
    enabled: jobShareIds.length > 0,
    queryFn: async () => {
      const counts: Record<string, number> = {};
      for (const jobId of jobShareIds) {
        const { count } = await supabase
          .from("job_share_clicks")
          .select("*", { count: "exact", head: true })
          .eq("talent_id", talentId!)
          .eq("job_id", jobId);
        counts[jobId] = count || 0;
      }
      return counts;
    },
    refetchInterval: 30000, // Auto-refresh every 30s during active campaigns
  });

  if (isLoading)
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[24px]" />
        ))}
      </div>
    );

  if (!submissions?.length) {
    return (
      <div className="py-16 text-center border-2 border-dashed rounded-[32px] border-border/40">
        <Sparkles className="h-10 w-10 text-muted-foreground/10 mx-auto mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
          No active missions found
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {submissions.map((sub: any) => {
        const config = statusConfig[sub.status as keyof typeof statusConfig] || statusConfig.pending;
        const StatusIcon = config.icon;
        const isJobSharing = sub.gigs?.category === "job_sharing";
        const jobId = (sub.submission_data as any)?.job_id;
        const clicks = isJobSharing && jobId ? clickCounts?.[jobId] || 0 : null;
        const CLICK_THRESHOLD = 10;

        return (
          <div
            key={sub.id}
            className="group relative bg-card/50 backdrop-blur-sm rounded-[28px] p-5 border border-border/40 hover:border-primary/20 transition-all hover:shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {sub.gigs?.title}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-border" />
                  <span className="text-[10px] font-bold text-muted-foreground/40">
                    {format(new Date(sub.created_at), "MMM d")}
                  </span>
                </div>
                <h4 className="font-black text-sm tracking-tight truncate leading-tight">
                  {(sub.submission_data as any)?.job_title ||
                    (sub.submission_data as any)?.parsed_job?.title ||
                    "Project Submission"}
                </h4>
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 h-6", config.className)}>
                  <StatusIcon className="h-3 w-3 mr-1.5" /> {config.label}
                </Badge>
                {sub.status === "approved" && (
                  <div className="flex items-center gap-1 text-emerald-600">
                    <Coins className="h-3 w-3" />
                    <span className="text-xs font-black">+{sub.credits_awarded}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign Progress - Exclusive to Job Sharing */}
            {isJobSharing && sub.status === "pending" && clicks !== null && (
              <div className="mt-5 space-y-3 bg-primary/5 rounded-2xl p-4 border border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="h-3.5 w-3.5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Viral Reach</span>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground">
                    {clicks}/{CLICK_THRESHOLD} Clicks
                  </span>
                </div>
                <Progress value={Math.min((clicks / CLICK_THRESHOLD) * 100, 100)} className="h-1.5 bg-primary/20" />

                <div className="flex items-center gap-2 pt-1">
                  <div className="flex-1 flex items-center gap-2 bg-background/50 rounded-xl px-3 py-2 border border-border/40 min-w-0">
                    <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                    <code className="text-[10px] font-bold text-muted-foreground truncate">
                      {`${window.location.origin}/jobs/${jobId}?ref=${talentRefCode}`}
                    </code>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-primary/10"
                    onClick={() => {
                      const url = `${window.location.origin}/jobs/${jobId}?ref=${talentRefCode}`;
                      navigator.clipboard.writeText(url);
                      setCopiedId(sub.id);
                      toast.success("Link recovered!");
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                  >
                    {copiedId === sub.id ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {sub.admin_notes && (
              <div className="mt-4 flex gap-3 p-3 bg-rose-500/[0.03] border border-rose-500/10 rounded-xl">
                <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                <p className="text-[11px] font-medium text-rose-600 leading-tight">
                  <span className="font-black uppercase tracking-tighter mr-1">Admin:</span>
                  {sub.admin_notes}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
