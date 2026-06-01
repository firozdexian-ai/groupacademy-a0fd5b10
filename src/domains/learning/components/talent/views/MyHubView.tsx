/**
 * GroUp Academy: Talent Learning Hub (MyHubView)
 * CTO Reference: Unified cockpit for course progression and session rail.
 */
import { MyCoursesTab } from "../MyCoursesTab";
import { UpcomingSessionsRail } from "../UpcomingSessionsRail";
import { Target, BookOpen } from "lucide-react";

export function MyHubView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300 w-full">
      {/* Upcoming Sessions */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Upcoming Sessions</h2>
        </div>
        <UpcomingSessionsRail />
      </section>

      {/* Enrolled Courses */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Enrolled Courses</h2>
        </div>
        <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          <MyCoursesTab />
        </div>
      </section>
    </div>
  );
}
