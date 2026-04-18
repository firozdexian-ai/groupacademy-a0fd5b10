import { useNavigate } from "react-router-dom";
import { PlayCircle, Clock, ChevronRight, BookOpen, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ActiveEnrollment } from "@/hooks/useLearningStats";
import { cn } from "@/lib/utils";

interface ActiveCourseHeroProps {
  enrollment: ActiveEnrollment;
  upNextEnrollments?: ActiveEnrollment[];
}

export function ActiveCourseHero({ enrollment, upNextEnrollments = [] }: ActiveCourseHeroProps) {
  const navigate = useNavigate();
  const { content, progress = 0, modules = [] } = enrollment;

  if (!content) return null;

  // CTO FIX: Defensive index finding to prevent OOB (Out of Bounds) errors
  const currentModuleIndex =
    enrollment.current_module_id && modules.length > 0
      ? Math.max(
          0,
          modules.findIndex((m) => m.id === enrollment.current_module_id),
        )
      : 0;

  const currentModule = modules[currentModuleIndex];
  const nextModules = modules.slice(currentModuleIndex + 1, currentModuleIndex + 3);

  const handleResume = () => navigate(`/app/learn/${content.slug}`);
  const handleViewDetails = () => navigate(`/app/learning/courses/${content.slug}`);

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <PlayCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">Mission Control</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Pick up where you left off
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        {/* Main Hero Card - Refined with Glassmorphism */}
        <Card className="group overflow-hidden border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl rounded-[32px] transition-all hover:border-primary/30">
          <div className="grid md:grid-cols-[240px,1fr] h-full">
            {/* Thumbnail with Gradient Overlay */}
            <div className="relative overflow-hidden bg-muted aspect-video md:aspect-auto">
              {content.thumbnail_url ? (
                <img
                  src={content.thumbnail_url}
                  alt={content.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <BookOpen className="h-12 w-12 text-primary/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                    Course Progress
                  </span>
                  <span className="text-xs font-black text-primary">{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-white/20" />
              </div>
            </div>

            {/* Content Body */}
            <CardContent className="p-6 md:p-8 flex flex-col justify-between bg-gradient-to-br from-transparent to-primary/5">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest">
                    {content.content_type.replace("_", " ")}
                  </Badge>
                  {progress > 50 && (
                    <Badge className="bg-amber-500/10 text-amber-600 border-none text-[9px] font-black uppercase tracking-widest">
                      <Sparkles className="h-2.5 w-2.5 mr-1" /> Finishing Soon
                    </Badge>
                  )}
                </div>

                <h3 className="text-2xl font-black leading-tight tracking-tighter line-clamp-2">{content.title}</h3>

                {currentModule && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      Current Module
                    </p>
                    <p className="text-sm font-bold text-foreground line-clamp-1">{currentModule.title}</p>
                    {currentModule.estimated_time_minutes && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                        <Clock className="h-3.5 w-3.5" />
                        <span>~{currentModule.estimated_time_minutes} min remaining</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-8">
                <Button
                  onClick={handleResume}
                  className="rounded-2xl h-12 px-8 font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Resume Now
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleViewDetails}
                  className="font-bold text-xs uppercase tracking-widest hover:bg-primary/5"
                >
                  Curriculum
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Up Next Sidebar - Mobile Snap Scroll */}
        <div className="flex flex-col h-full">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4 px-1">Up Next</h3>
          <div className="flex lg:flex-col gap-3 overflow-x-auto no-scrollbar lg:overflow-visible pb-4 lg:pb-0 snap-x">
            {nextModules.length > 0 ? (
              nextModules.map((module, idx) => (
                <Card
                  key={module.id}
                  className="p-4 cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all rounded-2xl border-border/40 shrink-0 w-[260px] lg:w-full snap-start"
                  onClick={handleResume}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0 font-black text-xs text-muted-foreground border border-border/50">
                      {currentModuleIndex + idx + 2}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black line-clamp-1 leading-tight">{module.title}</p>
                      <p className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-tighter">
                        Estimated: {module.estimated_time_minutes || 5}m
                      </p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground/30" />
                  </div>
                </Card>
              ))
            ) : (
              <Card className="flex-1 flex flex-col items-center justify-center p-8 border-dashed bg-primary/5 rounded-[32px] text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-xs font-black text-primary uppercase tracking-widest">Final Stretch!</p>
                <p className="text-[10px] text-muted-foreground font-bold mt-1">Complete this module to graduate.</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Carousel */}
      {upNextEnrollments.length > 0 && (
        <div className="pt-4 border-t border-border/40">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
            Other Active Tracks
          </h3>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-4 pb-4">
              {upNextEnrollments.map((enr) => (
                <Card
                  key={enr.id}
                  className="w-[240px] shrink-0 cursor-pointer hover:shadow-xl transition-all rounded-[24px] overflow-hidden group border-border/50"
                  onClick={() => navigate(`/app/learning/courses/${enr.content?.slug}`)}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img
                      src={enr.content?.thumbnail_url || "/placeholder.jpg"}
                      alt={enr.content?.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlayCircle className="text-white h-8 w-8" />
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-[11px] font-black line-clamp-2 whitespace-normal leading-tight tracking-tight">
                      {enr.content?.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <Progress value={enr.progress} className="h-1 flex-1" />
                      <span className="text-[9px] font-black text-muted-foreground">{enr.progress}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}
    </section>
  );
}
