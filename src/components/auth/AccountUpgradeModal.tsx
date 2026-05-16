import { useMemo } from "react";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountUpgradeModalProps {
  open: boolean;
  onComplete: () => void;
}

/**
 * GroUp Academy: Hardened Infrastructure Upgrade Gate (V5.6.0)
 * CTO Reference: Absolute full-screen uncloseable viewport gate enforcing relational data hydration hooks.
 * Architecture: Isolated modal container preventing element composition clipping or focus traps.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */
export function AccountUpgradeModal({ open, onComplete }: AccountUpgradeModalProps) {
  // Guard interface event routing options defensively to ensure total user focus lock
  const handleElementInteractionBlocker = useMemo(() => {
    return (e: Event) => {
      // HUD: ENFORCING_IMMUTABLE_ONBOARDING_GATEWAY_LOCK
      e.preventDefault();
    };
  }, []);

  return (
    <Dialog open={open}>
      <DialogPortal>
        {/* HUD: FIXED_BACKDROP_BLUR_SHIELD */}
        <DialogOverlay className="bg-slate-950/80 backdrop-blur-xl transition-all duration-500 z-40" />

        {/* COMPONENT: FULL_SCREEN_MIGRATION_TERMINAL */}
        <DialogPrimitive.Content
          onPointerDownOutside={handleElementInteractionBlocker}
          onEscapeKeyDown={handleElementInteractionBlocker}
          onInteractOutside={handleElementInteractionBlocker}
          className={cn(
            "fixed inset-0 z-50 flex h-screen w-screen flex-col bg-background p-0 outline-none overflow-hidden select-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-100 duration-500",
          )}
        >
          {/* ACCESSIBILITY: AUTHENTICATED_ARIA_DOM_DESCRIPTIONS */}
          <DialogPrimitive.Title className="sr-only">Account Infrastructure Upgrade Protocol</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            We have upgraded our deep learning core infrastructure pipelines. Legacy accounts must commit updated
            profile parameters to unlock multi-agent compute environments.
          </DialogPrimitive.Description>

          {/* HUD: STANDARDIZED_TOP_BORDER_ACCENT_LINE */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary shrink-0" />

          {/* WORKSPACE_SURFACE: METADATA_CONTAINER */}
          <div className="relative flex-1 w-full h-full">
            {/* CTO Architecture Note: The welcome message is passed down inside an explicit layout block 
              to guarantee standard linear rendering passes without dynamic text menu overlapping splits.
            */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4 pointer-events-none">
              <div className="rounded-full border-2 border-primary/20 bg-card/90 backdrop-blur-md px-4 py-2 shadow-xl flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse shrink-0" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary italic font-mono leading-none">
                  Infrastructure Upgrade Active
                </span>
              </div>
            </div>

            {/* CORE WORKFLOW SYSTEM MULTI_STEP STEPPER ENGINE */}
            <OnboardingWizard onComplete={onComplete} />
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
