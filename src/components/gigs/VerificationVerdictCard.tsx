import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";

interface Verification {
  id: string;
  verdict: string;
  score: number | null;
  rationale: string | null;
  criteria_results: Array<{ criterion: string; pass: boolean; note?: string }>;
  risk_flags: string[];
  suggested_revisions: string[];
}

const verdictMeta: Record<string, { label: string; icon: any; tone: string }> = {
  pending: { label: "Verifying...", icon: Clock, tone: "secondary" },
  auto_approved: { label: "Approved", icon: CheckCircle2, tone: "default" },
  human_approved: { label: "Approved (admin)", icon: CheckCircle2, tone: "default" },
  auto_revise: { label: "Revision requested", icon: AlertTriangle, tone: "secondary" },
  escalated: { label: "Under review", icon: Clock, tone: "secondary" },
  human_rejected: { label: "Rejected", icon: XCircle, tone: "destructive" },
};

export function VerificationVerdictCard({ verification }: { verification: Verification }) {
  const [appealReason, setAppealReason] = useState("");
  const [open, setOpen] = useState(false);
  const meta = verdictMeta[verification.verdict] ?? verdictMeta.pending;
  const Icon = meta.icon;

  const submitAppeal = async () => {
    if (!appealReason.trim()) return;
    const { error } = await supabase.rpc("open_verification_appeal", {
      _verification_id: verification.id,
      _reason: appealReason,
      _evidence: [],
    });
    if (error) toast.error(error.message);
    else { toast.success("Appeal submitted"); setOpen(false); setAppealReason(""); }
  };

  return (
    <Card className="p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <Badge variant={meta.tone as any}>{meta.label}</Badge>
        {verification.score != null && <Badge variant="outline">Score {verification.score}</Badge>}
      </div>

      {verification.rationale && <p className="text-xs text-muted-foreground">{verification.rationale}</p>}

      {verification.criteria_results?.length > 0 && (
        <ul className="space-y-1 text-xs">
          {verification.criteria_results.map((c, i) => (
            <li key={i} className="flex items-start gap-2">
              {c.pass ? <CheckCircle2 className="h-3 w-3 text-success mt-0.5" /> : <XCircle className="h-3 w-3 text-destructive mt-0.5" />}
              <span><strong>{c.criterion}</strong>{c.note ? ` — ${c.note}` : ""}</span>
            </li>
          ))}
        </ul>
      )}

      {verification.risk_flags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {verification.risk_flags.map(f => <Badge key={f} variant="destructive" className="text-[10px]">{f}</Badge>)}
        </div>
      )}

      {verification.suggested_revisions?.length > 0 && (
        <div className="rounded-md bg-muted/40 p-2 text-xs">
          <div className="font-semibold mb-1">Suggested revisions</div>
          <ul className="list-disc pl-4 space-y-0.5">
            {verification.suggested_revisions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {(verification.verdict === "human_rejected" || verification.verdict === "auto_revise") && (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button size="sm" variant="outline">Appeal verdict</Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader><SheetTitle>Appeal verdict</SheetTitle></SheetHeader>
            <div className="space-y-3 mt-3">
              <Textarea
                placeholder="Explain why this verdict should be reconsidered..."
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                rows={5}
              />
              <Button onClick={submitAppeal} disabled={!appealReason.trim()}>Submit appeal</Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </Card>
  );
}
