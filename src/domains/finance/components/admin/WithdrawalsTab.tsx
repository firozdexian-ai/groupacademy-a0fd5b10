import { useState, useEffect } from "react";
import { listAdminWithdrawalRequests } from "@/domains/finance/repo/financeRepo";
import { processWithdrawal as processWithdrawalEdge } from "@/domains/finance/api/financeApi";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Wallet, Clock, ArrowUpRight, Banknote } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

interface Row {
  id: string;
  talent_id: string;
  amount_credits: number;
  method: string;
  payout_details: unknown;
  status: "pending" | "approved" | "paid" | "rejected";
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  talent?: { full_name: string | null; email: string | null };
}

const STATUSES: Row["status"][] = ["pending", "approved", "paid", "rejected"];

/**
 * GroUp Academy: Withdrawal Requests Administration Ledger
 * Provides administrative oversight, verification checks, and final approval for instructor and contractor payouts.
 */
export function WithdrawalsTab() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Row["status"]>("pending");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listAdminWithdrawalRequests();
      setRows((data as unknown) || []);
    } catch (err) {
      console.error("[Payout Operations] Failed to retrieve withdrawal rows:", err);
      toast.error("Could not sync payout request balances from accounting logs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function processWithdrawal(id: string, action_status: Row["status"]) {
    setProcessingId(id);
    try {
      const data = await processWithdrawalEdge({
        withdrawal_id: id,
        action: action_status,
        admin_notes: noteDraft[id] ?? null,
      });
      if ((data as { error?: string } | null)?.error) throw new Error((data as { error?: string }).error);

      toast.success(`Payout request successfully marked as ${action_status}`);
      setNoteDraft((prev) => ({ ...prev, [id]: "" }));
      load();
    } catch (e: unknown) {
      console.error("[Payout Operations] State modification failure:", e);
      toast.error(e.message || "An error occurred while attempting to process this payout request.");
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = rows.filter((r) => r.status === filter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400";
      case "approved":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400";
      case "paid":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400";
      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300 p-4 md:p-6 text-left">
      {/* Executive Control Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <Wallet className="h-8 w-8 text-amber-500 fill-amber-500/10" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Payout Disbursements</h2>
          </div>
          <p className="text-xs font-medium text-muted-foreground/80">
            Review, verify, and approve contractor and instructor balance withdrawal requests.
          </p>
        </div>
      </header>

      {/* Dynamic Status Navigation Filters Grid */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as Row["status"])}>
        <TabsList className="bg-muted/30 border border-border/60 p-1.5 h-auto rounded-2xl mb-8 flex w-full max-w-2xl mx-auto select-none">
          {STATUSES.map((s) => (
            <TabsTrigger
              key={s}
              value={s}
              className="flex-1 capitalize rounded-xl text-xs font-bold py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
            >
              {s === "paid" ? "Disbursed" : s} ({rows.filter((r) => r.status === s).length})
            </TabsTrigger>
          ))}
        </TabsList>

        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-40 w-full rounded-2xl bg-muted/20 border" />
            <Skeleton className="h-40 w-full rounded-2xl bg-muted/20 border" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/10 border border-dashed border-border/40 rounded-2xl select-none">
            <Banknote className="h-12 w-12 text-muted-foreground/30 mb-4 shrink-0" />
            <p className="text-xs font-semibold text-muted-foreground/60">
              No requests currently await review under this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-left">
            {filtered.map((r) => (
              <Card
                key={r.id}
                className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                <div
                  className={cn(
                    "h-1 w-full",
                    r.status === "pending"
                      ? "bg-gradient-to-r from-amber-400 to-amber-500"
                      : r.status === "paid"
                        ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                        : r.status === "rejected"
                          ? "bg-gradient-to-r from-destructive to-red-500"
                          : "bg-gradient-to-r from-blue-400 to-blue-500",
                  )}
                />
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="font-bold text-base text-foreground truncate">
                        {r.talent?.full_name || "Unverified Recipient"}
                      </p>
                      <p className="text-xs font-medium text-muted-foreground/80 truncate">
                        {r.talent?.email || "No email linked"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize px-3 py-0.5 font-bold text-[10px] tracking-wider border rounded-lg select-none shrink-0",
                        getStatusColor(r.status),
                      )}
                    >
                      {r.status === "paid" ? "Disbursed" : r.status}
                    </Badge>
                  </div>

                  {/* ACCOUNT AMOUNT & ROUTING SPECIFICATIONS BLOCK */}
                  <div className="flex items-center gap-4 bg-muted/20 p-4 rounded-2xl border border-border/40">
                    <div className="space-y-1 flex-1">
                      <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                        Payout Amount
                      </p>
                      <p className="text-2xl font-bold tracking-tight text-foreground leading-none">
                        {Number(r.amount_credits).toFixed(1)}{" "}
                        <span className="text-xs font-semibold text-muted-foreground">credits</span>
                      </p>
                    </div>
                    <div className="space-y-1 flex-1 border-l border-border/40 pl-4 min-w-0">
                      <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                        Destination Channel
                      </p>
                      <p className="text-sm font-bold text-foreground truncate capitalize">{r.method}</p>
                      <p className="text-xs font-mono font-medium text-muted-foreground/80 truncate mt-0.5">
                        {r.payout_details?.account_number || "No account details linked"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/70 select-none">
                    <Clock className="h-3.5 w-3.5 shrink-0" /> Requested:{" "}
                    {format(new Date(r.created_at), "dd MMM yyyy, HH:mm")}
                  </div>

                  {/* ACTIVE ADMINISTRATIVE INTERACTION PANEL */}
                  {r.status === "pending" && (
                    <div className="pt-2 space-y-3">
                      <Input
                        placeholder="Attach audit notes for the account transaction statement log (optional)..."
                        value={noteDraft[r.id] ?? ""}
                        onChange={(e) => setNoteDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        className="h-11 rounded-xl border font-medium bg-background text-sm"
                        disabled={processingId === r.id}
                      />
                      <div className="flex gap-3">
                        <Button
                          size="sm"
                          onClick={() => processWithdrawal(r.id, "approved")}
                          disabled={processingId === r.id}
                          className="flex-1 h-10 rounded-xl font-bold text-xs tracking-wider"
                        >
                          {processingId === r.id ? <InlineSpinner size="sm" /> : "Approve Request"}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => processWithdrawal(r.id, "rejected")}
                          disabled={processingId === r.id}
                          variant="destructive"
                          className="flex-1 h-10 rounded-xl font-bold text-xs tracking-wider"
                        >
                          {processingId === r.id ? <InlineSpinner size="sm" /> : "Deny Request & Refund"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {r.status === "approved" && (
                    <div className="pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        onClick={() => processWithdrawal(r.id, "paid")}
                        disabled={processingId === r.id}
                        className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs tracking-wide shadow-sm gap-2"
                      >
                        {processingId === r.id ? <InlineSpinner size="sm" /> : "Confirm & Execute Outgoing Payout"}
                        <ArrowUpRight className="h-4 w-4 shrink-0" />
                      </Button>
                    </div>
                  )}

                  {/* HISTORICAL NOTES CONTAINER */}
                  {r.admin_notes && (
                    <div className="p-4 rounded-xl bg-muted/30 border border-border/40 text-xs">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-wider mb-1">
                        Administrative Audit Notes
                      </p>
                      <p className="font-medium text-muted-foreground leading-relaxed">{r.admin_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Tabs>
    </div>
  );
}

export default WithdrawalsTab;


