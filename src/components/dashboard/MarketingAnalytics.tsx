import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  TrendingUp,
  MousePointerClick,
  Share2,
  Briefcase,
  BookOpen,
  Activity,
  ShieldCheck,
  Globe,
} from "lucide-react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

/**
 * GroUp Academy: Marketing Performance Intelligence
 * CTO Reference: Unified telemetry for Recruitment and Academy content.
 */

interface AnalyticsRecord {
  source: string;
  count: number;
}

interface AnalyticsData {
  jobClicks: AnalyticsRecord[];
  jobShares: AnalyticsRecord[];
  contentClicks: AnalyticsRecord[];
  contentShares: AnalyticsRecord[];
  totals: {
    jobClicks: number;
    jobShares: number;
    contentClicks: number;
    contentShares: number;
  };
}

const CHART_COLORS = ["#0062ff", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

const DATE_RANGES = [
  { label: "Temporal Frame: 7D", value: "7" },
  { label: "Temporal Frame: 30D", value: "30" },
  { label: "Temporal Frame: 90D", value: "90" },
];

export function MarketingAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30");
  const [activeCategory, setActiveCategory] = useState("jobs");

  useEffect(() => {
    loadExecutiveTelemetry();
  }, [dateRange]);

  const loadExecutiveTelemetry = async () => {
    setLoading(true);
    try {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      const endDate = endOfDay(new Date());

      const [jobClicksRes, jobSharesRes, contentClicksRes, contentSharesRes] = await Promise.all([
        supabase
          .from("job_analytics")
          .select("source")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
        supabase
          .from("job_share_logs")
          .select("channel")
          .gte("shared_at", startDate.toISOString())
          .lte("shared_at", endDate.toISOString()),
        supabase
          .from("content_analytics")
          .select("source")
          .gte("clicked_at", startDate.toISOString())
          .lte("clicked_at", endDate.toISOString()),
        supabase
          .from("content_share_logs")
          .select("channel")
          .gte("shared_at", startDate.toISOString())
          .lte("shared_at", endDate.toISOString()),
      ]);

      const aggregate = (arr: any[], field: string): AnalyticsRecord[] => {
        const counts = arr.reduce(
          (acc, item) => {
            const val = item[field] || "Direct/Organic";
            acc[val] = (acc[val] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>,
        );

        return Object.entries(counts)
          .map(([name, count]) => ({ source: name, count: Number(count) }))
          .sort((a, b) => b.count - a.count);
      };

      setData({
        jobClicks: aggregate(jobClicksRes.data || [], "source"),
        jobShares: aggregate(jobSharesRes.data || [], "channel"),
        contentClicks: aggregate(contentClicksRes.data || [], "source"),
        contentShares: aggregate(contentSharesRes.data || [], "channel"),
        totals: {
          jobClicks: jobClicksRes.data?.length || 0,
          jobShares: jobSharesRes.data?.length || 0,
          contentClicks: contentClicksRes.data?.length || 0,
          contentShares: contentSharesRes.data?.length || 0,
        },
      });
    } catch (error) {
      console.error("Telemetry Fault:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLoadingSkeleton />;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Activity className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Market Intel</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Cross-Channel Conversion Radar
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-56 h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50 shadow-inner">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-2 shadow-2xl">
              {DATE_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value} className="font-bold">
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={loadExecutiveTelemetry}
            className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all"
          >
            <RefreshCw className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="bg-muted/30 backdrop-blur-md rounded-[24px] border-2 border-border/40 p-1.5 mb-8 w-full max-w-lg">
          <TabsTrigger
            value="jobs"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 py-3"
          >
            <Briefcase className="w-4 h-4" /> Recruitment
          </TabsTrigger>
          <TabsTrigger
            value="content"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 py-3"
          >
            <BookOpen className="w-4 h-4" /> Academy
          </TabsTrigger>
        </TabsList>

        {/* RECRUITMENT TAB */}
        <TabsContent value="jobs" className="space-y-8 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Recruitment Traffic" sub="Origin source of candidate clicks">
              <SourceBarChart data={data?.jobClicks || []} color="#0062ff" />
            </ChartCard>
            <ChartCard title="Job Distribution" sub="Multi-platform sharing telemetry">
              <SourcePieChart data={data?.jobShares.map((s) => ({ name: s.source, value: s.count })) || []} />
            </ChartCard>
          </div>
          <SummaryBadgeRow totalClicks={data?.totals.jobClicks || 0} totalShares={data?.totals.jobShares || 0} />
        </TabsContent>

        {/* ACADEMY TAB - NOW FULLY IMPLEMENTED */}
        <TabsContent value="content" className="space-y-8 animate-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Course Discovery" sub="How learners find our curriculum">
              <SourceBarChart data={data?.contentClicks || []} color="#10b981" />
            </ChartCard>
            <ChartCard title="Academy Vitality" sub="Social sharing of course content">
              <SourcePieChart data={data?.contentShares.map((s) => ({ name: s.source, value: s.count })) || []} />
            </ChartCard>
          </div>
          <SummaryBadgeRow
            totalClicks={data?.totals.contentClicks || 0}
            totalShares={data?.totals.contentShares || 0}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryBadgeRow({ totalClicks, totalShares }: { totalClicks: number; totalShares: number }) {
  return (
    <div className="flex flex-wrap gap-4">
      <Badge className="bg-primary/10 text-primary border-none font-black text-xs px-6 py-3 italic gap-2 rounded-full">
        <MousePointerClick className="h-4 w-4" /> {totalClicks} PULSE CLICKS
      </Badge>
      <Badge className="bg-green-500/10 text-green-600 border-none font-black text-xs px-6 py-3 italic gap-2 rounded-full">
        <Share2 className="h-4 w-4" /> {totalShares} SOCIAL SHARES
      </Badge>
    </div>
  );
}

function ChartCard({ title, sub, children }: any) {
  return (
    <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
      <CardHeader className="p-8 border-b border-border/10 bg-muted/10 text-left">
        <CardTitle className="text-lg font-black uppercase tracking-tighter italic">{title}</CardTitle>
        <CardDescription className="text-[10px] font-bold uppercase tracking-widest">{sub}</CardDescription>
      </CardHeader>
      <CardContent className="p-8">{children}</CardContent>
    </Card>
  );
}

function SourceBarChart({ data, color }: { data: any[]; color: string }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/20" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          dataKey="source"
          type="category"
          tick={{ fontSize: 10, fontWeight: 900 }}
          width={100}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--primary)/0.05)" }}
          contentStyle={{ borderRadius: "16px", border: "2px solid hsl(var(--border))", fontWeight: 800 }}
        />
        <Bar dataKey="count" fill={color} radius={[0, 8, 8, 0]} barSize={20} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function SourcePieChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: "16px", border: "2px solid hsl(var(--border))", fontWeight: 800 }} />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-10 animate-pulse p-8">
      <Skeleton className="h-32 w-full rounded-[40px]" />
      <Skeleton className="h-16 w-1/3 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-80 w-full rounded-[40px]" />
        <Skeleton className="h-80 w-full rounded-[40px]" />
      </div>
    </div>
  );
}
