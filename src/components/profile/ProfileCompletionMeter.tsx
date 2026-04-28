import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Circle,
  ChevronRight,
  Zap,
  Target,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { TalentProfile } from "@/contexts/TalentContext";

/**
 * GroUp Academy: Talent Readiness Telemetry
 * CTO Reference: Authoritative node for profile completeness and data ingress orchestration.
 */

interface ProfileCompletionMeterProps {
  talent: TalentProfile;
  variant?: "full" | "compact" | "mini";
  showActions?: boolean;
}

interface CompletionItem {
  key: string;
  label: string;
  icon: React.ElementType;
  isComplete: boolean;
  action: string;
  priority: number;
}

export function ProfileCompletionMeter({ talent, variant = "full", showActions = true }: ProfileCompletionMeterProps) {
  const navigate = useNavigate();

  const completionItems = useMemo((): CompletionItem[] => {
    return [
      {
        key: "photo",
        label: "Identity Node",
        icon: User,
        isComplete: !!talent.profilePhotoUrl,
        action: "Provision profile photo",
        priority: 1,
      },
      {
        key: "cv",
        label: "Artifact Sync (CV)",
        icon: FileText,
        isComplete: !!talent.cvUrl,
        action: "Deploy CV artifact",
        priority: 2,
      },
      {
        key: "experience",
        label: "Professional Ledger",
        icon: Briefcase,
        isComplete: !!(talent.experience && talent.experience.length > 0),
        action: "Sync professional history",
        priority: 3,
      },
      {
        key: "education",
        label: "Academic Registry",
        icon: GraduationCap,
        isComplete: !!(talent.education && talent.education.length > 0),
        action: "Log educational nodes",
        priority: 4,
      },
      {
        key: "skills",
        label: "Skill Matrix",
        icon: Sparkles,
        isComplete: !!(talent.skills && talent.skills.length >= 3),
        action: "Initialize skill matrix (min 3)",
        priority: 5,
      },
    ];
  }, [talent]);

  const completedCount = completionItems.filter((item) => item.isComplete).length;
  const totalCount = completionItems.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const nextAction = useMemo(() => {
    return completionItems.filter((item) => !item.isComplete).sort((a, b) => a.priority - b.priority)[0];
  }, [completionItems]);

  const handleEditHandshake = () => {
    navigate("/app/profile/edit");
  };

  // VARIANT: MINI PROTOCOL (Hardware-Accelerated Ring)
  if (variant === "mini") {
    return (
      <div className="relative w-14 h-14 group cursor-pointer" onClick={handleEditHandshake}>
        <svg className="w-14 h-14 transform -rotate-90">
          <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted/20" />
          <circle
            cx="28"
            cy="28"
            r="24"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${percentage * 1.508} 150.8`}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000 ease-in-out",
              percentage >= 80 ? "text-emerald-500" : percentage >= 50 ? "text-amber-500" : "text-primary",
            )}
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-black italic tracking-tighter leading-none">{percentage}%</span>
          <span className="text-[6px] font-bold opacity-40 uppercase tracking-widest mt-0.5">Ready</span>
        </span>
      </div>
    );
  }

  // VARIANT: COMPACT INGRESS (Feed/Dashboard Banner)
  if (variant === "compact") {
    if (percentage >= 100) return null;

    return (
      <Card
        className="cursor-pointer border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all rounded-[24px] shadow-xl overflow-hidden"
        onClick={handleEditHandshake}
      >
        <CardContent className="py-4 px-6">
          <div className="flex items-center gap-5">
            <div className="relative h-12 w-12 flex-shrink-0">
              <svg className="w-12 h-12 transform -rotate-90">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  className="text-muted/20"
                />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${percentage * 1.256} 125.6`}
                  strokeLinecap="round"
                  className="text-primary"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black italic">
                {percentage}%
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[11px] font-black uppercase italic tracking-widest text-primary leading-none mb-1">
                Incomplete_Trajectory
              </p>
              <p className="text-sm font-bold text-foreground truncate">
                {nextAction ? nextAction.action : "Complete professional nodes"}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // VARIANT: FULL AUDIT (Checklist Interface)
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-md shadow-2xl overflow-hidden">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b border-border/10">
          <div className="relative h-24 w-24 flex-shrink-0">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted/10"
              />
              <circle
                cx="48"
                cy="48"
                r="42"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${percentage * 2.639} 263.9`}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-[1500ms] ease-out",
                  percentage >= 80 ? "text-emerald-500" : percentage >= 50 ? "text-amber-500" : "text-primary",
                )}
              />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black italic tracking-tighter">{percentage}%</span>
              <span className="text-[8px] font-bold opacity-40 uppercase tracking-widest leading-none">Status</span>
            </span>
          </div>
          <div className="flex-1 text-left space-y-2">
            <div className="flex items-center gap-3">
              <h3 className="font-black text-2xl uppercase italic tracking-tighter">
                {percentage >= 100 ? "NODE_SYNCED_OK" : "SYSTEM_READINESS"}
              </h3>
              {percentage >= 100 && (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-3 font-black italic text-[10px]">
                  Verified
                </Badge>
              )}
            </div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest italic leading-relaxed opacity-70">
              {percentage >= 100
                ? "Your professional identity is fully synchronized for matching."
                : `${totalCount - completedCount} critical nodes remaining to optimize employer discovery.`}
            </p>
            <Progress value={percentage} className="h-2 mt-4 rounded-full bg-muted/20" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {completionItems.map((item) => (
            <div
              key={item.key}
              className={cn(
                "flex items-center gap-4 p-4 rounded-[20px] transition-all border-2",
                item.isComplete ? "bg-emerald-500/5 border-emerald-500/10 opacity-60" : "bg-muted/10 border-border/20",
              )}
            >
              <div
                className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border-2",
                  item.isComplete
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    : "bg-muted/20 border-border/40 text-muted-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p
                  className={cn(
                    "text-xs font-black uppercase italic tracking-widest",
                    item.isComplete ? "text-emerald-700" : "text-foreground",
                  )}
                >
                  {item.label}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase mt-0.5 opacity-60">
                  {item.isComplete ? "Synchronized" : "Awaiting_Ingress"}
                </p>
              </div>
              {item.isComplete ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Target className="h-5 w-5 text-muted-foreground/30 shrink-0 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {showActions && percentage < 100 && (
          <Button
            onClick={handleEditHandshake}
            className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest text-xs gap-3 shadow-2xl active:scale-95 transition-all"
          >
            <Zap className="h-5 w-5 fill-current" />
            {nextAction ? `INITIALIZE_${nextAction.key.toUpperCase()}_SYNC` : "HYDRATE_IDENTITY"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
