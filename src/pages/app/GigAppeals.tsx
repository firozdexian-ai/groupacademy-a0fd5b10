import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationVerdictCard } from "@/components/gigs/VerificationVerdictCard";

export default function GigAppeals() {
  const { data: appeals, isLoading } = useQuery({
    queryKey: ["my-gig-appeals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("gig_verification_appeals")
        .select("*, gig_verifications(*)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="container py-2 space-y-3 pb-safe-bottom">
      <header>
        <h1 className="text-lg font-bold">Appeals & verifications</h1>
        <p className="text-xs text-muted-foreground">Track your submitted appeals and AI verdicts.</p>
      </header>

      {isLoading ? <Skeleton className="h-32 w-full" /> : appeals?.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">No appeals yet.</Card>
      ) : (
        <div className="space-y-2">
          {appeals?.map((a: any) => (
            <Card key={a.id} className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"}>{a.status}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm">{a.reason}</p>
              {a.gig_verifications && <VerificationVerdictCard verification={a.gig_verifications as any} />}
              {a.resolution_notes && <p className="text-xs text-muted-foreground italic">Admin: {a.resolution_notes}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
