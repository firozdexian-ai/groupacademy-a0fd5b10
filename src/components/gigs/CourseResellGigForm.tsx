import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, BookOpen, MessageSquare, Copy, CheckCircle, ExternalLink, Sparkles, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseResellGigFormProps {
  gig: { id: string; title: string };
  talentId: string;
  onSubmitted: () => void;
}

export function CourseResellGigForm({ gig, talentId, onSubmitted }: CourseResellGigFormProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: courses, isLoading } = useQuery({
    queryKey: ["active-courses-for-resell"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select("id, title, slug, price, currency, cover_image_url")
        .eq("is_published", true)
        .in("content_type", ["batch_class", "recorded_course", "live_webinar"])
        .order("display_order", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const selectedCourse = courses?.find((c: any) => c.id === selectedCourseId);
  const referralLink = selectedCourse
    ? `https://groupacademy.app/app/courses/${selectedCourse.slug}?ref=${talentId}`
    : "";

  const shareMessage = selectedCourse
    ? `🚀 Level up your career with "${selectedCourse.title}"!\n\nJoin me on GroUp Academy. ${selectedCourse.price ? `Value: $${selectedCourse.price}` : "Limited Free Access"}\n\nClaim your spot: ${referralLink}`
    : "";

  const handleAction = (type: "whatsapp" | "copy") => {
    if (type === "whatsapp") {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
    } else {
      navigator.clipboard.writeText(shareMessage);
      toast.success("Affiliate link copied!");
    }
    setShared(true);
  };

  const handleSubmit = async () => {
    if (!shared) {
      toast.error("Please share or copy the link before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gig_submissions").insert({
        gig_id: gig.id,
        talent_id: talentId,
        status: "pending",
        submission_data: {
          type: "course_referral",
          course_id: selectedCourseId,
          course_title: selectedCourse?.title,
          referral_link: referralLink,
          attribution_meta: {
            timestamp: new Date().toISOString(),
            platform: "web",
          },
        },
      });

      if (error) throw error;
      toast.success("Referral logged for review!");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Selection Header */}
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Select Campaign
        </Label>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 bg-muted/20 rounded-2xl border-2 border-dashed border-border/40">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar">
            {courses?.map((course: any) => (
              <button
                key={course.id}
                onClick={() => {
                  setSelectedCourseId(course.id);
                  setShared(false);
                }}
                className={cn(
                  "group w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4",
                  selectedCourseId === course.id
                    ? "border-primary bg-primary/5 shadow-inner"
                    : "border-border/40 hover:border-primary/30 bg-card",
                )}
              >
                <div
                  className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    selectedCourseId === course.id ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs truncate leading-tight">{course.title}</p>
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest mt-1">
                    {course.price ? `$${course.price}` : "Free Track"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Campaign Assets */}
      {selectedCourse && (
        <div className="space-y-4 pt-2">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-violet-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition" />
            <div className="relative bg-card rounded-2xl border border-border/40 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Live Share Preview
                </span>
                <Share2 className="h-3 w-3 text-muted-foreground" />
              </div>
              <p className="text-xs font-medium leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/20 italic text-muted-foreground">
                "{shareMessage.substring(0, 100)}..."
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="rounded-xl h-12 gap-2 font-bold text-xs uppercase tracking-widest border-emerald-500/20 text-emerald-600 hover:bg-emerald-50"
              onClick={() => handleAction("whatsapp")}
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-12 gap-2 font-bold text-xs uppercase tracking-widest"
              onClick={() => handleAction("copy")}
            >
              <Copy className="h-4 w-4" /> Copy Link
            </Button>
          </div>

          <div className="pt-4 border-t border-border/40">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                "w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg transition-all",
                shared ? "shadow-primary/20" : "grayscale opacity-50 cursor-not-allowed",
              )}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              {shared ? "Submit Completion" : "Complete Share to Submit"}
            </Button>

            {shared && (
              <div className="flex items-center justify-center gap-2 mt-3 text-emerald-600 animate-in fade-in slide-in-from-top-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Share Verified</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
