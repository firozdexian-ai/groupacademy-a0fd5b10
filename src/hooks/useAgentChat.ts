import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { handleAIError, getAIUnavailableToast } from "@/lib/aiErrorHandler";

// ... (Interfaces remain the same)

export function useAgentChat(): UseAgentChatReturn {
  const { talent } = useTalent();
  const [session, setSession] = useState<AgentSession | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [recentSessions, setRecentSessions] = useState<AgentSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  
  // UPDATED: Default to 1 credit per response as per your new requirement
  const [perResponseCost, setPerResponseCost] = useState<number>(1); 

  // ... (loadRecentSessions and loadSession stay the same)

  const startOrResumeSession = useCallback(
    async (agentKey: string): Promise<AgentSession | null> => {
      if (!talent?.id) {
        toast.error("Please complete your profile first");
        return null;
      }

      setIsLoading(true);
      try {
        // We still fetch to check if a custom cost exists, but default to 1
        const { data: agentConfig } = await supabase
          .from("ai_agents")
          .select("credit_cost")
          .eq("agent_key", agentKey)
          .maybeSingle();

        // If no specific cost is set in DB, use our 1-credit-per-response standard
        const cost = agentConfig?.credit_cost ?? 1;
        setPerResponseCost(cost);

        // RESUME LOGIC: Find the MOST RECENT active session to keep the conversation going
        const { data: existingSessions } = await supabase
          .from("agent_chat_sessions")
          .select("*")
          .eq("talent_id", talent.id)
          .eq("agent_key", agentKey)
          .eq("is_active", true) // Ensure we are picking up the ongoing thread
          .order("created_at", { ascending: false })
          .limit(1);

        if (existingSessions && existingSessions.length > 0) {
          const existing = existingSessions[0];
          const sessionData: AgentSession = {
            ...existing,
            messages: (existing.messages as unknown as AgentMessage[]) || [],
          };
          setSession(sessionData);
          setMessages(sessionData.messages);
          return sessionData;
        }

        // NEW SESSION LOGIC: Only happens if no active session exists
        const now = new Date();
        const farFuture = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

        const { data, error } = await supabase
          .from("agent_chat_sessions")
          .insert({
            talent_id: talent.id,
            agent_key: agentKey,
            messages: [],
            is_active: true,
            credits_charged: 0,
            session_started_at: now.toISOString(),
            session_expires_at: farFuture.toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        const sessionData: AgentSession = { ...data, messages: [] };
        setSession(sessionData);
        setMessages([]);
        return sessionData;
      } catch (error) {
        console.error("Failed to start/resume session:", error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [talent?.id],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!session || !content.trim() || isStreaming) return;

      const userMessage: AgentMessage = { role: "user", content: content.trim() };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsStreaming(true);

      let assistantContent = "";

      try {
        // ... (Streaming fetch logic remains the same)

        // DEDUCTION LOGIC: Fires exactly once per AI response
        if (perResponseCost > 0 && assistantContent) {
          const { data: deductResult, error: rpcError } = await supabase.rpc("deduct_credits", {
            p_amount: perResponseCost,
            p_service_type: "AI_AGENT_CHAT", // Categorized as chat usage [cite: 43]
            p_reference_id: session.id,
            p_description: `AI Response: ${session.agent_key}`, // Clearer billing description
          });

          if (rpcError || (deductResult && !(deductResult as any).success)) {
            toast.error("Insufficient credits. Your conversation has been paused.");
            setIsStreaming(false);
            return;
          }
        }

        // SAVE LOGIC: Updates the single continuous conversation thread [cite: 33, 40]
        const finalMessages = [...newMessages, { role: "assistant" as const, content: assistantContent }];
        await saveMessages(finalMessages, perResponseCost);
      } catch (error) {
        console.error("Send message error:", error);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsStreaming(false);
      }
    },
    [session, messages, isStreaming, saveMessages, perResponseCost],
  );

  // ... (Remainder of hook)