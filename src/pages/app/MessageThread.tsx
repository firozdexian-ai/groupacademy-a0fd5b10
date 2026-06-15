import * as React from "react";
import { useParams, useNavigate } from "react-router-dom";

import { useTalent } from "@/hooks/useTalent";
import { useAgentChat } from "@/domains/agents/hooks/useAgentChat";
import { useMessageThreads } from "@/domains/messaging/hooks/useMessageThreads";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ChatBubble } from "@/domains/messaging/components/talent/ChatBubble";
import { ArrowLeft, Bot, Sparkles, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PAGE_SHELL } from "@/lib/uiTokens";
import { listTalentSystemFeedNotifications } from "@/domains/talent/repo/talentRepo";
import { getAgentByKey } from "@/domains/agents/repo/agentsRepo";
import { getMessageThreadIdByTalentAndAgent, ensureSystemThread } from "@/domains/messaging/repo/messagingRepo";
import { InlineSpinner } from "@/components/common/InlineSpinner";
import { useDirectMessages } from "@/domains/messaging/hooks/useDirectMessages";
import { supabase } from "@/integrations/supabase/client";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface NotificationRecord {
 id: string;
 title: string;
 message: string | null;
 link: string | null;
 created_at: string;
}

interface AgentRecord {
 id: string;
 name: string;
 agent_key: string;
 avatar_url: string | null;
 bg_color: string;
}

/**
 * GroUp Academy: Unified Thread Viewport (MessageThread)
 * Hardened responsive chat orchestrator managing dual-stream (System/Agent) communication pipelines.
 * Version: Launch Candidate Â· Phase Z1 Production Contract Sealed
 */
export default function MessageThread() {
 const { threadKey } = useParams<{ threadKey: string }>();
 const navigateHook = useNavigate();
 const { talent, isLoading: isTalentLoading } = useTalent();
 const { markThreadRead } = useMessageThreads();

 const isSystemThread = threadKey === "system";
 const isPeerThread = React.useMemo(() =>
   threadKey ? /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(threadKey) : false,
   [threadKey]
 );
 const scrollContainerRef = React.useRef<HTMLDivElement>(null);

 // --- Agent State ---
 const { messages, isStreaming, sendMessage, startOrResumeSession, perResponseCost } = useAgentChat();
 const [activeAgent, setActiveAgent] = React.useState<AgentRecord | null>(null);
 const [textComposerInput, setTextComposerInput] = React.useState<string>("");
 const [isBootstrapping, setIsBootstrapping] = React.useState<boolean>(true);

 // --- System State ---
 const [systemNotifications, setSystemNotifications] = React.useState<NotificationRecord[]>([]);

 // --- Peer State ---
 const { messages: peerMessages, send: sendPeerMessage, isSending: isSendingPeer } = useDirectMessages(
   isPeerThread ? threadKey : undefined
 );
 const [activePeer, setActivePeer] = React.useState<{ name: string; avatarUrl: string | null } | null>(null);

 // =========================================================================
 // LIFECYCLE SECTOR: THREAD INGRESS PROTOCOL
 // =========================================================================
  React.useEffect(() => {
   console.log("[Digital Workforce] useEffect triggered:", { talentId: talent?.id, isTalentLoading, threadKey, isSystemThread, isPeerThread });
   
   if (isTalentLoading) return;

   if (!talent?.id || !threadKey) {
     console.log("[Digital Workforce] Returning early because talent.id or threadKey is missing", { talent, threadKey });
     setIsBootstrapping(false);
     return;
   }
 
   if (isSystemThread) {
     const loadSystemFeed = async () => {
       console.log("[Digital Workforce] Loading system feed...");
       const tid = await ensureSystemThread(talent.id);
       if (tid) markThreadRead(tid);
 
       const data = await listTalentSystemFeedNotifications(talent.id, 200);
       setSystemNotifications(data ?? []);
       setIsBootstrapping(false);
       console.log("[Digital Workforce] Loaded system feed.");
     };
     void loadSystemFeed();
   } else if (isPeerThread) {
     const loadPeerSession = async () => {
       console.log("[Digital Workforce] Loading peer session:", threadKey);
       setIsBootstrapping(true);
       try {
         const { data: threadRow, error: threadError } = await supabase
           .from("message_threads")
           .select("peer_talent_id")
           .eq("id", threadKey)
           .single();
 
         if (!threadError && threadRow?.peer_talent_id) {
           const { data: talentRow, error: talentError } = await supabase
             .from("talents")
             .select("full_name, profile_photo_url")
             .eq("id", threadRow.peer_talent_id)
             .single();
 
           if (!talentError && talentRow) {
             setActivePeer({
               name: talentRow.full_name,
               avatarUrl: talentRow.profile_photo_url,
             });
           }
         }
         await markThreadRead(threadKey);
       } catch (error) {
         console.error("[Digital Workforce] Error loading peer session:", error);
       } finally {
         setIsBootstrapping(false);
         console.log("[Digital Workforce] Peer session load complete.");
       }
     };
     void loadPeerSession();
   } else {
     const loadAgentSession = async () => {
       console.log("[Digital Workforce] Loading agent session:", threadKey);
       try {
         setIsBootstrapping(true);
         const data = await getAgentByKey(threadKey);
         console.log("[Digital Workforce] getAgentByKey result:", data);
         if (data) setActiveAgent(data as unknown as AgentRecord);
         
         console.log("[Digital Workforce] Invoking startOrResumeSession...");
         const sessionResult = await startOrResumeSession(threadKey);
         console.log("[Digital Workforce] startOrResumeSession result:", sessionResult);
 
         console.log("[Digital Workforce] Invoking getMessageThreadIdByTalentAndAgent...");
         const threadId = await getMessageThreadIdByTalentAndAgent(talent.id, threadKey);
         console.log("[Digital Workforce] getMessageThreadIdByTalentAndAgent result:", threadId);
         if (threadId) await markThreadRead(threadId);
       } catch (err) {
         console.error("[Digital Workforce] Error loading agent session:", err);
       } finally {
         setIsBootstrapping(false);
         console.log("[Digital Workforce] Agent session load complete.");
       }
     };
     void loadAgentSession();
   }
  }, [threadKey, isSystemThread, isPeerThread, talent?.id, isTalentLoading, markThreadRead, startOrResumeSession]);

 // Sync scroll-to-bottom anchor
 React.useEffect(() => {
  if (scrollContainerRef.current) {
  scrollContainerRef.current.scrollTo({
  top: scrollContainerRef.current.scrollHeight,
  behavior: "smooth",
  });
  }
 }, [messages, systemNotifications, peerMessages]);

 const handleDispatchMessage = async () => {
  const trimmedInput = textComposerInput.trim();
  if (!trimmedInput) return;
  if (isPeerThread) {
  if (isSendingPeer) return;
  setTextComposerInput("");
  await sendPeerMessage(trimmedInput, "talent");
  } else {
  if (isStreaming) return;
  setTextComposerInput("");
  await sendMessage(trimmedInput);
  }
 };

 const headerLabel = isSystemThread
  ? "System Notifications"
  : isPeerThread
  ? (activePeer?.name ?? "Connection")
  : (activeAgent?.name ?? "Assistant");

 const subLabelText = isSystemThread
  ? "System Feed"
  : isPeerThread
  ? "Direct Message"
  : isStreaming
  ? "Typing..."
  : `${perResponseCost} credits per message`;

 const avatarImageSrc = isSystemThread
  ? undefined
  : isPeerThread
  ? (activePeer?.avatarUrl ?? undefined)
  : (activeAgent?.avatar_url ?? undefined);

 const avatarBgColor = isSystemThread
  ? "#2A7DDE"
  : isPeerThread
  ? "#10B981"
  : (activeAgent?.bg_color ?? "#2A7DDE");

 return (
 <div className={cn(PAGE_SHELL, "flex flex-col h-[100dvh] max-w-2xl mx-auto bg-background")}>
 {/* dashboard LEVEL 1: CONTEXT HEADER */}
 <header className="sticky top-0 z-20 bg-background/95 border-b border-border/40 flex items-center gap-3 px-4 py-3">
 <Button variant="ghost" size="icon" aria-label="Go back" className="h-9 w-9 shrink-0" onClick={() => navigateHook("/app/messages")}>
 <ArrowLeft className="h-5 w-5" />
 </Button>

 <Avatar className="h-9 w-9 rounded-full shrink-0">
  {avatarImageSrc && <AvatarImage src={avatarImageSrc} />}
  <AvatarFallback className="text-white" style={{ backgroundColor: avatarBgColor }}>
  {isSystemThread ? <Sparkles className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
  </AvatarFallback>
 </Avatar>

 <div className="flex-1 min-w-0">
  <p className="font-bold text-sm truncate">{headerLabel}</p>
  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest truncate">
  {subLabelText}
  </p>
 </div>
 </header>

 {/* dashboard LEVEL 2: MESSAGING VIEWPORT */}
 <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 bg-muted/10 space-y-4">
 {isBootstrapping ? (
 <InlineSpinner size="lg" />
 ) : isSystemThread ? (
 systemNotifications.length === 0 ? (
 <div className="text-center text-xs text-muted-foreground py-10">No system messages.</div>
 ) : (
 systemNotifications.map((n) => (
 <ChatBubble
 key={n.id}
 role="assistant"
 content={`${n.title}${n.message ? `\n\n${n.message}` : ""}`}
 timestamp={format(new Date(n.created_at), "MMM d, h:mm a")}
 ctaLabel={n.link ? "View" : undefined}
 ctaLink={n.link || undefined}
 />
 ))
 )
 ) : isPeerThread ? (
  peerMessages.length === 0 ? (
  <div className="text-center text-xs text-muted-foreground py-10">No messages yet.</div>
  ) : (
  peerMessages.map((m) => (
  <ChatBubble
  key={m.id}
  role={m.sender_id === talent?.id ? "user" : "assistant"}
  content={m.body}
  timestamp={format(new Date(m.created_at), "MMM d, h:mm a")}
  />
  ))
  )
  ) : (
  <>
  {messages.map((m, i) => (
  <ChatBubble key={i} role={m.role} content={m.content} />
  ))}
  {isStreaming && (
  <div className="flex items-center gap-2 px-3 py-2 text-[10px] uppercase font-bold text-muted-foreground animate-pulse">
  <InlineSpinner size="sm" /> {headerLabel} is typing...
  </div>
  )}
  </>
 )}
 </div>

 {/* dashboard LEVEL 3: INPUT COMPOSER */}
 {!isSystemThread && (
  <div className="border-t border-border/40 bg-background p-4 flex gap-2">
  <Input
  placeholder={`Message ${headerLabel}...`}
  value={textComposerInput}
  onChange={(e) => setTextComposerInput(e.target.value)}
  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleDispatchMessage()}
  className="h-11 rounded-xl bg-muted/30 border-transparent focus-visible:bg-background"
  disabled={isStreaming || isBootstrapping || (isPeerThread ? isSendingPeer : false)}
  />
  <Button
  size="icon" aria-label="Send"
  className="h-11 w-11 rounded-xl shrink-0"
  onClick={handleDispatchMessage}
  disabled={!textComposerInput.trim() || isStreaming || (isPeerThread ? isSendingPeer : false)}
  >
  <Send className="h-4 w-4" />
  </Button>
  </div>
 )}
 </div>
 );
}

