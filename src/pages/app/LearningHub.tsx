import { useNavigate } from "react-router-dom";
import { BookOpen, Target, Calendar, Library } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalent } from "@/hooks/useTalent";
import { useLearningStats } from "@/hooks/useLearningStats";
import { ActiveCourseHero } from "@/components/learning/ActiveCourseHero";
import { UnifiedDiscovery } from "@/components/learning/UnifiedDiscovery";
import { QuickStats } from "@/components/learning/QuickStats";
import { CareerTracksPreview } from "@/components/learning/CareerTracksPreview";
import { BannerCarousel } from "@/components/BannerCarousel";

const quickActions = [
  { icon: BookOpen, label: "My Courses", path: "/app/learning/my-courses" },
  { icon: Target, label: "Tracks", path: "/app/learning/tracks" },
  { icon: Library, label: "All Courses", path: "/app/learning/courses" },
  { icon: Calendar, label: "Events", path: "/app/learning/events" },
];

export default function LearningHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const {
    currentStreak,
    totalHoursLearned,
    coursesCompleted,
    modulesCompleted,
    activeEnrollments,
    isLoading,
  } = useLearningStats();

  const primaryEnrollment = activeEnrollments[0];
  const otherEnrollments = activeEnrollments.slice(1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-2 space-y-2 pb-32">
      {/* Banner Carousel */}
      <BannerCarousel placement="learning" />

      {/* Quick Actions - single row icon strip */}
      <div className="bg-card rounded-xl p-3 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <action.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] text-center text-muted-foreground leading-tight">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Career Tracks Preview */}
      <CareerTracksPreview />

      {/* Continue Learning Section */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : primaryEnrollment ? (
        <ActiveCourseHero
          enrollment={primaryEnrollment}
          upNextEnrollments={otherEnrollments}
        />
      ) : (
        <section className="space-y-4">
          <h2 className="text-lg font-bold">Start Learning</h2>
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No active courses yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                Explore our courses and start building your skills today!
              </p>
              <Button onClick={() => navigate("/app/learning/courses")}>
                Browse Courses
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Unified Discovery Section */}
      <UnifiedDiscovery />

      {/* Quick Stats */}
      <QuickStats
        coursesCompleted={coursesCompleted}
        hoursLearned={totalHoursLearned}
        modulesCompleted={modulesCompleted}
      />
    </div>
  );
}
