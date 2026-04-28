import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Clock, CheckCircle2, XCircle, FileText, Zap, ShieldCheck } from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { SUPPORT_CONFIG } from "@/lib/constants/support";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Fiscal Audit Ledger (Invoices)
 * CTO Reference: Authoritative historical record for talent capital ingress.
 */

interface InvoiceRow {
  id: string;
  invoice_number: string;
  bundle_credits: number;
  bundle_price_usd: number;
  status: string;
  payment_method: string | null;
  payment_proof_url: string | null;
  paid_at: string | null;
  created_at: string;
}

const LEDGER_META: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "AUDITING", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  awaiting_payment: {
    label: "AWAITING_SYNC",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: MessageCircle,
  },
  paid: { label: "VERIFIED", className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: ShieldCheck },
  cancelled: { label: "VOID", className: "bg-muted text-muted-foreground", icon: XCircle },
  refunded: { label: "REVERSED", className: "bg-muted text-muted-foreground", icon: XCircle },
};

export function MyInvoicesList() {
  const { talent } = useTalent();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["my-credit-invoices", talent?.id],
    enabled: !!talent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_invoices")
        .select("*")
        .eq("talent_id", talent!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as InvoiceRow[];
    },
  });

  if (isLoading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-2xl opacity-20" />
        ))}
      </div>
    );

  if (!invoices || invoices.length === 0)
    return (
      <Card className="border-2 border-dashed border-border/40 bg-muted/5 rounded-[32px]">
        <CardContent className="p-12 text-center">
          <Zap className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
            LEDGER_EMPTY: NO_TRANSACTIONS_DETECTED
          </p>
        </CardContent>
      </Card>
    );

  return (
    <div className="space-y-3 animate-in fade-in duration-700">
      {invoices.map((inv) => {
        const meta = LEDGER_META[inv.status] || LEDGER_META.pending;
        const Icon = meta.icon;

        const executeSupportHandshake = () => {
          const text = encodeURIComponent(
            `PROTOCOL_SYNC: Inquiry for Invoice ${inv.invoice_number} | Payload: ${inv.bundle_credits} Credits ($${Number(inv.bundle_price_usd).toFixed(2)}).`,
          );
          window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${text}`, "_blank");
        };

        return (
          <Card
            key={inv.id}
            className="group overflow-hidden rounded-2xl border-2 border-border/40 bg-card/40 backdrop-blur-xl transition-all hover:border-primary/20 hover:shadow-xl"
          >
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 text-left">
                  <div className="font-mono text-[10px] font-black tracking-widest text-muted-foreground/50 uppercase">
                    Ref: {inv.invoice_number}
                  </div>
                  <div className="text-base font-black italic tracking-tighter uppercase leading-none">
                    {inv.bundle_credits}_CREDITS <span className="mx-1 text-muted-foreground/30">|</span> $
                    {Number(inv.bundle_price_usd).toFixed(2)}
                  </div>
                  <div className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                    SYNC_{format(new Date(inv.created_at), "dd_MMM_yyyy_HH:mm")}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] font-black uppercase italic tracking-widest h-7 px-3 border-2",
                    meta.className,
                  )}
                >
                  <Icon className="h-3.5 w-3.5 mr-2" />
                  {meta.label}
                </Badge>
              </div>

              {inv.status === "paid" && (
                <div className="flex items-center justify-between pt-4 border-t border-border/10">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <ShieldCheck className="h-3 w-3 text-emerald-500" />
                    SYNCED_VIA_{inv.payment_method?.toUpperCase() || "SYSTEM"}
                  </div>
                  {inv.payment_proof_url && (
                    <a
                      href={inv.payment_proof_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary/70 flex items-center gap-2 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" /> DOWNLOAD_ARTIFACT
                    </a>
                  )}
                </div>
              )}

              {(inv.status === "pending" || inv.status === "awaiting_payment") && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-11 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 transition-all active:scale-95 shadow-lg shadow-primary/5"
                  onClick={executeSupportHandshake}
                >
                  <MessageCircle className="h-4 w-4 fill-current opacity-30" />
                  CONTINUE_WHATSAPP_LEDGER
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
