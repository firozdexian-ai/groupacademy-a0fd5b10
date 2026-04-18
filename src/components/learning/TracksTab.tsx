import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Building2,
  Laptop,
  Rocket,
  Megaphone,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

interface Academy {
  id: string;
  name: string;
  slug: string;
  academy_type: string;
  description: string;
}
interface School {
  id: string;
  name: string;
  slug: string;
  description: string;
  academy_id: string;
  icon: string | null;
}
interface Enrollment {
  id: string;
  progress: number;
  status: string;
  content: { title: string; profession_line_id: string | null } | null;
}

type Category = "my-program" | "executive" | "freelancing" | "entrepreneurship" | "influencing";

const categories: { key: Category; icon: any; label: string }[] = [
  { key: "my-program", icon: GraduationCap, label: "My Tracks" },
  { key: "executive", icon: Building2, label: "Executive" },
  { key: "freelancing", icon: Laptop, label: "Freelance" },
  { key: "entrepreneurship", icon: Rocket, label: "Startup" },
  { key: "influencing", icon: Megaphone, label: "Influence" },
];

const academyTypeMap: Record<string, Category> = {
  executive: "executive",
  freelancing: "freelancing",
  entrepreneurship: "entrepreneurship",
  influencing: "influencing",
};

const academyColors: Record<Category, { bg: string; icon: string; border: string; accent: string }> = {
  "my-program": {
    bg: "bg-primary/10",
    icon: "text-primary",
    border: "group-hover:border-primary/40",
    accent: "bg-primary",
  },
  executive: {
    bg: "bg-blue-500/10",
    icon: "text-blue-600",
    border: "group-hover:border-blue-500/40",
    accent: "bg-blue-500",
  },
  freelancing: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-600",
    border: "group-hover:border-emerald-500/40",
    accent: "bg-emerald-500",
  },
  entrepreneurship: {
    bg: "bg-orange-500/10",
    icon: "text-orange-600",
    border: "group-hover:border-orange-500/40",
    accent: "bg-orange-500",
  },
  influencing: {
    bg: "bg-pink-500/10",
    icon: "text-pink-600",
    border: "group-hover:border-pink-500/40",
    accent: "bg-pink-500",
  },
};

export function TracksTab() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category>("my-program");
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadingError(null);
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [academiesResult, schoolsResult] = await Promise.all([
        supabase.from("academies").select("*").eq("is_active", true).order("display_order"),
        supabase.from("schools").select("*").eq("is_active", true).order("display_order"),
      ]);

      if (academiesResult.error) throw academiesResult.error;
      if (schoolsResult.error) throw schoolsResult.error;

      setAcademies(academiesResult.data || []);
      setSchools(schoolsResult.data || []);

      if (user) {
        const { data: talent } = await supabase.from("talents").select("id").eq("user_id", user.id).maybeSingle();
        if (talent) {
          const { data: enrollmentData } = await supabase
            .from("enrollments")
            .select("id, progress, status, content:content_id(title, profession_line_id)")
            .eq("talent_id", talent.id)
            .order("created_at", { ascending: false });

          setEnrollments((enrollmentData as any) || []);
        }
      }
    } catch (error: any) {
      console.error("Data Load Error:", error);
      setLoadingError("Could not sync career tracks.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMyProgram = () => {
    const active = enrollments.filter((e) => e.status !== "completed");
    const completed = enrollments.filter((e) => e.status === "completed");

    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        {active.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-3 w-3 text-primary" /> Active Development
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {active.map((enr) => (
                <Card
                  key={enr.id}
                  className="group cursor-pointer hover:border-primary/40 transition-all rounded-[24px] bg-card/50 overflow-hidden"
                  onClick={() => navigate(`/app/learning/tracks`)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <GraduationCap className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-3">
                        <CardTitle className="text-sm font-black tracking-tight leading-tight line-clamp-1">
                          {enr.content?.title || "Career Track"}
                        </CardTitle>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
                            <span>Progression</span>
                            <span className="text-primary">{enr.progress}%</span>
                          </div>
                          <Progress value={enr.progress} className="h-1.5" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              Certified Achievements
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {completed.map((enr) => (
                <Card key={enr.id} className="rounded-[24px] border-emerald-500/20 bg-emerald-500/[0.02]">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-black tracking-tight">{enr.content?.title}</CardTitle>
                      <Badge className="bg-emerald-500 text-white border-none text-[9px] font-black uppercase tracking-widest mt-1">
                        ✓ Credentialed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {enrollments.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed rounded-[32px] border-border/40">
            <GraduationCap className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-6">
              No track enrollments found
            </p>
            <Button
              onClick={() => setSelectedCategory("executive")}
              className="rounded-xl font-black uppercase tracking-widest h-10 px-6"
            >
              Explore Academies
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderAcademy = (cat: Category) => {
    const academy = academies.find((a) => academyTypeMap[a.academy_type] === cat);
    if (!academy)
      return (
        <div className="py-20 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
          Academy Node Offline
        </div>
      );

    const academySchools = schools.filter((s) => s.academy_id === academy.id);
    const theme = academyColors[cat];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="px-1">
          <h2 className="text-lg font-black tracking-tight">{academy.name}</h2>
          <p className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed">{academy.description}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {academySchools.map((school) => {
            const SchoolIcon = getIcon(school.icon);
            return (
              <Card
                key={school.id}
                className={cn(
                  "group cursor-pointer transition-all duration-300 rounded-[24px] border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden",
                  theme.border,
                )}
                onClick={() => navigate(`/app/learning/tracks/school/${school.slug}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                        theme.bg,
                      )}
                    >
                      <SchoolIcon className={cn("h-6 w-6", theme.icon)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm tracking-tight leading-tight truncate">{school.name}</h4>
                      <p className="text-[11px] font-medium text-muted-foreground line-clamp-1 mt-0.5">
                        {school.description}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[24px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dynamic Nav Strip */}
      <div className="grid grid-cols-5 gap-2">
        {categories.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300 group outline-none",
              selectedCategory === key
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                : "bg-muted/50 text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5 transition-transform group-hover:scale-110",
                selectedCategory === key ? "text-white" : "text-primary/60",
              )}
            />
            <span className="text-[9px] font-black uppercase tracking-widest text-center leading-none">{label}</span>
          </button>
        ))}
      </div>

      {selectedCategory === "my-program" ? renderMyProgram() : renderAcademy(selectedCategory)}
    </div>
  );
}
