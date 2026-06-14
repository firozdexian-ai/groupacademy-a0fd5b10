/**
 * Dashboard / Chat — WhatsApp-style unified conversational agent surface.
 * Sibling to the data-heavy `/dashboard`. All admin AI agents live here
 * with persistent per-admin threads.
 */
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentRail } from "@/domains/agents/components/admin/chat/AgentRail";
import { ChatThread } from "@/domains/agents/components/admin/chat/ChatThread";
import { useAdminAgentThreads } from "@/domains/agents/components/admin/chat/hooks/useAgentRuntimeThread";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ADMIN_AGENTS, ADMIN_AGENTS_BY_KEY } from "@/lib/adminAgents";
import { getCurrentUser, getAccessToken } from "@/lib/auth";
import { listUserRoles } from "@/domains/profile/repo/profileRepo";

export default function DashboardChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialAgent = searchParams.get("agent");
  const [activeKey, setActiveKey] = useState<string | null>(
    initialAgent && ADMIN_AGENTS_BY_KEY[initialAgent] ? initialAgent : ADMIN_AGENTS[0].key,
  );
  const { threads, reload } = useAdminAgentThreads();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    (async () => {
      try {
        const u = await getCurrentUser();
        const t = await getAccessToken();
        const r = u ? await listUserRoles(u.id) : [];
        setDebugInfo({
          id: u?.id || "none",
          email: u?.email || "none",
          roles: r.map(x => x.role).join(", ") || "none",
          tokenExists: !!t,
        });
      } catch (err: any) {
        setDebugInfo({ error: err.message });
      }
    })();
  }, []);

  useEffect(() => {
    if (activeKey) setSearchParams({ agent: activeKey }, { replace: true });
  }, [activeKey, setSearchParams]);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const showThread = activeKey !== null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* top bar */}
      <header className="h-14 border-b border-border/40 px-4 flex items-center gap-3 bg-card/40 backdrop-blur flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          title="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <MessageCircle className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="font-bold text-sm">Agentic Dashboard</div>
          <div className="text-[11px] text-muted-foreground">
            All conversational agents · persistent threads
          </div>
        </div>
      </header>

      {debugInfo && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-2xs font-mono text-amber-500 flex gap-4 overflow-x-auto select-all shrink-0">
          <span><strong>ID:</strong> {debugInfo.id}</span>
          <span><strong>Email:</strong> {debugInfo.email}</span>
          <span><strong>Roles:</strong> {debugInfo.roles}</span>
          <span><strong>Token:</strong> {debugInfo.tokenExists ? "present" : "missing"}</span>
          {debugInfo.error && <span className="text-rose-500"><strong>Error:</strong> {debugInfo.error}</span>}
        </div>
      )}

      {/* body */}
      <div className="flex-1 min-h-0 flex">
        <aside
          className={`${
            showThread ? "hidden md:flex" : "flex"
          } w-full md:w-[320px] flex-col border-r border-border/40 bg-card flex-shrink-0`}
        >
          <AgentRail
            activeKey={activeKey}
            threads={threads}
            onSelect={(k) => setActiveKey(k)}
          />
        </aside>
        <main className={`${showThread ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col`}>
          {activeKey ? (
            <ChatThread agentKey={activeKey} onAfterSend={reload} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select an agent to start chatting
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
