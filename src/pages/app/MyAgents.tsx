import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
 listOwnedAiAgentsForTalent,
 listTalentAgentMarketplaceEarnings,
 listAgentPayoutRequestsForTalent,
 getTalentMarketplaceSummary,
} from "@/domains/agents/repo/agentsRepo";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Bot, TrendingUp, Coins, Wallet, PlusCircle, Rocket, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CreatorOnboardingDialog } from "@/domains/agents/components/talent/CreatorOnboardingDialog";
import { PayoutDialog } from "@/domains/agents/components/talent/PayoutDialog"; // Recommended extraction
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";
import { ComingSoonGate } from "@/components/launch/ComingSoonGate";

// =========================================================================
// DETERMINISTIC CONTRACTS
// =========================================================================
interface SummaryRecord {
 lifetime_earned: number;
 paid_out: number;
 pending_payout: number;
 available: number;
}

export default function MyAgents() {
 const { talent } = useTalent();
 const queryClient = useQueryClient();
 const [isOnboardingOpen, setIsOnboardingOpen] = React.useState(false);

 // Unified dashboard state fetching
 const {
 data: dashboardData,
 isLoading,
 refetch,
 } = useQuery({
 queryKey: ["talent-agent-dashboard", talent?.id],
 enabled: !!talent?.id,
 queryFn: async () => {
 const [agents, earnings, payouts, summary] = await Promise.all([
 listOwnedAiAgentsForTalent(talent!.id),
 listTalentAgentMarketplaceEarnings(talent!.id, 100),
 listAgentPayoutRequestsForTalent(talent!.id),
 getTalentMarketplaceSummary(),
 ]);

 return {
 agents: agents ?? [],
 earnings: earnings ?? [],
 payouts: payouts ?? [],
 summary: summary as SummaryRecord,
 };
 },
 });

 if (isLoading)
 return (
 <InlineSpinner size="lg" />
 );
 if (!dashboardData) return null;

 const { agents, earnings, payouts, summary } = dashboardData;

 return (
 <div className="container max-w-5xl py-6 space-y-5 pb-24">
 <header className="flex items-start justify-between">
 <div>
 <h1 className="text-2xl font-bold flex items-center gap-2">
 <Bot className="h-6 w-6 text-primary" /> My Agents
 </h1>
 <p className="text-sm text-muted-foreground">Build, publish and earn.</p>
 </div>
 </header>

 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
 <SummaryTile
 label="Lifetime Earned"
 value={summary.lifetime_earned}
 icon={<TrendingUp className="h-4 w-4" />}
 />
 <SummaryTile
 label="Available"
 value={summary.available}
 icon={<Coins className="h-4 w-4" />}
 accent="text-emerald-500"
 />
 <SummaryTile label="Pending" value={summary.pending_payout} icon={<Wallet className="h-4 w-4" />} />
 <SummaryTile label="Paid Out" value={summary.paid_out} icon={<Wallet className="h-4 w-4" />} />
 </div>

 <div className="flex flex-wrap gap-2">
 <CreatorOnboardingDialog
 open={isOnboardingOpen}
 onOpenChange={setIsOnboardingOpen}
 onCreated={() => {
 queryClient.invalidateQueries({ queryKey: ["talent-agent-dashboard"] });
 setIsOnboardingOpen(false);
 }}
 />
 <Button onClick={() => setIsOnboardingOpen(true)}>
 <Rocket className="h-4 w-4 mr-2" />
 Become a builder
 </Button>
 <PayoutDialog
 available={summary.available}
 onCreated={() => queryClient.invalidateQueries({ queryKey: ["talent-agent-dashboard"] })}
 />
 </div>

 <Tabs defaultValue="agents">
 <TabsList>
 <TabsTrigger value="agents">My agents ({agents.length})</TabsTrigger>
 <TabsTrigger value="earnings">Earnings</TabsTrigger>
 <TabsTrigger value="payouts">Payouts</TabsTrigger>
 </TabsList>

 <TabsContent value="agents" className="space-y-4">
 {agents.length === 0 ? (
 <Card className="p-8 text-center space-y-4 border-dashed">
 <Bot className="h-12 w-12 mx-auto text-muted-foreground animate-pulse" />
 <div className="space-y-2">
 <h3 className="font-semibold text-lg">No AI Agents Yet</h3>
 <p className="text-sm text-muted-foreground max-w-sm mx-auto">
 You haven't built any AI agents yet. Click "Become a builder" to submit your first agent. Once submitted, it will appear here as "Pending Review" until approved by our admins.
 </p>
 </div>
 <Button onClick={() => setIsOnboardingOpen(true)} variant="outline" size="sm">
 <PlusCircle className="h-4 w-4 mr-2" />
 Create Agent
 </Button>
 </Card>
 ) : (
 agents.map((a: any) => (
 <Card key={a.id} className="p-5 space-y-3 hover:shadow-sm transition-shadow">
 <div className="flex items-start justify-between">
 <div className="space-y-1">
 <h3 className="font-semibold text-base flex items-center gap-2">
 {a.name}
 <Badge className={cn("text-[10px] font-semibold px-2 py-0.5 border-none rounded-full select-none", getStatusBadgeStyles(a.marketplace_status))}>
 {getStatusLabel(a.marketplace_status)}
 </Badge>
 </h3>
 <p className="text-xs text-muted-foreground">{a.description}</p>
 </div>
 {a.marketplace_status === "approved" && (
 <Button asChild size="sm" variant="outline">
 <Link to={`/app/agents/${a.agent_key}`}>Chat</Link>
 </Button>
 )}
 </div>
 {a.review_notes && (
 <div className="p-3 rounded-md bg-amber-50/50 border border-amber-100/50 text-xs text-amber-800 space-y-1 text-left">
 <span className="font-semibold block">Reviewer Feedback:</span>
 <p className="leading-relaxed">{a.review_notes}</p>
 </div>
 )}
 </Card>
 ))
 )}
 </TabsContent>
  <TabsContent value="earnings" className="space-y-3">
   <ComingSoonGate
    featureKey="my-agents-earnings"
    title="Earnings ledger coming soon"
    description="A per-agent earnings ledger with daily roll-ups is on the way. Join the waitlist and we'll ping you the moment it opens."
    secondaryCtaLabel="Back to agents"
    secondaryCtaHref="/app/my-agents"
   />
  </TabsContent>
  <TabsContent value="payouts" className="space-y-3">
   <ComingSoonGate
    featureKey="my-agents-payouts"
    title="Payouts dashboard coming soon"
    description="Self-serve payout history and statements land here next. Until then, request a payout using the button above and we'll process it manually."
    secondaryCtaLabel="Back to agents"
    secondaryCtaHref="/app/my-agents"
   />
  </TabsContent>
  </Tabs>
 </div>
 );
}

function SummaryTile({
 icon,
 label,
 value,
 accent,
}: {
 icon: React.ReactNode;
 label: string;
 value: number;
 accent?: string;
}) {
 return (
 <Card>
 <CardContent className="p-3">
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 {icon}
 {label}
 </div>
 <div className={cn("text-xl font-bold mt-1", accent)}>{Number(value).toFixed(1)}</div>
 </CardContent>
 </Card>
 );
}

function getStatusBadgeStyles(status: string | null | undefined): string {
  switch (status) {
    case "approved":
      return "bg-emerald-500/10 text-emerald-700";
    case "pending":
      return "bg-amber-500/10 text-amber-700";
    case "rejected":
      return "bg-rose-500/10 text-rose-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "approved":
      return "Approved";
    case "pending":
      return "Pending Review";
    case "rejected":
      return "Rejected";
    default:
      return "Draft";
  }
}
