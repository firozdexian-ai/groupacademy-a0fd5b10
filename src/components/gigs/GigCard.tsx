import { useState } from "react";
import { Coins, ChevronRight, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GigSubmissionForm } from "./GigSubmissionForm";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

// CTO FIX: Unified interface to match GigSubmissionForm requirements
interface Gig {
  id: string;
  title: string;
  description: string;
  category: string; // The missing required property
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

  // Fallback to a safe icon if mapping fails
  const Icon = getIcon(gig.icon);

  // Logic for completion thresholds and state management
  const totalSubmitted = userSubmissions?.total || 0;
  const pendingCount = userSubmissions?.pending || 0;
  const maxAllowed = gig.max_completions_per_user || Infinity;
  const isMaxed = totalSubmitted >= maxAllowed;
  const hasPending = pendingCount > 0;

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden transition-all duration-500 rounded-[28px] border border-border/40 p-5",
          isMaxed
            ? "bg-muted/40 grayscale-[0.5]"
            : "bg-card/50 backdrop-blur-sm hover:shadow-2xl hover:border-primary/30",
        )}
      >
        {/* Visual flair for high-value rewards */}
        {gig.credit_reward >= 50 && (
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <ShieldAlert className="h-16 w-16 text-primary rotate-12" />
          </div>
        )}

        <div className="flex items-start gap-4">
          {/* Hero Icon Container */}
          <div
            className={cn(
              "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500",
              isMaxed
                ? "bg-muted text-muted-foreground"
                : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white group-hover:scale-110 shadow-inner",
            )}
          >
            <Icon className="h-6 w-6" />
          </div>

          <div className="flex-1 min-w-0 space-y-3">
            {/* Gig Info Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-black text-sm tracking-tight leading-tight line-clamp-1 group-hover:text-primary transition-colors">
                  {gig.title}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Badge className="bg-amber-500/10 text-amber-600 border-none text-[10px] font-black uppercase tracking-widest px-2 h-5">
                    <Coins className="h-3 w-3 mr-1" />+{gig.credit_reward} Credits
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description & Requirements */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-2">
                {gig.description}
              </p>
              {gig.requirements && (
                <p className="text-[10px] font-bold text-muted-foreground/40 italic uppercase tracking-tighter">
                  Condition: {gig.requirements}
                </p>
              )}
            </div>

            {/* Progress and Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border/30">
              <div className="flex flex-col">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  {totalSubmitted > 0 ? `${totalSubmitted} Submissions` : "Unclaimed Gig"}
                </p>
                {maxAllowed !== Infinity && (
                  <p className="text-[8px] font-bold text-muted-foreground/40 uppercase">
                    Limit: {totalSubmitted}/{maxAllowed}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isMaxed ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[10px] font-black uppercase tracking-widest h-8 px-3">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Maxed Out
                  </Badge>
                ) : (
                  <>
                    {hasPending && (
                      <Badge
                        variant="outline"
                        className="border-primary/20 text-primary text-[9px] font-black uppercase tracking-tighter h-8 px-2 animate-pulse"
                      >
                        <Clock className="h-3 w-3 mr-1" /> {pendingCount} Pending
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setShowForm(true)}
                      className="rounded-xl h-8 px-4 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/10 transition-all active:scale-95"
                    >
                      Start Task <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Orchestrator Modal */}
      <GigSubmissionForm gig={gig} open={showForm} onOpenChange={setShowForm} />
    </>
  );
}
