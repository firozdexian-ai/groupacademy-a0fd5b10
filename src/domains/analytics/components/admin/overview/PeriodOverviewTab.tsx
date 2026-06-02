/**
 * Period Overview — Hardened Monthly/Quarterly Performance Component
 * Interfaces with the high-performance bulk analytics RPC engine.
 * Completely aligned with 2024 SaaS design system typography standards.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { analystMetricsBulk } from "@/domains/analytics/repo/analyticsRepo";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  CreditCard,
  DollarSign,
  Briefcase,
  FileText,
  Building2,
  BookOpen,
  Bot,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowDownRight,
  ArrowUpRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PeriodMode, Period, currentPeriod, listPeriods, parseToken, previousPeriod, shiftPeriod } from "./period";
import { cn } from "@/lib/utils";

const ROWS = [
  { key: "talents_count", label: "New Talents", icon: Users, format: "number" },
  { key: "transactions_count", label: "Transactions Processed", icon: CreditCard, format: "number" },
  { key: "transactions_revenue_bdt", label: "Gross Revenue", icon: DollarSign, format: "currency" },
  { key: "jobs_count", label: "Jobs Posted", icon: Briefcase, format: "number" },
  { key: "job_applications_count", label: "Applications Received", icon: FileText, format: "number" },
  { key: "companies_count", label: "New Employer Profiles", icon: Building2, format: "number" },
  { key: "enrollments_count", label: "Course Enrollments", icon: BookOpen, format: "number" },
  { key: "agent_sessions_count", label: "AI Agent Sessions", icon: Bot, format: "number" },
] as const;

export function PeriodOverviewTab({ mode }: { mode: PeriodMode }) {
  const [params, setParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [current, setCurrent] = useState<Record<string, number>>({});
  const [previous, setPrevious] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const cur: Period = useMemo(() => {
    return parseToken(mode, params.get("p")) ?? currentPeriod(mode);
  }, [mode, params]);

  const prev = useMemo(() => previousPeriod(cur, mode), [cur, mode]);
  const choices = useMemo(() => listPeriods(mode, mode === "month" ? 24 : 12), [mode]);

  const setPeriod = useCallback(
    (p: Period) => {
      const next = new URLSearchParams(params);
      next.set("p", p.token);
      setParams(next, { replace: true });
    },
    [params, setParams],
  );

  const load = useCallback(
    async (manual = false) => {
      if (manual) setIsRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const metricKeys = ROWS.map((r) => r.key);
        const data = await analystMetricsBulk({
          metrics: metricKeys as unknown as string[],
          periods: [
            { from: cur.from.toISOString(), to: cur.to.toISOString(), label: "current" },
            { from: prev.from.toISOString(), to: prev.to.toISOString(), label: "previous" },
          ],
        });

        if (data) {
          const curData: Record<string, number> = {};
          const prevData: Record<string, number> = {};

          data.forEach((row) => {
            if (row.period_label === "current") curData[row.metric] = Number(row.value);
            else prevData[row.metric] = Number(row.value);
          });

          setCurrent(curData);
          setPrevious(prevData);
        }
      } catch (err: any) {
        console.error("[Digital Workforce Anomaly] Bulk analytical query failed:", err);
        setError("We hit a snag loading these comparative metrics. Our operations team has been notified.");

        // Push error to the platform event table for tracking
        try {
          await supabase.from("platform_events").insert({
            event_kind: "period_metrics_fault",
            subject_kind: "analytics",
            payload: { severity: "warning", message: err?.message, mode, token: cur.token },
          });
        } catch (innerErr) {
          console.error("Critical: Telemetry loop disconnected:", innerErr);
        }
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [cur.from, cur.to, prev.from, prev.to, mode, cur.token],
  );

  useEffect(() => {
    load();
  }, [load]);

  const formatValue = (val: number, type: string) => {
    if (type === "currency") {
      return `৳${val.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`;
    }
    return val.toLocaleString("en-US");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Dynamic Comparative Action Controls Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-4 sm:p-6 rounded-2xl border border-border">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            {mode === "month" ? "Monthly" : "Quarterly"} Performance Review
          </span>
          <p className="text-sm font-medium text-muted-foreground">
            Comparing <span className="font-semibold text-foreground">{cur.label}</span> against{" "}
            <span className="font-semibold text-foreground">{prev.label}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous period"
            onClick={() => setPeriod(shiftPeriod(cur, mode, -1))}
            disabled={isRefreshing || loading}
            className="rounded-xl h-10 w-10 shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Select
            value={cur.token}
            disabled={loading}
            onValueChange={(v) => {
              const p = parseToken(mode, v);
              if (p) setPeriod(p);
            }}
          >
            <SelectTrigger className="h-10 w-full sm:w-[180px] rounded-xl font-medium text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {choices.map((p) => (
                <SelectItem key={p.token} value={p.token} className="text-xs">
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            aria-label="Next period"
            onClick={() => setPeriod(shiftPeriod(cur, mode, 1))}
            disabled={isRefreshing || loading}
            className="rounded-xl h-10 w-10 shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            aria-label="Refresh metric values"
            onClick={() => load(true)}
            disabled={isRefreshing || loading}
            className="rounded-xl h-10 w-10 shrink-0"
          >
            <RefreshCw className={cn("h-4 w-4 text-muted-foreground", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-3 text-sm text-destructive font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Cross-Period Delta Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {ROWS.map((row) => {
          const currentVal = current[row.key] ?? 0;
          const previousVal = previous[row.key] ?? 0;
          const deltaPct =
            previousVal === 0
              ? currentVal > 0
                ? 100
                : 0
              : Math.round(((currentVal - previousVal) / previousVal) * 100);
          const isPositive = deltaPct >= 0;
          const Icon = row.icon;

          return (
            <Card
              key={row.key}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-md"
            >
              <CardHeader className="p-5 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{row.label}</CardTitle>
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center border border-primary/10 text-primary bg-primary/5 shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 space-y-2.5">
                {loading ? (
                  <div className="space-y-2 pt-1">
                    <Skeleton className="h-7 w-20 rounded" />
                    <Skeleton className="h-4 w-28 rounded" />
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
                      {formatValue(currentVal, row.format)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-0.5">
                      <div
                        className={cn(
                          "flex items-center px-1.5 py-0.5 rounded text-2xs font-semibold border",
                          isPositive
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-destructive/10 text-destructive border-destructive/20",
                        )}
                      >
                        {isPositive ? (
                          <ArrowUpRight className="h-3 w-3 mr-0.5" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 mr-0.5" />
                        )}
                        <span>{Math.abs(deltaPct)}%</span>
                      </div>
                      <span className="text-2xs text-muted-foreground">
                        Prior period: {formatValue(previousVal, row.format)}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default PeriodOverviewTab;
