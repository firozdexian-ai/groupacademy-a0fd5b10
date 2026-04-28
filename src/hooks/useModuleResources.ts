import { supabase } from "@/integrations/supabase/client";
import { useQueryWithTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import type { Database } from "@/integrations/supabase/types";

/**
 * GroUp Academy: Curriculum Resource Sentinel
 * CTO Reference: Authoritative controller for 6-Stage pedagogical content delivery.
 * Logic: Implements phase-based partitioning and student progress auditing.
 */

type ModuleResource = Database["public"]["Tables"]["module_resources"]["Row"];

export interface StageResources {
  stage: number;
  stageName: string;
  resources: ModuleResource[];
}

// HUD: Institutional Stage Definitions
const stageNames: Record<number, string> = {
  1: "Orientation",
  2: "Learn",
  3: "Discuss",
  4: "Practice",
  5: "Assess",
  6: "Progress",
};

/**
 * PHASE: Resource_Ingress
 * Retrieves all curriculum artifacts for a specific module node.
 */
export function useModuleResources(moduleId: string | undefined) {
  return useQueryWithTimeout({
    queryKey: ["module-resources", moduleId],
    queryFn: async () => {
      if (!moduleId) return [];

      const { data, error } = await supabase
        .from("module_resources")
        .select("*")
        .eq("module_id", moduleId)
        .order("stage_number", { ascending: true })
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!moduleId,
    timeout: TIMEOUTS.DEFAULT,
  });
}

/**
 * PHASE: Stage_Partitioning
 * Reconfigures raw resources into the 6-Stage executive model.
 */
export function useModuleResourcesByStage(moduleId: string | undefined) {
  const { data: resources, ...rest } = useModuleResources(moduleId);

  const resourcesByStage: StageResources[] = [1, 2, 3, 4, 5, 6].map((stage) => ({
    stage,
    stageName: stageNames[stage],
    resources: resources?.filter((r) => r.stage_number === stage) || [],
  }));

  return {
    ...rest,
    data: resourcesByStage,
    allResources: resources,
  };
}

/**
 * PHASE: Progress_Audit
 * Verifies which specific resource artifacts have been completed by the talent.
 */
export function useStudentResourceProgress(studentId: string | undefined, moduleId: string | undefined) {
  return useQueryWithTimeout({
    queryKey: ["student-resource-progress", studentId, moduleId],
    queryFn: async () => {
      if (!studentId || !moduleId) return [];

      // Step 1: Discover module resource artifacts
      const { data: resources } = await supabase.from("module_resources").select("id").eq("module_id", moduleId);

      if (!resources?.length) return [];

      const resourceIds = resources.map((r) => r.id);

      // Step 2: Audit interaction ledger
      const { data, error } = await supabase
        .from("student_resource_progress")
        .select("*")
        .eq("student_id", studentId)
        .in("resource_id", resourceIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentId && !!moduleId,
    timeout: TIMEOUTS.DEFAULT,
  });
}
