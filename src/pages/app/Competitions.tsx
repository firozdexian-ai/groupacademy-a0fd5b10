import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Calendar, ArrowLeft, Clock, Gift, Zap, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  upcoming: { label: "Upcoming", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Calendar },
  active: { label: "Live", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: Zap },
  judging: { label: "Judging", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Target },
  completed: { label: "Completed", color: "bg-muted text-muted-foreground border-border", icon: Trophy },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Target },
};

export default function Competitions() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<"all" | "active" | "upcoming" | "completed">("all");

  const { data: competitions, isLoading } = useQuery({
    queryKey: ["competitions", filter],
    queryFn: async () => {
      let query = supabase
        .from("competitions")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });
      if (filter !== "all") query = query.eq("status", filter);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const getTimeRemaining = (deadline: string) => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return "Ended";
    if (days === 0) return "Ends today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  };

  return (
    <div className={PAGE_SHELL_WIDE}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/learning")} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h1 className={PAGE_TITLE}>Competitions</h1>
        </div>
        <p className={PAGE_SUBTITLE}>Compete, win prizes, and build your portfolio.</p>
      </header>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-9">
          <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
          <TabsTrigger value="active" className="text-xs">Live</TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs">Upcoming</TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">Past</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      ) : competitions && competitions.length > 0 ? (
        <div className="space-y-2">
          {competitions.map((c) => {
            const status = STATUS_CONFIG[c.status] || STATUS_CONFIG.upcoming;
            const prizes = Array.isArray(c.prizes) ? c.prizes : [];
            return (
              <Card
                key={c.id}
                className={cn(CARD, "cursor-pointer hover:border-primary/40 transition-colors overflow-hidden")}
                onClick={() => navigate(`/app/learning/competitions/${c.slug}`)}
              >
                {c.featured_image && (
                  <div className="h-28 overflow-hidden">
                    <img src={c.featured_image} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold line-clamp-1">{c.title}</h3>
                    <Badge variant="outline" className={cn("text-[10px] gap-1 shrink-0", status.color)}>
                      <status.icon className="h-3 w-3" /> {status.label}
                    </Badge>
                  </div>
                  {c.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <span className={cn(META_TEXT, "flex items-center gap-1")}>
                      <Calendar className="h-3 w-3" /> {format(new Date(c.start_date), "MMM d")}
                    </span>
                    {c.status === "active" && (
                      <span className="text-[11px] text-amber-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {getTimeRemaining(c.submission_deadline)}
                      </span>
                    )}
                    {prizes.length > 0 && (
                      <span className={cn(META_TEXT, "flex items-center gap-1")}>
                        <Gift className="h-3 w-3" /> {prizes.length} prizes
                      </span>
                    )}
                    {c.is_featured && (
                      <Badge variant="outline" className="text-[10px] ml-auto">Featured</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Trophy}
          title="No competitions yet"
          description="Check back soon — new competitions are added regularly."
          action={{ label: "Show all", onClick: () => setFilter("all") }}
        />
      )}
    </div>
  );
}
