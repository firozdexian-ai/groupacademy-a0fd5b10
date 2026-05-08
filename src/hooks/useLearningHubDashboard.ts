import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LearningHubDashboard {
  authenticated: boolean;
  talent_id: string | null;
  active_enrollments: Array<{
    id: string;
    content_id: string;
    progress: number;
    last_accessed_at: string | null;
    current_module_id: string | null;
    status: string;
    title: string;
    slug: string;
    cover_image_url: string | null;
    thumbnail_url: string | null;
    content_type: string;
  }>;
  upcoming_sessions: Array<{
    id: string;
    title: string;
    starts_at: string;
    meeting_url: string | null;
    cohort_id: string;
  }>;
  recent_certificates: Array<{
    id: string;
    code: string;
    kind: string;
    issued_at: string;
    content_id: string | null;
  }>;
  stats: { active_count: number; completed_count: number; due_reviews: number };
  generated_at: string;
}

export function useLearningHubDashboard() {
  return useQuery({
    queryKey: ["learning-hub-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_learning_hub_dashboard");
      if (error) throw error;
      return data as unknown as LearningHubDashboard;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
