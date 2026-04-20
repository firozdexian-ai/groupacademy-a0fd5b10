import { useState, lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Target, Library, Calendar, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { BannerCarousel } from "@/components/BannerCarousel";
import { MyCoursesTab } from "@/components/learning/MyCoursesTab";
import { TracksTab } from "@/components/learning/TracksTab";
import { CoursesTab } from "@/components/learning/CoursesTab";
import { EventsTab } from "@/components/learning/EventsTab";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Academic Command Center
 * High-fidelity orchestration for self-paced units, career pathways, and live protocols.
 * 2026 Standard: Executive Logic navigation with recursive detail-view injection.
 */

const CompetitionDetail = lazy(() => import("@/pages/app/CompetitionDetail"));
const AppCourseDetail = lazy(() => import("@/pages/app/AppCourseDetail"));

type TabKey = "my-courses" | "tracks" | "courses" | "events";
type DetailView = { type: "competition" | "course"; slug: string } | null;

const tabs: { key: TabKey; icon: any; label: string; detail: string }[] = [
  { key: "my-courses", icon: BookOpen, label: "My Hub", detail: "Active Units" },
  { key: "tracks", icon: Target, label: "Pathways", detail: "Career Tracks" },
  { key: "courses", icon: Library, label: "Academy", detail: "Unit Registry" },
  { key: "events", icon: Calendar, label: "Arena", detail: "Live Logic" },
];

export default function LearningHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "my-courses";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [detailView, setDetailView] = useState<DetailView>(null);

  useEffect(() => {
    if (!detailView) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, detailView, setSearchParams]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setDetailView(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const DetailFallback = () => (
    <div className="space-y-10 py-6 animate-pulse">
      <Skeleton className="h-10 w-48 rounded-xl bg-muted/40" />
      <Skeleton className="h-[400px] w-full rounded-[40px] bg-muted/40" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-3/4 bg-muted/40" />
        <Skeleton className="h-4 w-full bg-muted/40" />
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-6 pb-40 space-y-12 animate-in fade-in duration-700">
      {/* Immersive Header: Academic Identity */}
      {!detailView && (
        <div className="space-y-10">
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Learning Academy</h1>
                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                Active Professional Deployment Protocol v2.6
              </p>
            </div>

            <div className="hidden md:flex items-center gap-4 bg-primary/5 px-4 py-2 rounded-2xl border border-primary/10">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">
                Registry Sync: Optimized
              </span>
            </div>
          </header>

          <div className="rounded-[40px] overflow-hidden shadow-2xl border border-border/40 bg-card">
            <BannerCarousel placement="learning" />
          </div>
        </div>
      )}

      {/* Logic-First HUD Navigation */}
      {!detailView && (
        <nav className="sticky top-20 z-30 bg-background/60 backdrop-blur-2xl border-2 border-border/40 rounded-[32px] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all">
          <div className="grid grid-cols-4 gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    "group relative flex flex-col items-center justify-center gap-1.5 py-4 rounded-[24px] transition-all duration-500 outline-none",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-2xl shadow-primary/30 scale-[1.02]"
                      : "bg-transparent text-muted-foreground/60 hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <tab.icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-500",
                      isActive ? "scale-110" : "group-hover:scale-110",
                    )}
                  />
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                    <span
                      className={cn(
                        "text-[7px] font-bold uppercase tracking-[0.2em] mt-1 opacity-0 transition-opacity duration-500",
                        isActive && "opacity-40",
                      )}
                    >
                      {tab.detail}
                    </span>
                  </div>
                  {isActive && <Zap className="absolute top-2 right-2 h-3 w-3 text-white/20 fill-white" />}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Logic Viewport: Dynamic Content Handshake */}
      <main className="min-h-[60vh]">
        {detailView ? (
          <Suspense fallback={<DetailFallback />}>
            <div className="animate-in slide-in-from-bottom-8 duration-700">
              {detailView.type === "competition" ? (
                <CompetitionDetail inlineSlug={detailView.slug} onBack={() => setDetailView(null)} />
              ) : (
                <AppCourseDetail inlineSlug={detailView.slug} onBack={() => setDetailView(null)} />
              )}
            </div>
          </Suspense>
        ) : (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500 delay-150">
            {activeTab === "my-courses" && (
              <section className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary">In-Progress Logic</h2>
                </div>
                <MyCoursesTab onBrowseCatalog={() => handleTabChange("courses")} />
              </section>
            )}

            {activeTab === "tracks" && <TracksTab />}

            {activeTab === "courses" && <CoursesTab onOpenCourse={(slug) => setDetailView({ type: "course", slug })} />}

            {activeTab === "events" && (
              <EventsTab onOpenCompetition={(slug) => setDetailView({ type: "competition", slug })} />
            )}
          </div>
        )}
      </main>

      {/* Operational Trace Footer */}
      {!detailView && (
        <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-20">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Academy Node: Active Registry v2.6.4
          </p>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-1 w-6 rounded-full bg-primary/40" />
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
