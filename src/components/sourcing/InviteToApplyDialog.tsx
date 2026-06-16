import { useState, useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { listJobsByCompanyAndStatus } from "@/domains/jobs/repo/jobsRepo";
import { useInviteToApply } from "@/domains/jobs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { Loader2, MailPlus, ShieldCheck } from "lucide-react";

interface InviteToApplyDialogProps {
  open: boolean;
  onOpenChange: (openStateBool: boolean) => void;
  companyId: string;
  talentId: string;
}

interface ActiveJobNode {
  id: string;
  title: string;
}

/**
 * Recruiter dialog to invite a candidate to apply for an active job opening.
 */
export function InviteToApplyDialog({ open, onOpenChange, companyId, talentId }: InviteToApplyDialogProps) {
  const queryClient = useQueryClient();
  const jobInvitationMutation = useInviteToApply();
  const isMountedRef = useRef<boolean>(true);

  const [jobs, setJobs] = useState<ActiveJobNode[]>([]);
  const [jobId, setJobId] = useState<string>("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetchingJobs, setFetchingJobs] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    if (open) {
      trackEvent("job_invitation_dialog_opened", { companyId, talentId });
    }
    return () => {
      isMountedRef.current = false;
    };
  }, [open, companyId, talentId]);

  useEffect(() => {
    let isRequestActive = true;
    if (!open || !companyId) return;

    if (isMountedRef.current) {
      setFetchingJobs(true);
    }

    listJobsByCompanyAndStatus(companyId, "active", 50)
      .then((jobsDataPayload) => {
        if (isRequestActive && isMountedRef.current) {
          const typedJobsList = (jobsDataPayload || []) as ActiveJobNode[];
          setJobs(typedJobsList);
          setFetchingJobs(false);
          trackEvent("job_invitation_active_openings_loaded", { listingsCount: typedJobsList.length });
        }
      })
      .catch((jobsQueryError: unknown) => {
        trackError(jobsQueryError, {
          component: "InviteToApplyDialog",
          action: "fetch_company_active_jobs",
          companyId,
        });
        if (isRequestActive && isMountedRef.current) {
          setFetchingJobs(false);
        }
      });

    return () => {
      isRequestActive = false;
    };
  }, [open, companyId]);

  const safeJobsCollection = useMemo(() => {
    if (!Array.isArray(jobs)) return [];
    return jobs.filter((jobItem) => jobItem && typeof jobItem.id === "string");
  }, [jobs]);

  const handleInvitationSubmit = async () => {
    const targetSelectedJobId = jobId;
    if (!targetSelectedJobId) {
      toast.error("Please select an active job opening to invite the candidate.");
      return;
    }

    setSaving(true);
    trackEvent("job_invitation_dispatch_initiated", { targetSelectedJobId });
    const dynamicToastTrackerId = toast.loading("Sending invitation...");

    try {
      await jobInvitationMutation.mutateAsync({
        job_id: targetSelectedJobId,
        company_id: companyId,
        talent_id: talentId,
        note: note.trim() || null,
      });

      await queryClient.invalidateQueries({ queryKey: ["job-invitations"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-profile", talentId] });

      if (isMountedRef.current) {
        toast.success("Invitation sent successfully.", {
          id: dynamicToastTrackerId,
        });
        trackEvent("job_invitation_dispatch_success", { targetSelectedJobId });

        setJobId("");
        setNote("");
        onOpenChange(false);
      }
    } catch (caughtPipelineExceptionErr: unknown) {
      const formattedExceptionMsgStr =
        caughtPipelineExceptionErr instanceof Error
          ? caughtPipelineExceptionErr.message
          : String(caughtPipelineExceptionErr);

      trackError(formattedExceptionMsgStr, {
        component: "InviteToApplyDialog",
        action: "commit_job_invitation_mutation_api",
        targetSelectedJobId,
      });

      toast.error(formattedExceptionMsgStr, { id: dynamicToastTrackerId });
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpenState) => {
        if (!isOpenState && !saving) {
          onOpenChange(isOpenState);
          trackEvent("job_invitation_dialog_cancelled");
        }
      }}
    >
      <DialogContent className="sm:max-w-md rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl shadow-2xl p-5 sm:p-6 text-left antialiased overflow-hidden flex flex-col justify-center">
        <DialogHeader className="mb-4 text-left select-none shrink-0 leading-none w-full">
          <div className="flex items-center gap-2.5 leading-none w-full">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shrink-0 shadow-inner">
              <MailPlus className="h-4 w-4 text-primary stroke-[2.2]" />
            </div>
            <div className="min-w-0 flex flex-col justify-center leading-none flex-1">
              <DialogTitle className="text-sm sm:text-base font-bold text-foreground uppercase tracking-wide leading-none">
                Invite Candidate to Apply
              </DialogTitle>
              <DialogDescription className="text-[10px] font-semibold tracking-wider text-muted-foreground/60 leading-none pt-1">
                Select one of your active job openings and send a personalized invitation.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 w-full min-w-0 font-bold text-xs tracking-tight text-foreground/90">
          <div className="space-y-1.5 text-left w-full min-w-0">
            <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
              Target Job Opening *
            </Label>
            <Select
              value={jobId}
              disabled={saving || fetchingJobs}
              onValueChange={(val) => {
                trackEvent("job_invitation_opening_selected", { targetSelectedJobId: val });
                setJobId(val);
              }}
            >
              <SelectTrigger className="h-10 rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground px-3 cursor-pointer">
                {fetchingJobs ? (
                  <span className="flex items-center gap-2 text-muted-foreground/40 italic">
                    <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                    <span>Loading jobs...</span>
                  </span>
                ) : (
                  <SelectValue placeholder="Select an active job opening..." />
                )}
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border/40 bg-background font-bold text-xs max-h-60">
                {safeJobsCollection.length === 0 && !fetchingJobs ? (
                  <p className="text-[10px] font-semibold text-center py-3 uppercase tracking-wide text-muted-foreground/40 italic">
                    No active job openings found.
                  </p>
                ) : (
                  safeJobsCollection.map((jobNodeItem) => (
                    <SelectItem
                      key={jobNodeItem.id}
                      value={jobNodeItem.id}
                      className="cursor-pointer text-xs font-semibold py-2 rounded-lg uppercase tracking-wide"
                    >
                      {jobNodeItem.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 text-left w-full min-w-0">
            <Label className="text-[10px] font-extrabold uppercase tracking-wide text-primary block pl-0.5 leading-none select-none">
              Personal Note{" "}
              <span className="text-muted-foreground/40 font-normal lowercase tracking-normal">(optional)</span>
            </Label>
            <Textarea
              rows={3}
              value={note}
              disabled={saving}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Explain why they are a great fit, salary details, or next steps..."
              className="w-full rounded-xl border border-border/40 bg-background/50 text-xs sm:text-sm font-semibold tracking-tight text-foreground p-3.5 leading-relaxed resize-none shadow-inner"
              maxLength={400}
            />
          </div>
        </div>

        <DialogFooter className="mt-5 gap-2.5 sm:gap-0 select-none border-t border-border/10 pt-4 w-full shrink-0 flex items-center justify-end font-bold text-xs">
          <Button
            variant="ghost"
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="h-9 px-4 rounded-xl text-muted-foreground hover:text-foreground font-bold uppercase text-[10px] tracking-wide shrink-0 transition-colors cursor-pointer"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleInvitationSubmit}
            disabled={saving || !jobId || fetchingJobs}
            className="h-9 px-5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transform-gpu active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 stroke-[2.5]" />
                <span>Send Invitation</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
