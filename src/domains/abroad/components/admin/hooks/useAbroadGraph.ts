/**
 * Group Academy — Career Abroad Domain Graph Orchestration Hook
 * Version: Phase 10i.2 Hardened (Production Candidate)
 * Architecture: Centralized TanStack Query cache mutations managing student placement graphs.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getAbroadGraphMaster, upsertGraphRow, deleteGraphRow } from "@/domains/abroad/repo/abroadRepo";
import { trackError } from "@/lib/errorTracking";

export interface AbroadApplication {
  id: string;
  talent_user_id: string;
  program_id: string;
  status: string;
  created_at: string;
}

export interface AbroadProgram {
  id: string;
  title: string;
  institution_id: string;
  status: string;
  created_at: string;
}

export interface RoadmapLead {
  id: string;
  talent_id: string;
  destination: string;
  status: string;
  created_at: string;
}

export interface DestinationAgent {
  id: string;
  name: string;
  country: string;
  status: string;
  created_at: string;
}

export interface IeltsAttempt {
  id: string;
  user_id: string;
  prompt_id: string;
  score?: number;
  status: string;
  currentStep?: string;
  created_at: string;
}

export interface IeltsResource {
  id: string;
  title: string;
  resource_type: string;
  status: string;
  created_at: string;
}

export function useAbroadGraph() {
  const queryClient = useQueryClient();

  const abroadGraphQuery = useQuery({
    queryKey: ["abroad_graph_master"],
    queryFn: async () => {
      try {
        const master = await getAbroadGraphMaster();

        const applications: AbroadApplication[] = (master.apps ?? []).map((r: unknown) => ({
          id: r.id,
          talent_user_id: r.talent_user_id,
          program_id: r.program_id,
          status: r.stage ?? "unknown",
          created_at: r.created_at,
        }));

        const programs: AbroadProgram[] = (master.programs ?? []).map((r: unknown) => ({
          id: r.id,
          title: r.program_name ?? "Untitled Program",
          institution_id: r.university_name ?? "",
          status: r.is_active ? "active" : "inactive",
          created_at: r.created_at,
        }));

        const roadmaps: RoadmapLead[] = (master.roadmaps ?? []).map((r: unknown) => ({
          id: r.id,
          talent_id: r.talent_id,
          destination:
            Array.isArray(r.target_countries) && r.target_countries.length > 0 ? String(r.target_countries[0]) : "—",
          status: r.status ?? "pending",
          created_at: r.created_at,
        }));

        const agents: DestinationAgent[] = (master.agents ?? []).map((r: unknown) => ({
          id: r.id,
          name: r.display_name ?? "Unnamed",
          country: r.country_code ?? "",
          status: r.is_active ? "active" : "inactive",
          created_at: r.created_at,
        }));

        const ieltsAttempts: IeltsAttempt[] = (master.ielts ?? []).map((r: unknown) => ({
          id: r.id,
          user_id: r.user_id,
          prompt_id: r.prompt_id,
          score: r.ai_band_score ?? undefined,
          status: r.ai_band_score != null ? "scored" : "pending",
          created_at: r.created_at,
        }));

        const ieltsResources: IeltsResource[] = (master.resources ?? []).map((r: unknown) => ({
          id: r.id,
          title: r.title ?? "Untitled",
          resource_type: r.content_type ?? "unknown",
          status: r.is_active ? "active" : "inactive",
          created_at: r.created_at,
        }));

        return { applications, programs, roadmaps, agents, ieltsAttempts, ieltsResources };
      } catch (err: unknown) {
        trackError("abroad-graph-master-hydrator-failure", { error: err.message });
        throw err;
      }
    },
  });

  const useCreateUpsertMutation = (table: string, entityLabel: string) =>
    useMutation({
      mutationFn: (payload: unknown) => upsertGraphRow(table, payload),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["abroad_graph_master"] });
        toast.success(`${entityLabel} saved successfully.`);
      },
      onError: (err: Error) => {
        trackError("abroad-graph-upsert-error", { table, error: err.message });
        toast.error("Couldn't save changes. Please try again.");
      },
    });

  const useCreateDeleteMutation = (table: string, entityLabel: string) =>
    useMutation({
      mutationFn: (id: string) => deleteGraphRow(table, id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["abroad_graph_master"] });
        toast.success(`${entityLabel} removed successfully.`);
      },
      onError: (err: Error) => {
        trackError("abroad-graph-delete-error", { table, error: err.message });
        toast.error("Couldn't remove entry. Please try again.");
      },
    });

  return {
    abroadGraphQuery,
    mutations: {
      upsertApplication: useCreateUpsertMutation("abroad_applications", "Application"),
      deleteApplication: useCreateDeleteMutation("abroad_applications", "Application"),
      upsertProgram: useCreateUpsertMutation("study_abroad_programs", "Program"),
      deleteProgram: useCreateDeleteMutation("study_abroad_programs", "Program"),
      upsertRoadmap: useCreateUpsertMutation("study_abroad_roadmaps", "Roadmap"),
      deleteRoadmap: useCreateDeleteMutation("study_abroad_roadmaps", "Roadmap"),
      upsertAgent: useCreateUpsertMutation("destination_agents", "Agent info"),
      deleteAgent: useCreateDeleteMutation("destination_agents", "Agent info"),
      upsertIeltsAttempt: useCreateUpsertMutation("ielts_mock_attempts", "IELTS try"),
      deleteIeltsAttempt: useCreateDeleteMutation("ielts_mock_attempts", "IELTS try"),
      upsertIeltsResource: useCreateUpsertMutation("ielts_resources", "IELTS resource"),
      deleteIeltsResource: useCreateDeleteMutation("ielts_resources", "IELTS resource"),
    },
  };
}


