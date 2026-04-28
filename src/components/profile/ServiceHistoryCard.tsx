import { useNavigate } from "react-router-dom";
import { ClipboardCheck, Mic, DollarSign, Briefcase, ArrowRight, Loader2, Zap, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useServiceHistory, ServiceHistoryItem } from "@/hooks/useServiceHistory";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Service Ledger
 * CTO Reference: Authoritative node for historical service engagement and scoring.
 */

const SERVICE_CONFIG: Record<
  ServiceHistoryItem["type"],
  {
    icon: any;
    color: string;
    bgColor: string;
    label: string;
  }
> = {
  career_assessment: {
    icon: Target,
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/10",
    label: "NEURAL_ASSESSMENT",
  },
  mock_interview: {
    icon: Mic,
    color: "text-primary",
    bgColor: "bg-primary/10",
    label: "AI_VIRTUAL_INTERVIEW",
  },
  salary_analysis: {
    icon: DollarSign,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    label: "CAPITAL_BENCHMARK",
  },
  portfolio: {
    icon: Briefcase,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    label: "BRAND_PROVISIONING",
  },
};

export function ServiceHistoryCard() {
  const navigate = useNavigate();
  const { history, isLoading } = useServiceHistory();

  if (isLoading) {
    return (
      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30">
        <CardContent className="py-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">
            Syncing_Ledger...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) return null;

  // PROTOCOL: Render top 5 strategic artifacts
  const recentHistory = history.slice(0, 5);

  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in duration-700">
      <CardHeader className="p-6 border-b border-border/10 bg-muted/5">
        <div className="space-y-1">
          <CardTitle className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" /> Service_Artifacts
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Institutional engagement and proficiency logs
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-3">
        {recentHistory.map((item) => {
          const config = SERVICE_CONFIG[item.type];
          const Icon = config.icon;

          return (
            <div
              key={item.id}
              className="group flex items-center gap-4 p-4 rounded-[22px] bg-muted/20 border-2 border-transparent hover:border-primary/20 hover:bg-background transition-all cursor-pointer active:scale-[0.98]"
              onClick={() => navigate(item.href)}
            >
              {/* NODE ICON */}
              <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", config.bgColor)}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>

              {/* DATA PAYLOAD */}
              <div className="flex-1 min-w-0 text-left">
                <p className="font-black text-sm uppercase italic tracking-tight text-foreground truncate leading-none mb-2">
                  {item.title}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest italic">
                    {formatDistanceToNow(new Date(item.date), { addSuffix: true })}
                  </span>
                  <Badge
                    variant={item.status === "completed" ? "default" : "secondary"}
                    className={cn(
                      "text-[8px] font-black italic px-2 py-0 border-none rounded-sm uppercase tracking-tighter",
                      item.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600",
                    )}
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>

              {/* METRIC NODE */}
              {item.score !== undefined && (
                <div className="flex flex-col items-end gap-1 mr-2">
                  <span className="text-[8px] font-black text-muted-foreground/40 uppercase leading-none">Yield</span>
                  <span className="text-sm font-black tabular-nums tracking-tighter text-primary">{item.score}%</span>
                </div>
              )}

              <div className="h-10 w-10 rounded-full flex items-center justify-center text-muted-foreground/20 group-hover:text-primary transition-colors">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
