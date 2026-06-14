/**
 * Talent Shell — Workforce Assignment Card (W-8)
 * Displays the logged-in talent's HR placement: team, grade, role, vertical, status.
 */
import { useQuery } from "@tanstack/react-query";
import { getMyWorkforceAssignment } from "@/domains/workforce/repo/workforceRepo";
import { cn } from "@/lib/utils";
import { Briefcase, GraduationCap, Building2, MapPin, Users } from "lucide-react";
import { GRO10X_PANEL, GRO10X_MUTED } from "@/gro10x/lib/tokens";

const ROLE_LABELS: Record<string, string> = {
  country_director: "Country Director",
  head_of_ta: "Head of TA",
  talent_executive: "Talent Executive",
  bde: "Business Dev Exec",
  academy_chancellor: "Academy Chancellor",
  school_dean: "School Dean",
  career_abroad_exec: "Career Abroad Exec",
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active:    { bg: "bg-[#10D576]/10",  text: "text-[#10D576]",  dot: "bg-[#10D576]"  },
  probation: { bg: "bg-amber-400/10",  text: "text-amber-300",  dot: "bg-amber-400"  },
  inactive:  { bg: "bg-slate-600/10",  text: "text-slate-400",  dot: "bg-slate-500"  },
};

export function WorkforceAssignmentCard({ talentId }: { talentId: string }) {
  const { data: assignment, isLoading } = useQuery({
    queryKey: ["talent-workforce-assignment", talentId],
    queryFn: () => getMyWorkforceAssignment(talentId),
    enabled: !!talentId,
  });

  if (isLoading || !assignment) return null;

  const status = assignment.status || "active";
  const sc = STATUS_COLORS[status] || STATUS_COLORS.inactive;

  const team      = assignment.hr_teams?.name;
  const func_     = assignment.hr_teams?.hr_functions?.name;
  const vertical  = assignment.hr_teams?.hr_functions?.hr_verticals?.name;
  const grade     = assignment.hr_grades
    ? `L${assignment.hr_grades.level} · ${assignment.hr_grades.name}`
    : null;
  const role      = ROLE_LABELS[assignment.role_type] || assignment.role_type;

  return (
    <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[#2A7DDE]/15 grid place-items-center">
            <Users className="h-4 w-4 text-[#2A7DDE]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Your Team</p>
            <p className={`text-[11px] ${GRO10X_MUTED}`}>GRO10X Workforce</p>
          </div>
        </div>
        {/* Status pill */}
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-white/10",
            sc.bg,
            sc.text,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2">
        {role && (
          <Chip icon={Briefcase} label={role} />
        )}
        {team && (
          <Chip icon={Users} label={team} />
        )}
        {grade && (
          <Chip icon={GraduationCap} label={grade} />
        )}
        {vertical && (
          <Chip icon={Building2} label={vertical} />
        )}
        {func_ && (
          <Chip icon={Briefcase} label={func_} />
        )}
        {assignment.city && (
          <Chip icon={MapPin} label={assignment.city} />
        )}
      </div>
    </div>
  );
}

function Chip({ icon: Icon, label }: { icon: unknown; label: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/5">
      <Icon className="h-3 w-3 text-slate-400 shrink-0" />
      <span className="text-[11px] text-slate-300 truncate">{label}</span>
    </div>
  );
}


