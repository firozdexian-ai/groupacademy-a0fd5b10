/**
 * Gro10x B2B Shell â€” People Tab (W-7)
 * Shows active workforce members placed or linked to the authenticated company.
 */
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getWorkforceMembersForCompany } from "@/domains/workforce/repo/workforceRepo";
import { cn } from "@/lib/utils";
import { Users, Briefcase, MapPin, GraduationCap, Loader2, UserCheck } from "lucide-react";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";

const ROLE_LABELS: Record<string, string> = {
  country_director: "Country Director",
  head_of_ta: "Head of TA",
  talent_executive: "Talent Executive",
  bde: "Business Dev Exec",
  academy_chancellor: "Academy Chancellor",
  school_dean: "School Dean",
  career_abroad_exec: "Career Abroad Exec",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-[#10D576]",
  probation: "bg-amber-400",
  inactive: "bg-slate-500",
};

export function Gro10xPeopleTab({ companyId }: { companyId: string }) {
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["gro10x-company-workforce", companyId],
    queryFn: () => getWorkforceMembersForCompany(companyId),
    enabled: !!companyId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!members.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
        <div className="h-14 w-14 rounded-full bg-white/5 grid place-items-center">
          <Users className="h-6 w-6 text-slate-500" />
        </div>
        <p className="text-sm font-semibold text-slate-200">No team members yet</p>
        <p className={`text-xs ${GRO10X_MUTED} max-w-xs`}>
          Workforce members placed or assigned to your company will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="h-4 w-4 text-[#33E1E4]" />
        <span className={`text-xs font-semibold uppercase tracking-wider ${GRO10X_MUTED}`}>
          {members.length} Active Member{members.length !== 1 ? "s" : ""}
        </span>
      </div>

      {members.map((m: unknown) => {
        const name = m.talents?.full_name || "Unknown";
        const email = m.talents?.email;
        const role = ROLE_LABELS[m.role_type] || m.role_type;
        const team = m.hr_teams?.name;
        const grade = m.hr_grades ? `L${m.hr_grades.level} Â· ${m.hr_grades.name}` : null;
        const status = m.status || "active";

        return (
          <div
            key={m.id}
            className={`${GRO10X_PANEL} border border-white/5 rounded-2xl p-4 flex items-start gap-4`}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-11 w-11 rounded-full bg-gradient-to-br from-[#2A7DDE]/40 to-[#33E1E4]/30 grid place-items-center">
                <span className="text-sm font-bold text-white">
                  {name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0B1220]",
                  STATUS_DOT[status] || "bg-slate-500",
                )}
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 space-y-1">
              <p className="text-sm font-semibold truncate">{name}</p>
              {email && (
                <p className={`text-[11px] ${GRO10X_MUTED} truncate`}>{email}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-[#2A7DDE]/15 text-[#2A7DDE] border border-[#2A7DDE]/20 font-medium">
                  <Briefcase className="h-2.5 w-2.5" />
                  {role}
                </span>
                {team && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 font-medium">
                    <Users className="h-2.5 w-2.5" />
                    {team}
                  </span>
                )}
                {grade && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 font-medium">
                    <GraduationCap className="h-2.5 w-2.5" />
                    {grade}
                  </span>
                )}
                {m.city && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 font-medium">
                    <MapPin className="h-2.5 w-2.5" />
                    {m.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}


