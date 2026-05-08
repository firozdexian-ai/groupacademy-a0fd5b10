import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, Building2, MessageCircle, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalentPitches } from "@/hooks/useTalentPitches";
import { formatDistanceToNow, format } from "date-fns";

/**
 * /app/pitches — full inbox of AI-dispatched employer pitches.
 * Closes the loop on the Phase 2 unlock → WhatsApp pitch.
 */
export default function TalentPitches() {
  const navigate = useNavigate();
  const { pitches, isLoading } = useTalentPitches(50);

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-border/40 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold leading-tight flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" /> Employer Pitches
            </h1>
            <p className="text-[11px] text-muted-foreground">
              Companies that unlocked your profile
            </p>
          </div>
        </div>
      </header>

      <div className="p-3 space-y-2">
        {isLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)
        ) : pitches.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted/40 mx-auto flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="text-base font-bold mb-1">No pitches yet</h2>
            <p className="text-xs text-muted-foreground">
              When an employer pays to unlock your profile and our AI sends them a pitch on your behalf,
              it will appear here.
            </p>
          </Card>
        ) : (
          pitches.map((p) => {
            const waLink = p.phone
              ? `https://wa.me/${p.phone.replace(/\D/g, "")}`
              : null;
            return (
              <Card key={p.id} className="p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  {p.company_logo ? (
                    <img src={p.company_logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
                  ) : (
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.company_name || "An employer"}</p>
                    <p className="text-[11px] text-muted-foreground" title={format(new Date(p.created_at), "PPpp")}>
                      {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {p.dispatched ? (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-[hsl(var(--success))] bg-[hsl(var(--success)/0.12)] px-1.5 py-0.5 rounded">
                      <CheckCircle2 className="h-3 w-3" /> Sent
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      <Clock className="h-3 w-3" /> Queued
                    </span>
                  )}
                </div>

                <div className="rounded-lg bg-muted/40 p-3 mb-3">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{p.message}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {waLink && (
                    <Button
                      asChild
                      size="sm"
                      className="h-8 text-xs gap-1.5 bg-[#25D366] hover:bg-[#1ea952] text-white"
                    >
                      <a href={waLink} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-3.5 w-3.5" /> Reply on WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => navigate(`/c/${p.company_id}`)}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> View company
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
