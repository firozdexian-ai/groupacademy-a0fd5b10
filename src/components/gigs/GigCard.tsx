import { useState } from "react";
import { Coins, ChevronRight, CheckCircle2, Clock, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GigSubmissionForm } from "./GigSubmissionForm";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

/**
 * Compact, mobile-first gig row.
 * Tap anywhere on the row to open the submission sheet.
 */
interface Gig {
  id: string;
  title: string;
  description: string;
  category: string;
  requirements?: string;
  credit_reward: number;
  icon: string;
  max_completions_per_user?: number | null;
}

interface GigCardProps {
  gig: Gig;
  userSubmissions?: { total: number; pending: number };
}

export function GigCard({ gig, userSubmissions }: GigCardProps) {
  const [showForm, setShowForm] = useState(false);
  const Icon = getIcon(gig.icon);

  const totalSubmitted = userSubmissions?.total || 0;
  const pendingCount = userSubmissions?.pending || 0;
  const maxAllowed = gig.max_completions_per_user || Infinity;
  const isMaxed = totalSubmitted >= maxAllowed;
  const hasPending = pendingCount > 0;

  return (
    <>
      <button
        type="button"
        disabled={isMaxed}
        onClick={() => setShowForm(true)}
        className={cn(
          "group w-full text-left rounded-2xl border bg-card/60 backdrop-blur-sm transition-all",
          "px-3 py-3 sm:px-4 sm:py-3.5 active:scale-[0.99]",
          isMaxed
            ? "border-border/30 opacity-60 cursor-not-allowed"
            : "border-border/50 hover:border-primary/40 hover:shadow-md",
        )}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={cn(
              "h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center shrink-0",
              isMaxed ? "bg-muted text-muted-foreground/40" : "bg-primary/10 text-primary",
            )}
          >
            <Icon className="h-5 w-5" />
          </div>

          {/* Body */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm leading-tight truncate">{gig.title}</h3>
              {gig.credit_reward >= 15 && !isMaxed && (
                <Zap className="h-3 w-3 text-amber-500 shrink-0 fill-current" />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{gig.description}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 text-[10px] font-bold px-1.5 py-0 h-5 gap-1">
                <Coins className="h-2.5 w-2.5" />+{gig.credit_reward}
              </Badge>
              {maxAllowed !== Infinity && (
                <span className="text-[10px] text-muted-foreground/60 font-medium tabular-nums">
                  {totalSubmitted}/{maxAllowed}
                </span>
              )}
              {hasPending && !isMaxed && (
                <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                  <Clock className="h-2.5 w-2.5" /> {pendingCount} pending
                </span>
              )}
              {isMaxed && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-3 w-3" /> Done
                </span>
              )}
            </div>
          </div>

          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              isMaxed ? "text-muted-foreground/30" : "text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5",
            )}
          />
        </div>
      </button>

      <GigSubmissionForm gig={gig} open={showForm} onOpenChange={setShowForm} />
    </>
  );
}
