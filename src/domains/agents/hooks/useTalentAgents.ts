import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/iconMap";
import type { LucideIcon } from "lucide-react";

export interface TalentAgent {
  id: string;
  agent_key: string;
  name: string;
  description: string;
  iconName: string | null;
  icon: LucideIcon;
  color: string;
  bg_color: string;
  expertise_areas: string[];
  credit_cost: number;
  category: string;
  avatar_url: string | null;
  agent_type: string;
  is_featured: boolean;
  system_prompt: string;
}

export function useTalentAgents() {
  return useQuery<TalentAgent[]>({
    queryKey: ["talent-agents-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select(`
          id,
          agent_key,
          name,
          description,
          icon,
          color,
          bg_color,
          expertise_areas,
          is_active,
          credit_cost,
          category,
          avatar_url,
          agent_type,
          is_featured,
          system_prompt,
          visibility,
          marketplace_status
        `)
        .eq("agent_type", "talent")
        .eq("is_active", true)
        .eq("visibility", "public")
        .eq("marketplace_status", "approved");

      if (error) throw error;

      return (data || []).map((agent: any) => {
        const rawIconName = agent.icon || "Briefcase";
        const normalizedIconName = rawIconName.toLowerCase();
        
        return {
          id: agent.id,
          agent_key: agent.agent_key,
          name: agent.name,
          description: agent.description,
          iconName: rawIconName,
          icon: getIcon(normalizedIconName),
          color: agent.color || "text-primary",
          bg_color: agent.bg_color || "bg-primary/10",
          expertise_areas: Array.isArray(agent.expertise_areas) ? agent.expertise_areas : [],
          credit_cost: agent.credit_cost ?? 1,
          category: agent.category || "general",
          avatar_url: agent.avatar_url,
          agent_type: agent.agent_type || "talent",
          is_featured: !!agent.is_featured,
          system_prompt: agent.system_prompt || "",
        };
      });
    },
    staleTime: 5 * 60 * 1000,
  });
}
