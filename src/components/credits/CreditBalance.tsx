import { Coins, Zap, ShieldCheck, TrendingUp } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Fiscal Asset HUD (CreditBalance)
 * CTO Reference: Authoritative component for credit registry visualization.
 */

interface CreditBalanceProps {
  variant?: "default" | "compact" | "full" | "vault";
  onClick?: () => void;
  className?: string;
}

export function CreditBalance({ variant = "default", onClick, className }: CreditBalanceProps) {
  const { balance, earnedBalance, freeBalance, isLoading } = useCredits();

  if (isLoading) {
    return <Skeleton className="h-10 w-24 rounded-xl opacity-20" />;
  }

  // HUD: COMPACT_INGRESS (Navbar Integration)
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/5 border border-warning/20",
          className,
        )}
      >
        <Coins className="h-4 w-4 text-warning fill-current animate-pulse" />
        <span className="font-black text-xs italic tabular-nums tracking-tighter text-warning">{balance}</span>
      </div>
    );
  }

  // HUD: FULL_REGISTRY (Wallet / Profile View)
  if (variant === "full" || variant === "vault") {
    return (
      <div
        className={cn(
          "relative overflow-hidden space-y-4 p-5 rounded-[24px] border-2 backdrop-blur-xl transition-all duration-500",
          "bg-card/30 border-border/40 shadow-2xl",
          className,
        )}
      >
        {/* ATMOSPHERIC_GLOW */}
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-warning/10 blur-[64px] rounded-full pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase italic tracking-[0.2em] text-muted-foreground/60">
              Registry_Total
            </span>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-warning/10 border border-warning/20">
                <Coins className="h-5 w-5 text-warning" />
              </div>
              <span className="text-3xl font-black italic tracking-tighter tabular-nums text-foreground">
                {balance}
              </span>
            </div>
          </div>
          {variant === "vault" && (
            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 animate-in zoom-in-95">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 pt-4 border-t border-border/10">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 group transition-all hover:border-emerald-500/30">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600/80">Earned_Assets</span>
            </div>
            <span className="font-black italic tabular-nums text-emerald-500 text-sm">{earnedBalance}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/5 border border-sky-500/10 group transition-all hover:border-sky-500/30">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-sky-500 fill-current" />
              <span className="text-[9px] font-black uppercase tracking-widest text-sky-600/80">Grant_Ingress</span>
            </div>
            <span className="font-black italic tabular-nums text-sky-500 text-sm">{freeBalance}</span>
          </div>
        </div>
      </div>
    );
  }

  // HUD: DEFAULT_INTERACTIVE (Trigger Button)
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-11 px-4 rounded-2xl gap-3 bg-muted/10 border-2 border-border/40 transition-all hover:bg-muted/20 active:scale-95",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-center h-6 w-6 rounded-lg bg-warning/10 shadow-inner">
        <Coins className="h-4 w-4 text-warning fill-current" />
      </div>
      <div className="flex flex-col items-start leading-none">
        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/40">Sync_Balance</span>
        <span className="text-sm font-black italic tracking-tighter tabular-nums text-foreground">{balance}</span>
      </div>
    </Button>
  );
}
