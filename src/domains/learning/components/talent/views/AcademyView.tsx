/**
 * GroUp Academy: Academy Hub Surface (AcademyView)
 * CTO Reference: Authoritative directory for academic tracks and school departments.
 * Version: Launch Candidate Â· Phase Z0 Hardened Â· Patch 0.1
 * Enhancements: GPU performance grid, agentic Dean chat bindings, dynamic academy directory.
 */
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { listAcademiesSchoolsReadiness } from "@/domains/learning/repo/learningRepo";
import { getIcon } from "@/lib/iconMap";
import { Globe, Sparkles, GraduationCap, ArrowRight, Users, Briefcase, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trackEvent } from "@/lib/errorTracking";
import { useCredits } from "@/domains/finance/hooks/useCredits";

const iconMap: Record<string, unknown> = {
  executive: Users,
  freelancing: Briefcase,
  entrepreneurship: Rocket,
  influencing: Sparkles,
};

export function AcademyView() {
  const navigate = useNavigate();
  const { balance } = useCredits();

  const { data, isLoading } = useQuery({
    queryKey: ["academies-schools-readiness"],
    queryFn: listAcademiesSchoolsReadiness,
  });

  const academiesList = useMemo(() => {
    if (!data?.academies) return [];
    return data.academies.map((ac: unknown) => ({
      id: ac.academy_type || ac.slug || ac.id,
      title: ac.name,
      icon: iconMap[ac.academy_type] || getIcon(ac.icon) || GraduationCap,
      desc: ac.description || `${ac.name} tracks & catalog`,
    }));
  }, [data?.academies]);

  const handleAcademyClick = (id: string) => {
    trackEvent("academy_catalog_clicked", { academyId: id });
    navigate(`/app/learning?tab=tracks&academy=${id}`);
  };

  return (
    <div className="space-y-6 antialiased select-none sm:select-text w-full animate-in fade-in duration-300">
      {/* Credit & Advisor Header */}
      <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Planning your journey?</p>
              <p className="text-xs text-muted-foreground">
                You have {balance} credits available for roadmap generation.
              </p>
            </div>
          </div>
          <Button size="sm" className="rounded-xl font-bold shadow-md" onClick={() => {
            trackEvent("abroad_advisor_clicked");
            navigate("/app/agents/abroad-counselor");
          }}>
            <Sparkles className="h-4 w-4 mr-2" /> Talk to Advisor
          </Button>
        </CardContent>
      </Card>

      {/* Academy Directory Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          [1, 2, 3, 4].map((skeletonIndex) => (
            <Skeleton key={skeletonIndex} className="h-28 w-full rounded-2xl bg-muted/40 animate-pulse" />
          ))
        ) : academiesList.length === 0 ? (
          <Card className="col-span-2 rounded-2xl border-dashed">
            <CardContent className="p-10 text-center text-xs font-bold text-muted-foreground/60 italic">
              No academies defined in the network registry.
            </CardContent>
          </Card>
        ) : (
          academiesList.map((academy) => (
            <button
              key={academy.id}
              type="button"
              onClick={() => handleAcademyClick(academy.id)}
              className="text-left rounded-2xl border border-border/40 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.99] group"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/5 shadow-inner">
                  <academy.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="text-sm font-bold tracking-tight text-foreground/90">{academy.title}</h3>
                  <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium line-clamp-2 font-medium">
                    {academy.desc}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Dean Chat Access Module */}
      <Card className="rounded-2xl border border-border/20 bg-muted/20">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold">Ask the Dean</p>
              <p className="text-xs text-muted-foreground">Need help picking your track? Chat with our Dean agent.</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-xl font-bold"
            onClick={() => navigate("/dashboard/chat?agent=learn-dean")}
          >
            Chat
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}


