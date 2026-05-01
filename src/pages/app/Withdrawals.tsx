import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, Coins, Loader2, Info, CheckCircle2, Clock, XCircle } from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface WithdrawalRow {
  id: string;
  amount_credits: number;
  method: string;
  status: "pending" | "approved" | "paid" | "rejected";
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
}

const METHOD_LABEL: Record<string, string> = {
  bkash: "bKash",
  bank: "Bank transfer",
  paypal: "PayPal",
  wise: "Wise",
};

const STATUS_META: Record<WithdrawalRow["status"], { label: string; icon: any; cls: string }> = {
  pending: { label: "Pending review", icon: Clock, cls: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Approved", icon: CheckCircle2, cls: "bg-blue-100 text-blue-700 border-blue-200" },
  paid: { label: "Paid", icon: CheckCircle2, cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  rejected: { label: "Rejected", icon: XCircle, cls: "bg-rose-100 text-rose-700 border-rose-200" },
};

export default function Withdrawals() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { earnedBalance, balance } = useCredits() as any;
  const earned = Number(earnedBalance ?? 0);

  const [requests, setRequests] = useState<WithdrawalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("bkash");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  useEffect(() => {
    if (!talent?.id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("withdrawal_requests" as any)
        .select("*")
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false });
      setRequests((data as any) || []);
      setLoading(false);
    })();
  }, [talent?.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!talent?.id) return;
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("Enter a valid amount.");
    if (amt > earned) return toast.error(`You only have ${earned} earned credits available to withdraw.`);
    if (amt < 100) return toast.error("Minimum withdrawal is 100 credits.");
    if (!accountName.trim() || !accountNumber.trim()) return toast.error("Add your payout account details.");

    setSubmitting(true);
    const { error, data } = await supabase
      .from("withdrawal_requests" as any)
      .insert({
        talent_id: talent.id,
        amount_credits: amt,
        method,
        payout_details: { account_name: accountName.trim(), account_number: accountNumber.trim() },
      })
      .select()
      .single();
    setSubmitting(false);

    if (error) {
      toast.error(error.message || "Could not submit your request.");
      return;
    }
    toast.success("Withdrawal request submitted. We'll review it shortly.");
    setAmount("");
    setAccountName("");
    setAccountNumber("");
    setRequests((prev) => [data as any, ...prev]);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-28 space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Withdraw earnings</h1>
          <p className="text-sm text-muted-foreground">Cash out the credits you've earned from gigs and referrals.</p>
        </div>
      </header>

      {/* Balance summary */}
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Withdrawable balance</p>
            <p className="text-2xl font-bold flex items-center gap-1.5">
              <Coins className="h-5 w-5 text-amber-500" /> {earned.toFixed(1)}
              <span className="text-sm font-normal text-muted-foreground ml-2">earned credits</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total balance</p>
            <p className="text-base font-semibold">{Number(balance ?? 0).toFixed(1)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="flex gap-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p>Only <b>earned credits</b> (from gigs, referrals, or rewards) can be withdrawn — bonus and purchased credits cannot.</p>
          <p>Minimum withdrawal: <b>100 credits</b> (≈ $2 USD). Payouts are processed within 3 business days.</p>
        </div>
      </div>

      {/* Request form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request a payout</CardTitle>
          <CardDescription>Choose a method and amount.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount (credits)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={100}
                  step={1}
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={submitting || earned < 100}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payout method</Label>
                <Select value={method} onValueChange={setMethod} disabled={submitting}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="bank">Bank transfer</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="wise">Wise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acctName">Account holder name</Label>
              <Input id="acctName" value={accountName} onChange={(e) => setAccountName(e.target.value)} disabled={submitting} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acctNum">{method === "paypal" ? "PayPal email" : method === "bkash" ? "bKash number" : "Account / IBAN"}</Label>
              <Input id="acctNum" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} disabled={submitting} />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || earned < 100}>
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {earned < 100 ? "Earn at least 100 credits to withdraw" : "Submit request"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Your requests</h2>
        {loading ? (
          <Skeleton className="h-20 w-full rounded-lg" />
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((r) => {
              const meta = STATUS_META[r.status];
              const Icon = meta.icon;
              return (
                <Card key={r.id} className="p-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {Number(r.amount_credits).toFixed(1)} credits · {METHOD_LABEL[r.method] || r.method}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                      {r.admin_notes && <> · {r.admin_notes}</>}
                    </p>
                  </div>
                  <Badge variant="outline" className={cn("border", meta.cls)}>{meta.label}</Badge>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
