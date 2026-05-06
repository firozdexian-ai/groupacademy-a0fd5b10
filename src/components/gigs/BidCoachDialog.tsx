import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  gigId: string;
  gigKind?: "marketplace" | "quick";
  initialDraft?: string;
  onAccept: (improved: { text: string; rationale: string; proof_links: any[] }) => void;
}

export function BidCoachDialog({ open, onOpenChange, gigId, gigKind = "marketplace", initialDraft = "", onAccept }: Props) {
  const [draft, setDraft] = useState(initialDraft);
  const [improved, setImproved] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const improve = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-bid-coach", {
        body: { gig_id: gigId, gig_kind: gigKind, draft_text: draft },
      });
      if (error) throw error;
      if ((data as any)?.error === "rate_limited") { toast.error("Rate limited — try again in a minute."); return; }
      if ((data as any)?.error === "credits_exhausted") { toast.error("AI credits exhausted. Add funds to keep using AI."); return; }
      setImproved(data);
    } catch (e: any) {
      toast.error(e.message || "Failed to coach bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Bid Coach</DialogTitle>
          <DialogDescription>We'll rewrite your bid using your verified skills and past wins.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block">Your draft</label>
            <Textarea value={draft} onChange={e => setDraft(e.target.value)} rows={5} placeholder="A few sentences about how you'll approach this gig…" />
          </div>
          <Button onClick={improve} disabled={loading} className="w-full">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Coaching…</> : <><Sparkles className="w-4 h-4 mr-2" />Improve with AI</>}
          </Button>
          {improved && (
            <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-primary">Improved bid</span>
                <Badge variant="outline" className="text-[10px]">AI</Badge>
              </div>
              <p className="text-sm whitespace-pre-wrap">{improved.improved_text}</p>
              {improved.rationale && <p className="text-xs text-muted-foreground italic">{improved.rationale}</p>}
              {improved.key_strengths?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {improved.key_strengths.map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="outline" onClick={() => setImproved(null)}>Try again</Button>
                <Button size="sm" onClick={() => {
                  onAccept({ text: improved.improved_text, rationale: improved.rationale || "", proof_links: improved.proof_links || [] });
                  onOpenChange(false);
                }}><Check className="w-4 h-4 mr-1" />Use this</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
