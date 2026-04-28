import { useNavigate } from "react-router-dom";
import { PlayCircle, Clock, ChevronRight, BookOpen, Sparkles, Zap, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ActiveEnrollment } from "@/hooks/useLearningStats";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Learning Continuity Terminal
 * CTO Reference: Authoritative resume-node for talent development.
 */

interface ActiveCourseHeroProps {
  enrollment: ActiveEnrollment;
  upNextEnrollments?: ActiveEnrollment[];
}

export function ActiveCourseHero({ enrollment, upNextEnrollments = [] }: ActiveCourseHeroProps) {
  const navigate = useNavigate();
  const { content, progress = 0, modules = [] } = enrollment;

  if (!content) return null;

  // PROTOCOL: Robust Indexing Guard
  const currentModuleIndex =
    enrollment.current_module_id && modules.length > 0
      ? Math.max(
          0,
          modules.findIndex((m) => m.id === enrollment.current_module_id),
        )
      : 0;

  const currentModule = modules[currentModuleIndex];
  const nextModules = modules.slice(currentModuleIndex + 1, currentModuleIndex + 3);

  const handleResumeProtocol = () => navigate(`/app/learn/${content.slug}`);
  const handleAuditCurriculum = () => navigate(`/app/learning/courses/${content.slug}`);

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* HEADER: TELEMETRY LABEL */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Zap className="h-5 w-5 text-primary fill-current" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Mission_Control</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
              Active_Trajectory_Resume
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        {/* ARTIFACT: MAIN COMMAND CARD */}
        <Card className="group relative overflow-hidden border-2 border-border/40 bg-card/30 backdrop-blur-md shadow-2xl rounded-[32px] transition-all hover:border-primary/40">
          <div className="grid md:grid-cols-[280px,1fr] h-full">
            {/* COMPONENT: VISUAL PROGRESS NODE */}
            <div className="relative overflow-hidden bg-muted aspect-video md:aspect-auto border-r-2 border-border/10">
              {content.thumbnail_url ? (
                <img
                  src={content.thumbnail_url}
                  alt={content.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <BookOpen className="h-12 w-12 text-primary/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] italic">
                    Trajectory_Sync
                  </span>
                  <span className="text-xs font-black text-primary tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-white/10 rounded-full shadow-inner" />
              </div>
            </div>

            {/* COMPONENT: COMMAND INTERFACE */}
            <CardContent className="p-8 flex flex-col justify-between text-left relative">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <GraduationCap className="h-32 w-32 rotate-12" />
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="bg-primary/5 border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg"
                  >
                    {content.content_type.replace("_", " ")}
                  </Badge>
                  {progress > 50 && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                      <Sparkles className="h-3 w-3 mr-1.5" /> High_Yield_Near_End
                    </Badge>
                  )}
                </div>

                <h3 className="text-3xl font-black leading-tight tracking-tighter line-clamp-2 uppercase italic">
                  {content.title}
                </h3>

                {currentModule && (
                  <div className="space-y-2 p-4 rounded-2xl bg-muted/20 border-2 border-border/10">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary italic leading-none">
                      Active_Module
                    </p>
                    <p className="text-sm font-bold text-foreground line-clamp-1 italic">{currentModule.title}</p>
                    {currentModule.estimated_time_minutes && (
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
                        <Clock className="h-3 w-3" />
                        <span>~{currentModule.estimated_time_minutes} MIN_REMAINING</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 mt-10">
                <Button
                  onClick={handleResumeProtocol}
                  className="rounded-2xl h-14 px-10 font-black uppercase italic tracking-widest shadow-[0_10px_30px_rgba(var(--primary),0.3)] hover:scale-[1.05] active:scale-95 transition-all gap-3"
                >
                  <PlayCircle className="h-5 w-5 fill-current" />
                  INITIALIZE_RESUME
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleAuditCurriculum}
                  className="h-14 px-6 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary/5 italic opacity-60 hover:opacity-100"
                >
                  View_Registry
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* COMPONENT: UP NEXT NODES */}
        <div className="flex flex-col h-full text-left">
          <h3 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] mb-4 px-1 italic">
            Queue_Stack
          </h3>
          <div className="flex lg:flex-col gap-3 overflow-x-auto no-scrollbar lg:overflow-visible pb-4 lg:pb-0 snap-x">
            {nextModules.length > 0 ? (
              nextModules.map((module, idx) => (
                <Card
                  key={module.id}
                  className="p-5 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all rounded-[20px] border-2 border-border/20 shrink-0 w-[280px] lg:w-full snap-start group/node shadow-lg"
                  onClick={handleResumeProtocol}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center shrink-0 font-black text-xs text-muted-foreground border-2 border-border/40 group-hover/node:border-primary/20 group-hover/node:text-primary transition-all">
                      {String(currentModuleIndex + idx + 2).padStart(2, "0")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-black line-clamp-1 leading-tight uppercase italic group-hover/node:text-primary transition-colors">
                        {module.title}
                      </p>
                      <p className="text-[9px] font-bold text-muted-foreground/60 mt-1.5 uppercase tracking-widest">
                        T_EST: {module.estimated_time_minutes || 5}M
                      </p>
                    </div>
                    <ChevronRight className="ml-auto h-4 w-4 text-primary/20 group-hover/node:translate-x-1 group-hover/node:text-primary transition-all" />
                  </div>
                </Card>
              ))
            ) : (
              <Card className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/20 bg-primary/5 rounded-[32px] text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 shadow-inner">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <p className="text-xs font-black text-primary uppercase tracking-[0.2em] italic">GRADUATION_PHASE</p>
                <p className="text-[9px] text-muted-foreground font-bold mt-2 uppercase tracking-widest">
                  Final module logic active.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* REGISTRY: SECONDARY TRACKS */}
      {upNextEnrollments.length > 0 && (
        <div className="pt-8 border-t-2 border-border/10 text-left">
          <h3 className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] mb-6 italic">
            Parallel_Learning_Tracks
          </h3>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-5 pb-6">
              {upNextEnrollments.map((enr) => (
                <Card
                  key={enr.id}
                  className="w-[260px] shrink-0 cursor-pointer hover:shadow-2xl transition-all rounded-[24px] overflow-hidden group border-2 border-border/20 hover:border-primary/20 bg-card/40"
                  onClick={() => navigate(`/app/learning/courses/${enr.content?.slug}`)}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden border-b-2 border-border/10">
                    <img
                      src={enr.content?.thumbnail_url || "/placeholder.jpg"}
                      alt={enr.content?.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-primary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 backdrop-blur-sm">
                      <PlayCircle className="text-white h-10 w-10 drop-shadow-2xl" />
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <p className="text-[11px] font-black line-clamp-2 whitespace-normal leading-tight tracking-tight uppercase italic">
                      {enr.content?.title}
                    </p>
                    <div className="flex items-center gap-3">
                      <Progress value={enr.progress} className="h-1.5 flex-1 rounded-full" />
                      <span className="text-[9px] font-black text-primary tabular-nums italic">{enr.progress}%</span>
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
