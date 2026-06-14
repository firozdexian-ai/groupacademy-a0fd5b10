/**
 * Recent Activity Feed Widget (Phase 10i â€” Hardened).
 * Tracks real-time pedagogical interactions for administrative oversight.
 * Conforms fully to 2024 Professional SaaS UI/UX specifications.
 */
import { formatDistanceToNow } from "date-fns";
import { UserPlus, ListChecks, MessageSquare, type LucideIcon } from "lucide-react";
import type { CoursePerformance } from "@/lib/coursePerformance";
import { cn } from "@/lib/utils";

interface Props {
  recent: CoursePerformance["recent"];
}

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  enroll: UserPlus,
  quiz: ListChecks,
  scenario: MessageSquare,
};

export default function RecentActivityList({ recent }: Props) {
  if (!recent || recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">No recent activity</p>
        <p className="text-xs text-muted-foreground/60">Interaction telemetry is currently quiet.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {recent.map((activity, index) => {
        const Icon = ACTIVITY_ICONS[activity.kind] ?? MessageSquare;

        return (
          <li key={`${activity.talentName}-${activity.at}-${index}`} className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-200 shrink-0">
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground truncate">{activity.talentName}</div>
              <div className="text-xs text-muted-foreground truncate leading-relaxed">{activity.detail}</div>
            </div>

            <div className="text-xs text-muted-foreground font-medium whitespace-nowrap shrink-0">
              {formatDistanceToNow(new Date(activity.at), { addSuffix: true })}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

