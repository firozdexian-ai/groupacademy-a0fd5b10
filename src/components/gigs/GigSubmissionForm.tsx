import { useTalent } from "@/hooks/useTalent";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Coins, Sparkles, AlertCircle } from "lucide-react";
import { CVUploadGigForm } from "./CVUploadGigForm";
import { JobPostingGigForm } from "./JobPostingGigForm";
import { JobSharingGigForm } from "./JobSharingGigForm";
import { ContentCreationGigForm } from "./ContentCreationGigForm";
import { CourseResellGigForm } from "./CourseResellGigForm";
import { cn } from "@/lib/utils";

interface Gig {
  id: string;
  title: string;
  category: string;
  credit_reward: number;
}

interface GigSubmissionFormProps {
  gig: Gig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GigSubmissionForm({ gig, open, onOpenChange }: GigSubmissionFormProps) {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  // CTO Tip: Use a robust invalidation strategy to ensure UI sync
  const handleSubmitted = () => {
    queryClient.invalidateQueries({ queryKey: ["gig-submission-counts"] });
    queryClient.invalidateQueries({ queryKey: ["my-gig-submissions"] });
    queryClient.invalidateQueries({ queryKey: ["talent-stats"] }); // Update global wallet balance
    onOpenChange(false);
  };

  if (!talent?.id) return null;

  const renderCategoryForm = () => {
    const props = { gig, talentId: talent.id, onSubmitted: handleSubmitted };

    switch (gig.category) {
      case "cv_upload":
        return <CVUploadGigForm {...props} />;
      case "job_posting":
        return <JobPostingGigForm {...props} />;
      case "job_sharing":
        return <JobSharingGigForm {...props} />;
      case "content_creation":
        return <ContentCreationGigForm {...props} />;
      case "course_resell":
        return <CourseResellGigForm {...props} />;
      default:
        return (
          <div className="py-10 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Unsupported Category</p>
          </div>
        );
    }
  };

  // Determine width based on form complexity to avoid excessive scrolling
  const getDialogWidth = () => {
    if (["content_creation", "job_posting"].includes(gig.category)) return "max-w-xl";
    if (gig.category === "job_sharing") return "max-w-lg";
    return "max-w-md";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "rounded-[32px] border-border/40 bg-card/95 backdrop-blur-2xl shadow-2xl no-scrollbar",
          getDialogWidth(),
          "max-h-[90vh] overflow-y-auto",
        )}
      >
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <DialogTitle className="text-xl font-black tracking-tighter">{gig.title}</DialogTitle>
          </div>

          <DialogDescription className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Potential Reward
              </span>
              <span className="text-sm font-black text-amber-600">Pending Review</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500 text-white px-3 py-1.5 rounded-xl shadow-lg shadow-amber-500/20">
              <Coins className="h-4 w-4" />
              <span className="text-xs font-black">+{gig.credit_reward}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">{renderCategoryForm()}</div>
      </DialogContent>
    </Dialog>
  );
}
