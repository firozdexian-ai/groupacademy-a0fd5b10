import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, MessageSquare } from "lucide-react";
import { AgentChatDialog } from "@/components/ai-agents/AgentChatDialog";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { getAgentById } from "@/lib/constants/agents";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getIcon } from "@/lib/iconMap";

export default function AgentChat() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(true);

  const {
    session,
    messages,
    isStreaming,
    sendMessage,
    startOrResumeSession,
    endSession,
    isLoadingSessions,
    perResponseCost,
  } = useAgentChat();

  const { balance } = useCredits();

  const { data: dbAgent, isLoading: isLoadingDbAgent } = useQuery({
    queryKey: ["ai-agent-detail", agentKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("agent_key", agentKey!)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!agentKey,
    staleTime: 10 * 60 * 1000,
  });

  const staticAgent = useMemo(() => (agentKey ? getAgentById(agentKey) : null), [agentKey]);

  const activeAgent = useMemo(() => {
    if (dbAgent) {
      return {
        name: dbAgent.name,
        color: dbAgent.bg_color || "bg-primary",
        iconColor: dbAgent.color || "text-primary-foreground",
        iconName: dbAgent.icon || "MessageSquare",
        avatarUrl: dbAgent.avatar_url,
        creditCost: dbAgent.credit_cost,
      };
    }
    if (staticAgent) {
      return {
        name: staticAgent.name,
        color: staticAgent.bgColor,
        iconColor: staticAgent.iconColor,
        iconName: "MessageSquare",
        avatarUrl: null,
        creditCost: 1,
      };
    }
    return null;
  }, [dbAgent, staticAgent]);

  useEffect(() => {
    if (isLoadingDbAgent || isLoadingSessions) return;

    if (!activeAgent && !isLoadingDbAgent && agentKey) {
      toast.error("Agent not found in registry");
      navigate("/app/agents");
      return;
    }

    const initializeSession = async () => {
      if (!agentKey) return;
      try {
        const result = await startOrResumeSession(agentKey);
        if (result) {
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("AgentChat init error:", err);
        navigate("/app/agents");
      }
    };

    initializeSession();
  }, [agentKey, isLoadingDbAgent, isLoadingSessions, activeAgent, navigate, startOrResumeSession]);

  if (!agentKey) return null;

  if (isInitializing || isLoadingDbAgent) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!activeAgent) return null;

  const IconComponent = getIcon(activeAgent.iconName) || MessageSquare;

  return (
    /** * CTO CRITICAL FIX:
     * We must use 100dvh (dynamic viewport height) to account for mobile address bars.
     * We subtract the approximate height of the top search bar and bottom nav (~120px).
     * overflow-hidden is MANDATORY here to stop the page-level scrolling.
     */
    <div className="fixed inset-x-0 top-[60px] bottom-[65px] flex flex-col overflow-hidden bg-background">
      <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col overflow-hidden">
        {session && (
          <AgentChatDialog
            agent={{
              id: agentKey,
              name: activeAgent.name,
              color: activeAgent.color,
              icon: <IconComponent className={`h-4 w-4 ${activeAgent.iconColor}`} />,
              avatarUrl: activeAgent.avatarUrl,
            }}
            messages={messages}
            isStreaming={isStreaming}
            onSendMessage={sendMessage}
            onBack={() => navigate("/app/agents")}
            onEndSession={async () => {
              await endSession();
              navigate("/app/agents");
            }}
            perResponseCost={activeAgent.creditCost || perResponseCost}
          />
        )}
      </div>
    </div>
  );
}
