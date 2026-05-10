import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Users, Mail, Building2, Target, UserCheck, ArrowUpRight, Zap } from "lucide-react";
import {
  IR_CONFIG,
  formatUSD,
  creditsToUsd,
  calculateServiceTargets,
  calculateAutoKPIs,
  type ServiceMix,
} from "@/lib/irConfig";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Stakeholder Capital Dashboard (IRDashboard)
 * CTO Reference: Authoritative telemetry hub for fundraising and growth KPIs.
 * 2024 Standard: Executive Logic geometry with reinforced interaction analysis.
 */

interface IRDashboardProps {
  onNavigate: (tab: string) => void;
}

export function IRDashboard({ onNavigate }: IRDashboardProps) {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // FETCH PROTOCOLS
  const { data: target, isLoading: targetLoading } = useQuery({
    queryKey: ["ir-target", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_monthly_targets")
        .select("*")
        .eq("month", currentMonth)
        .maybeSingle();
      if (error && error.code !== "PGRST116") throw error;
      return data || null;
    },
  });

  const { data: creditUsage, isLoading: creditsLoading } = useQuery({
    queryKey: ["ir-credit-usage", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("amount, service_type, talent_id")
        .in("transaction_type", ["service_usage", "usage"])
        .gte("created_at", startOfMonth.toISOString());
      if (error) throw error;

      const totalCredits = data?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      const byService: Record<string, number> = {};
      data?.forEach((t) => {
        if (t.service_type) byService[t.service_type] = (byService[t.service_type] || 0) + Math.abs(t.amount);
      });
      const activeTalents = new Set(data?.map((d) => d.talent_id).filter(Boolean)).size;
      return { totalCredits, byService, activeTalents };
    },
  });

  // KPI CALIBRATION
  const mrrTarget = Number(target?.mrr_target_usd) || 0;
  const totalCreditsTarget = mrrTarget * IR_CONFIG.USD_TO_CREDITS;
  const currentCredits = creditUsage?.totalCredits || 0;
  const currentMRR = creditsToUsd(currentCredits);
  const progressPercent = totalCreditsTarget > 0 ? Math.min(100, (currentCredits / totalCreditsTarget) * 100) : 0;
  const serviceMix = (target?.service_mix as ServiceMix) || (IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix);
  const serviceTargets = calculateServiceTargets(mrrTarget, serviceMix);
  const autoKPIs = calculateAutoKPIs(mrrTarget);

  if (targetLoading || creditsLoading) return <SkeletonGrid />;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* EXECUTIVE COMMAND HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <TrendingUp className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Intelligence Hub</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Strategic Growth Registry & Fundraising Telemetry
          </p>
        </div>
        <Button
          onClick={() => onNavigate("ir-targets")}
          className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg shadow-primary/20"
        >
          <Target className="h-4 w-4" /> {target ? "Recalibrate Targets" : "Initialize Targets"}
        </Button>
      </header>

      {/* PRIMARY KPI NODES */}
      <div className="grid gap-6 md:grid-cols-4">
        <KPICard
          title="MRR Target"
          value={formatUSD(mrrTarget)}
          icon={Target}
          subtext={`${formatUSD(autoKPIs.arrUsd)} ARR Target`}
        />
        <KPICard
          title="Current MRR"
          value={formatUSD(currentMRR)}
          icon={Zap}
          subtext={`${progressPercent.toFixed(1)}% of Protocol`}
          variant="accent"
        />
        <KPICard title="Total Talents" value="2,211" icon={Users} subtext="Registered Nodes" />
        <KPICard
          title="Active Nodes"
          value={creditUsage?.activeTalents || 0}
          icon={UserCheck}
          subtext="Credit Utilization"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-stretch">
        {/* MRR PROGRESS TRACKER */}
        <Card className="lg:col-span-2 rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl flex flex-col h-full">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
          <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-black uppercase italic tracking-tighter text-emerald-600">
                  Monetization Pulse
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                  Credit-to-USD conversion protocol active
                </CardDescription>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black italic px-3 py-1 shadow-sm">
                Q2_TARGET_ALPHA
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-10 flex-1 flex flex-col justify-center space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <p className="text-6xl md:text-7xl font-black italic tracking-tighter text-foreground drop-shadow-sm">
                  {formatUSD(currentMRR)}
                </p>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/30 w-fit px-3 py-1 rounded-md border border-border/20">
                  Verified Monthly Revenue
                </p>
              </div>
              <p className="text-2xl md:text-3xl font-black text-muted-foreground/40 italic text-right">
                <span className="text-[10px] block font-bold uppercase tracking-widest not-italic text-muted-foreground/30 mb-1">
                  Target
                </span>
                {formatUSD(mrrTarget)}
              </p>
            </div>

            <div className="space-y-5 bg-muted/5 p-6 rounded-[24px] border border-border/10 shadow-inner">
              <Progress
                value={progressPercent}
                className="h-5 rounded-full bg-muted/30 shadow-inner border border-border/5"
              />
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 italic">
                  Delta: {(totalCreditsTarget - currentCredits).toLocaleString()} Credits
                </p>
                <Badge
                  variant="outline"
                  className="font-black text-[9px] border-2 border-emerald-500/30 text-emerald-600 uppercase italic px-3 py-1 bg-emerald-500/5"
                >
                  {progressPercent.toFixed(0)}% SYNCHRONIZED
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QUICK ACCESS CHANNELS */}
        <div className="flex flex-col justify-between h-full gap-4">
          <ActionNode icon={Building2} label="VC Firm Registry" count="12 Firms" onClick={() => onNavigate("ir-vcs")} />
          <ActionNode
            icon={Users}
            label="Stakeholder Map"
            count="48 Investors"
            onClick={() => onNavigate("ir-investors")}
          />
          <ActionNode icon={Mail} label="Outreach Registry" count="Sent Logs" onClick={() => onNavigate("ir-emails")} />
        </div>
      </div>

      {/* SERVICE PERFORMANCE TERMINAL */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
        <CardHeader className="p-8 border-b border-border/10 bg-muted/5">
          <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-primary">
            Neural Service Distribution
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest italic mt-1 text-muted-foreground/60">
            Real-time resource utilization against strategic benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            {serviceTargets.map((service) => {
              const actualUsage = creditUsage?.byService?.[service.service] || 0;
              const serviceProgress =
                service.creditTarget > 0 ? Math.min(100, (actualUsage / service.creditTarget) * 100) : 0;
              return (
                <div
                  key={service.service}
                  className="p-6 rounded-[24px] border-2 border-border/20 bg-background/50 group hover:border-primary/30 hover:bg-primary/5 transition-all shadow-sm"
                >
                  <div className="flex justify-between items-start mb-5">
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-black uppercase italic tracking-[0.2em] group-hover:text-primary transition-colors">
                        {service.label}
                      </p>
                      <p className="text-xs font-mono font-bold text-muted-foreground/70">
                        {actualUsage.toLocaleString()} / {service.creditTarget.toLocaleString()} CR
                      </p>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-none font-black italic text-[9px] px-2.5 py-1">
                      {serviceProgress.toFixed(0)}%
                    </Badge>
                  </div>
                  <Progress value={serviceProgress} className="h-2 bg-muted/30 border border-border/10 shadow-inner" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ATOMIC SUB-COMPONENTS
function KPICard({ title, value, icon: Icon, subtext, variant = "default" }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-md shadow-xl overflow-hidden group hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic group-hover:text-foreground transition-colors">
          {title}
        </p>
        <Icon
          className={cn(
            "h-5 w-5 transition-transform group-hover:scale-110",
            variant === "accent" ? "text-primary fill-primary/20" : "text-muted-foreground/40",
          )}
        />
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div
          className={cn(
            "text-4xl font-black italic tracking-tighter leading-none mb-3",
            variant === "accent" && "text-primary",
          )}
        >
          {value}
        </div>
        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function ActionNode({ icon: Icon, label, count, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full h-full flex flex-row items-center gap-5 p-6 md:p-8 rounded-[32px] border-2 border-border/40 bg-card/30 hover:bg-primary/5 hover:border-primary/40 hover:shadow-xl transition-all group shadow-md backdrop-blur-md"
    >
      <div className="h-14 w-14 rounded-2xl bg-background flex items-center justify-center border-2 border-border/20 group-hover:rotate-6 group-hover:border-primary/30 transition-all shadow-sm shrink-0">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="text-left flex-1 min-w-0">
        <p className="font-black text-sm uppercase italic tracking-widest leading-tight truncate group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-1.5 truncate">
          {count}
        </p>
      </div>
      <ArrowUpRight className="ml-auto h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 group-hover:-translate-y-1 group-hover:translate-x-1" />
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="space-y-8 p-4 md:p-6 animate-pulse">
      <Skeleton className="h-32 w-full rounded-[40px] bg-muted/40" />
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-[32px] bg-muted/40" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[400px] lg:col-span-2 rounded-[40px] bg-muted/40" />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-full rounded-[32px] bg-muted/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
