import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { BookOpen, Target, Library, Bell } from "lucide-react";
import { useReviewQueue } from "@/domains/learning";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Sub-views imported as modules
import { MyHubView } from "@/domains/learning/components/talent/views/MyHubView";
import { TracksView } from "@/domains/learning/components/talent/views/TracksView";
import { AcademyView } from "@/domains/learning/components/talent/views/AcademyView";

type TabKey = "my-hub" | "tracks" | "academy";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
 { key: "my-hub", label: "My Hub", icon: BookOpen },
 { key: "tracks", label: "Career Path", icon: Target },
 { key: "academy", label: "Academy", icon: Library },
];

export default function LearningHub() {
 const navigate = useNavigate();
 const [searchParams, setSearchParams] = useSearchParams();

 React.useEffect(() => {
  if (searchParams.get("tab") === "study-abroad") {
   navigate("/app/abroad", { replace: true });
  }
 }, [searchParams, navigate]);

 const rawTab = searchParams.get("tab");
 const activeTab: TabKey = (rawTab === "tracks" || rawTab === "academy" ? rawTab : "my-hub");

 const { data: reviewQueue } = useReviewQueue({ limit: 50, itemsPerTopic: 1 });
 const dueReviews = reviewQueue?.total_due ?? 0;

 const handleTabChange = (key: TabKey) => {
  setSearchParams({ tab: key }, { replace: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
 };

 return (
  <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
   {/* Header Orchestration */}
   <header className="flex justify-between items-start">
    <h1 className="text-2xl font-black uppercase tracking-tight">Learning</h1>
    {dueReviews > 0 && <Badge variant="destructive">{dueReviews} Due</Badge>}
   </header>

   {/* Tab Navigation */}
   <nav className="flex gap-2 p-1 bg-muted/40 rounded-xl border">
    {TABS.map((tab) => (
     <button
      key={tab.key}
      onClick={() => handleTabChange(tab.key)}
      className={cn(
       "flex-1 py-2 flex items-center justify-center gap-2 rounded-lg text-xs font-bold uppercase transition-all",
       activeTab === tab.key ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
     >
      <tab.icon className="h-4 w-4" /> {tab.label}
     </button>
    ))}
   </nav>

   {/* View Delegation */}
   <main className="animate-in fade-in duration-300">
    {activeTab === "my-hub" && <MyHubView />}
    {activeTab === "tracks" && <TracksView />}
    {activeTab === "academy" && <AcademyView />}
   </main>
  </div>
 );
}
