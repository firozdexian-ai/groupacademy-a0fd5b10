import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { trackDuplicateDetected } from "@/lib/onboarding/telemetry";
import { toast } from "sonner";

/**
 * GroUp Academy: Onboarding Pipeline & Fraud Sentinel (V5.6.0)
 * CTO Reference: Authoritative engine for profile progression and credit grants.
 * Architecture: Digital Workforce enabled - streams multi-step pipeline faults to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface OnboardingState {
  currentStep: number;
  isComplete: boolean;
  isLoading: boolean;
}

export interface CompletionResult {
  success: boolean;
  creditsAwarded: boolean;
  duplicate: boolean;
}

export function useOnboarding() {
  const { talent, refreshTalent } = useTalent();
  const { addCredits } = useCredits();
  const qc = useQueryClient();
  const [isUpdatingLegacy, setIsUpdatingLegacy] = useState(false);

  const isOnboardingComplete = !!talent?.onboardingCompletedAt;
  const currentStep = talent?.onboardingStep || 0;

  // --- MUTATION: PROGRESS_ONBOARDING_STEP ---
  const stepMutation = useMutation({
    mutationFn: async (step: number): Promise<boolean> => {
      if (!talent?.id) return false;

      // HUD: EXECUTING_ONBOARDING_STEP_UPDATE
      const { error } = await supabase.from("talents").update({ onboarding_step: step }).eq("id", talent.id);

      if (error) {
        console.error("[Digital Workforce] FAULT: talents onboarding_step write rejected.", error);
        throw error;
      }
      return true;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["talent", talent?.id] });
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] ANOMALY: Step progression handshake failed.", err);
    },
  });

  // --- MUTATION: ATOMIC_ONBOARDING_FINALIZATION ---
  const completionMutation = useMutation({
    mutationFn: async (): Promise<CompletionResult> => {
      if (!talent?.id) {
        return { success: false, creditsAwarded: false, duplicate: false };
      }

      // Step 1: Query credit history to prevent welcome bonus duplicate vectors
      const { data: existingCredits } = await supabase
        .from("talent_credits")
        .select("id")
        .eq("talent_id", talent.id)
        .maybeSingle();

      // Step 2: Fetch un-cached sybil check profiles (CV validation check step matches)
      const { data: fresh, error: freshError } = await supabase
        .from("talents")
        .select("is_suspected_duplicate, cv_fingerprint")
        .eq("id", talent.id)
        .maybeSingle();

      if (freshError) throw freshError;

      const isDuplicate = !!fresh?.is_suspected_duplicate;
      let creditsAwarded = false;

      // Step 3: Conditional validation check for the welcome bonus credit allocation
      if (!existingCredits && !isDuplicate) {
        // HUD: EXECUTING_FISCAL_WELCOME_ALLOCATION
        await addCredits(250, "welcome_bonus", "Welcome bonus");
        creditsAwarded = true;
      }

      if (isDuplicate) {
        // HUD: LOGGING_FRAUD_TELEMETRY
        trackDuplicateDetected(talent.id, fresh?.cv_fingerprint ?? null);
      }

      // Step 4: Commit absolute onboarding account milestone parameters
      const { error: syncError } = await supabase
        .from("talents")
        .update({
          onboarding_completed_at: new Date().toISOString(),
          onboarding_step: 4,
        })
        .eq("id", talent.id);

      if (syncError) throw syncError;

      // Step 5: Assign automated career coach via localized rpc
      try {
        await supabase.rpc("assign_career_coach", { _talent_id: talent.id });
      } catch (rpcErr) {
        console.warn("[Digital Workforce] ANOMALY: assign_career_coach rpc execution bypassed.", rpcErr);
      }

      // Step 6: Flush cold user recommendations to prepare clean profile matrices
      await supabase.from("ai_recommendations").delete().eq("talent_id", talent.id);

      return { success: true, creditsAwarded, duplicate: isDuplicate };
    },
    onSuccess: async (res) => {
      // Invalidate relevant system data states globally
      void qc.invalidateQueries({ queryKey: ["talent", talent?.id] });
      void qc.invalidateQueries({ queryKey: ["talent-credits", talent?.id] });
      void qc.invalidateQueries({ queryKey: ["feed-recommendations"] });

      await refreshTalent();

      if (res.success) {
        if (res.duplicate) {
          toast.warning("Profile initialized. Secondary account structural boundaries enforced.");
        } else if (res.creditsAwarded) {
          toast.success("Welcome package unlocked! +250 Credits applied.");
        } else {
          toast.success("Profile registration completed successfully.");
        }
      }
    },
    onError: (err: any) => {
      console.error("[Digital Workforce] CRITICAL: Onboarding pipeline transaction execution aborted.", err);
      toast.error("Onboarding submission timeout. Structural changes rolled back.");
    },
  });

  return {
    currentStep,
    isOnboardingComplete,
    isUpdating: stepMutation.isPending || completionMutation.isPending || isUpdatingLegacy,
    updateStep: stepMutation.mutateAsync,
    completeOnboarding: completionMutation.mutateAsync,
    skipOnboarding: () => completionMutation.mutateAsync(),
  };
}
