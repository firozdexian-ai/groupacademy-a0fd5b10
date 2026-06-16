import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listAiAgentsForListTab, getUgcMetadata, updateAiAgent } from "@/domains/agents/repo/agentsRepo";
import { Search, Activity, Cpu, Loader2, Save, Ban, Coins, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trackError } from "@/lib/errorTracking";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";

/**
 * Group Academy — Career Guidance System: Agent Categorization Directory List Tab Component
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/command-center?tab=fleet (Fleet Configuration Workspace Node View)
 * Operations Mode: Automated Efficiency listing workspace filtering system agents across permissions boundaries.
 */

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  agentTypeFilter?: string | string[];
  audienceFilter?: string;
  emptyHint?: string;
}

interface AgentRow {
  id: string;
  agent_key: string;
  name: string;
  description: string;
  agent_type: string;
  audience: string;
  visibility: string;
  is_active: boolean;
  total_conversations: number;
  credit_cost: number | null;
  message_credit_cost: number | null;
  model: string | null;
  owner_kind: string | null;
  owner_id: string | null;
  connection_fee: number | null;
  marketplace_status: string | null;
}

export function AgentListTab({ title, description, icon: Icon, agentTypeFilter, audienceFilter, emptyHint }: Props) {
  const [rows, setRows] = useState<AgentRow[]>([]);
  const [editingFees, setEditingFees] = useState<Record<string, { connectionFee: string; msgCost: string }>>({});
  const [ugcOwners, setUgcOwners] = useState<Record<string, string>>({});
  const [ugcEarnings, setUgcEarnings] = useState<Record<string, number>>({});
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const isB2B = Array.isArray(agentTypeFilter) ? agentTypeFilter.includes("company") : agentTypeFilter === "company";
  const isUGC = Array.isArray(agentTypeFilter) ? agentTypeFilter.includes("ugc") : agentTypeFilter === "ugc";

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    listAiAgentsForListTab({ agentTypeFilter, audienceFilter })
      .then(async (data) => {
        if (active) {
          const typedData = data as AgentRow[];
          setRows(typedData);

          if (isUGC && typedData.length > 0) {
            const agentIds = typedData.map((a) => a.id);
            const ownerIds = typedData
              .filter((a) => a.owner_kind === "talent" && a.owner_id)
              .map((a) => a.owner_id as string);

            try {
              const { talents, earnings } = await getUgcMetadata(agentIds, ownerIds);

              const ownerMap: Record<string, string> = {};
              talents.forEach((t) => {
                if (t.full_name) ownerMap[t.id] = t.full_name;
              });

              const earningsMap: Record<string, number> = {};
              earnings.forEach((e) => {
                earningsMap[e.agent_id] = (earningsMap[e.agent_id] || 0) + (e.gross_credits || 0);
              });

              if (active) {
                setUgcOwners(ownerMap);
                setUgcEarnings(earningsMap);
              }
            } catch (err: any) {
              trackError("agent-list-tab-ugc-metadata-failure", { error: err.message });
            }
          }
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        trackError("agent-list-tab-fetch-failure", {
          error: (err as any)?.message || String(err),
          agentTypeFilter,
          audienceFilter,
        });
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [agentTypeFilter, audienceFilter, isUGC]);

  const handleSaveFees = async (id: string, connectionFee: number, msgCost: number) => {
    setIsUpdating(id);
    try {
      await updateAiAgent(id, { connection_fee: connectionFee, message_credit_cost: msgCost });
      toast.success("Billing rates updated successfully.");
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, connection_fee: connectionFee, message_credit_cost: msgCost } : r
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update billing rates.");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleForceUnpublish = async (id: string) => {
    if (!window.confirm("Are you sure you want to force unpublish this agent from the marketplace?")) return;
    setIsUpdating(id);
    try {
      await updateAiAgent(id, { marketplace_status: "rejected", visibility: "unlisted" });
      toast.success("Assistant profile successfully unpublished from the marketplace.");
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, marketplace_status: "rejected", visibility: "unlisted" } : r
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to unpublish agent.");
    } finally {
      setIsUpdating(null);
    }
  };

  const filtered = rows.filter(
    (r) => !search || (r.name + " " + r.agent_key).toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Dynamic Structural Header Block */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-muted/40 p-6 rounded-2xl border border-border/40 backdrop-blur-sm">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2.5 text-primary">
            <Icon className="h-6 w-6 shrink-0" />
            <h2 className="text-xl font-bold tracking-tight text-foreground truncate">{title}</h2>
          </div>
          <p className="text-xs text-muted-foreground/90 font-medium leading-relaxed">{description}</p>
        </div>
      </header>

      {/* Main Framework Filter Container */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="h-1 w-full bg-primary" />

        <CardHeader className="p-4 border-b border-border/40 bg-muted/20 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80 shrink-0">
            <Cpu className="h-4 w-4 text-primary" /> Assistant Profiles
          </CardTitle>
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assistants by name or key..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10 rounded-xl border border-border text-sm font-medium focus-visible:ring-1 focus-visible:ring-primary bg-background/80"
            />
          </div>
        </CardHeader>

        <CardContent className="p-5 flex-1 bg-background/50">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl border border-border/40 bg-muted/30" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-muted/10 border border-dashed border-border/60 rounded-xl space-y-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
                <Activity className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground text-center">
                {emptyHint ?? "No active agents found matching the selected parameters."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-background hover:bg-primary/[0.01] hover:border-primary/30 transition-all group animate-in fade-in duration-200"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-none truncate">
                        {a.name}
                      </h3>
                      <span className="font-mono text-[10px] font-semibold bg-muted px-2 py-0.5 rounded border border-border/50 text-muted-foreground shrink-0">
                        {a.agent_key}
                      </span>
                      {a.model && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-mono font-medium bg-blue-500/10 hover:bg-blue-500/10 text-blue-700 border-none px-2 rounded"
                        >
                          {a.model}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground/80 font-medium leading-relaxed line-clamp-2">
                      {a.description}
                    </p>

                    {isB2B && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium mt-1">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        <span>Connection Fee: <strong className="text-foreground">{a.connection_fee ?? 0} Credits</strong></span>
                        <span className="text-muted-foreground/40">|</span>
                        <span>Message Cost: <strong className="text-foreground">{a.message_credit_cost ?? 0} Credits</strong></span>
                      </div>
                    )}

                    {isUGC && (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground font-medium mt-1">
                        <div className="flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-blue-500" />
                          <span>Creator: <strong className="text-foreground">{ugcOwners[a.owner_id || ""] || "Platform Talent"}</strong></span>
                        </div>
                        <span className="text-muted-foreground/30">|</span>
                        <div className="flex items-center gap-1">
                          <Coins className="h-3.5 w-3.5 text-amber-500" />
                          <span>Gross Earnings: <strong className="text-foreground">{(ugcEarnings[a.id] || 0).toLocaleString()} Credits</strong></span>
                        </div>
                        {a.marketplace_status && (
                          <>
                            <span className="text-muted-foreground/30">|</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0 border-none rounded-full",
                                a.marketplace_status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-700"
                                  : a.marketplace_status === "pending"
                                  ? "bg-amber-500/10 text-amber-700"
                                  : "bg-red-500/10 text-red-700"
                              )}
                            >
                              Status: {a.marketplace_status}
                            </Badge>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-wrap shrink-0 xl:justify-end sm:self-start xl:self-center">
                    {isB2B && (
                      <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-border/50">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase px-1">Access:</span>
                          <Input
                            type="number"
                            step="0.05"
                            min="0"
                            disabled={isUpdating === a.id}
                            className="h-6 w-14 text-[10px] px-1 rounded bg-background border border-border/80 text-center font-mono focus-visible:ring-1 focus-visible:ring-primary"
                            value={editingFees[a.id]?.connectionFee ?? (a.connection_fee ?? 0).toString()}
                            onChange={(e) =>
                              setEditingFees((prev) => ({
                                ...prev,
                                [a.id]: {
                                  connectionFee: e.target.value,
                                  msgCost: prev[a.id]?.msgCost ?? (a.message_credit_cost ?? 0).toString(),
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-bold text-muted-foreground uppercase px-1">Msg:</span>
                          <Input
                            type="number"
                            step="0.05"
                            min="0"
                            disabled={isUpdating === a.id}
                            className="h-6 w-14 text-[10px] px-1 rounded bg-background border border-border/80 text-center font-mono focus-visible:ring-1 focus-visible:ring-primary"
                            value={editingFees[a.id]?.msgCost ?? (a.message_credit_cost ?? 0).toString()}
                            onChange={(e) =>
                              setEditingFees((prev) => ({
                                ...prev,
                                [a.id]: {
                                  connectionFee: prev[a.id]?.connectionFee ?? (a.connection_fee ?? 0).toString(),
                                  msgCost: e.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isUpdating === a.id}
                          onClick={() => {
                            const cFeeStr = editingFees[a.id]?.connectionFee ?? (a.connection_fee ?? 0).toString();
                            const msgStr = editingFees[a.id]?.msgCost ?? (a.message_credit_cost ?? 0).toString();
                            handleSaveFees(a.id, parseFloat(cFeeStr) || 0, parseFloat(msgStr) || 0);
                          }}
                          className="h-6 rounded text-[9px] font-bold px-2 hover:bg-muted text-primary flex items-center gap-1"
                        >
                          {isUpdating === a.id ? (
                            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          <span>Save</span>
                        </Button>
                      </div>
                    )}

                    {isUGC && a.marketplace_status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isUpdating === a.id}
                        onClick={() => handleForceUnpublish(a.id)}
                        className="h-7 rounded-lg text-[10px] font-bold px-2.5 border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-700 transition-all flex items-center gap-1 shrink-0"
                      >
                        {isUpdating === a.id ? (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : (
                          <Ban className="h-3.5 w-3.5" />
                        )}
                        <span>Force Unpublish</span>
                      </Button>
                    )}

                    <div className="flex items-center gap-1.5">
                      {a.audience && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-border font-semibold text-[10px] uppercase tracking-wide bg-background text-muted-foreground px-2.5"
                        >
                          {a.audience}
                        </Badge>
                      )}
                      {a.visibility && (
                        <Badge
                          variant="outline"
                          className="rounded-full border-border font-semibold text-[10px] uppercase tracking-wide bg-background text-muted-foreground px-2.5"
                        >
                          {a.visibility}
                        </Badge>
                      )}
                      <Badge
                        variant="outline"
                        className="rounded-full font-bold text-[10px] uppercase tracking-wide px-2.5 py-0.5 border-none bg-amber-500/10 text-amber-700"
                      >
                        {(a.total_conversations ?? 0).toLocaleString()} conversations
                      </Badge>
                      <Badge
                        className={cn(
                          "rounded-full font-bold text-[10px] uppercase tracking-wide px-2.5 py-0.5 border-none",
                          a.is_active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground/60",
                        )}
                      >
                        {a.is_active ? "Active" : "Offline"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentListTab;



