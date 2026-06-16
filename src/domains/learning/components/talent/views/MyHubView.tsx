/**
 * Talent Learning Hub — My Hub view.
 * Composes next-best-action + upcoming sessions + courses + credentials.
 */
import { useNavigate } from "react-router-dom";
import { MyCoursesTab } from "../MyCoursesTab";
import { UpcomingSessionsRail } from "../UpcomingSessionsRail";
import { NextActionsCard } from "../NextActionsCard";
import { SkillCredentialsPanel } from "../SkillCredentialsPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, BookOpen, Award, Globe, ArrowRight } from "lucide-react";

export function MyHubView() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-in fade-in duration-300 w-full">
      {/* Next best action */}
      <NextActionsCard />

      {/* Study Abroad card */}
      <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground">Explore Study Abroad Opportunities</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Find destinations, prepare for IELTS, practice language skills, and build your personalized roadmap.
              </p>
            </div>
          </div>
          <Button size="sm" className="rounded-xl font-bold shadow-md shrink-0 self-start sm:self-auto" onClick={() => navigate("/app/abroad")}>
            Explore Abroad <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardContent>
      </Card>


      {/* Upcoming Sessions */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Target className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Upcoming Sessions
          </h2>
        </div>
        <UpcomingSessionsRail />
      </section>

      {/* Enrolled Courses */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <BookOpen className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Enrolled Courses
          </h2>
        </div>
        <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          <MyCoursesTab />
        </div>
      </section>

      {/* Verified skills */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Award className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Verified Skills
          </h2>
        </div>
        <SkillCredentialsPanel />
      </section>
    </div>
  );
}

