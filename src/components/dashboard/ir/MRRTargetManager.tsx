import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, RefreshCw, Lock, Calendar } from "lucide-react";
import { 
  IR_CONFIG, 
  formatUSD, 
  creditsToUsd,
  calculateServiceTargets,
  calculateAutoKPIs,
  type ServiceMix,
  type ServiceKey,
} from "@/lib/irConfig";

export function MRRTargetManager() {
  const queryClient = useQueryClient();
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  const [mrrTarget, setMrrTarget] = useState<number>(0);
  const [serviceMix, setServiceMix] = useState<ServiceMix>(IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix);
  const [targetPayingUsers, setTargetPayingUsers] = useState<number>(0);
  const [targetChurnRate, setTargetChurnRate] = useState<number>(5);
  const [notes, setNotes] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Fetch current target
  const { data: target, isLoading } = useQuery({
    queryKey: ["ir-target", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_monthly_targets")
        .select("*")
        .eq("month", currentMonth)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setMrrTarget(Number(data.mrr_target_usd) || 0);
        setServiceMix((data.service_mix as ServiceMix) || (IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix));
        setTargetPayingUsers(data.target_paying_users || 0);
        setTargetChurnRate(Number(data.target_churn_rate) || 5);
        setNotes(data.notes || "");
      }
      
      return data;
    },
  });
  
  // Fetch current month credit usage (for close month)
  const { data: creditUsage } = useQuery({
    queryKey: ["ir-credit-usage-close", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("amount, service_type, talent_id")
        .in("transaction_type", ["service_usage", "usage"])
        .gte("created_at", startOfMonth.toISOString());
      
      if (error) throw error;
      
      const totalCredits = data?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      
      const byService: Record<string, number> = {};
      data?.forEach((t) => {
        if (t.service_type) {
          byService[t.service_type] = (byService[t.service_type] || 0) + Math.abs(t.amount);
        }
      });
      
      const activeTalents = new Set(data?.map(d => d.talent_id).filter(Boolean)).size;
      
      return { totalCredits, byService, activeTalents };
    },
  });
  
  // Fetch total talents count
  const { data: totalTalentsCount } = useQuery({
    queryKey: ["ir-total-talents-close"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("talents")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });
  
  // Save target mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        month: currentMonth,
        mrr_target_usd: mrrTarget,
        service_mix: serviceMix,
        target_paying_users: targetPayingUsers,
        target_churn_rate: targetChurnRate,
        notes: notes || null,
      };
      
      if (target?.id) {
        const { error } = await supabase
          .from("ir_monthly_targets")
          .update(payload)
          .eq("id", target.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ir_monthly_targets")
          .insert(payload);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Target saved successfully");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["ir-target"] });
    },
    onError: (error) => {
      toast.error("Failed to save target: " + error.message);
    },
  });
  
  // Close month mutation
  const closeMonthMutation = useMutation({
    mutationFn: async () => {
      if (!target?.id) throw new Error("No target to close");
      
      const actualCredits = creditUsage?.totalCredits || 0;
      const actualMrr = creditsToUsd(actualCredits);
      
      // Update the target with actuals
      const { error: updateError } = await supabase
        .from("ir_monthly_targets")
        .update({
          actual_mrr_usd: actualMrr,
          actual_credits_consumed: actualCredits,
          total_talents: totalTalentsCount,
          active_talents: creditUsage?.activeTalents || 0,
          service_actuals: creditUsage?.byService || {},
          is_closed: true,
          closed_at: new Date().toISOString(),
        })
        .eq("id", target.id);
      
      if (updateError) throw updateError;
      
      // Also create a snapshot in ir_metrics_snapshots
      const { error: snapshotError } = await supabase
        .from("ir_metrics_snapshots")
        .upsert({
          snapshot_date: currentMonth,
          mrr_usd: actualMrr,
          arr_usd: actualMrr * 12,
          total_credits_consumed: actualCredits,
          paying_users: creditUsage?.activeTalents || 0,
          total_users: totalTalentsCount,
          service_breakdown: creditUsage?.byService || {},
        }, { onConflict: "snapshot_date" });
      
      if (snapshotError) throw snapshotError;
    },
    onSuccess: () => {
      toast.success("Month closed and snapshot saved!");
      queryClient.invalidateQueries({ queryKey: ["ir-target"] });
      queryClient.invalidateQueries({ queryKey: ["ir-historical-targets"] });
    },
    onError: (error) => {
      toast.error("Failed to close month: " + error.message);
    },
  });
  
  const handleMixChange = (service: ServiceKey, value: number) => {
    setServiceMix((prev) => ({ ...prev, [service]: value }));
    setHasChanges(true);
  };
  
  const resetToDefaults = () => {
    setServiceMix(IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix);
    setHasChanges(true);
  };
  
  const totalMixPercent = Object.values(serviceMix).reduce((sum, v) => sum + v, 0);
  const serviceTargets = calculateServiceTargets(mrrTarget, serviceMix);
  const autoKPIs = calculateAutoKPIs(mrrTarget, targetPayingUsers > 0 ? mrrTarget / targetPayingUsers : 20);
  const totalCreditsTarget = mrrTarget * IR_CONFIG.USD_TO_CREDITS;
  const currentCredits = creditUsage?.totalCredits || 0;
  const currentMRR = creditsToUsd(currentCredits);
  const isClosed = target?.is_closed || false;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MRR Targets</h2>
          <p className="text-muted-foreground">
            Set monthly revenue targets and service mix for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isClosed && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span className="text-sm">Month Closed</span>
            </div>
          )}
          {target && !isClosed && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <Calendar className="mr-2 h-4 w-4" />
                  Close Month
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close This Month?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will save the current metrics as final results for{' '}
                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}:
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Actual MRR: {formatUSD(currentMRR)}</li>
                      <li>• Credits Used: {currentCredits.toLocaleString()}</li>
                      <li>• Active Users: {creditUsage?.activeTalents || 0}</li>
                      <li>• Total Talents: {totalTalentsCount}</li>
                    </ul>
                    <p className="mt-2 font-medium">This action cannot be undone.</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => closeMonthMutation.mutate()}
                    disabled={closeMonthMutation.isPending}
                  >
                    {closeMonthMutation.isPending ? "Closing..." : "Close & Save Snapshot"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button 
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !hasChanges || isClosed}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Target
          </Button>
        </div>
      </div>
      
      {/* MRR Input */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Target</CardTitle>
          <CardDescription>
            Set your MRR goal in USD. Service targets will be auto-calculated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mrr">MRR Target (USD)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="mrr"
                  type="number"
                  value={mrrTarget}
                  onChange={(e) => {
                    setMrrTarget(Number(e.target.value));
                    setHasChanges(true);
                  }}
                  placeholder="2000"
                  min={0}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="users">Target Paying Users</Label>
              <Input
                id="users"
                type="number"
                value={targetPayingUsers}
                onChange={(e) => {
                  setTargetPayingUsers(Number(e.target.value));
                  setHasChanges(true);
                }}
                placeholder="100"
                min={0}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="churn">Target Churn Rate (%)</Label>
              <Input
                id="churn"
                type="number"
                value={targetChurnRate}
                onChange={(e) => {
                  setTargetChurnRate(Number(e.target.value));
                  setHasChanges(true);
                }}
                placeholder="5"
                min={0}
                max={100}
                step={0.5}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Total Credits Target</Label>
              <div className="text-2xl font-bold">
                {totalCreditsTarget.toLocaleString()} credits
              </div>
              <p className="text-xs text-muted-foreground">
                {formatUSD(mrrTarget)} × 50 credits/$
              </p>
            </div>
          </div>
          
          {/* Auto KPIs */}
          {mrrTarget > 0 && (
            <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">ARR Target</p>
                <p className="text-lg font-semibold">{formatUSD(autoKPIs.arrUsd)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Required Users</p>
                <p className="text-lg font-semibold">{autoKPIs.requiredPayingUsers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">LTV Estimate</p>
                <p className="text-lg font-semibold">{formatUSD(autoKPIs.ltvEstimate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CAC Ceiling</p>
                <p className="text-lg font-semibold">{formatUSD(autoKPIs.cacCeiling)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Service Mix */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Service Mix Configuration</CardTitle>
            <CardDescription>
              Adjust expected usage distribution across services (Total: {totalMixPercent}%)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {(Object.keys(IR_CONFIG.SERVICE_LABELS) as ServiceKey[]).map((service) => {
              const target = serviceTargets.find((s) => s.service === service);
              const mixValue = serviceMix[service] || 0;
              
              return (
                <div key={service} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{IR_CONFIG.SERVICE_LABELS[service]}</Label>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{target?.usageTarget.toLocaleString() || 0} uses</span>
                      <span>{target?.creditTarget.toLocaleString() || 0} credits</span>
                      <span className="w-16 text-right font-medium">
                        {formatUSD(target?.revenueUsd || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[mixValue]}
                      onValueChange={([v]) => handleMixChange(service, v)}
                      max={50}
                      step={1}
                      className="flex-1"
                    />
                    <div className="w-16 flex items-center gap-1">
                      <Input
                        type="number"
                        value={mixValue}
                        onChange={(e) => handleMixChange(service, Number(e.target.value))}
                        className="h-8 text-center"
                        min={0}
                        max={100}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {IR_CONFIG.SERVICE_COSTS[service]} credits per use
                  </div>
                </div>
              );
            })}
          </div>
          
          {totalMixPercent !== 100 && (
            <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
              Note: Mix percentages total {totalMixPercent}%. Consider adjusting to reach 100%.
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>
            Add context or assumptions for this month's targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setHasChanges(true);
            }}
            placeholder="E.g., Expecting higher AI Agent usage due to new marketing campaign..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
