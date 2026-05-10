import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, AlertTriangle, Target, ArrowUpRight, Activity, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// In a real implementation, this pulls from platform_events or agent_chat_sessions
const MOCK_ANOMALIES = [
  {
    id: "evt_001",
    type: "system_error",
    agent: "Agent Manager",
    title: "Verification Sweeper Fault",
    description: "cron-verification-sweeper threw TypeError on execution. Gig loops blocked.",
    severity: "critical",
    time: "2 mins ago",
    icon: ShieldAlert,
  },
  {
    id: "evt_002",
    type: "b2b_lead",
    agent: "Riya (Companies)",
    title: "High-Intent Employer Unlock",
    description: "Company 'Apex Financial' completed 5 profile unlocks today. Upgrade potential.",
    severity: "opportunity",
    time: "14 mins ago",
    icon: Target,
  },
  {
    id: "evt_003",
    type: "outreach_block",
    agent: "Company Outreach Exec",
    title: "Outreach Queued (Quiet Hours)",
    description: "14 B2B messages intercepted by outreach_can_send soft block.",
    severity: "warning",
    time: "1 hour ago",
    icon: AlertTriangle,
  },
];

export function AgentAnomalyFeed() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-[40px] border-2 border-primary/20 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-full relative">
      {/* Pulsing indicator for active anomalies */}
      <div className="absolute top-0 right-0 p-8">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
        </span>
      </div>

      <div className="h-1.5 w-full bg-gradient-to-r from-destructive via-orange-500 to-primary" />

      <CardHeader className="p-8 pb-4 border-b border-border/10 bg-muted/10">
        <CardTitle className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-3">
          <Bot className="h-5 w-5 text-primary" /> Agent Anomaly Feed
        </CardTitle>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 italic">
          Triaging automated interventions
        </p>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="divide-y divide-border/10 flex-1 overflow-y-auto max-h-[300px]">
          {MOCK_ANOMALIES.map((anomaly) => (
            <div key={anomaly.id} className="p-6 hover:bg-muted/10 transition-colors group">
              <div className="flex gap-4">
                <div
                  className={cn(
                    "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border-2",
                    anomaly.severity === "critical"
                      ? "bg-destructive/10 border-destructive/20 text-destructive"
                      : anomaly.severity === "warning"
                        ? "bg-orange-500/10 border-orange-500/20 text-orange-500"
                        : "bg-primary/10 border-primary/20 text-primary",
                  )}
                >
                  <anomaly.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">{anomaly.title}</p>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      {anomaly.time}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed">{anomaly.description}</p>
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-sm">
                      {anomaly.agent}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-muted/5 mt-auto border-t border-border/10">
          <Button
            onClick={() => navigate("/dashboard/chat")}
            className="w-full h-12 rounded-xl justify-between font-black uppercase text-[10px] tracking-[0.2em] px-6 shadow-lg hover:shadow-primary/20 transition-all"
          >
            Enter Agent OS Chat <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
