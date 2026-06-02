import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Briefcase, ClipboardCheck, ChevronRight, Sparkles, Loader2, Zap, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/domains/finance/hooks/useCredits";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type PromptType = "cv" | "assessment" | "jobs" | "portfolio";

interface Prompt {
  type: PromptType;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  path: string;
  priority: number;
  cost?: number;
}

/**
 * Personalized Prompt Engine.
 * Dynamically renders recommended actions for talent based on account completeness,
 * career status, and verified skill profiles.
 */
export function PersonalizedPromptCard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { talent } = useTalent();
  const { balance, deductCredits } = useCredits();
  const [loading, setLoading] = useState<string | null>(null);

  // Log automated evaluations for recommendation tracking loops
  useEffect(() => {
    if (talent?.id) {
      trackEvent("prompts_evaluated", {
        talentId: talent.id,
        currentBalance: balance,
        hasCv: !!talent.cvUrl,
      });
    }
  }, [talent, balance]);

  const getPrompts = (): Prompt[] => {
    if (!talent?.id) return [];
    const prompts: Prompt[] = [];
    const servicesUsed = talent?.servicesUsed || [];

    // Onboarding prompt: Triggered if no parsed CV is on file
    if (!talent?.cvUrl) {
      prompts.push({
        type: "cv",
        title: "Upload your CV",
        description: "Add your CV so we can match you to the right professional roles.",
        icon: <FileText className="h-5 w-5" />,
        action: "Upload",
        path: "/app/profile/edit",
        priority: 1,
      });
    }

    // Assessment prompt: Triggered once CV is on file but gap tracking is incomplete
    const hasAssessment = servicesUsed.includes("career_assessment");
    if (talent?.cvUrl && !hasAssessment) {
      prompts.push({
        type: "assessment",
        title: "Career Scorecard",
        description: "Get a deep AI audit of your structural skill gaps and market readiness.",
        icon: <ClipboardCheck className="h-5 w-5" />,
        action: "Start",
        path: "/app/services/assessment",
        priority: 2,
        cost: 50,
      });
    }

    // Branding prompt: Unlocked dynamically if credit milestones allow
    const hasPortfolio = servicesUsed.includes("portfolio_request");
    if (!hasPortfolio && balance >= 100) {
      prompts.push({
        type: "portfolio",
        title: "Pro Portfolio",
        description: "Build a polished web portfolio infrastructure for your professional brand.",
        icon: <Zap className="h-5 w-5" />,
        action: "Create",
        path: "/app/services/portfolio",
        priority: 3,
        cost: 100,
      });
    }

    // Matching prompt: Active matching row targeting job-seeking talent
    if (talent?.currentStatus?.includes("job_seeking")) {
      prompts.push({
        type: "jobs",
        title: "Jobs for you",
        description: "See top ecosystem roles that match your verified skills and mastery metrics.",
        icon: <Briefcase className="h-5 w-5" />,
        action: "View",
        path: "/app/jobs",
        priority: 4,
      });
    }

    return prompts.sort((a, b) => a.priority - b.priority).slice(0, 2);
  };

  const handleAction = async (prompt: Prompt) => {
    trackEvent("prompt_card_action_clicked", {
      promptType: prompt.type,
      targetPath: prompt.path,
      talentId: talent?.id,
    });

    // Enforce transaction conditions for gated features
    if (prompt.cost) {
      if (balance < prompt.cost) {
        toast.error(`Not enough credits — this needs ${prompt.cost} credits.`);
        return;
      }

      setLoading(prompt.type);
      const toastId = toast.loading(`Starting ${prompt.title}…`);

      try {
        const transactionServiceKey = prompt.type === "portfolio" ? "PORTFOLIO" : "CAREER_ASSESSMENT";

        const success = await deductCredits(
          transactionServiceKey,
          undefined,
          `Started AI Service Audit - ${prompt.title}`,
        );

        if (success) {
          // Synchronize account balance across layout boundaries
          queryClient.invalidateQueries({ queryKey: ["credits-balance"] });

          toast.success(`${prompt.title} unlocked.`, { id: toastId });
          navigate(prompt.path);
        } else {
          throw new Error("Transaction declined by credit validation handler.");
        }
      } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        trackError(errorMessage, {
          component: "PersonalizedPromptCard",
          action: "deduct_service_credits_fault",
          promptType: prompt.type,
          expectedCost: prompt.cost,
          talentId: talent?.id,
        });

        toast.error("Couldn't process that — please check your balance and try again.", { id: toastId });
      } finally {
        setLoading(null);
      }
    } else {
      navigate(prompt.path);
    }
  };

  const prompts = getPrompts();
  if (prompts.length === 0) return null;

  return (
    <div className="space-y-3 animate-in fade-in duration-500 touch-manipulation select-none sm:select-text">
      {/* Container Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-xs font-bold text-foreground tracking-tight uppercase">Suggested for you</span>
        </div>
        <Badge variant="outline" className="text-[10px] font-bold border-border/40 tabular-nums">
          {prompts.length} {prompts.length === 1 ? "action" : "actions"}
        </Badge>
      </div>

      {/* Grid Stack List View */}
      <div className="space-y-3">
        {prompts.map((prompt) => (
          <Card
            key={prompt.type}
            className={cn(
              "group relative overflow-hidden transition-all duration-300 rounded-2xl border border-border/40 bg-card/60 hover:bg-card backdrop-blur-md cursor-pointer hover:border-primary/30 shadow-sm hover:shadow-md",
              loading === prompt.type && "opacity-75 cursor-wait pointer-events-none",
            )}
            onClick={() => handleAction(prompt)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Accent Icon Container */}
                <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary border border-primary/20 shadow-inner transition-transform group-hover:scale-105 duration-200">
                  {prompt.icon}
                </div>

                <div className="flex-1 min-w-0 text-left space-y-1">
                  <p className="font-bold text-sm text-foreground leading-tight tracking-tight group-hover:text-primary transition-colors">
                    {prompt.title}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{prompt.description}</p>

                  {/* Actions Toolbar Footer */}
                  <div className="flex items-center gap-2 mt-3.5 flex-wrap">
                    {prompt.cost && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 select-none shadow-sm animate-in slide-in-from-left-2 duration-200">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-bold tabular-nums tracking-wide uppercase">
                          {prompt.cost} credits
                        </span>
                      </div>
                    )}
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(prompt);
                      }}
                      className="h-8 px-3.5 rounded-xl font-bold text-xs gap-1 active:scale-95 transition-transform shadow-sm cursor-pointer ml-auto"
                      disabled={loading === prompt.type}
                    >
                      {loading === prompt.type ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <span>{prompt.action}</span>
                          <ChevronRight className="h-3.5 w-3.5 stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}