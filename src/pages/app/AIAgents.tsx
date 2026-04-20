import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Coins,
  Sparkles,
  MessageCircle,
  Bot,
  ClipboardList,
  Mic,
  DollarSign,
  Palette,
  History as HistoryIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AgentCard } from "@/components/ai-agents/AgentCard";
import { AgentListItem } from "@/components/ai-agents/AgentListItem";
import { AgentFilters, AgentCategory } from "@/components/ai-agents/AgentFilters";
import { useAgentChat } from "@/hooks/useAgentChat";
import { supabase } from "@/integrations/supabase/client";
import { AI_AGENTS, getAgentById } from "@/lib/constants/agents";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Expert Network Registry
 * Orchestrates the discovery and engagement of AI Specialists and Career Tools.
 */

interface DBAgent {
  id: string;
  agent_key: string;
  name: string;
  description: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  expertise_areas: string[] | null;
  is_active: boolean;
  credit_cost: number | null;
  category: string | null;
  avatar_url: string | null;
  agent_type: string | null;
  is_featured: boolean | null;
}

const CAREER_TOOLS = [
  {
    icon: ClipboardList,
    label: "Scorecard",
    description: "Readiness Assessment",
    path: "/app/services/assessment",
    creditCost: 50,
  },
  {
    icon: Mic,
    label: "Interview",
    description: "Mock Session",
    path: "/app/services/mock-interview",
    creditCost: 50,
  },
  {
    icon: DollarSign,
    label: "Salary",
    description: "Market Analysis",
    path: "/app/services/salary-analysis",
    creditCost: 50,
  },
  {
    icon: Palette,
    label: "Portfolio",
    description: "Asset Builder",
    path: "/app/services/portfolio",
    creditCost: 500,
  },
];

export default function AIAgents() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<AgentCategory>("all");

  const { recentSessions = [], isLoadingSessions } = useAgentChat();

  const { data: dbAgents = [], isLoading: isLoadingAgents } = useQuery({
    queryKey: ["ai-agents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("is_active", true)
        .order("is_featured", { ascending: false });
      if (error) throw error;
      return data as DBAgent[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const agents = useMemo(() => {
    const baseList = dbAgents.length > 0 ? dbAgents : AI_AGENTS;
    return baseList.map((agent: any) => {
      const isDb = "agent_key" in agent;
      const key = isDb ? agent.agent_key : agent.id;
      const staticMeta = getAgentById(key);

      return {
        id: isDb ? agent.id : agent.id,
        agent_key: key,
        name: agent.name,
        description: agent.description,
        icon: staticMeta?.icon,
        bgColor: isDb ? agent.bg_color || "bg-primary/5" : agent.bgColor || "bg-primary/5",
        color: isDb ? agent.color || "#7c3aed" : agent.iconColor || "#7c3aed",
        expertise: isDb ? agent.expertise_areas || [] : agent.expertise || [],
        creditCost: isDb ? (agent.credit_cost ?? 10) : 10,
        category: (isDb ? agent.category || "career" : "career") as AgentCategory,
        avatarUrl: isDb ? agent.avatar_url : null,
        isCompanyAgent: isDb ? agent.agent_type === "company" : false,
      };
    });
  }, [dbAgents]);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        !searchQuery ||
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.expertise.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "company" ? agent.isCompanyAgent : agent.category === selectedCategory);
      return matchesSearch && matchesCategory;
    });
  }, [agents, searchQuery, selectedCategory]);

  const conversationStacks = useMemo(() => {
    const active = recentSessions
      .filter((s) => s.is_active)
      .map((s) => ({
        ...s,
        agent: agents.find((a) => a.agent_key === s.agent_key),
        lastMsg: s.messages?.[s.messages.length - 1]?.content.slice(0, 60),
      }));
    const historical = recentSessions
      .filter((s) => !s.is_active)
      .slice(0, 8)
      .map((s) => ({
        ...s,
        agent: agents.find((a) => a.agent_key === s.agent_key),
        lastMsg: s.messages?.[s.messages.length - 1]?.content.slice(0, 60),
      }));
    return { active, historical };
  }, [recentSessions, agents]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[20px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3">
            <Bot className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none">Expertise</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
              Neural Career Intelligence
            </p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="network" className="w-full">
        <TabsList className="grid w-full grid-cols-2 p-1.5 h-14 bg-muted/30 backdrop-blur-md rounded-2xl mb-8 border border-border/40">
          <TabsTrigger value="network" className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Explorer
          </TabsTrigger>
          <TabsTrigger
            value="chats"
            className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 relative"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Registry
            {conversationStacks.active.length > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-[10px] font-black text-white rounded-lg flex items-center justify-center shadow-lg animate-pulse">
                {conversationStacks.active.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-10 outline-none">
          <AgentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            showCompanyTab={agents.some((a) => a.isCompanyAgent)}
          />

          <section className="space-y-6">
            <SectionHeader
              icon={Bot}
              title={searchQuery ? "Diagnostic Results" : "Neural Specialists"}
              count={filteredAgents.length}
              size="sm"
            />
            <div className="grid grid-cols-2 gap-4">
              {isLoadingAgents
                ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-[32px]" />)
                : filteredAgents.map((agent) => (
                    <AgentCard
                      key={agent.agent_key}
                      {...agent}
                      hasActiveSession={recentSessions.some((s) => s.agent_key === agent.agent_key && s.is_active)}
                      onClick={() => navigate(`/app/agents/${agent.agent_key}`)}
                    />
                  ))}
            </div>
          </section>

          {!searchQuery && selectedCategory === "all" && (
            <section className="space-y-6">
              <SectionHeader icon={ClipboardList} title="Logic Suite" size="sm" />
              <div className="grid grid-cols-2 gap-4">
                {CAREER_TOOLS.map((tool) => (
                  <Card
                    key={tool.label}
                    className="group cursor-pointer hover:border-primary/40 transition-all rounded-[32px] p-6 bg-card/50 backdrop-blur-sm border-2 border-dashed border-border/40"
                    onClick={() => navigate(tool.path)}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <tool.icon className="h-7 w-7 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-black uppercase tracking-tighter text-sm">{tool.label}</h3>
                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                          {tool.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        <Coins className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-black tracking-[0.2em]">{tool.creditCost}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </TabsContent>

        <TabsContent value="chats" className="space-y-10 outline-none">
          {conversationStacks.active.length > 0 && (
            <section className="space-y-6">
              <SectionHeader icon={MessageCircle} title="Active Uplinks" size="sm" />
              <div className="space-y-3">
                {conversationStacks.active.map((conv) => (
                  <AgentListItem
                    key={conv.id}
                    id={conv.id}
                    name={conv.agent?.name || "Specialist"}
                    description={conv.lastMsg || "Establishing secure connection..."}
                    isActive
                    onClick={() => navigate(`/app/agents/${conv.agent_key}`)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <SectionHeader icon={HistoryIcon} title="Interaction Logs" size="sm" />
            {conversationStacks.historical.length > 0 ? (
              <div className="space-y-3">
                {conversationStacks.historical.map((chat) => (
                  <AgentListItem
                    key={chat.id}
                    id={chat.id}
                    name={chat.agent?.name || "Specialist"}
                    description={chat.lastMsg || "Session archive finalized."}
                    onClick={() => navigate(`/app/agents/${chat.agent_key}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-16 border-2 border-dashed border-border/40 rounded-[40px] text-center bg-muted/5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                  Registry Empty: No Prior Sessions
                </p>
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
