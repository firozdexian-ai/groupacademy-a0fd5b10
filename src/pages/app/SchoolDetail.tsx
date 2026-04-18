import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getIcon } from "@/lib/iconMap";
import { ArrowLeft, ArrowRight, Bot, RefreshCw, AlertCircle, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface School {
  id: string;
  name: string;
  slug: string;
  description: string;
  academies: { name: string; slug: string } | null;
}

interface ProfessionLine {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  career_outcome: string;
  school_id: string;
  ai_instructors: any; // Flexible JSON handling
}

export default function SchoolDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState<School | null>(null);
  const [professions, setProfessions] = useState<ProfessionLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) loadSchoolData();
  }, [slug]);

  const loadSchoolData = async () => {
    setLoadingError(null);
    setIsLoading(true);
    try {
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select("*, academies(name, slug)")
        .eq("slug", slug)
        .single();

      if (schoolError) throw schoolError;
      setSchool(schoolData as School);

      const { data: professionData, error: profError } = await supabase
        .from("profession_categories")
        .select("*, ai_instructors(name)")
        .eq("school_id", schoolData.id)
        .eq("is_active", true)
        .order("display_order");

      if (profError) throw profError;
      setProfessions((professionData as ProfessionLine[]) || []);
    } catch (error: any) {
      console.error("Error loading school data:", error);
      setLoadingError("Unable to retrieve the faculty information. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-6 w-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (loadingError || !school) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Faculty Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          {loadingError || "This school might have been moved or renamed."}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={loadSchoolData} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
          <Button variant="outline" onClick={() => navigate("/app/learning/tracks")}>
            Browse All Tracks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-8">
      {/* Breadcrumb & Navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/learning/tracks")}
          className="gap-1.5 h-8 px-2 -ml-2"
        >
          <ArrowLeft className="h-4 w-4" /> Learning Hub
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">{school.name}</span>
      </nav>

      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border bg-card p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative space-y-4 max-w-3xl">
          {school.academies && (
            <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/15 border-none">
              <GraduationCap className="w-3.5 h-3.5 mr-1.5" />
              {school.academies.name}
            </Badge>
          )}
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{school.name}</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">{school.description}</p>
        </div>
      </section>

      {/* Programs/Professions Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Available Programs</h2>
          <Badge variant="outline" className="font-medium">
            {professions.length} Professional Tracks
          </Badge>
        </div>

        {professions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 pb-12">
            {professions.map((profession) => {
              const IconComponent = getIcon(profession.icon);
              const aiInstructors = profession.ai_instructors;
              const hasAIInstructor = aiInstructors && (Array.isArray(aiInstructors) ? aiInstructors.length > 0 : true);

              return (
                <Card
                  key={profession.id}
                  className="group cursor-pointer hover:shadow-lg hover:border-primary/40 transition-all duration-300 overflow-hidden flex flex-col"
                  onClick={() => navigate(`/app/learning/tracks/${profession.slug}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      {hasAIInstructor && (
                        <Badge
                          variant="secondary"
                          className="gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50"
                        >
                          <Bot className="h-3.5 w-3.5" /> AI Augmented
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {profession.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                      {profession.description}
                    </CardDescription>

                    <div className="pt-4 mt-auto border-t flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Career Path
                      </span>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary font-bold group-hover:gap-2 transition-all"
                      >
                        Explore Track <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed py-16 bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">New Tracks Pending</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-1">
                We are currently designing the curriculum for this faculty. Please check back soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
