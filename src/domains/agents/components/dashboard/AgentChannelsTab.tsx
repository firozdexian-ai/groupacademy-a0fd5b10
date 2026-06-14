import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listAgentChannels } from "@/domains/agents/repo/agentsRepo";
import { Zap, Network, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { trackError } from "@/lib/errorTracking";

/**
 * Group Academy — Career Guidance System: Agent Integration Channels Sub-Panel
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/command-center?tab=channels (System Infrastructure Dashboard View)
 * Operations Mode: High-performance channel routing registry mapping webhooks, endpoints, and chat vectors.
 */

export function AgentChannelsTab() {
  const [rows, setRows] = useState<unknown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listAgentChannels()
      .then((data) => {
        if (active) {
          setRows(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        trackError("agent-channels-tab-fetch-failure", { error: err?.message || String(err) });
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Executive Overview Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-muted/40 p-6 rounded-2xl border border-border/40 backdrop-blur-sm">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 text-primary">
            <Zap className="h-6 w-6 text-amber-500 fill-amber-500/10" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Integration Channels</h2>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configure messaging protocols, webhooks, and automation triggers for conversational workers.
          </p>
        </div>
      </header>

      {/* Integration Registry Node Display */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600" />

        <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-muted-foreground/80">
            <Network className="h-4 w-4 text-amber-500" /> Authorized Integration Endpoints
          </CardTitle>
        </CardHeader>

        <CardContent className="p-5 flex-1 bg-background/50">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl border border-border/40 bg-muted/30" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-muted/10 border border-dashed border-border/60 rounded-xl space-y-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
                <Activity className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-muted-foreground text-center">
                No active configuration channels detected in this environment slot.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-background hover:bg-primary/[0.01] hover:border-primary/30 transition-all group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-none truncate">
                        {r.label}
                      </h3>
                      <span className="font-mono text-[10px] font-semibold bg-muted px-2 py-0.5 rounded border border-border/50 text-muted-foreground shrink-0">
                        {r.channel_key}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">{r.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 sm:self-center">
                    {r.direction && (
                      <Badge
                        variant="outline"
                        className="rounded-full border-border font-semibold text-[10px] uppercase tracking-wide bg-background text-muted-foreground px-2.5"
                      >
                        {r.direction}
                      </Badge>
                    )}
                    <Badge
                      className={cn(
                        "rounded-full font-bold text-[10px] uppercase tracking-wide px-2.5 py-0.5 border-none",
                        r.is_active ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground/60",
                      )}
                    >
                      {r.is_active ? "Online" : "Offline"}
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

export default AgentChannelsTab;


