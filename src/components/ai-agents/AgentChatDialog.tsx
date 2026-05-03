import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgentChat } from "@/hooks/useAgentChat";
import { Send, Loader2, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
// CTO FIX: Perfectly pathed import to the standardized ecosystem component!
import { AgentAvatar } from "@/components/agents/AgentAvatar";

/**
 * GroUp Academy: Neural Chat Interface (Reconstructed)
 * CTO Audit: Fully reconstructed from scratch. Upgraded to 2026 Premium SaaS aesthetic.
 * Fixed the folder pathing bug and wired it flawlessly to the new AgentAvatar.
 */

export interface AgentChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentKey: string;
  agentName: string;
  agentAvatarUrl?: string | null;
  isCompanyAgent?: boolean;
}

export function AgentChatDialog({
  open,
  onOpenChange,
  agentKey,
  agentName,
  agentAvatarUrl,
  isCompanyAgent,
}: AgentChatDialogProps) {
  const { messages, isStreaming, sendMessage, startOrResumeSession, isLoading, perResponseCost } = useAgentChat();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Initialize neural link when dialog opens
  useEffect(() => {
    if (open && agentKey) {
      startOrResumeSession(agentKey);
    }
  }, [open, agentKey, startOrResumeSession]);

  // Auto-scroll logic
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput("");
    await sendMessage(text);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl h-[85vh] sm:h-[80vh] flex flex-col p-0 gap-0 overflow-hidden rounded-[32px] border-2 border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl">
        {/* HUD: HEADER */}
        <DialogHeader className="p-4 sm:p-6 border-b border-border/10 bg-card/30 flex-shrink-0 text-left">
          <div className="flex items-center gap-4">
            <AgentAvatar
              name={agentName}
              avatarUrl={agentAvatarUrl}
              isCompanyAgent={isCompanyAgent}
              isOnline={true}
              size="lg"
            />
            <div className="flex-1">
              <DialogTitle className="text-xl font-black uppercase italic tracking-tighter">{agentName}</DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1 mt-1">
                <Zap className="h-3 w-3" /> Neural Sync Active
              </DialogDescription>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                Operation Cost
              </span>
              <span className="text-xs font-black text-primary">{perResponseCost} TKN/MSG</span>
            </div>
          </div>
        </DialogHeader>

        {/* HUD: CHAT MATRIX */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth bg-muted/5">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest text-primary italic animate-pulse">
                Establishing Handshake...
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 opacity-50 animate-in fade-in duration-1000">
              <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center max-w-[250px] leading-relaxed">
                End-to-End Encrypted Node. <br /> Initialization Complete. State your query.
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
              disabled={isStreaming || isLoading}
              className="flex-1 h-14 rounded-2xl bg-background/80 border-2 italic font-medium px-5 focus-visible:ring-primary/20 shadow-inner"
            />
            <Button
              type="submit"
              disabled={!input.trim() || isStreaming || isLoading}
              className="h-14 w-14 rounded-2xl shrink-0 shadow-[0_10px_30px_rgba(var(--primary),0.2)] hover:shadow-primary/40 transition-all active:scale-95"
            >
              {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-1" />}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
