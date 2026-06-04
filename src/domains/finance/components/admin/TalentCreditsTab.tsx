import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTalentCreditsTotalCirculation,
  buildListTalentCreditsQuery,
  buildListCreditTransactionsQuery,
  getConsumptionTotals,
  getMonthlyConsumption,
  manualAdjustTalentCredit,
  addCreditsRpc,
  deductCreditsRpc,
} from "@/domains/finance/repo/financeRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Coins,
  Search,
  Plus,
  Minus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Calendar,
  Activity,
  CircleDollarSign,
} from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

interface ConsumptionStats {
  totalConsumed: number;
  monthlyConsumed: number;
  serviceBreakdown: { service: string; consumed: number; count: number }[];
}

interface TalentCredit {
  id: string;
  talent_id: string;
  balance: number;
  updated_at: string;
  talent?: { full_name: string; email: string };
}

interface CreditTransaction {
  id: string;
  talent_id: string;
  amount: number;
  transaction_type: string;
  service_type: string | null;
  description: string | null;
  balance_after: number;
  created_at: string;
  talent?: { full_name: string; email: string };
}

const ITEMS_PER_PAGE = 10;

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedSearch;
}

/**
 * GroUp Academy: Candidate Credit & Wallet Balance Panel
 * Provides system operators end-to-end lookup, transaction analytics, and manual quota fulfillment capabilities.
 */
export function TalentCreditsTab() {
  const qc = useQueryClient();
  const [credits, setCredits] = useState<TalentCredit[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [selectedTab, setSelectedTab] = useState<"balances" | "transactions">("balances");
  const [typeFilter, setTypeFilter] = useState("all");

  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; talent?: TalentCredit; type: "add" | "deduct" }>({
    open: false,
    type: "add",
  });
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [totalCirculation, setTotalCirculation] = useState(0);
  const [consumptionStats, setConsumptionStats] = useState<ConsumptionStats>({
    totalConsumed: 0,
    monthlyConsumed: 0,
    serviceBreakdown: [],
  });

  // Aggregates granular usage breakdowns across active candidate interaction endpoints
  const loadConsumptionTelemetry = useCallback(async () => {
    try {
      const totalData = await getConsumptionTotals();
      const totalConsumed = totalData.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const serviceMap: Record<string, { consumed: number; count: number }> = {};
      totalData.forEach((t) => {
        const service = t.service_type || "Other Tools";
        if (!serviceMap[service]) serviceMap[service] = { consumed: 0, count: 0 };
        serviceMap[service].consumed += Math.abs(t.amount);
        serviceMap[service].count += 1;
      });

      const now = new Date();
      const monthlyData = await getMonthlyConsumption(startOfMonth(now).toISOString(), endOfMonth(now).toISOString());

      setConsumptionStats({
        totalConsumed,
        monthlyConsumed: monthlyData.reduce((sum, t) => sum + Math.abs(t.amount), 0),
        serviceBreakdown: Object.entries(serviceMap)
          .map(([service, data]) => ({ service, ...data }))
          .sort((a, b) => b.consumed - a.consumed),
      });
    } catch (err) {
      console.error("[Credit Operations] Error gathering usage metrics logs:", err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (page === 1 && selectedTab === "balances") {
        setTotalCirculation(await getTalentCreditsTotalCirculation());
      }

      const query =
        selectedTab === "balances"
          ? buildListTalentCreditsQuery({ page, pageSize: ITEMS_PER_PAGE })
          : buildListCreditTransactionsQuery({ page, pageSize: ITEMS_PER_PAGE, typeFilter });

      const result = await withTimeout(
        Promise.resolve(query),
        TIMEOUTS.DEFAULT,
        "Database registry timeout encountered while fetching wallet rows.",
      );
      if (result.error) throw result.error;

      if (selectedTab === "balances") setCredits(result.data as TalentCredit[]);
      else setTransactions(result.data as CreditTransaction[]);

      setTotalCount(result.count || 0);
    } catch (err) {
      console.error("[Credit Operations] Ledger statement sync failed:", err);
      toast.error("Could not sync credit balance registry details. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedTab, typeFilter]);

  useEffect(() => {
    loadData();
    loadConsumptionTelemetry();
  }, [loadData, loadConsumptionTelemetry]);

  useEffect(() => {
    setPage(1);
  }, [selectedTab, typeFilter, debouncedSearch]);

  const handleAdjustCredits = async () => {
    const talentNode = adjustDialog.talent;
    if (!talentNode || !adjustAmount) return;

    setIsAdjusting(true);
    try {
      const amount = parseInt(adjustAmount);
      const finalAmount = adjustDialog.type === "add" ? amount : -amount;

      if (adjustDialog.type === "deduct" && (talentNode.balance || 0) < amount) {
        setIsAdjusting(false);
        return toast.error("Operation Denied: Target user profile has insufficient credits for deduction.");
      }

      let rpcError: any = null;
      try {
        if (adjustDialog.type === "add") {
          await addCreditsRpc({
            talentId: talentNode.talent_id,
            amount,
            description: adjustReason || "Administrative credit adjustment adjustment",
            transactionType: "admin_credit",
          });
        } else {
          await deductCreditsRpc({
            talentId: talentNode.talent_id,
            amount,
            description: adjustReason || "Administrative debit adjustment adjustment",
            serviceType: "admin_debit",
            transactionType: "admin_debit",
          });
        }
      } catch (e) {
        rpcError = e;
      }

      // Digital Workforce Fallback Strategy: If RPC interface fails, apply fallback update to local ledger rows
      if (rpcError) {
        console.warn(
          "[Credit Operations] RPC connection mismatch. Activating manual fallback tracking override.",
          rpcError,
        );
        const newBalance = (talentNode.balance || 0) + finalAmount;
        await manualAdjustTalentCredit({
          creditId: talentNode.id,
          talentId: talentNode.talent_id,
          newBalance,
          delta: finalAmount,
          transactionType: adjustDialog.type === "add" ? "admin_credit" : "admin_debit",
          description:
            adjustReason || `Administrative ${adjustDialog.type === "add" ? "credit" : "debit"} top-up adjustment`,
        });
      }

      toast.success("Candidate account balances updated successfully.");
      setAdjustDialog({ open: false, type: "add" });
      setAdjustAmount("");
      setAdjustReason("");
      loadData();
    } catch (err: any) {
      console.error("[Credit Operations] Quota adjustment script failed:", err);
      toast.error("Transaction processing error. Balance changes discarded.");
    } finally {
      setIsAdjusting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  return (
    <div className="space-y-10 animate-in fade-in duration-300 p-4 md:p-6 text-left">
      {/* Executive Control Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
            <CircleDollarSign className="h-8 w-8 text-blue-500 fill-blue-500/20" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Talent Wallet Balances</h2>
          </div>
          <p className="text-xs font-medium text-muted-foreground/80">
            Review B2C candidate credit allotments, evaluate consumption burn metrics, and issue custom overrides.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadData}
          className="rounded-xl h-12 px-6 border font-semibold text-xs gap-2 border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-all shrink-0"
        >
          <RefreshCw className={cn("h-4 w-4 shrink-0", isLoading && "animate-spin")} /> Re-Sync Registry
        </Button>
      </header>

      {/* KPI Overview Grid */}
      {selectedTab === "balances" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
          <Card className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm shadow-sm group">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="h-14 w-14 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-white/5 transition-transform group-hover:scale-105">
                <Coins className="h-7 w-7 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                  Total in Circulation
                </p>
                <p className="text-3xl font-bold tracking-tight text-foreground leading-none">
                  {totalCirculation.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-destructive/20 bg-destructive/5 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-destructive rotate-180" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-destructive/80">
                  Lifetime Consumption
                </p>
              </div>
              <p className="text-3xl font-bold tracking-tight text-destructive leading-none">
                {consumptionStats.totalConsumed.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-muted-foreground/50 mt-2">All-time user consumption volume</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Current Billing Cycle
                </p>
              </div>
              <p className="text-3xl font-bold tracking-tight text-foreground leading-none">
                {consumptionStats.monthlyConsumed.toLocaleString()}
              </p>
              <p className="text-xs font-semibold text-muted-foreground/50 mt-2">Credits used this month</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm shadow-sm flex flex-col justify-center">
            <CardContent className="p-4 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 border-b border-border/10 pb-1.5">
                Top Service Explanations
              </p>
              <div className="space-y-1.5">
                {consumptionStats.serviceBreakdown.slice(0, 3).map((item) => (
                  <div
                    key={item.service}
                    className="flex items-center justify-between text-xs font-semibold tracking-tight"
                  >
                    <span className="text-muted-foreground/70 lowercase capitalize">
                      {item.service.replace(/_/g, " ")}
                    </span>
                    <span className="font-mono font-bold text-foreground">{item.consumed} cr</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Ledger Control Table Surface */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
        <div className="h-1 w-full bg-gradient-to-r from-blue-400 via-indigo-500 to-blue-600" />
        <CardHeader className="p-6 border-b border-border/10">
          <div className="flex flex-col lg:flex-row gap-6 justify-between lg:items-center">
            <div className="flex gap-2 bg-muted/20 p-1 rounded-2xl border border-border/40 w-fit select-none">
              <button
                onClick={() => setSelectedTab("balances")}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-none",
                  selectedTab === "balances"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "hover:bg-muted/50 text-muted-foreground",
                )}
              >
                User Balances
              </button>
              <button
                onClick={() => setSelectedTab("transactions")}
                className={cn(
                  "px-6 py-2 rounded-xl text-xs font-bold transition-all shadow-none",
                  selectedTab === "transactions"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "hover:bg-muted/50 text-muted-foreground",
                )}
              >
                Transaction History Log
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-blue-500 transition-colors" />
                <Input
                  placeholder="Search matching accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-12 w-full sm:w-72 bg-muted/20 border border-border/40 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 space-y-4">
              <Skeleton className="h-12 w-full rounded-2xl bg-muted/20 border" />
              <Skeleton className="h-12 w-full rounded-2xl bg-muted/20 border" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b border-border/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold text-xs py-5 pl-8 text-muted-foreground">
                      {selectedTab === "balances" ? "Candidate Profile" : "Transaction Timestamp"}
                    </TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground">
                      {selectedTab === "balances" ? "Linked Email" : "Target User"}
                    </TableHead>
                    <TableHead className="font-bold text-xs text-muted-foreground">
                      {selectedTab === "balances" ? "Available Quota Balance" : "Fulfillment Type"}
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs pr-8 text-muted-foreground">
                      {selectedTab === "balances" ? "Quota Overrides" : "Balance Impact"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/40">
                  {selectedTab === "balances"
                    ? credits.map((credit) => (
                        <TableRow
                          key={credit.id}
                          className="group hover:bg-blue-500/[0.01] transition-colors duration-150"
                        >
                          <TableCell className="px-8 py-5 font-semibold text-sm text-foreground text-left">
                            {credit.talent?.full_name || "Unverified Account"}
                          </TableCell>
                          <TableCell className="text-left">
                            <span className="text-xs font-medium text-muted-foreground/70">
                              {credit.talent?.email || "—"}
                            </span>
                          </TableCell>
                          <TableCell className="text-left">
                            <Badge
                              variant="outline"
                              className="font-semibold text-xs border bg-background px-3 py-0.5 border-blue-500/20 text-blue-600 rounded-full shadow-none"
                            >
                              {credit.balance.toLocaleString()} credits
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex gap-2 justify-end opacity-40 group-hover:opacity-100 transition-opacity duration-150 select-none">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Grant Credits"
                                className="h-9 w-9 rounded-lg hover:bg-emerald-500 hover:text-white border border-border/40 transition-all"
                                onClick={() => setAdjustDialog({ open: true, talent: credit, type: "add" })}
                              >
                                <Plus className="h-4 w-4 shrink-0" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Deduct Credits"
                                className="h-9 w-9 rounded-lg hover:bg-destructive text-destructive hover:text-white border border-border/40 transition-all"
                                onClick={() => setAdjustDialog({ open: true, talent: credit, type: "deduct" })}
                              >
                                <Minus className="h-4 w-4 shrink-0" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    : transactions.map((tx) => (
                        <TableRow key={tx.id} className="group hover:bg-blue-500/[0.01] transition-colors duration-150">
                          <TableCell className="px-8 py-5 font-mono text-xs text-muted-foreground/70 text-left">
                            {format(new Date(tx.created_at), "dd MMM yyyy, HH:mm:ss")}
                          </TableCell>
                          <TableCell className="text-left">
                            <p className="font-semibold text-sm text-foreground">
                              {tx.talent?.full_name || "Platform Automations Loop"}
                            </p>
                          </TableCell>
                          <TableCell className="text-left">
                            <Badge
                              className={cn(
                                "rounded-full font-bold text-[10px] tracking-wide px-3 py-0.5 border-none shadow-none uppercase",
                                tx.amount > 0
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {tx.transaction_type?.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right pr-8 font-sans text-sm font-bold",
                              tx.amount > 0 ? "text-emerald-600" : "text-destructive",
                            )}
                          >
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount} cr
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Table Footer Frame Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-6 border-t border-border/40 bg-muted/5 select-none">
              <div className="space-y-0.5 text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  Data Window Navigation
                </p>
                <p className="text-sm font-bold text-foreground">
                  Page {page} <span className="text-xs font-medium text-muted-foreground/50">of</span> {totalPages}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous Page"
                  className="h-10 w-10 rounded-xl border border-border hover:bg-primary/5 transition-all"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Next Page"
                  className="h-10 w-10 rounded-xl border border-border hover:bg-primary/5 transition-all"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BALANCE MANIPULATION INTERCEPTOR MODAL */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => !open && setAdjustDialog({ open: false, type: "add" })}>
        <DialogContent className="max-w-xl rounded-2xl border border-border/40 bg-card p-0 overflow-hidden shadow-xl text-left animate-in fade-in duration-200">
          <div
            className={cn(
              "h-1.5 w-full",
              adjustDialog.type === "add"
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : "bg-gradient-to-r from-destructive/80 to-destructive",
            )}
          />
          <div className="p-8">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <Activity
                  className={cn(
                    "h-6 w-6 shrink-0",
                    adjustDialog.type === "add" ? "text-emerald-500" : "text-destructive",
                  )}
                />
                <div className="text-left">
                  <DialogTitle className="text-xl font-bold text-foreground">
                    {adjustDialog.type === "add" ? "Manual Credit Top-up" : "Manual Balance Deduction"}
                  </DialogTitle>
                  <DialogDescription className="text-xs font-medium text-muted-foreground mt-0.5">
                    Override parameters governing a candidate's available credit balance.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 py-2">
              <div className="p-5 rounded-xl border bg-muted/20 border-border/40 flex items-center justify-between text-xs font-semibold">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground/60 mb-1">Selected Candidate</p>
                  <p className="text-sm font-bold tracking-tight text-foreground leading-none">
                    {adjustDialog.talent?.talent?.full_name || "Unverified Profile"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-bold text-muted-foreground/60 mb-1">Current Balance</p>
                  <p className="text-sm font-bold tracking-tight text-blue-600 dark:text-blue-400 leading-none">
                    {adjustDialog.talent?.balance} credits
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 ml-0.5">Adjustment Value (Credits)</Label>
                <Input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 250"
                  className="h-11 rounded-xl border font-medium text-base bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 ml-0.5">
                  Administrative Balance Modification Reasoning
                </Label>
                <Textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Provide explicit operational context notes clarifying this quota override for administrative review hooks..."
                  rows={3}
                  className="rounded-xl border bg-muted/20 p-4 text-xs font-medium leading-relaxed"
                />
              </div>
            </div>

            <DialogFooter className="mt-8 pt-6 border-t border-border/40 gap-3">
              <Button
                variant="outline"
                onClick={() => setAdjustDialog({ open: false, type: "add" })}
                className="h-11 px-5 rounded-xl font-bold text-xs border border-border"
              >
                Go Back
              </Button>
              <Button
                onClick={handleAdjustCredits}
                disabled={isAdjusting || !adjustAmount}
                className={cn(
                  "h-11 px-5 rounded-xl font-bold text-xs flex items-center gap-2 text-white shadow-none",
                  adjustDialog.type === "add"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-destructive hover:bg-destructive/90",
                )}
              >
                {isAdjusting ? (
                  <RefreshCw className="animate-spin h-4 w-4 shrink-0" />
                ) : (
                  <Activity className="h-4 w-4 shrink-0" />
                )}{" "}
                Apply Sync
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TalentCreditsTab;
