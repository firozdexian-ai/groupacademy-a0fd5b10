import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Monotonic Progress Guard
 * CTO Reference: Authoritative controller for curriculum stage transitions and resource tracking.
 * Performance: Optimized for optimistic UI updates with background persistence.
 */

interface UseStageProgressOptions {
  enrollmentId: string | undefined;
  moduleId: string | undefined;
  totalStages?: number;
}

export function useStageProgress({ enrollmentId, moduleId, totalStages = 6 }: UseStageProgressOptions) {
  const [completedStages, setCompletedStages] = useState<number[]>([]);
  const [currentStage, setCurrentStage] = useState(1);
  const [resourceViewStates, setResourceViewStates] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // PHASE: Registry_Ingress
  useEffect(() => {
    async function loadInstitutionalProgress() {
      if (!enrollmentId || !moduleId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("enrollment_stage_progress")
          .select("completed_stages, current_stage, resource_view_states")
          .eq("enrollment_id", enrollmentId)
          .eq("module_id", moduleId)
          .maybeSingle();

        if (error) {
          console.error("REGISTRY_FETCH_FAULT:", error);
        } else if (data) {
          setCompletedStages(data.completed_stages || []);
          setCurrentStage(data.current_stage || 1);
          setResourceViewStates((data.resource_view_states as Record<string, boolean>) || {});
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadInstitutionalProgress();
  }, [enrollmentId, moduleId]);

  // PHASE: Aggregate_Progress_Sync
  const updateEnrollmentMetrics = useCallback(
    async (completedStagesCount: number) => {
      if (!enrollmentId) return;

      const progress = Math.round((completedStagesCount / totalStages) * 100);
      try {
        await supabase
          .from("enrollments")
          .update({
            progress: Math.min(progress, 100),
            last_accessed_at: new Date().toISOString(),
          })
          .eq("id", enrollmentId);
      } catch (err) {
        console.error("METRIC_SYNC_FAULT:", err);
      }
    },
    [enrollmentId, totalStages],
  );

  // PHASE: Persistence_Handshake
  const persistProgressArtifacts = useCallback(
    async (newCompletedStages: number[], newCurrentStage: number, newResourceViewStates?: Record<string, boolean>) => {
      if (!enrollmentId || !moduleId) return;

      setIsSaving(true);
      try {
        const { error } = await supabase.from("enrollment_stage_progress").upsert(
          {
            enrollment_id: enrollmentId,
            module_id: moduleId,
            completed_stages: newCompletedStages,
            current_stage: newCurrentStage,
            resource_view_states: newResourceViewStates || resourceViewStates,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "enrollment_id,module_id" },
        );

        if (error) throw error;
        await updateEnrollmentMetrics(newCompletedStages.length);
      } catch (err) {
        console.error("PERSISTENCE_FAULT:", err);
      } finally {
        setIsSaving(false);
      }
    },
    [enrollmentId, moduleId, resourceViewStates, updateEnrollmentMetrics],
  );

  const markStageComplete = useCallback(
    async (stageNumber: number) => {
      const newCompletedStages = completedStages.includes(stageNumber)
        ? completedStages
        : [...completedStages, stageNumber];

      // HUD: Auto-advance to the next node if applicable
      const newCurrentStage = stageNumber < 6 && currentStage === stageNumber ? stageNumber + 1 : currentStage;

      // Optimistic state update
      setCompletedStages(newCompletedStages);
      setCurrentStage(newCurrentStage);

      await persistProgressArtifacts(newCompletedStages, newCurrentStage);
    },
    [completedStages, currentStage, persistProgressArtifacts],
  );

  return {
    completedStages,
    currentStage,
    markStageComplete,
    goToStage: useCallback(
      (stageNumber: number) => {
        if (stageNumber === 1 || completedStages.includes(stageNumber - 1)) {
          setCurrentStage(stageNumber);
          persistProgressArtifacts(completedStages, stageNumber);
        }
      },
      [completedStages, persistProgressArtifacts],
    ),
    isStageUnlocked: useCallback(
      (stageNumber: number) => stageNumber === 1 || completedStages.includes(stageNumber - 1),
      [completedStages],
    ),
    isLoading,
    isSaving,
    // Artifact View HUD
    markResourceViewed: useCallback(
      async (resourceId: string) => {
        const newStates = { ...resourceViewStates, [resourceId]: true };
        setResourceViewStates(newStates);
        await persistProgressArtifacts(completedStages, currentStage, newStates);
      },
      [resourceViewStates, completedStages, currentStage, persistProgressArtifacts],
    ),
    isResourceViewed: useCallback(
      (resourceId: string) => resourceViewStates[resourceId] === true,
      [resourceViewStates],
    ),
  };
}
