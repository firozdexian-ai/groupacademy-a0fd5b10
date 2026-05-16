import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, Target, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { trackOnboardingStep } from "@/lib/onboarding/telemetry";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GoalStepProps {
  onContinue: () => void;
}

const STATUS_OPTIONS = [
  { value: "student", label: "Student", sub: "Currently enrolled" },
  { value: "fresh_graduate", label: "Fresh graduate", sub: "Just finished studying" },
  { value: "job_seeking", label: "Looking for a job", sub: "Open to new roles" },
  { value: "working", label: "Employed", sub: "In a full-time role" },
  { value: "freelancer", label: "Freelancer", sub: "Working on projects" },
  { value: "career_changer", label: "Switching careers", sub: "Pivoting fields" },
];

const GOAL_OPTIONS = [
  { value: "first_job", label: "Land my first job" },
  { value: "switch_role", label: "Switch to a new role" },
  { value: "get_promoted", label: "Get promoted" },
  { value: "freelance_earn", label: "Freelance & earn" },
  { value: "learn_new_skill", label: "Learn a new skill" },
  { value: "study_abroad", label: "Study abroad" },
  { value: "build_own_thing", label: "Build my own thing" },
];

/**
 * GroUp Academy: Onboarding Persona & Goal Alignment Selector (GoalStep)
 * An authoritative wizard block calculating candidate status and trajectory vectors to customize experiences.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function GoalStep({ onContinue }: GoalStepProps) {
  const queryClient = useQueryClient();
  const { talent, updateTalent } = useTalent();

  const [status, setStatus] = useState<string>("");
  const [goal, setGoal] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Sync state parameters safely once the underlying profile engine payload resolves
  useEffect(() => {
    if (talent) {
      if (talent.currentStatus) setStatus(talent.currentStatus);
      if (talent.primaryGoal) setGoal(talent.primaryGoal);
    }
  }, [talent]);

  // Monitor wizard step views via standard telemetry pipelines
  useEffect(() => {
    trackOnboardingStep("goal", "view");
    trackEvent("onboarding_goal_step_mounted");
  }, []);

  const canContinue = !!status && !!goal;

  async function handleContinue() {
    if (!canContinue || isSaving) return;

    setIsSaving(true);
    let isMounted = true;

    trackEvent("onboarding_goal_save_requested", { status, goal });
    const toastId = toast.loading("Configuring trajectory personalization parameters...");

    try {
      const isUpdateSuccessful = await updateTalent({
        currentStatus: status,
        primaryGoal: goal,
      } as any);

      if (!isUpdateSuccessful) {
        throw new Error("Core database transaction write declined.");
      }

      // Automated Efficiency: Synchronize cache streams immediately to avoid state drift across layouts
      await queryClient.invalidateQueries({ queryKey: ["talent-profile"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      trackOnboardingStep("goal", "next", { status, goal });
      trackEvent("onboarding_goal_save_success");

      toast.success("Ecosystem personalization locked successfully.", { id: toastId });

      if (isMounted) {
        onContinue();
      }
    } catch (err: any) {
      const parsedExceptionMsg = err instanceof Error ? err.message : String(err);

      trackError(parsedExceptionMsg, {
        component: "GoalStep",
        action: "commit_onboarding_goals_api",
        talentId: talent?.id,
      });

      toast.error(`Ecosystem sync error: ${parsedExceptionMsg}`, { id: toastId });
    } finally {
      if (isMounted) {
        setIsSaving(false);
      }
    }
  }

  return (
    <div className="flex flex-col px-4 py-6 max-w-xl mx-auto w-full antialiased text-left select-none sm:select-text transform-gpu animate-in fade-in duration-300">
      {/* HUD TITLE SECTION */}
      <div className="mb-6 space-y-1.5 text-center select-none w-full leading-none">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground/90 uppercase tracking-wide">
          Map Your Trajectory
        </h2>
        <p className="text-xs sm:text-sm font-semibold text-muted-foreground/80 leading-normal max-w-sm mx-auto">
          We configure matching recruitment pipelines, active modules, and your automated AI coach based on these
          fields.
        </p>
      </div>

      {/* PERSISTENT SECTION 1: STATUS MATRICES SELECTION LOOP */}
      <section className="mb-5 w-full min-w-0">
        <div className="flex items-center gap-2 mb-2.5 pl-0.5 select-none text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">
          <Compass className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
          <span>Current Occupational Persona</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 w-full font-semibold text-xs tracking-tight">
          {STATUS_OPTIONS.map((optionItem) => {
            const isOptionActive = status === optionItem.value;
            return (
              <button
                key={optionItem.value}
                type="button"
                disabled={isSaving}
                onClick={() => {
                  trackEvent("onboarding_status_pill_selected", { value: optionItem.value });
                  setStatus(optionItem.value);
                }}
                className={cn(
                  "w-full text-left rounded-xl border p-3.5 transition-all duration-200 cursor-pointer transform-gpu active:scale-[0.99] flex flex-col justify-center shadow-sm leading-none outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isOptionActive
                    ? "border-primary bg-primary/5 text-primary font-bold shadow-inner"
                    : "border-border/40 bg-background/50 hover:border-border/60 hover:bg-background",
                )}
              >
                <span className="text-xs sm:text-sm font-bold text-foreground/90 block leading-tight">
                  {optionItem.label}
                </span>
                <span className="text-[10px] font-medium text-muted-foreground/60 block truncate text-ellipsis mt-1 leading-none max-w-full">
                  {optionItem.sub}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* PERSISTENT SECTION 2: GOAL TRAJECTORY SELECTION LOOP */}
      <section className="mb-6 w-full min-w-0">
        <div className="flex items-center gap-2 mb-3 pl-0.5 select-none text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 leading-none">
          <Target className="h-3.5 w-3.5 text-primary stroke-[2.2]" />
          <span> Autoritative Target Objective</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 select-none w-full max-w-full font-bold text-xs">
          {GOAL_OPTIONS.map((goalItem) => {
            const isGoalActive = goal === goalItem.value;
            return (
              <button
                key={goalItem.value}
                type="button"
                disabled={isSaving}
                onClick={() => {
                  trackEvent("onboarding_goal_pill_selected", { value: goalItem.value });
                  setGoal(goalItem.value);
                }}
                className={cn(
                  "rounded-full px-4 py-2 text-xs font-bold border transition-all duration-200 cursor-pointer transform-gpu active:scale-95 shadow-sm leading-none outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isGoalActive
                    ? "bg-primary border-transparent text-primary-foreground font-extrabold shadow-inner shadow-primary/10"
                    : "border-border/40 text-muted-foreground bg-background/50 hover:border-primary/20 hover:text-foreground",
                )}
              >
                {goalItem.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* TRANSACTION COMMAND DISPATCH ACCESS BUTTON FOOTER CONTAINER */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-[max(env(safe-area-inset-bottom),12px)] select-none w-full shrink-0">
        <Button
          onClick={handleContinue}
          disabled={!canContinue || isSaving}
          type="button"
          className="w-full h-11 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md active:scale-[0.995] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2.5]" />
              <span>Calibrating Personalization Infrastructure…</span>
            </>
          ) : (
            <>
              <span>Lock Objective & Continue Pathway</span>
              <ArrowRight className="ml-1.5 h-4 w-4 shrink-0 stroke-[2.5]" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
