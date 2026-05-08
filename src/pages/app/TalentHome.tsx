import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Building2,
  ChevronRight,
  Award,
  Eye,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useTalent } from "@/hooks/useTalent";
import { useTalentPitches } from "@/hooks/useTalentPitches";
import { useSkillCredentials } from "@/hooks/useSkillCredentials";
import { computeReadiness } from "@/lib/talentReadiness";
import { formatDistanceToNow } from "date-fns";

/**
 * Talent Home Dashboard — mobile-first "/app/me".
 * Stack: Market Readiness · Pitches/Unlocks · Skill Summary.
 */
export default function TalentHome() {
  const navigate = useNavigate();
  const { talent, isLoading: talentLoading } = useTalent();
  const { pitches, isLoading: pitchesLoading } = useTalentPitches(5);
  const { data: credentials = [], isLoading: credsLoading } = useSkillCredentials(talent?.id);

  const readiness = useMemo(() => computeReadiness(talent), [talent]);
  const dispatchedCount = pitches.filter((p) => p.dispatched).length;
  const greeting = talent?.fullName?.split(" ")[0] || "there";

  return (
    <div className="max-w-2xl mx-auto pb-24 px-3 pt-3 space-y-3">
      <header className="px-1 py-1">
        <p className="text-xs text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl font-bold tracking-tight">Hi {greeting} 👋</h1>
      </header>

      {/* === Card 1: Market Readiness === */}
      {talentLoading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : readiness.isLive ? (
        <Card className="p-4 bg-gradient-to-br from-[hsl(var(--success)/0.12)] to-[hsl(var(--success)/0.04)] border-[hsl(var(--success)/0.3)]">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--success)/0.2)] flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold">🟢 You are LIVE on the Gro10x Market</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Employers can discover and pitch you. Keep your profile fresh for better matches.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => navigate(`/t/${talent?.id ?? ""}`)}
                  disabled={!talent?.id}
                >
                  <Eye className="h-3.5 w-3.5" /> Preview public profile
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => navigate("/app/profile/edit")}>
                  Edit profile
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/40">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold">Hidden from Employers</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add{" "}
                <span className="font-semibold text-foreground">
                  {readiness.missing.map((m) => m.label).join(", ")}
                </span>{" "}
                to go live on the Gro10x talent market.
              </p>
              <div className="mt-3 space-y-2">
                <Progress value={readiness.percent} className="h-1.5" />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">{readiness.percent}% complete</span>
                  <Button size="sm" className="h-8 text-xs" onClick={() => navigate("/app/profile/edit")}>
                    Complete profile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* === Card 2: The Dopamine Hit (Pitches/Unlocks) === */}
      <Card className="p-4 border-[hsl(var(--primary)/0.25)] bg-gradient-to-br from-[hsl(var(--primary)/0.06)] to-transparent">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[hsl(var(--primary)/0.15)] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Employer Pitches</h2>
              <p className="text-[11px] text-muted-foreground">
                {pitchesLoading
                  ? "Checking…"
                  : pitches.length === 0
                    ? "No pitches yet"
                    : `${dispatchedCount} ${dispatchedCount === 1 ? "employer has" : "employers have"} reached out`}
              </p>
            </div>
          </div>
          {pitches.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate("/app/pitches")}>
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {pitchesLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : pitches.length === 0 ? (
          <div className="text-center py-6 px-4">
            <p className="text-sm text-muted-foreground">
              When employers unlock your profile, their pitch will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pitches.slice(0, 3).map((p) => (
              <button
                key={p.id}
                onClick={() => navigate("/app/pitches")}
                className="w-full text-left p-3 rounded-lg bg-card hover:bg-muted/40 border border-border/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  {p.company_logo ? (
                    <img src={p.company_logo} alt="" className="h-6 w-6 rounded object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded bg-muted flex items-center justify-center">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-xs font-semibold truncate flex-1">
                    {p.company_name || "An employer"}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{p.message}</p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {/* === Card 3: Skill Summary === */}
      <Card className="p-4">
        <button
          onClick={() => navigate("/app/talent-mirror")}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[hsl(var(--accent)/0.2)] flex items-center justify-center shrink-0">
              <Award className="h-5 w-5 text-[hsl(var(--accent-foreground))]" />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-tight">Verified Skills</h2>
              <p className="text-[11px] text-muted-foreground">
                {credsLoading
                  ? "Loading…"
                  : credentials.length === 0
                    ? "Earn your first credential by completing a course"
                    : `${credentials.length} verified ${credentials.length === 1 ? "credential" : "credentials"}`}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>

        {!credsLoading && credentials.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {credentials.slice(0, 6).map((c) => (
              <span
                key={c.id}
                className="px-2 py-1 rounded-md bg-muted text-[11px] font-medium capitalize"
              >
                {c.topic_tag.replace(/-/g, " ")}
              </span>
            ))}
            {credentials.length > 6 && (
              <span className="px-2 py-1 rounded-md bg-muted/60 text-[11px] text-muted-foreground">
                +{credentials.length - 6} more
              </span>
            )}
          </div>
        )}
      </Card>

      {/* Quick links */}
      <Card className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="h-9 justify-start gap-2 text-xs" onClick={() => navigate("/app/messages")}>
            <MessageCircle className="h-3.5 w-3.5" /> Messages
          </Button>
          <Button variant="outline" size="sm" className="h-9 justify-start gap-2 text-xs" onClick={() => navigate("/app/pitches")}>
            <Sparkles className="h-3.5 w-3.5" /> Pitches
          </Button>
        </div>
      </Card>
    </div>
  );
}
