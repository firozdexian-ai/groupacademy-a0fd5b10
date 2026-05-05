/**
 * Inline registration panel for live webinars / batch classes.
 * Spends credits via existing `deduct_credits` RPC and reveals the WhatsApp group.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useEnrollment } from "@/hooks/useEnrollment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Coins, MessageCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatEventTime, formatEventLocal, DEFAULT_EVENT_TZ } from "@/lib/eventTime";
import { getCourseCredits } from "@/lib/creditPricing";

interface Props {
  course: {
    id: string;
    slug: string;
    title: string;
    content_type: string;
    event_date: string | null;
    event_timezone: string | null;
    event_duration_minutes: number | null;
    max_capacity: number | null;
    current_enrollment: number | null;
    whatsapp_group_link: string | null;
    price: number | null;
  };
}

export function WebinarEnrollPanel({ course }: Props) {
  const { talent } = useTalent();
  const { balance, deductCustomAmount, refresh } = useCredits() as any;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const creditCost = getCourseCredits(Number(course.price ?? 0));
  const tz = course.event_timezone || DEFAULT_EVENT_TZ;
  const seatsLeft = course.max_capacity
    ? course.max_capacity - (course.current_enrollment || 0)
    : null;

  const { data: enrollment, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["enrollment", talent?.id, course.id],
    enabled: !!talent?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("enrollments")
        .select("id, status, enrolled_at")
        .eq("talent_id", talent!.id)
        .eq("content_id", course.id)
        .maybeSingle();
      return data;
    },
  });

  const isEnrolled = !!enrollment;

  const handleEnroll = async () => {
    if (!talent?.id) {
      navigate(`/auth?redirect=/app/learning/courses/${course.slug}`);
      return;
    }
    if (creditCost > 0 && (balance ?? 0) < creditCost) {
      toast.error(`You need ${creditCost} credits — top up to reserve.`);
      navigate("/app/wallet");
      return;
    }
    setBusy(true);
    try {
      if (creditCost > 0) {
        const ok = await deductCustomAmount(creditCost, "webinar_enrollment", course.id, `Joined: ${course.title}`);
        if (!ok) throw new Error("Could not deduct credits");
      }
      const { error } = await supabase.from("enrollments").insert({
        talent_id: talent.id,
        student_id: talent.id,
        content_id: course.id,
        status: "active" as const,
        payment_amount: creditCost,
      } as any);
      if (error && !error.message.includes("duplicate")) throw error;
      await supabase
        .from("content")
        .update({ current_enrollment: (course.current_enrollment || 0) + 1 })
        .eq("id", course.id);
      toast.success("You're in! Check your email for details.");
      if (typeof refresh === "function") await refresh();
      qc.invalidateQueries({ queryKey: ["enrollment", talent.id, course.id] });
      qc.invalidateQueries({ queryKey: ["app-course-detail"] });
    } catch (e: any) {
      toast.error(e.message || "Reservation failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5">
      <CardContent className="p-4 space-y-3">
        <Badge className="bg-rose-500/10 text-rose-600 border-0 text-[10px] w-fit">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mr-1 animate-pulse" />
          Live session
        </Badge>

        {course.event_date && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary shrink-0" />
              <span className="font-semibold">{formatEventTime(course.event_date, tz)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground pl-6">{formatEventLocal(course.event_date)}</p>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {course.event_duration_minutes ? (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{course.event_duration_minutes} min</span>
          ) : null}
          {seatsLeft !== null && (
            <span className={`flex items-center gap-1 ${seatsLeft <= 10 ? "text-rose-600 font-medium" : ""}`}>
              <Users className="h-3 w-3" />
              {seatsLeft > 0 ? `${seatsLeft} seats left` : "Sold out"}
            </span>
          )}
          <span className="flex items-center gap-1 text-primary font-semibold">
            <Coins className="h-3 w-3" />{creditCost} cr
          </span>
        </div>

        {isEnrolled ? (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="h-4 w-4" /> You're registered
            </div>
            {course.whatsapp_group_link && (
              <Button
                variant="outline"
                className="w-full rounded-xl border-emerald-500/30 text-emerald-600"
                asChild
              >
                <a href={course.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> Join WhatsApp group
                </a>
              </Button>
            )}
          </div>
        ) : (
          <Button
            className="w-full rounded-xl"
            onClick={handleEnroll}
            disabled={busy || enrollmentLoading || (seatsLeft !== null && seatsLeft <= 0)}
          >
            {busy ? "Reserving..." : `Reserve seat · ${creditCost} cr`}
            {!busy && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
