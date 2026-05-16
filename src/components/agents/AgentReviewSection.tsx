import { useState, useMemo } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * GroUp Academy: Agent Social Proof Node (V5.6.0)
 * CTO Reference: High-performance social proof component pulling optimized relational records.
 * Architecture: Server-side projections replacing client-side N+1 hydration loops.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

interface Props {
  agentKey: string;
  canReview: boolean;
}

interface Review {
  id: string;
  talent_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  talentName: string;
}

const STARS = Array.from({ length: 5 }, (_, i) => i + 1);

export function AgentReviewSection({ agentKey, canReview }: Props) {
  const { talent } = useTalent();
  const queryClient = useQueryClient();
  const [isWriting, setIsWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const queryKey = useMemo(() => ["agent-reviews", agentKey], [agentKey]);

  // --- SENSOR: OPTIMIZED_RELATIONAL_REVIEW_QUERY ---
  const { data: reviews = [], isLoading } = useQuery<Review[], Error>({
    queryKey,
    staleTime: 30 * 1000, // 30-second stability cache window for ledger metrics
    queryFn: async (): Promise<Review[]> => {
      // HUD: EXECUTING_RELATIONAL_LEDGER_INGRESS_SELECT
      // Architecture: Pulls reviews and profiles in a single query via server-side joins
      const { data, error } = await supabase
        .from("agent_reviews")
        .select("id, talent_id, rating, review_text, created_at, talent:talents(full_name)")
        .eq("agent_key", agentKey)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Digital Workforce] FAULT: agent_reviews relational lookup dropped.", error);
        throw error;
      }

      return (data || []).map((row: any) => ({
        id: String(row.id),
        talent_id: String(row.talent_id),
        rating: Number(row.rating ?? 5),
        review_text: row.review_text ? String(row.review_text) : null,
        created_at: String(row.created_at),
        talentName: String(row.talent?.full_name ?? "Anonymous Learner"),
      }));
    },
  });

  // --- ACTION: SOCIAL_LEDGER_UPSERT_MUTATION ---
  const submitMutation = useMutation({
    mutationKey: ["append-agent-review", agentKey],
    mutationFn: async (): Promise<void> => {
      if (!talent?.id) throw new Error("AUTH_REQUIRED: Authentication layer sync required.");
      const cleanText = text.trim();

      // HUD: COMMITTING_REVIEW_LEDGER_UPSERT
      const { error } = await supabase.from("agent_reviews").upsert(
        {
          agent_key: agentKey,
          talent_id: talent.id,
          rating,
          review_text: cleanText || null,
        },
        { onConflict: "agent_key,talent_id" },
      );

      if (error) {
        // Digital Workforce Anomaly Trigger: Imprints explicit trace tracking packets
        console.error("[Digital Workforce] ANOMALY: agent_reviews upsert transaction rejected.", {
          agentKey,
          talentId: talent.id,
          message: error.message,
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Artifact logged: Review posted successfully.");
      setIsWriting(false);
      setText("");
      void queryClient.invalidateQueries({ queryKey, exact: true });
    },
    onError: (err: Error) => {
      toast.error(
        err.message === "AUTH_REQUIRED"
          ? "Please sign in to log artifacts."
          : "Failed to sync review. Please try again.",
      );
    },
  });

  return (
    <section className="space-y-4 animate-in fade-in duration-500 text-left select-none">
      <div className="flex items-center justify-between border-b border-border/10 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] italic text-foreground/80">
            Social Ledger <span className="text-primary">({reviews.length})</span>
          </h2>
        </div>
        {canReview && !isWriting && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsWriting(true)}
            className="h-8 rounded-lg font-black uppercase text-[9px] tracking-widest border-2 hover:bg-primary/5"
          >
            Append Review
          </Button>
        )}
      </div>

      {/* RE-ENTRY FORM SHELL GATED BY ACTIVE MUTATION STATES */}
      {isWriting && (
        <div className="rounded-[24px] border-2 border-border/40 p-5 space-y-4 bg-card/30 backdrop-blur-sm animate-in slide-in-from-top-2">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Quality Metric</p>
            <div className="flex gap-1.5">
              {STARS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={submitMutation.isPending}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                >
                  <Star
                    className={cn(
                      "h-7 w-7 transition-colors",
                      s <= rating
                        ? "fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                        : "text-muted-foreground/20",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            placeholder="Document your interaction trajectory..."
            value={text}
            disabled={submitMutation.isPending}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="rounded-xl border-2 bg-background/50 italic font-medium resize-none disabled:opacity-50"
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button
              size="sm"
              type="button"
              variant="ghost"
              disabled={submitMutation.isPending}
              onClick={() => setIsWriting(false)}
              className="font-black uppercase text-[10px] tracking-widest"
            >
              Abort
            </Button>
            <Button
              size="sm"
              type="button"
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending || !text.trim()}
              className="font-black uppercase text-[10px] tracking-widest rounded-xl px-6"
            >
              {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Commit Ledger"}
            </Button>
          </div>
        </div>
      )}

      {/* FEED RESULTS RENDER WINDOW */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border/20 p-8 text-center bg-muted/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
            No artifacts recorded in ledger.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reviews.slice(0, 10).map((r) => {
            const dateValue = useMemo(() => {
              try {
                return format(new Date(r.created_at), "MMM d, yyyy");
              } catch {
                return "Recent Ingress";
              }
            }, [r.created_at]);

            return (
              <div
                key={r.id}
                className="rounded-2xl border-2 border-border/10 bg-card/20 p-4 transition-all hover:bg-card/40"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-black uppercase italic tracking-tight">{r.talentName}</p>
                    <div className="flex gap-0.5 mt-1">
                      {STARS.map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            "h-3 w-3",
                            s <= r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    {dateValue}
                  </span>
                </div>
                {r.review_text && (
                  <p className="text-xs font-medium text-foreground/70 italic leading-relaxed pt-1">
                    "{r.review_text}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
