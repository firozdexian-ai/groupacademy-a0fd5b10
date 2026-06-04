import { useFinOpsGraph } from "./hooks/useFinOpsGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Coins,
  Wallet,
  Building2,
  Receipt,
  Banknote,
  ArrowDownRight,
  ArrowUpRight,
  Activity,
  Clock,
} from "lucide-react";

/**
 * GroUp Academy: Finance Overview Controller Dashboard
 * 2024 Highly Professional SaaS UI presenting global ledger analytics, invoice histories, and payout requests.
 */
export function FinOverviewTab() {
  const { finOpsGraphQuery } = useFinOpsGraph();
  const { data, isLoading } = finOpsGraphQuery;

  // Ledger state aggregations mapping to global operational balances
  const totalTalentWallets = data?.talentWallets?.length || 0;
  const totalCompanyWallets = (data?.companyWallets?.length || 0) + (data?.gro10xWallets?.length || 0);
  const totalInvoices = data?.invoices?.length || 0;
  const pendingWithdrawals = data?.withdrawals?.filter((w) => w.status === "pending")?.length || 0;

  const latestInvoices = data?.invoices?.slice(0, 4) || [];
  const latestWithdrawals = data?.withdrawals?.slice(0, 4) || [];

  return (
    <div className="space-y-10 animate-in fade-in duration-300 p-4 md:p-6 text-left">
      {/* Executive Financial Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Coins className="h-8 w-8 text-primary fill-primary/10" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Financial Overview</h2>
          </div>
          <p className="text-xs font-medium text-muted-foreground/80">
            Real-time monitoring of platform revenue streams, user accounts, and payout cycles.
          </p>
        </div>
        <Badge
          variant="outline"
          className="h-12 px-6 rounded-xl font-semibold uppercase text-xs tracking-wider gap-2 border-primary/30 text-primary bg-primary/5 select-none"
        >
          <Activity className="h-4 w-4 animate-pulse" /> Live Balance Active
        </Badge>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl bg-muted/20 border border-border/10" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Main KPI Analytics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
            <MetricTile
              label="Active Candidates"
              value={totalTalentWallets}
              icon={Wallet}
              color="text-blue-600 dark:text-blue-400"
              bg="bg-blue-500/10"
            />
            <MetricTile
              label="Active Corporate Accounts"
              value={totalCompanyWallets}
              icon={Building2}
              color="text-emerald-600 dark:text-emerald-400"
              bg="bg-emerald-500/10"
            />
            <MetricTile
              label="Total Invoices"
              value={totalInvoices}
              icon={Receipt}
              color="text-fuchsia-600 dark:text-fuchsia-400"
              bg="bg-fuchsia-500/10"
            />
            <MetricTile
              label="Pending Payout Requests"
              value={pendingWithdrawals}
              icon={Banknote}
              color="text-orange-600 dark:text-orange-400"
              bg="bg-orange-500/10"
            />
          </div>

          {/* Historical Record Logs Feeds */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* INCOMING REVENUE STREAMS PANEL */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2 select-none">
                <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  Recent Credit Purchases
                </h3>
              </div>
              <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
                <CardContent className="p-0">
                  {latestInvoices.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground/60 font-medium text-xs">
                      No recent credit purchase transactions recorded.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {latestInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="p-5 flex items-center justify-between group hover:bg-emerald-500/[0.01] transition-colors duration-200"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
                              <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">
                                {inv.talent?.full_name || "Platform User"}
                              </p>
                              <p className="text-[11px] font-medium text-muted-foreground/70 tracking-tight">
                                Invoice #{inv.invoice_number}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 font-sans pl-2">
                            <Badge
                              className={cn(
                                "font-bold text-[10px] tracking-wide px-2.5 py-0.5 border-none shadow-none",
                                inv.status === "paid"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                                  : "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                              )}
                            >
                              +{inv.bundle_credits || 0} credits
                            </Badge>
                            <p className="text-[11px] font-medium text-muted-foreground/60 mt-1 flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3" /> {new Date(inv.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* OUTGOING PAYOUT REQUESTS PANEL */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2 select-none">
                <ArrowUpRight className="h-4 w-4 text-orange-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                  Recent Payout Disbursements
                </h3>
              </div>
              <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-rose-500" />
                <CardContent className="p-0">
                  {latestWithdrawals.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground/60 font-medium text-xs">
                      No recent user payout records found.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {latestWithdrawals.map((req) => (
                        <div
                          key={req.id}
                          className="p-5 flex items-center justify-between group hover:bg-orange-500/[0.01] transition-colors duration-200"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="h-11 w-11 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                              <Banknote className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-foreground truncate">
                                {req.talent?.full_name || "Platform Professional"}
                              </p>
                              <p className="text-[11px] font-medium text-muted-foreground/70 tracking-tight">
                                Route: {req.method}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 font-sans pl-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-bold text-[10px] tracking-wide px-2.5 py-0.5 shadow-none",
                                req.status === "completed"
                                  ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                                  : req.status === "pending"
                                    ? "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400"
                                    : "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400",
                              )}
                            >
                              -{req.amount_credits} credits
                            </Badge>
                            <p className="text-[11px] font-medium text-muted-foreground/60 mt-1 flex items-center justify-end gap-1">
                              <Clock className="h-3 w-3" /> {new Date(req.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

interface MetricTileProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  bg: string;
}

function MetricTile({ label, value, icon: Icon, color, bg }: MetricTileProps) {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card backdrop-blur-sm shadow-sm overflow-hidden hover:border-primary/20 transition-all duration-200 group">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border border-transparent transition-transform duration-300 group-hover:scale-105 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5 truncate">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight text-foreground/90">{value?.toLocaleString() || "0"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinOverviewTab;
