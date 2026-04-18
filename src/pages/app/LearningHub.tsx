import { useState, lazy, Suspense, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { BookOpen, Target, Library, Calendar, Sparkles } from "lucide-react";
import { BannerCarousel } from "@/components/BannerCarousel";
import { MyCoursesTab } from "@/components/learning/MyCoursesTab";
import { TracksTab } from "@/components/learning/TracksTab";
import { CoursesTab } from "@/components/learning/CoursesTab";
import { EventsTab } from "@/components/learning/EventsTab";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// FIX: Lazy imports for deep-view components
const CompetitionDetail = lazy(() => import("@/pages/app/CompetitionDetail"));
const AppCourseDetail = lazy(() => import("@/pages/app/AppCourseDetail"));

type TabKey = "my-courses" | "tracks" | "courses" | "events";
type DetailView = { type: "competition" | "course"; slug: string } | null;

const tabs: { key: TabKey; icon: any; label: string }[] = [
  { key: "my-courses", icon: BookOpen, label: "My Hub" },
  { key: "tracks", icon: Target, label: "Pathways" },
  { key: "courses", icon: Library, label: "Academy" },
  { key: "events", icon: Calendar, label: "Live" },
];

export default function LearningHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabKey) || "my-courses";

  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [detailView, setDetailView] = useState<DetailView>(null);

  // Sync state with URL params for link sharing and browser history
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
    <div className="space-y-6 p-4">
      <Skeleton className="h-[240px] w-full rounded-[32px]" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-6 pb-32 animate-in fade-in duration-500">
      {/* Visual Context */}
      {!detailView && (
        <div className="space-y-6">
          <header className="px-1">
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
              Learning Academy <Sparkles className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
              Upgrade your professional trajectory
            </p>
          </header>
          <BannerCarousel placement="learning" />
        </div>
      )}

      {/* Modern Navigation Shell */}
      {!detailView && (
        <nav className="sticky top-[65px] z-30 bg-background/80 backdrop-blur-xl border border-border/40 rounded-3xl p-1.5 shadow-xl shadow-primary/5">
          <div className="grid grid-cols-4 gap-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 py-3 rounded-2xl transition-all duration-300 outline-none",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                      : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  <tab.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-primary")} />
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-widest leading-none",
                      isActive ? "opacity-100" : "opacity-60",
                    )}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Dynamic Content Area */}
      <main className="min-h-[50vh]">
        {detailView ? (
          <Suspense fallback={<DetailFallback />}>
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              {detailView.type === "competition" ? (
                <CompetitionDetail inlineSlug={detailView.slug} onBack={() => setDetailView(null)} />
              ) : (
                <AppCourseDetail inlineSlug={detailView.slug} onBack={() => setDetailView(null)} />
              )}
            </div>
          </Suspense>
        ) : (
          <div className="space-y-8">
            {activeTab === "my-courses" && <MyCoursesTab onBrowseCatalog={() => handleTabChange("courses")} />}
            {activeTab === "tracks" && <TracksTab />}
            {activeTab === "courses" && <CoursesTab onOpenCourse={(slug) => setDetailView({ type: "course", slug })} />}
            {activeTab === "events" && (
              <EventsTab onOpenCompetition={(slug) => setDetailView({ type: "competition", slug })} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
