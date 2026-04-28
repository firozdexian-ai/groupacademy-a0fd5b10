import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Briefcase,
  ClipboardCheck,
  ChevronRight,
  Sparkles,
  Loader2,
  Zap,
  Target,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/**
 * GroUp Academy: Contextual Conversion Node (PersonalizedPromptCard)
 * CTO Reference: Authoritative engine for dynamic task injection and credit-gated services.
 */

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

    // PROTOCOL 1: Data Ingress (Highest Priority)
    if (!talent?.cvUrl) {
      prompts.push({
        type: "cv",
        title: "INITIALIZE_CV_SYNC",
        description: "Deploy CV artifact to unlock AI-orchestrated job matches.",
        icon: <FileText className="h-5 w-5" />,
        action: "SYNC_NOW",
        path: "/app/profile/edit",
        priority: 1,
      });
    }

    // PROTOCOL 2: Revenue Optimization (Gated Intelligence)
    const hasAssessment = servicesUsed.includes("career_assessment");
    if (talent?.cvUrl && !hasAssessment) {
      prompts.push({
        type: "assessment",
        title: "NEURAL_SCORECARD",
        description: "Execute deep-audit of skill gaps and marketplace readiness.",
        icon: <ClipboardCheck className="h-5 w-5" />,
        action: "EXECUTE",
        path: "/app/services/assessment",
        priority: 2,
        cost: 50,
      });
    }

    // PROTOCOL 3: Brand Infrastructure
    const hasPortfolio = servicesUsed.includes("portfolio_request");
    if (!hasPortfolio && balance >= 100) {
      prompts.push({
        type: "portfolio",
        title: "PRO_PORTFOLIO_NODE",
        description: "Provision a high-fidelity web artifact for your professional brand.",
        icon: <Zap className="h-5 w-5" />,
        action: "PROVISION",
        path: "/app/services",
        priority: 3,
      });
    }

    // PROTOCOL 4: Market Ingress (Intent Based)
    if (talent?.currentStatus?.includes("job_seeking")) {
      prompts.push({
        type: "jobs",
        title: "ACTIVE_PIPELINE",
        description: "View high-yield roles synchronized with your current skills.",
        icon: <Briefcase className="h-5 w-5" />,
        action: "INGRESS",
        path: "/app/jobs",
        priority: 4,
      });
    }

    return prompts.sort((a, b) => a.priority - b.priority).slice(0, 2);
  };

  const handleAction = async (prompt: Prompt) => {
    if (prompt.type === "assessment" && prompt.cost) {
      if (balance < prompt.cost) {
        toast.error("Protocol Fault: Insufficient fractional credit yield.");
        return;
      }

      setLoading(prompt.type);
      const toastId = toast.loading("Initializing neural scorecard protocol...");

      try {
        const success = await deductCredits("CAREER_ASSESSMENT", undefined, "Initialized AI Career Audit");
        if (success) {
          toast.success("Intelligence Unlocked: Yield Deducted", { id: toastId });
          navigate(prompt.path);
        }
      } catch (error) {
        toast.error("Transmission Interrupted: Protocol Aborted", { id: toastId });
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
    <div className="space-y-6 py-4 animate-in fade-in duration-700">
      {/* EXECUTIVE HEADER */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="h-5 w-5 text-primary animate-pulse relative z-10" />
            <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full scale-150" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
            Strategic_Prompts
          </span>
        </div>
        <Badge variant="outline" className="font-black text-[9px] border-primary/20 bg-primary/5 uppercase italic">
          Nodes_Active
        </Badge>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Card
            key={prompt.type}
            className={cn(
              "group relative overflow-hidden transition-all duration-500 rounded-[28px]",
              "border-2 border-primary/10 hover:border-primary/40 bg-card/30 backdrop-blur-md shadow-xl",
              "hover:scale-[1.02] active:scale-[0.98] cursor-pointer transform-gpu",
            )}
            onClick={() => handleAction(prompt)}
          >
            {/* NEURAL GLOW INGRESS */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-primary/15 transition-all duration-700" />

            <CardContent className="p-6">
              <div className="flex items-center gap-5 relative z-10">
                {/* ICON NODE */}
                <div
                  className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500",
                    "bg-primary/10 text-primary border border-primary/20",
                    "group-hover:rotate-6 group-hover:scale-110 shadow-lg group-hover:shadow-primary/10",
                  )}
                >
                  {prompt.icon}
                </div>

                {/* PAYLOAD INFO */}
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-black text-sm tracking-tighter uppercase italic text-foreground leading-tight">
                    {prompt.title}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-bold italic leading-relaxed mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    {prompt.description.toUpperCase()}
                  </p>
                </div>

                {/* ACTION NODE */}
                <div className="flex items-center gap-3">
                  {prompt.cost && (
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500">
                      <ShieldCheck className="h-3 w-3 fill-current" />
                      <span className="text-[10px] font-black italic tracking-tighter">{prompt.cost} CR</span>
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="h-10 px-5 rounded-xl font-black italic text-[10px] tracking-widest gap-2 shadow-2xl active:scale-90 transition-all uppercase"
                    disabled={loading === prompt.type}
                  >
                    {loading === prompt.type ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        {prompt.action}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
