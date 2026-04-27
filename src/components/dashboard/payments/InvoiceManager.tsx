import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Coins,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Upload,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { SUPPORT_CONFIG } from "@/lib/constants/support";

type InvoiceStatus =
  | "all"
  | "pending"
  | "awaiting_payment"
  | "paid"
  | "cancelled"
  | "refunded";

interface InvoiceRow {
  id: string;
  invoice_number: string;
  talent_id: string;
  bundle_credits: number;
  bundle_price_usd: number;
  currency: string;
  status: string;
  channel: string;
  whatsapp_message_sent: boolean;
  payment_method: string | null;
  payment_reference: string | null;
  payment_proof_url: string | null;
  admin_notes: string | null;
  cancellation_reason: string | null;
  credits_disbursed: boolean;
  credit_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
  talents?: { full_name: string | null; email: string | null; phone: string | null } | null;
}

const STATUS_BADGE: Record<string, { label: string; className: string; icon: React.ElementType }> = {
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

export function InvoiceManager() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InvoiceRow | null>(null);
  const [approveOpen, setApproveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: invoices, isLoading } = useQuery({
    queryKey: ["admin-credit-invoices", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("credit_invoices")
        .select(
          "*, talents:talent_id (full_name, email, phone)"
        )
        .order("created_at", { ascending: false })
        .limit(500);

      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as InvoiceRow[];
    },
  });

  const filtered = useMemo(() => {
    if (!invoices) return [];
    if (!search.trim()) return invoices;
    const s = search.toLowerCase();
    return invoices.filter(
      (i) =>
        i.invoice_number?.toLowerCase().includes(s) ||
        i.talents?.full_name?.toLowerCase().includes(s) ||
        i.talents?.email?.toLowerCase().includes(s) ||
        i.talents?.phone?.toLowerCase().includes(s)
    );
  }, [invoices, search]);

  const kpis = useMemo(() => {
    const list = invoices || [];
    const pending = list.filter((i) => i.status === "pending").length;
    const awaiting = list.filter((i) => i.status === "awaiting_payment");
    const awaitingValue = awaiting.reduce((sum, i) => sum + Number(i.bundle_price_usd || 0), 0);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const paidThisMonth = list.filter(
      (i) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= monthStart
    );
    const paidUsd = paidThisMonth.reduce((s, i) => s + Number(i.bundle_price_usd || 0), 0);
    const paidCredits = paidThisMonth.reduce((s, i) => s + (i.bundle_credits || 0), 0);
    return { pending, awaiting: awaiting.length, awaitingValue, paidUsd, paidCredits };
  }, [invoices]);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-credit-invoices"] });

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Pending" value={kpis.pending.toString()} icon={Clock} />
        <KpiCard
          label="Awaiting Payment"
          value={`${kpis.awaiting} · $${kpis.awaitingValue.toFixed(2)}`}
          icon={MessageCircle}
        />
        <KpiCard label="Paid (MTD)" value={`$${kpis.paidUsd.toFixed(2)}`} icon={CheckCircle2} />
        <KpiCard label="Credits Disbursed (MTD)" value={kpis.paidCredits.toString()} icon={Coins} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search invoice #, name, email, phone…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as InvoiceStatus)}>
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="awaiting_payment">Awaiting payment</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No invoices found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Talent</TableHead>
                    <TableHead className="text-right">Bundle</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((inv) => {
                    const meta = STATUS_BADGE[inv.status] || STATUS_BADGE.pending;
                    const Icon = meta.icon;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.invoice_number}</TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {inv.talents?.full_name || "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {inv.talents?.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold">{inv.bundle_credits} cr</div>
                          <div className="text-xs text-muted-foreground">
                            ${Number(inv.bundle_price_usd).toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={meta.className}>
                            <Icon className="h-3 w-3 mr-1" />
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(inv.created_at), "dd MMM, HH:mm")}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelected(inv)}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-mono">{selected.invoice_number}</DialogTitle>
              <DialogDescription>
                {selected.bundle_credits} credits · ${Number(selected.bundle_price_usd).toFixed(2)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              <Row label="Talent" value={selected.talents?.full_name || "—"} />
              <Row label="Email" value={selected.talents?.email || "—"} />
              <Row label="Phone" value={selected.talents?.phone || "—"} />
              <Row label="Channel" value={selected.channel} />
              <Row label="Status" value={STATUS_BADGE[selected.status]?.label || selected.status} />
              {selected.payment_method && (
                <Row label="Payment method" value={selected.payment_method} />
              )}
              {selected.payment_reference && (
                <Row label="Reference" value={selected.payment_reference} />
              )}
              {selected.payment_proof_url && (
                <a
                  href={selected.payment_proof_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
                >
                  <FileText className="h-3.5 w-3.5" /> View payment proof
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {selected.admin_notes && (
                <div className="p-2 bg-muted rounded text-xs">
                  <div className="font-medium mb-1">Admin notes</div>
                  {selected.admin_notes}
                </div>
              )}
              {selected.cancellation_reason && (
                <div className="p-2 bg-destructive/10 rounded text-xs">
                  <div className="font-medium mb-1">Cancelled</div>
                  {selected.cancellation_reason}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 flex-wrap">
              {selected.talents?.phone && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const phone = selected.talents!.phone!.replace(/[^0-9]/g, "");
                    const msg = encodeURIComponent(
                      `Hi ${selected.talents?.full_name || "there"}, regarding invoice ${selected.invoice_number} for ${selected.bundle_credits} credits ($${Number(selected.bundle_price_usd).toFixed(2)}).`
                    );
                    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp talent
                </Button>
              )}
              {!selected.credits_disbursed && selected.status !== "cancelled" && (
                <>
                  {selected.status === "pending" && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("credit_invoices")
                          .update({ status: "awaiting_payment" })
                          .eq("id", selected.id);
                        if (error) toast.error(error.message);
                        else {
                          toast.success("Marked as awaiting payment");
                          refresh();
                          setSelected(null);
                        }
                      }}
                    >
                      Mark awaiting payment
                    </Button>
                  )}
                  <Button variant="destructive" onClick={() => setCancelOpen(true)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setApproveOpen(true)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Approve & disburse
                  </Button>
                </>
              )}
            </DialogFooter>

            <ApproveDialog
              open={approveOpen}
              onOpenChange={setApproveOpen}
              invoice={selected}
              onDone={() => {
                refresh();
                setApproveOpen(false);
                setSelected(null);
              }}
            />
            <CancelDialog
              open={cancelOpen}
              onOpenChange={setCancelOpen}
              invoice={selected}
              onDone={() => {
                refresh();
                setCancelOpen(false);
                setSelected(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-sm font-bold truncate">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ApproveDialog({
  open,
  onOpenChange,
  invoice,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: InvoiceRow;
  onDone: () => void;
}) {
  const [method, setMethod] = useState("bkash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!method) {
      toast.error("Select payment method");
      return;
    }
    setSubmitting(true);
    try {
      let proofUrl: string | null = null;
      if (file) {
        const path = `${invoice.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage
          .from("payment-proofs")
          .upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage
          .from("payment-proofs")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        proofUrl = signed?.signedUrl || path;
      }

      const { data, error } = await supabase.rpc("approve_invoice_and_disburse", {
        p_invoice_id: invoice.id,
        p_payment_method: method,
        p_payment_reference: reference || null,
        p_payment_proof_url: proofUrl,
        p_admin_notes: notes || null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string; credits_added?: number };
      if (!result?.success) throw new Error(result?.error || "Failed");
      toast.success(`Disbursed ${result.credits_added} credits`);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to approve invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve & disburse credits</DialogTitle>
          <DialogDescription>
            Adds {invoice.bundle_credits} credits to {invoice.talents?.full_name || "talent"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bkash">bKash</SelectItem>
                <SelectItem value="nagad">Nagad</SelectItem>
                <SelectItem value="bank">Bank transfer</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Payment reference (TXN ID)</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="TXN-123456" />
          </div>
          <div>
            <Label>Proof (image/PDF, optional)</Label>
            <Input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <Label>Admin notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any context…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            <Upload className="h-4 w-4 mr-1" />
            {submitting ? "Disbursing…" : "Approve & disburse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({
  open,
  onOpenChange,
  invoice,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  invoice: InvoiceRow;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("cancel_invoice", {
        p_invoice_id: invoice.id,
        p_reason: reason || null,
      });
      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result?.success) throw new Error(result?.error || "Failed");
      toast.success("Invoice cancelled");
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel invoice {invoice.invoice_number}?</DialogTitle>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional, visible to admins)"
          rows={3}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Back
          </Button>
          <Button variant="destructive" onClick={submit} disabled={submitting}>
            {submitting ? "Cancelling…" : "Confirm cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// re-export support config so component is self-contained for callers
export const _SUPPORT = SUPPORT_CONFIG;
