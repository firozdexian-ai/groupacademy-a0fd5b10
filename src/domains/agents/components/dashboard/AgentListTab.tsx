import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { listAiAgentsForListTab } from "@/domains/agents/repo/agentsRepo";
import { Search, Activity, Cpu, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trackError } from "@/lib/errorTracking";
import type { LucideIcon } from "lucide-react";

/**
 * Group Academy â€” Career Guidance System: Agent Categorization Directory List Tab Component
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

export function AgentListTab({ title, description, icon: Icon, agentTypeFilter, audienceFilter, emptyHint }: Props) {
  const [rows, setRows] = useState<unknown[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);

    listAiAgentsForListTab({ agentTypeFilter, audienceFilter })
      .then((data) => {
        if (active) {
          setRows(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        trackError("agent-list-tab-fetch-failure", {
          error: err?.message || String(err),
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
  }, [agentTypeFilter, audienceFilter]);

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
                  className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-background hover:bg-primary/[0.01] hover:border-primary/30 transition-all group"
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
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0 xl:justify-end sm:self-start xl:self-center">
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentListTab;


