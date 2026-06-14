import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Coins, Zap, ShieldCheck, ArrowUpRight, Plus, History, Building2, Sparkles, MessageCircle } from "lucide-react";
import { SUPPORT_CONFIG } from "@/lib/constants/support";

/**
 * GroUp Academy: Gro10x Corporate Credit Management Dashboard
 * Enterprise self-service portal for managing workspace balances, team credit allowances, and agent logs.
 */
export function Gro10xCreditsTab() {
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

  // Mock corporate ledger balances - replaces the original placeholder text with production structure
  const companyBalance = {
    totalAllocated: 5000,
    usedThisMonth: 1240,
    availableBalance: 3760,
    renewalDate: "01 Jul 2026",
    workspaceName: "Acme Corp Enterprise",
  };

  const usageBreakdown = [
    { name: "Automated Sourcing Agent Runs", amount: 650, color: "bg-blue-500" },
    { name: "Candidate Contact Unlocks", amount: 440, color: "bg-purple-500" },
    { name: "Technical Escrow Project Runs", amount: 150, color: "bg-amber-500" },
  ];

  const recentTransactions = [
    {
      id: "TX-9021",
      type: "Agent Execution",
      detail: "Talent Matcher Run - Senior React Dev",
      cost: -10,
      date: "Today, 14:22",
    },
    {
      id: "TX-9018",
      type: "Contact Unlock",
      detail: "Unlocked credentials for Candidate #2401",
      cost: -15,
      date: "Yesterday, 09:15",
    },
    {
      id: "TX-8992",
      type: "Wallet Top-up",
      detail: "Enterprise Balance Grant Invoice #4810",
      cost: 2500,
      date: "02 Jun 2026",
    },
  ];

  const handleEnterpriseTopUp = () => {
    const outboundMessagePayload = encodeURIComponent(
      `Hello Billing Team, I would like to request a credit top-up/custom quota adjustment for our B2B Enterprise Workspace: ${companyBalance.workspaceName}.`,
    );
    window.open(`${SUPPORT_CONFIG.WHATSAPP_LINK}?text=${outboundMessagePayload}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      {/* Balance Summary Header Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 relative overflow-hidden border border-border/40 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Workspace Credit Management
                </CardTitle>
                <CardDescription>
                  Manage enterprise team credit allocations, background automations, and corporate talent acquisition
                  tiers.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-primary/5 text-primary border-primary/20 gap-1.5 px-3 py-1 font-semibold text-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Enterprise Tier
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2 border-t border-border/10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Available Credits
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-foreground">
                    {companyBalance.availableBalance.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">cr</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Allocated Monthly Limit
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tracking-tight text-foreground/70">
                    {companyBalance.totalAllocated.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">cr</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60 mb-1">
                  Next Rollover Date
                </p>
                <p className="text-lg font-semibold text-foreground/80 mt-1">{companyBalance.renewalDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Panel */}
        <Card className="border border-border/40 bg-gradient-to-br from-primary/5 via-card to-card rounded-2xl shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Instant Add-ons
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Need additional high-capacity recruitment cycles or bulk contact unseals?
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <Button
              onClick={handleEnterpriseTopUp}
              className="w-full h-11 font-bold text-xs tracking-wide gap-2 rounded-xl mt-2 shadow-sm"
            >
              <Plus className="h-4 w-4" /> Request Custom Allocation
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Breakdown & Recent Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Usage Breakdown */}
        <Card className="lg:col-span-2 border border-border/40 bg-card rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" /> Allocation Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-muted-foreground">Total Consumption</span>
                <span className="font-bold text-foreground">
                  {companyBalance.usedThisMonth} / {companyBalance.totalAllocated} credits used
                </span>
              </div>
              <Progress
                value={(companyBalance.usedThisMonth / companyBalance.totalAllocated) * 100}
                className="h-2 rounded-full"
              />
            </div>

            <div className="pt-4 border-t border-border/10 space-y-3.5">
              {usageBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`h-2.5 w-2.5 rounded-full ${item.color} shrink-0`} />
                    <span className="text-xs font-medium text-muted-foreground truncate">{item.name}</span>
                  </div>
                  <span className="text-xs font-bold text-foreground shrink-0 pl-2">{item.amount} cr</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transaction History Log */}
        <Card className="lg:col-span-3 border border-border/40 bg-card rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" /> Workspace Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40 border-t border-border/40">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 flex items-center justify-between group hover:bg-muted/10 transition-colors duration-150"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        tx.cost < 0
                          ? "bg-muted border-border/50 text-muted-foreground"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600"
                      }`}
                    >
                      <Coins className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">{tx.detail}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-medium">
                        <span className="uppercase">{tx.type}</span>
                        <span>•</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={`text-xs font-bold tracking-tight ${tx.cost < 0 ? "text-foreground" : "text-emerald-600"}`}
                    >
                      {tx.cost > 0 ? `+${tx.cost}` : tx.cost} cr
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Human-in-the-loop Account Manager Support Shortcut */}
            <div className="p-4 border-t border-border/40 bg-muted/20 text-center">
              <button
                onClick={handleEnterpriseTopUp}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Need a historical ledger audit statement? Contact Support
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Gro10xCreditsTab;

