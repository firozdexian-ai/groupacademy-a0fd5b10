import { useState, useEffect } from "react";
import {
  toggleAiAgentActive,
  updateAiAgent,
  listAllAgentsOrdered,
  listAgentChatSessionKeys,
} from "@/domains/agents/repo/agentsRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Bot,
  Edit2,
  MessageSquare,
  Zap,
  ShieldCheck,
  Terminal,
  Settings2,
  Loader2,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AIAgent {
  id: string;
  agent_key: string;
  name: string;
  description: string;
  system_prompt: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  expertise_areas: string[] | null;
  is_active: boolean | null;
  display_order: number | null;
}

interface AgentStats {
  agent_key: string;
  total_sessions: number;
  active_sessions: number;
}

export function AIAgentsManager() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [stats, setStats] = useState<Record<string, AgentStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setIsLoading(true);
    try {
      const agentsData = await listAllAgentsOrdered();
      setAgents(agentsData as AIAgent[]);

      // Safeguard: limit(10000) prevents silent 1,000-row truncation bug
      const sessionsData = await listAgentChatSessionKeys(10000);

      const statsMap: Record<string, AgentStats> = {};
      sessionsData.forEach((session) => {
        if (!statsMap[session.agent_key]) {
          statsMap[session.agent_key] = {
            agent_key: session.agent_key,
            total_sessions: 0,
            active_sessions: 0,
          };
        }
        statsMap[session.agent_key].total_sessions++;
        if (session.is_active) statsMap[session.agent_key].active_sessions++;
      });
      setStats(statsMap);
    } catch (error: any) {
      toast.error("Failed to sync agents registry with the database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (agent: AIAgent) => {
    try {
      await toggleAiAgentActive(agent.id, !agent.is_active);
      setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, is_active: !a.is_active } : a)));
      toast.success(`Agent "${agent.name}" status updated successfully.`);
    } catch (error: any) {
      toast.error("Could not update agent activation status. Please try again.");
    }
  };

  const handleEdit = (agent: AIAgent) => {
    setEditingAgent(agent);
    setEditedPrompt(agent.system_prompt || "");
    setEditedDescription(agent.description || "");
  };

  const handleSave = async () => {
    if (!editingAgent) return;
    setIsSaving(true);
    try {
      await updateAiAgent(editingAgent.id, {
        system_prompt: editedPrompt,
        description: editedDescription,
      });
      setAgents((prev) =>
        prev.map((a) =>
          a.id === editingAgent.id ? { ...a, system_prompt: editedPrompt, description: editedDescription } : a,
        ),
      );
      setEditingAgent(null);
      toast.success("System prompts and agent configurations updated successfully.");
    } catch (error: any) {
      toast.error("Failed to update system prompts. Check syntax or permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="space-y-8 animate-pulse p-4 md:p-6">
        <Skeleton className="h-10 w-64 rounded-xl bg-muted/40" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-muted/40" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl bg-muted/40" />
          ))}
        </div>
      </div>
    );

  const totalSessions = Object.values(stats).reduce((sum, s) => sum + s.total_sessions, 0);
  const activeSessions = Object.values(stats).reduce((sum, s) => sum + s.active_sessions, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-4 md:p-6">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/10 p-6 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-foreground">
            <Cpu className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">AI Agents Swarm Control</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage system prompts, monitor active message threads, and toggle operational availability.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadAgents}
          className="rounded-lg h-10 px-4 text-xs font-semibold gap-2 shadow-sm bg-background/50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Synchronize System Registry
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Total Configured Agents",
            val: agents.length,
            icon: Bot,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          },
          {
            label: "Total Persistent Sessions",
            val: totalSessions,
            icon: MessageSquare,
            color: "text-purple-500",
            bg: "bg-purple-500/10",
          },
          {
            label: "Live Chat Channels",
            val: activeSessions,
            icon: Zap,
            color: "text-amber-500",
            bg: "bg-amber-500/10",
          },
        ].map((stat, i) => (
          <Card
            key={i}
            className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all shadow-sm"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center border border-white/5 shadow-inner shrink-0",
                    stat.bg,
                  )}
                >
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight mt-0.5">{stat.val}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent Registry Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => {
          const agentStats = stats[agent.agent_key] || { total_sessions: 0, active_sessions: 0 };
          const isActive = agent.is_active;

          return (
            <Card
              key={agent.id}
              className={cn(
                "rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl transition-all hover:shadow-md flex flex-col shadow-sm",
                !isActive && "opacity-60 bg-muted/10 border-dashed",
              )}
            >
              <div
                className="h-1.5 w-full shrink-0 rounded-t-2xl"
                style={{ background: `linear-gradient(to right, ${agent.color || "var(--primary)"}, transparent)` }}
              />
              <CardHeader className="p-6 pb-2">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="h-12 w-12 rounded-xl border border-white/5 flex items-center justify-center shadow-inner shrink-0"
                    style={{ backgroundColor: agent.bg_color || "rgba(var(--primary-rgb), 0.1)" }}
                  >
                    <Bot className="h-6 w-6" style={{ color: agent.color || "var(--primary)" }} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={isActive ?? true}
                      onCheckedChange={() => handleToggleActive(agent)}
                      className="data-[state=checked]:bg-primary"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Edit configurations"
                      className="h-9 w-9 rounded-lg hover:bg-muted"
                      onClick={() => handleEdit(agent)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-lg font-bold tracking-tight truncate">{agent.name}</CardTitle>
                <p className="text-[11px] font-mono text-muted-foreground mt-1">Key: {agent.agent_key}</p>
              </CardHeader>
              <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between">
                <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px] mb-4">{agent.description}</p>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    {agent.expertise_areas?.slice(0, 3).map((area) => (
                      <Badge
                        key={area}
                        className="rounded bg-secondary text-secondary-foreground font-medium text-[10px] px-2 py-0.5 border-none"
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-border/40 grid grid-cols-2 gap-4 text-xs font-medium">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">
                        Total Threads
                      </span>
                      <span className="text-sm font-semibold">{agentStats.total_sessions} sessions</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">
                        Active Inboxes
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          agentStats.active_sessions > 0 ? "text-emerald-600" : "text-muted-foreground/40",
                        )}
                      >
                        {agentStats.active_sessions} active
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Prompt Configuration Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={() => setEditingAgent(null)}>
        <DialogContent className="max-w-3xl rounded-xl border border-border bg-background p-0 overflow-hidden shadow-xl">
          <div className="p-6 sm:p-8 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-3">
                <Settings2 className="h-6 w-6 text-primary" />
                <div className="space-y-0.5 text-left">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                    Agent Engine Parameterization
                  </p>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    Configure Agent: {editingAgent?.name}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">User Facing Description / Briefing</label>
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="rounded-lg border bg-card text-xs p-3 leading-relaxed resize-none focus:border-primary/40 transition-all"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground">System Logic Prompt Configuration</label>
                  <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                    {editedPrompt.length} Characters
                  </Badge>
                </div>
                <div className="relative">
                  <Terminal className="absolute top-3.5 left-4 h-4 w-4 text-muted-foreground opacity-40" />
                  <Textarea
                    value={editedPrompt}
                    onChange={(e) => setEditedPrompt(e.target.value)}
                    className="font-mono text-xs bg-muted/60 text-foreground rounded-lg min-h-[300px] p-4 pl-10 border focus:border-primary transition-all"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal mt-1">
                  Changes committed here alter LLM instruction boundaries instantly across live student and employer
                  chat interfaces.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/60">
                <Button
                  variant="outline"
                  onClick={() => setEditingAgent(null)}
                  className="h-10 px-4 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="h-10 px-5 rounded-lg text-xs font-semibold relative overflow-hidden flex items-center gap-2"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  {isSaving ? "Saving changes..." : "Save System Prompt"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
