import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { SUPPORT_CONFIG } from "@/lib/constants/support";

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

const META: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending: { label: "Pending", className: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  awaiting_payment: {
    label: "Awaiting Payment",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: MessageCircle,
  },
  paid: { label: "Paid", className: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", className: "bg-muted text-muted-foreground", icon: XCircle },
  refunded: { label: "Refunded", className: "bg-muted text-muted-foreground", icon: XCircle },
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

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          No purchase invoices yet. Buy credits to see your invoices here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv) => {
        const meta = META[inv.status] || META.pending;
        const Icon = meta.icon;
        const reopenWA = () => {
          const text = encodeURIComponent(
            `Hi! Following up on invoice ${inv.invoice_number} — ${inv.bundle_credits} credits for $${Number(inv.bundle_price_usd).toFixed(2)}.`
          );
          window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${text}`, "_blank");
        };
        return (
          <Card key={inv.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-muted-foreground">
                    {inv.invoice_number}
                  </div>
                  <div className="text-sm font-semibold">
                    {inv.bundle_credits} credits · ${Number(inv.bundle_price_usd).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(inv.created_at), "dd MMM yyyy, HH:mm")}
                  </div>
                </div>
                <Badge variant="outline" className={meta.className}>
                  <Icon className="h-3 w-3 mr-1" />
                  {meta.label}
                </Badge>
              </div>

              {inv.status === "paid" && inv.payment_method && (
                <div className="text-xs text-muted-foreground">
                  Paid via {inv.payment_method}
                  {inv.payment_proof_url && (
                    <>
                      {" · "}
                      <a
                        href={inv.payment_proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary inline-flex items-center gap-1 hover:underline"
                      >
                        <FileText className="h-3 w-3" /> Receipt
                      </a>
                    </>
                  )}
                </div>
              )}

              {(inv.status === "pending" || inv.status === "awaiting_payment") && (
                <Button size="sm" variant="outline" className="w-full" onClick={reopenWA}>
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Continue on WhatsApp
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
