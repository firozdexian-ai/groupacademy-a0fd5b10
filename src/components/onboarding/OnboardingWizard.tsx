import { useState, useEffect } from "react";
import { X, Zap, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WelcomeBonus } from "./WelcomeBonus";
import { CVUploadStep } from "./CVUploadStep";
import { ServicesTour } from "./ServicesTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Onboarding Orchestration Node
 * CTO Reference: Authoritative controller for talent initialization and credit grant.
 */

const ONBOARDING_NODES = [
  { id: "welcome", label: "NODE_WELCOME" },
  { id: "profile", label: "NODE_PROFILE" },
  { id: "explore", label: "NODE_EXPLORE" },
];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const { completeOnboarding, skipOnboarding, updateStep, currentStep: savedStep } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  // PROTOCOL: State Synchronization & Regression Prevention
  useEffect(() => {
    if (savedStep !== undefined) {
      const validStep = Math.min(Math.max(0, savedStep), ONBOARDING_NODES.length - 1);
      if (!hasInitialized) {
        setCurrentStep(validStep);
        setHasInitialized(true);
      } else if (validStep > currentStep) {
        // Only permit forward trajectory sync from external state
        setCurrentStep(validStep);
      }
    }
  }, [savedStep, hasInitialized, currentStep]);

  const yieldProgress = ((currentStep + 1) / ONBOARDING_NODES.length) * 100;

  const executeTrajectoryAdvance = async () => {
    if (currentStep < ONBOARDING_NODES.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep); // Optimistic UI Sync
      await updateStep(nextStep);
    }
  };

  const executeEmergencySkip = async () => {
    const success = await skipOnboarding();
    if (success) {
      toast.success("SYSTEM_ACCESS_GRANTED", { description: "Onboarding bypassed. Initializing dashboard." });
      onComplete();
    }
  };

  const finalizeOnboarding = async () => {
    const success = await completeOnboarding();
    if (success) {
      toast.success("ONBOARDING_SYNC_VERIFIED", {
        description: "250 Welcome Credits have been committed to your wallet.",
        icon: <Zap className="h-4 w-4 text-primary fill-current" />,
      });
      onComplete();
    }
  };

  const renderActiveNode = () => {
    switch (ONBOARDING_NODES[currentStep].id) {
      case "welcome":
        return <WelcomeBonus onContinue={executeTrajectoryAdvance} />;
      case "profile":
        return <CVUploadStep onContinue={executeTrajectoryAdvance} onSkip={executeTrajectoryAdvance} />;
      case "explore":
        return <ServicesTour onComplete={finalizeOnboarding} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-700">
      {/* HUD: TRAJECTORY_PROGRESS */}
      <header className="border-b border-border/40 bg-card/30 backdrop-blur-xl">
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground italic">
                Sync_Status
              </span>
              <span className="text-[9px] font-bold uppercase text-muted-foreground">Protocol_v3.0.4</span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8">
            <Progress value={yieldProgress} className="h-1.5 bg-primary/10 shadow-inner" />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={executeEmergencySkip}
            className="rounded-xl h-10 px-4 font-black uppercase italic text-[9px] tracking-widest hover:bg-rose-500/5 hover:text-rose-500 transition-all gap-2"
          >
            <X className="h-3.5 w-3.5" /> AUTHORIZE_SKIP
          </Button>
        </div>

        {/* HUD: NODE_REGISTRY */}
        <div className="flex items-center justify-center gap-6 pb-4">
          {ONBOARDING_NODES.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 transition-all duration-500",
                index === currentStep ? "opacity-100 scale-105" : "opacity-30 grayscale",
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  index === currentStep
                    ? "bg-primary animate-pulse"
                    : index < currentStep
                      ? "bg-emerald-500"
                      : "bg-muted",
                )}
              />
              <span
                className={cn(
                  "text-[10px] font-black uppercase tracking-widest italic",
                  index === currentStep ? "text-primary" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {index < ONBOARDING_NODES.length - 1 && <div className="ml-3 h-[1px] w-4 bg-border/40" />}
            </div>
          ))}
        </div>
      </header>

      {/* VIEWPORT: ACTIVE_PROTOCOL */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-muted/5 to-transparent">
        <div className="h-full w-full max-w-5xl mx-auto flex items-center justify-center">{renderActiveNode()}</div>
      </main>

      {/* FOOTER: SYSTEM_TELEMETRY */}
      <footer className="p-4 border-t border-border/10 bg-muted/5 flex justify-center">
        <div className="flex items-center gap-2 opacity-20">
          <ShieldCheck className="h-3 w-3" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em]">Academy_Encryption_Active</span>
        </div>
      </footer>
    </div>
  );
}
