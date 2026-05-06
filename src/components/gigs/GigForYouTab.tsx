import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, X, ChevronRight, Coins, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect } from "react";

export function GigForYouTab() {
  const { talent } = useTalent();
  const qc = useQueryClient();

  const { data: matches, isLoading } = useQuery({
    queryKey: ["gig-matches-for-you", talent?.id],
    enabled: !!talent?.id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("match_gigs_for_talent", {
        _talent_id: talent!.id,
        _limit: 20,
      });
      if (error) throw error;
      return data || [];
    },
  });

  const dismiss = useMutation({
    mutationFn: async (matchId: string) => {
      await supabase.rpc("record_match_event", { _match_id: matchId, _event: "dismiss" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gig-matches-for-you"] }),
  });

  // Mark seen matches as viewed in background
  useEffect(() => {
    if (!matches?.length) return;
    matches.filter((m: any) => m.status === "offered").slice(0, 10).forEach((m: any) => {
      supabase.rpc("record_match_event", { _match_id: m.match_id, _event: "view" }).then(() => {});
    });
  }, [matches]);

  if (isLoading) {
    return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  if (!matches?.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center space-y-2">
          <Sparkles className="w-8 h-8 mx-auto text-primary/60" />
          <p className="font-medium">No matches yet</p>
          <p className="text-sm text-muted-foreground">Add verified skills and set your weekly capacity to get hot gig matches pushed to you.</p>
          <div className="flex gap-2 justify-center pt-2">
            <Button asChild variant="outline" size="sm"><Link to="/app/profile">Improve profile</Link></Button>
            <Button asChild size="sm"><Link to="/app/gigs?tab=tasks">Browse all</Link></Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {matches.map((m: any) => (
        <Card key={m.match_id} className="hover:border-primary/50 transition">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px] h-5">{m.gig_kind}</Badge>
                  <Badge className="text-[10px] h-5 bg-primary/15 text-primary hover:bg-primary/20">Match {Math.round(Number(m.score))}</Badge>
                </div>
                <p className="font-medium text-sm leading-tight line-clamp-2">{m.title}</p>
                {m.why_text && <p className="text-xs text-muted-foreground line-clamp-2 mt-1"><Sparkles className="w-3 h-3 inline mr-1 text-primary" />{m.why_text}</p>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => dismiss.mutate(m.match_id)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                {m.credits != null && <span className="flex items-center gap-1"><Coins className="w-3 h-3" />{m.credits}cr</span>}
                {m.deadline && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(m.deadline).toLocaleDateString()}</span>}
              </div>
              <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs">
                <Link to={m.gig_kind === "marketplace" ? `/app/marketplace/${m.gig_id}` : `/app/gigs?tab=tasks`}>
                  Open <ChevronRight className="w-3 h-3 ml-0.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
