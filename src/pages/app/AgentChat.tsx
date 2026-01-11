import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Briefcase, FileText, Mic, DollarSign, BookOpen, Lightbulb, Loader2 } from "lucide-react";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { AgentChatDialog } from "@/components/ai-agents/AgentChatDialog";
import { useAgentChat } from "@/hooks/useAgentChat";
import { useCredits } from "@/hooks/useCredits";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { toast } from "sonner";

// Consistent with AIAgents.tsx
const AGENTS: Record<string, { name: string; icon: React.ElementType; color: string }> = {
  "career-consultant": {
    name: "Career Consultant",
    icon: Briefcase,
    color: "text-blue-600 bg-blue-500/10",
  },
  "cv-coach": {
    name: "CV Coach",
    icon: FileText,
    color: "text-emerald-600 bg-emerald-500/10",
  },
  "interview-coach": {
    name: "Interview Coach",
    icon: Mic,
    color: "text-purple-600 bg-purple-500/10",
  },
  "salary-negotiator": {
    name: "Salary Negotiator",
    icon: DollarSign,
    color: "text-amber-600 bg-amber-500/10",
  },
  "ielts-tutor": {
    name: "IELTS Tutor",
    icon: BookOpen,
    color: "text-rose-600 bg-rose-500/10",
  },
  "skill-advisor": {
    name: "Skill Advisor",
    icon: Lightbulb,
    color: "text-cyan-600 bg-cyan-500/10",
  },
};

export default function AgentChat() {
  const { agentKey } = useParams<{ agentKey: string }>();
  const navigate = useNavigate();

  // UI State
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Custom Hooks
  const {
    session,
    messages,
    isStreaming,
    sendMessage,
    startNewSession,
    loadSession,
    endSession,
    recentSessions,
    isSessionExpired,
    timeRemaining,
    isLoadingSessions,
  } = useAgentChat();

  const { balance, deductCredits } = useCredits();

  const agent = agentKey ? AGENTS[agentKey] : null;
  const serviceCost = CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost;

  // 1. Session Initialization Logic
  useEffect(() => {
    if (!agentKey || !agent) {
      navigate("/app/agents");
      return;
    }

    // Wait for sessions to load to prevent false negatives
    if (isLoadingSessions) return;

    const initializeSession = async () => {
      // Check for active, unexpired session for THIS agent
      const activeSession = recentSessions.find(
        (s) => s.agent_key === agentKey && s.is_active && new Date(s.session_expires_at) > new Date(),
      );

      if (activeSession) {
        // Resume existing session (Free)
        await loadSession(activeSession.id);
        setIsInitializing(false);
      } else {
        // No active session -> Gate it
        setShowCreditGate(true);
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [agentKey, recentSessions, isLoadingSessions, agent, navigate, loadSession]);

  // 2. Handle Starting a New Session (Paid)
  const handleConfirmCredit = async () => {
    if (!agentKey) return;

    // Use our global credit hook
    const success = await deductCredits("AI_AGENT_CHAT", undefined, `AI Agent: ${agent?.name} session`);

    if (success) {
      const newSession = await startNewSession(agentKey);
      if (newSession) {
        setShowCreditGate(false);
        toast.success("Session started! You have 30 minutes.");
      } else {
        toast.error("Failed to start session. Please try again.");
        // Consider refunding here if session creation fails, usually handled by backend
      }
    }
  };

  const handleBuyCredits = () => {
    setShowCreditGate(false); // Close gate
    setShowPurchaseSheet(true); // Open purchase sheet
  };

  const handleBack = () => {
    navigate("/app/agents");
  };

  const handleEndSession = async () => {
    await endSession();
    toast.success("Session ended");
    navigate("/app/agents");
  };

  if (!agent || !agentKey) return null;

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 3. Helper to render the icon component
  const AgentIcon = agent.icon;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] flex flex-col">
      {/* Credit Gate (The Door) */}
      <CreditGateModal
        isOpen={showCreditGate}
        onClose={handleBack}
        onConfirm={handleConfirmCredit}
        onBuyCredits={handleBuyCredits}
        serviceName={`${agent.name} Chat`}
        cost={serviceCost}
        currentBalance={balance}
        isLoading={false}
      />

      {/* Credit Purchase (The Wallet) */}
      <CreditPurchaseSheet
        isOpen={showPurchaseSheet}
        onClose={() => {
          setShowPurchaseSheet(false);
          // Re-open gate if they didn't start a session yet
          if (!session) setShowCreditGate(true);
        }}
        currentBalance={balance}
      />

      {/* Chat Interface (The Room) */}
      {session && (
        <AgentChatDialog
          agent={{
            ...agent,
            icon: (
              <div className={`p-1.5 rounded-md ${agent.color}`}>
                <AgentIcon className="h-4 w-4" />
              </div>
            ),
          }}
          messages={messages}
          isStreaming={isStreaming}
          timeRemaining={timeRemaining}
          isSessionExpired={isSessionExpired}
          onSendMessage={sendMessage}
          onBack={handleBack}
          onEndSession={handleEndSession}
        />
      )}
    </div>
  );
}
