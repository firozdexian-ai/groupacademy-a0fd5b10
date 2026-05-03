import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, Zap, ShieldCheck, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
// CTO FIX: Corrected the folder path to ai-agents
import { AgentAvatar } from "@/components/ai-agents/AgentAvatar";
import { AgentMessage } from "@/hooks/useAgentChat";

/**
 * GroUp Academy: Neural Chat Interface
 * CTO Audit: Re-synchronized props to perfectly match the parent page (AgentChat.tsx).
 * Upgraded to 2026 Premium SaaS aesthetic.
 */

export interface AgentChatDialogProps {
  agent: {
    id: string;
    name: string;
    color?: string;
    icon?: any;
    avatarUrl?: string | null;
  };
  messages: AgentMessage[];
  isStreaming: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onBack: () => void;
  onEndSession: () => Promise<void>;
  perResponseCost: number;
}

export function AgentChatDialog({
  agent,
  messages,
  isStreaming,
  onSendMessage,
  onBack,
  onEndSession,
  perResponseCost,
}: AgentChatDialogProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput("");
    await onSendMessage(text);
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-[32px] border-2 border-border/40 overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-500 max-h-[85vh]">
      {/* HUD: HEADER */}
      <header className="p-4 sm:p-6 border-b border-border/10 bg-card/30 flex items-center gap-4 flex-shrink-0 z-10 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-10 w-10 shrink-0 rounded-xl hover:bg-primary/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <AgentAvatar
          name={agent.name}
          avatarUrl={agent.avatarUrl}
          icon={agent.icon}
          iconColor={agent.color}
          isOnline={true}
          size="md"
        />

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black uppercase italic tracking-tighter truncate leading-tight">{agent.name}</h2>
          <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1 mt-0.5">
            <Zap className="h-3 w-3" /> Neural Sync Active
          </div>
        </div>

        <div className="flex flex-col items-end shrink-0">
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60">Yield Cost</span>
          <span className="text-[10px] font-black text-primary">{perResponseCost} TKN</span>
        </div>
      </header>

      {/* HUD: CHAT MATRIX */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth bg-muted/5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-50 animate-in fade-in duration-1000">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center max-w-[250px] leading-relaxed">
              End-to-End Encrypted Node. <br /> Target locked. State your query.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex animate-in slide-in-from-bottom-2",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-[24px] px-5 py-4 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground font-medium rounded-br-sm shadow-lg shadow-primary/20"
                    : "bg-card border-2 border-border/20 text-foreground font-medium italic rounded-bl-sm shadow-sm",
                )}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-card border-2 border-border/20 rounded-[24px] rounded-bl-sm px-6 py-5 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* COMMAND: INPUT INGRESS */}
      <div className="p-4 sm:p-6 bg-card/50 backdrop-blur-md border-t border-border/10 flex-shrink-0 relative z-10">
        <form onSubmit={handleSend} className="flex gap-3 relative">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Transmit query..."
            disabled={isStreaming}
            className="flex-1 h-14 rounded-2xl bg-background/80 border-2 italic font-medium px-5 focus-visible:ring-primary/20 shadow-inner"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="h-14 w-14 rounded-2xl shrink-0 shadow-[0_10px_30px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95"
          >
            {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-1" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
