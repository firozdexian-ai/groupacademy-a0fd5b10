import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Calendar,
  Trophy,
  FileText,
  Video,
  ChevronRight,
  Sparkles,
  PlayCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useTalent } from "@/hooks/useTalent";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const LEARNING_SECTIONS = [
  {
    title: "Career Tracks",
    icon: GraduationCap,
    href: "/app/learning/tracks",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Courses",
    icon: BookOpen,
    href: "/app/learning/courses",
    color: "text-secondary",
    bgColor: "bg-secondary/10",
  },
  {
    title: "Events",
    icon: Calendar,
    href: "/app/learning/events",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    title: "Competitions",
    icon: Trophy,
    href: "/app/learning/competitions",
    color: "text-warning",
    bgColor: "bg-warning/10",
  },
  {
    title: "Webinars",
    icon: Video,
    href: "/app/learning/webinars",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    title: "Blog",
    icon: FileText,
    href: "/app/learning/blog",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
];

interface EnrollmentContent {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  content_type: string;
}

interface Enrollment {
  id: string;
  status: string;
  progress: number;
  content: EnrollmentContent | null;
}

// Extracted Card Component
const LearningCard = ({ enrollment }: { enrollment: Enrollment }) => {
  const navigate = useNavigate();
  const { content, status, progress } = enrollment;

  if (!content) return null;

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all group overflow-hidden border-border/50 h-full flex flex-col"
      onClick={() => navigate(`/app/learning/courses/${content.slug}`)}
    >
      <div className="aspect-video bg-muted relative overflow-hidden shrink-0">
        {content.thumbnail_url ? (
          <img
            src={content.thumbnail_url}
            alt={content.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/5">
            <BookOpen className="h-10 w-10 text-primary/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-white/30 transition-colors">
            <PlayCircle className="w-4 h-4" />
            Resume
          </div>
        </div>
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Badge variant="outline" className="capitalize text-[10px] h-5 px-1.5">
              {content.content_type.replace("_", " ")}
            </Badge>
            {status === "pending_payment" && (
              <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
                Unpaid
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm line-clamp-2 mb-3 group-hover:text-primary transition-colors">
            {content.title}
          </h3>
        </div>

        <div className="space-y-2 mt-auto">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
};

export default function LearningHub() {
  const navigate = useNavigate();
  const { talent } = useTalent();

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["talent-enrollments-preview", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enrollments")
        .select(
          `
          id,
          status,
          progress,
          content:content_id (
            id,
            title,
            slug,
            thumbnail_url,
            content_type
          )
        `,
        )
        .eq("talent_id", talent!.id)
        .in("status", ["active", "pending_payment"])
        .order("last_accessed_at", { ascending: false }) // Sort by most recently accessed
        .limit(6);

      if (error) throw error;
      return data as unknown as Enrollment[];
    },
    enabled: !!talent?.id,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-background rounded-xl shadow-sm">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold">Learning Hub</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          Master new skills with our curated courses, join live events, and compete with peers to accelerate your career
          growth.
        </p>
      </div>

      {/* Quick Navigation Grid */}
      <section>
        <h2 className="text-lg font-bold mb-4">Browse Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {LEARNING_SECTIONS.map((section) => (
            <Card
              key={section.title}
              className="cursor-pointer hover:shadow-md transition-all border-0 shadow-sm press-scale hover:bg-muted/50"
              onClick={() => navigate(section.href)}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <div className={`w-12 h-12 rounded-xl ${section.bgColor} flex items-center justify-center`}>
                  <section.icon className={`h-6 w-6 ${section.color}`} />
                </div>
                <span className="font-semibold text-xs text-foreground leading-tight">{section.title}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* My Learning Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold">Continue Learning</h2>
            {enrollments.length > 0 && (
              <Badge variant="secondary" className="text-xs px-2">
                {enrollments.length} Active
              </Badge>
            )}
          </div>
          {enrollments.length > 0 && (
            <button
              onClick={() => navigate("/app/learning/my-courses")}
              className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
            >
              View All
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <Card className="border-dashed border-2 bg-muted/30">
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No active courses</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                You haven't enrolled in any courses yet. Start your journey today!
              </p>
              <button
                onClick={() => navigate("/app/learning/courses")}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Browse Courses
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {enrollments.map((enrollment) => (
              <LearningCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
