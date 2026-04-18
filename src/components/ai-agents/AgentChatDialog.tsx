import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Send, MoreVertical, Trash2, Copy, Check, Coins, MessageSquare, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AgentMessage } from "@/hooks/useAgentChat";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface AgentInfo {
  id?: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  avatarUrl?: string | null;
}

interface AgentChatDialogProps {
  agent: AgentInfo;
  messages: AgentMessage[];
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onBack: () => void;
  onEndSession: () => void;
  perResponseCost?: number;
}

const getSuggestions = (agentId?: string) => {
  const common = ["What can you help me with?", "Give me a quick tip", "Help me get started"];
  switch (agentId) {
    case "cv-coach":
      return ["Review my summary", "ATS optimization tips", "Action verbs list", ...common];
    case "interview-coach":
      return ["Start mock interview", "STAR method example", "Common questions", ...common];
    case "salary-negotiator":
      return ["Negotiation script", "Market rate check", "Email template", ...common];
    default:
      return common;
  }
};

export function AgentChatDialog({
  agent,
  messages,
  isStreaming,
  onSendMessage,
  onBack,
  onEndSession,
  perResponseCost = 1,
}: AgentChatDialogProps) {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // CTO FIX: Intelligent Auto-Scroll logic
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (scrollContainer) {
      scrollContainer.scrollTo({
        top: scrollContainer.scrollHeight,
        behavior: isStreaming ? "auto" : "smooth",
      });
    }
  }, [messages, isStreaming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestions = getSuggestions(agent.id);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative border-x border-border/40">
      {/* Dynamic Header */}
      <header className="flex items-center gap-3 p-3 border-b bg-card/50 backdrop-blur-md shrink-0 z-20">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar className="h-10 w-10 shrink-0 border-2 border-background shadow-sm">
            {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.name} className="object-cover" />}
            <AvatarFallback className={cn("text-white transition-colors font-black", agent.color)}>
              {agent.icon || <Bot className="h-5 w-5" />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="font-bold text-sm tracking-tight truncate">{agent.name}</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary/70">
              <Coins className="h-3 w-3" />
              <span>{perResponseCost} Credit/MSG</span>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
              <MoreVertical className="h-5 w-5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl">
            <DropdownMenuItem onClick={onEndSession} className="text-destructive font-bold focus:text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Conversation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Chat Viewport */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 w-full bg-slate-50/40 dark:bg-slate-900/10">
        <div className="max-w-3xl mx-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-in fade-in duration-700">
              <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center mb-6 shadow-inner">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2">Initialize {agent.name}</h3>
              <p className="text-xs text-muted-foreground mb-8 leading-relaxed max-w-[240px]">
                I'm synced and ready to assist. Tap a strategic prompt below to begin.
              </p>

              <div className="flex flex-col gap-2.5 w-full max-w-[320px]">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    onClick={() => onSendMessage(suggestion)}
                    disabled={isStreaming}
                    className="w-full justify-start h-auto py-4 px-5 text-[11px] font-bold uppercase tracking-tight rounded-2xl bg-background border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-left shadow-sm"
                  >
                    <MessageSquare className="h-4 w-4 mr-3 text-primary" />
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.role === "user";
            const msgId = `msg-${index}`;

            return (
              <div
                key={index}
                className={cn(
                  "flex gap-3 group animate-in slide-in-from-bottom-2 duration-300",
                  isUser ? "justify-end" : "justify-start",
                )}
              >
                {!isUser && (
                  <Avatar className="h-8 w-8 mt-1 shrink-0 border shadow-sm">
                    {agent.avatarUrl && <AvatarImage src={agent.avatarUrl} alt={agent.name} />}
                    <AvatarFallback className={cn("text-white text-[10px] font-bold", agent.color)}>
                      {agent.icon}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={cn("relative max-w-[88%] space-y-1", isUser ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm transition-colors",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-none font-medium"
                        : "bg-card text-foreground rounded-tl-none border border-border/50",
                    )}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-muted-foreground prose-code:text-primary">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {!isUser && (
                    <div className="flex items-center gap-2 px-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground/50 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleCopy(message.content, msgId)}
                      >
                        {copiedId === msgId ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex gap-3 justify-start items-center">
              <Avatar className="h-8 w-8 border">
                <AvatarFallback className={cn("text-white text-[10px] font-bold animate-pulse", agent.color)}>
                  AI
                </AvatarFallback>
              </Avatar>
              <div className="bg-card border border-border/50 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:0.8s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-duration:0.8s] [animation-delay:0.4s]"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Persistent Bottom Bar */}
      <footer className="border-t bg-card/30 backdrop-blur-xl p-4 shrink-0 z-20">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${agent.name}...`}
            disabled={isStreaming}
            className="flex-1 h-12 bg-background border-border/60 rounded-2xl focus-visible:ring-primary/20 shadow-inner px-5 font-medium"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-2xl shadow-lg bg-primary hover:scale-[1.02] active:scale-95 transition-all"
            disabled={!input.trim() || isStreaming}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
