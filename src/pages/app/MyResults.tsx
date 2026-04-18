import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  Mic,
  DollarSign,
  Palette,
  ChevronRight,
  Award,
  Calendar,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isValid } from "date-fns";
import { cn } from "@/lib/utils";

interface ServiceResult {
  id: string;
  type: "assessment" | "interview" | "salary" | "portfolio";
  title: string;
  date: string;
  status: string;
  score?: number;
}

export default function MyResults() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (talent?.email) {
      fetchResults();
    }
  }, [talent?.email]);

  async function fetchResults() {
    if (!talent?.email) return;
    setLoading(true);
    try {
      const emailLower = talent.email.toLowerCase().trim();

      const [assessments, interviews, salaries, portfolios] = await Promise.all([
        supabase
          .from("career_assessments")
          .select("id, created_at, percentage, readiness_level")
          .eq("email", emailLower)
          .order("created_at", { ascending: false }),
        supabase
          .from("mock_interviews")
          .select("id, created_at, selection_percentage, status, job_title")
          .eq("email", emailLower)
          .order("created_at", { ascending: false }),
        supabase
          .from("salary_analyses")
          .select("id, created_at, status, job_title")
          .eq("email", emailLower)
          .order("created_at", { ascending: false }),
        supabase
          .from("portfolio_requests")
          .select("id, created_at, status")
          .eq("email", emailLower)
          .order("created_at", { ascending: false }),
      ]);

      const allResults: ServiceResult[] = [];

      assessments.data?.forEach((a) =>
        allResults.push({
          id: a.id,
          type: "assessment",
          title: "Career Readiness",
          date: a.created_at,
          status: a.readiness_level,
          score: a.percentage,
        }),
      );
      interviews.data?.forEach((i) =>
        allResults.push({
          id: i.id,
          type: "interview",
          title: i.job_title || "Mock Interview",
          date: i.created_at,
          status: i.status || "pending",
          score: i.selection_percentage,
        }),
      );
      salaries.data?.forEach((s) =>
        allResults.push({
          id: s.id,
          type: "salary",
          title: s.job_title || "Salary Analysis",
          date: s.created_at,
          status: s.status || "pending",
        }),
      );
      portfolios.data?.forEach((p) =>
        allResults.push({
          id: p.id,
          type: "portfolio",
          title: "Digital Portfolio",
          date: p.created_at,
          status: p.status,
        }),
      );

      allResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setResults(allResults);
    } catch (error) {
      console.error("Data Aggregation Error:", error);
    } finally {
      setLoading(false);
    }
  }

  const getTheme = (type: string) => {
    switch (type) {
      case "assessment":
        return { icon: ClipboardCheck, color: "text-blue-600", bg: "bg-blue-50" };
      case "interview":
        return { icon: Mic, color: "text-purple-600", bg: "bg-purple-50" };
      case "salary":
        return { icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" };
      case "portfolio":
        return { icon: Palette, color: "text-pink-600", bg: "bg-pink-50" };
      default:
        return { icon: Award, color: "text-slate-600", bg: "bg-slate-50" };
    }
  };

  const ResultCard = ({ result }: { result: ServiceResult }) => {
    const theme = getTheme(result.type);
    const dateObj = new Date(result.date);
    const isClickable = result.status === "completed" || result.type === "assessment" || result.type === "portfolio";

    // CTO Fix: Dynamic score coloring for psychological feedback
    const scoreColor =
      result.score && result.score >= 80
        ? "text-emerald-600"
        : result.score && result.score >= 50
          ? "text-amber-600"
          : "text-rose-600";

    return (
      <Card
        className={cn(
          "group transition-all duration-300 border-border/40 rounded-[24px] overflow-hidden",
          isClickable
            ? "cursor-pointer hover:shadow-xl hover:border-primary/30 hover:-translate-y-0.5 bg-card/50 backdrop-blur-sm"
            : "opacity-60 bg-muted/20",
        )}
        onClick={() => isClickable && handleResultClick(result)}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={cn(
                  "p-3 rounded-2xl shrink-0 transition-transform group-hover:scale-110",
                  theme.bg,
                  theme.color,
                )}
              >
                <theme.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-sm tracking-tight leading-tight truncate group-hover:text-primary transition-colors">
                  {result.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                  <Calendar className="h-3 w-3" />
                  <span>{isValid(dateObj) ? format(dateObj, "MMM d, yyyy") : "Recent"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {result.score !== undefined && (
                <div className="text-right hidden sm:block">
                  <p className={cn("text-lg font-black tracking-tighter leading-none", scoreColor)}>{result.score}%</p>
                  <p className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Match Rate</p>
                </div>
              )}
              <Badge
                className={cn(
                  "border-none text-[9px] font-black uppercase tracking-widest px-2.5 h-6",
                  result.status === "completed" || result.status === "High"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-primary/10 text-primary",
                )}
              >
                {result.status.replace("_", " ")}
              </Badge>
              {isClickable && (
                <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const handleResultClick = (result: ServiceResult) => {
    const routes: Record<string, string> = {
      assessment: `/assessment-results/${result.id}`,
      interview: `/mock-interview/results/${result.id}`,
      salary: `/salary-analysis/results/${result.id}`,
      portfolio: "/portfolio-status",
    };
    navigate(routes[result.type]);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            Performance Archive <BarChart3 className="h-5 w-5 text-primary" />
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Strategic insights from your journey
          </p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
      </header>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl w-full mb-6">
          <TabsTrigger value="all" className="flex-1 rounded-xl font-bold text-xs">
            All Activity ({results.length})
          </TabsTrigger>
          <TabsTrigger value="assessment" className="flex-1 rounded-xl font-bold text-xs">
            Assessments
          </TabsTrigger>
          <TabsTrigger value="interview" className="flex-1 rounded-xl font-bold text-xs">
            Interviews
          </TabsTrigger>
          <TabsTrigger value="salary" className="flex-1 rounded-xl font-bold text-xs">
            Salary
          </TabsTrigger>
        </TabsList>

        {["all", "assessment", "interview", "salary"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4 outline-none">
            {loading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-[24px]" />)
            ) : results.filter((r) => tab === "all" || r.type === tab).length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed rounded-[32px] border-border/40">
                <Award className="h-12 w-12 text-muted-foreground/10 mx-auto mb-4" />
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">
                  No records found in this category
                </p>
              </div>
            ) : (
              results
                .filter((r) => tab === "all" || r.type === tab)
                .map((result) => <ResultCard key={`${result.type}-${result.id}`} result={result} />)
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
