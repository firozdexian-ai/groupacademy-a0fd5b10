import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WelcomeBonus } from "./WelcomeBonus";
import { CVUploadStep } from "./CVUploadStep";
import { ServicesTour } from "./ServicesTour";
import { useOnboarding } from "@/hooks/useOnboarding";
import { toast } from "sonner";

interface OnboardingWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "profile", label: "Profile" },
  { id: "explore", label: "Explore" },
];

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { completeOnboarding, skipOnboarding, updateStep, currentStep: savedStep } = useOnboarding();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  // FIXED: Prevent regression loops. Only update from savedStep if it's FURTHER ahead
  // or if we haven't initialized at all.
  useEffect(() => {
    if (savedStep !== undefined) {
      if (!hasInitialized) {
        // First load: trust the DB
        const validStep = Math.min(Math.max(0, savedStep), STEPS.length - 1);
        setCurrentStep(validStep);
        setHasInitialized(true);
      } else {
        // Subsequent updates: ONLY move forward, never backward automatically
        // This prevents the loop where local state is 2, DB says 1, and it jumps back
        const validStep = Math.min(Math.max(0, savedStep), STEPS.length - 1);
        if (validStep > currentStep) {
          setCurrentStep(validStep);
        }
      }
    }
  }, [savedStep, hasInitialized, currentStep]);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = async () => {
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      // Optimistically update UI first to prevent UI lag
      setCurrentStep(nextStep);
      // Then sync to DB
      await updateStep(nextStep);
    }
  };

  const handleSkipAll = async () => {
    const success = await skipOnboarding();
    if (success) {
      toast.success("Welcome to GroUp Academy!");
      onComplete();
    }
  };

  const handleComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      toast.success("You're all set! Let's explore.", {
        description: "Your 250 welcome credits are ready to use",
      });
      onComplete();
    }
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case "welcome":
        return <WelcomeBonus onContinue={handleNext} />;
      case "profile":
        return <CVUploadStep onContinue={handleNext} onSkip={handleNext} />;
      case "explore":
        return <ServicesTour onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <Button variant="ghost" size="sm" onClick={handleSkipAll} className="ml-4 text-muted-foreground">
          <X className="h-4 w-4 mr-1" />
          Skip
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-3 border-b border-border/50">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`text-xs font-medium transition-colors ${
              index === currentStep
                ? "text-primary"
                : index < currentStep
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
            }`}
          >
            {index > 0 && <span className="mx-2 text-border">•</span>}
            {step.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{renderStep()}</div>
    </div>
  );
}
