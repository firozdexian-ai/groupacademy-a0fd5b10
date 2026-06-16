import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Gro10xAgent {
  key: string;
  name: string;
  desc: string;
  emoji: string;
  goals: string[];
  message_credit_cost: number;
}

const B2B_ALLOWLIST = [
  "concierge",
  "company_recruiter",
  "company_talent_scout",
  "company_ops",
  "company_billing",
  "company_growth",
];

const EMOJI_MAP: Record<string, string> = {
  concierge: "🧭",
  company_recruiter: "👥",
  company_talent_scout: "🔍",
  company_ops: "⚙️",
  company_billing: "💳",
  company_growth: "📈",
};

const GOALS_MAP: Record<string, string[]> = {
  concierge: ["explore"],
  company_recruiter: ["hire"],
  company_talent_scout: ["hire"],
  company_ops: ["ops"],
  company_billing: ["ops"],
  company_growth: ["sell_b2b"],
};

export const GRO10X_AGENTS: Gro10xAgent[] = [
  { key: "concierge",            name: "Atlas",            desc: "Your Gro10x concierge — routes you to the right agent", emoji: "🧭", goals: ["explore"], message_credit_cost: 0 },
  { key: "company_recruiter",    name: "Recruiter Riya",   desc: "Post jobs, screen applicants, move the Kanban",         emoji: "👥", goals: ["hire"], message_credit_cost: 1.0 },
  { key: "company_talent_scout", name: "Talent Scout Maya",desc: "Search candidates, reveal contacts, build shortlists",  emoji: "🔍", goals: ["hire"], message_credit_cost: 0.5 },
  { key: "company_ops",          name: "Ops Omar",         desc: "Company profile, teammates, gig bids & contracts",      emoji: "⚙️", goals: ["ops"], message_credit_cost: 0.3 },
  { key: "company_billing",      name: "Billing Bilal",    desc: "Credits, invoices, top-ups",                            emoji: "💳", goals: ["ops"], message_credit_cost: 0.3 },
  { key: "company_growth",       name: "Growth Aiden",     desc: "Draft & publish on the company feed, track signal",     emoji: "📈", goals: ["sell_b2b"], message_credit_cost: 0.5 },
];

export const AGENT_BY_KEY: Record<string, Gro10xAgent> = Object.fromEntries(
  GRO10X_AGENTS.map((a) => [a.key, a])
);

export function getAgentMeta(key: string): Gro10xAgent {
  return (
    AGENT_BY_KEY[key] ?? {
      key,
      name: key,
      desc: "AI agent",
      emoji: "🤖",
      goals: [],
      message_credit_cost: 0,
    }
  );
}

export function useGro10xAgents(extraKeys: string[] = []) {
  const queryKeys = Array.from(new Set([...B2B_ALLOWLIST, ...extraKeys]));
  
  return useQuery<Gro10xAgent[]>({
    queryKey: ["gro10x-agents-list", queryKeys.sort()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("agent_key, name, description, message_credit_cost, display_order")
        .in("agent_key", queryKeys)
        .eq("is_active", true)
        .eq("visibility", "public")
        .order("display_order", { ascending: true });

      if (error) throw error;

      return (data || []).map((agent) => ({
        key: agent.agent_key,
        name: agent.name,
        desc: agent.description || "",
        emoji: EMOJI_MAP[agent.agent_key] || "🤖",
        goals: GOALS_MAP[agent.agent_key] || [],
        message_credit_cost: Number(agent.message_credit_cost ?? 0),
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

