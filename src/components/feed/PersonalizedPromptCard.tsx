import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Briefcase, ClipboardCheck, Wallet, ChevronRight, Sparkles, Loader2, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export function PersonalizedPromptCard() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { balance, deductCredits } = useCredits();
  const [loading, setLoading] = useState<string | null>(null);

  const getPrompts = (): Prompt[] => {
    if (!talent?.id) return [];
    const prompts: Prompt[] = [];
    const servicesUsed = talent?.servicesUsed || [];

    // 1. Missing CV (Highest friction for AI features)
    if (!talent?.cvUrl) {
      prompts.push({
        type: "cv",
        title: "Upload your CV",
        description: "Unlock AI job matches and career scoring",
        icon: <FileText className="h-5 w-5" />,
        action: "Upload",
        path: "/app/profile/edit",
        priority: 1,
      });
    }

    // 2. Career Assessment (Direct Value/Revenue)
    const hasAssessment = servicesUsed.includes("career_assessment");
    if (talent?.cvUrl && !hasAssessment) {
      prompts.push({
        type: "assessment",
        title: "AI Career Scorecard",
        description: "Analyze your readiness and skills gaps",
        icon: <ClipboardCheck className="h-5 w-5" />,
        action: "Analyze",
        path: "/app/services/assessment",
        priority: 2,
        cost: 50,
      });
    }

    // 3. Portfolio Building
    const hasPortfolio = servicesUsed.includes("portfolio_request");
    if (!hasPortfolio && balance >= 100) {
      prompts.push({
        type: "portfolio",
        title: "Professional Portfolio",
        description: "Build a high-converting website for your brand",
        icon: <Zap className="h-5 w-5" />,
        action: "Build",
        path: "/app/services",
        priority: 3,
      });
    }

    // 4. Job Seeking
    if (talent?.currentStatus?.includes("job_seeking")) {
      prompts.push({
        type: "jobs",
        title: "Matching Roles",
        description: "View jobs tailored to your skills",
        icon: <Briefcase className="h-5 w-5" />,
        action: "Browse",
        path: "/app/jobs",
        priority: 4,
      });
    }

    return prompts.sort((a, b) => a.priority - b.priority).slice(0, 2);
  };

  const handleAction = async (prompt: Prompt) => {
    if (prompt.type === "assessment" && prompt.cost) {
      if (balance < prompt.cost) {
        toast.error("Insufficient credits to start assessment");
        return;
      }

      setLoading(prompt.type);
      try {
        // CTO FIX: referenceId must be undefined for NULL mapping in DB
        const success = await deductCredits("CAREER_ASSESSMENT", undefined, "Started AI Career Assessment");

        if (success) {
          toast.success("Assessment credits deducted!");
          navigate(prompt.path);
        }
      } catch (error) {
        toast.error("Process interrupted. Please try again.");
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
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 px-1">
        <div className="relative">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recommended Actions</span>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Card
            key={prompt.type}
            className={cn(
              "group relative overflow-hidden transition-all duration-300",
              "border-primary/10 hover:border-primary/40 bg-card hover:shadow-lg",
              "hover:scale-[1.01] active:scale-[0.99] cursor-pointer",
            )}
            onClick={() => handleAction(prompt)}
          >
            {/* Subtle Gradient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />

            <CardContent className="p-4">
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform group-hover:rotate-3 group-hover:scale-110">
                  {prompt.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm tracking-tight">{prompt.title}</p>
                  <p className="text-xs text-muted-foreground truncate font-medium">{prompt.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  {prompt.cost && (
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                      {prompt.cost} CR
                    </span>
                  )}
                  <Button
                    size="sm"
                    className="h-8 px-3 rounded-lg font-bold text-xs gap-1.5 shadow-sm shadow-primary/20"
                    disabled={loading === prompt.type}
                  >
                    {loading === prompt.type ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        {prompt.action}
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
