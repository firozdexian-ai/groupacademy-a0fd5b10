/**
 * Talent Overview — Refactored for High Performance RPC
 * CTO Version: May 2026
 * Fixes: P2 (Sequential Query Storm & 5000-row scan)
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Briefcase, Globe, DatabaseZap, Activity, ShieldCheck, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Bucket {
  label: string;
  value: number;
}

export function TalentOverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["global-crm-overview-optimized"],
    queryFn: async () => {
      // P2: Single atomic RPC replaces ~9 sequential count queries + client-side reduce
      const { data: res, error } = await supabase.rpc("get_global_crm_overview");
      if (error) throw error;

      const mapToSortedArray = (obj: Record<string, number>) =>
        Object.entries(obj || {})
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

      return {
        total: res.total_talents || 0,
        onboarded: res.onboarded_count || 0,
        byCategory: mapToSortedArray(res.professions),
        byCountry: mapToSortedArray(res.countries),
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-[32px] bg-muted/40" />
        ))}
        <Skeleton className="col-span-4 h-96 rounded-[40px] bg-muted/40" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricTile
          label="Global Nodes"
          value={data.total}
          icon={Users}
          color="text-indigo-500"
          bg="bg-indigo-500/10"
        />
        <MetricTile
          label="Verified Mastery"
          value={data.onboarded}
          icon={ShieldCheck}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <MetricTile
          label="Active Markets"
          value={data.byCountry.length}
          icon={Globe}
          color="text-blue-500"
          bg="bg-blue-500/10"
        />
        <MetricTile
          label="System Pulse"
          value="Nominal"
          icon={Activity}
          color="text-fuchsia-500"
          bg="bg-fuchsia-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BreakdownCard title="Market Concentration" data={data.byCountry} icon={Globe} color="indigo" />
        <BreakdownCard title="Profession Mix" data={data.byCategory} icon={Briefcase} color="fuchsia" />
      </div>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 p-6 text-left group transition-all hover:border-primary/30">
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-3 shadow-inner",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">{label}</p>
          <p className="text-3xl font-black italic tracking-tighter text-foreground">{value.toLocaleString()}</p>
        </div>
      </div>
    </Card>
  );
}

function BreakdownCard({ title, data, icon: Icon, color }: any) {
  const max = Math.max(1, ...data.map((d: any) => d.value));
  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 p-8 text-left">
      <div className="flex items-center gap-3 mb-6">
        <Icon className={cn("h-5 w-5", color === "indigo" ? "text-indigo-500" : "text-fuchsia-500")} />
        <h3 className="text-sm font-black uppercase tracking-widest italic">{title}</h3>
      </div>
      <div className="space-y-4">
        {data.map((d: any) => (
          <div key={d.label} className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase truncate">
              <span className="truncate pr-4">{d.label}</span>
              <span>{d.value}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-1000",
                  color === "indigo" ? "bg-indigo-500" : "bg-fuchsia-500",
                )}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
