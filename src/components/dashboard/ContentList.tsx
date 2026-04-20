import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash2,
  Video,
  BookOpen,
  Presentation,
  Users,
  MapPin,
  RefreshCw,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldCheck,
  Activity,
  Layers,
  Terminal,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { CardGridSkeleton } from "@/components/ui/page-loading-skeleton";
import { useNavigate } from "react-router-dom";
import ContentFilters, { type ContentFilterValues } from "./ContentFilters";
import ContentReadinessBadge, { type ModuleStats } from "./ContentReadinessBadge";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Academic Artifact Registry (Content List)
 * High-fidelity orchestrator for multi-modal educational assets and logic tiers.
 * 2026 Standard: Executive Logic geometry with reinforced readiness telemetry.
 */

interface Content {
  id: string;
  title: string;
  content_type: string;
  description: string | null;
  price: number;
  is_published: boolean;
  instructor_name: string | null;
  event_date: string | null;
  max_capacity: number | null;
  current_enrollment: number;
  profession_line_id: string | null;
  profession_level_id: string | null;
}

type ContentType = "batch_class" | "free_video" | "live_webinar" | "offline_seminar" | "recorded_course";

interface ContentListProps {
  filter?: ContentType;
}

const TYPE_CONFIG: Record<string, { icon: LucideIcon; label: string; color: string; bg: string }> = {
  free_video: { icon: Video, label: "FREE_VIDEO", color: "text-blue-500", bg: "bg-blue-500/10" },
  recorded_course: { icon: BookOpen, label: "COURSE_NODE", color: "text-purple-500", bg: "bg-purple-500/10" },
  live_webinar: { icon: Presentation, label: "WEBINAR_LOGIC", color: "text-teal-500", bg: "bg-teal-500/10" },
  batch_class: { icon: Users, label: "BATCH_CLASS", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  offline_seminar: { icon: MapPin, label: "SEMINAR_OFFLINE", color: "text-orange-500", bg: "bg-orange-500/10" },
};

const ITEMS_PER_PAGE = 9;

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const ContentList = ({ filter }: ContentListProps) => {
  const navigate = useNavigate();
  const [content, setContent] = useState<Content[]>([]);
  const [moduleStatsMap, setModuleStatsMap] = useState<Record<string, ModuleStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [filters, setFilters] = useState<ContentFilterValues>({
    programId: "all",
    levelId: "all",
    readiness: "all",
    sortBy: "newest",
  });

  const fetchModuleStats = useCallback(async (contentIds: string[]) => {
    if (contentIds.length === 0) {
      setModuleStatsMap({});
      return;
    }
    const { data } = await supabase
      .from("course_modules")
      .select("content_id, description, video_url")
      .in("content_id", contentIds);
    if (!data) return;

    const map: Record<string, ModuleStats> = {};
    for (const row of data) {
      if (!map[row.content_id]) map[row.content_id] = { module_count: 0, modules_with_desc: 0, modules_with_video: 0 };
      map[row.content_id].module_count++;
      if (row.description && row.description.trim().length > 500) map[row.content_id].modules_with_desc++;
      if (row.video_url && row.video_url.trim().length > 0) map[row.content_id].modules_with_video++;
    }
    setModuleStatsMap(map);
  }, []);

  const loadRegistry = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const sortCol = filters.sortBy.startsWith("title") ? "title" : "created_at";
      const sortAsc = filters.sortBy === "oldest" || filters.sortBy === "title_asc";

      let query = supabase.from("content").select("*", { count: "exact" }).order(sortCol, { ascending: sortAsc });
      if (filter) query = query.eq("content_type", filter);
      if (filters.programId !== "all") query = query.eq("profession_line_id", filters.programId);
      if (filters.levelId !== "all") query = query.eq("profession_level_id", filters.levelId);

      if (debouncedSearch) {
        const safe = sanitizeIlike(debouncedSearch);
        if (safe) query = query.or(`title.ilike.%${safe}%,instructor_name.ilike.%${safe}%`);
      }

      if (filters.readiness !== "all") {
        const allResult = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Registry Sync Timeout");
        if (allResult.error) throw allResult.error;
        const allContent = (allResult.data || []) as Content[];
        const { data: moduleData } = await supabase
          .from("course_modules")
          .select("content_id, description, video_url")
          .in(
            "content_id",
            allContent.map((c) => c.id),
          );

        const statsMap: Record<string, ModuleStats> = {};
        for (const row of moduleData || []) {
          if (!statsMap[row.content_id])
            statsMap[row.content_id] = { module_count: 0, modules_with_desc: 0, modules_with_video: 0 };
          statsMap[row.content_id].module_count++;
          if (row.description?.length > 500) statsMap[row.content_id].modules_with_desc++;
          if (row.video_url?.trim()) statsMap[row.content_id].modules_with_video++;
        }

        const filtered = allContent.filter((c) => {
          const s = statsMap[c.id];
          switch (filters.readiness) {
            case "no_modules":
              return !s || s.module_count === 0;
            case "has_modules":
              return s && s.module_count > 0;
            case "complete":
              return s && s.module_count > 0 && s.modules_with_desc === s.module_count;
            default:
              return true;
          }
        });

        setTotalCount(filtered.length);
        const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
        setContent(paged);
        setModuleStatsMap(statsMap);
      } else {
        const from = (page - 1) * ITEMS_PER_PAGE;
        query = query.range(from, from + ITEMS_PER_PAGE - 1);
        const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Registry Link Timeout");
        if (result.error) throw result.error;
        setContent(result.data as Content[]);
        setTotalCount(result.count || 0);
        await fetchModuleStats((result.data as Content[]).map((c) => c.id));
      }
    } catch (err: any) {
      setLoadError("Transmission Error: Failed to synchronize registry nodes.");
    } finally {
      setIsLoading(false);
    }
  }, [page, filter, debouncedSearch, filters, fetchModuleStats]);

  useEffect(() => {
    loadRegistry();
  }, [loadRegistry]);
  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch, filters]);

  const confirmPurge = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabase.from("content").delete().eq("id", deleteId);
      if (error) throw error;
      toast.success("Artifact purged from registry.");
      loadRegistry();
    } catch (err: any) {
      toast.error("Handshake Failed: Logic termination aborted.");
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading && content.length === 0) return <CardGridSkeleton count={6} columns={3} />;

  return (
    <div className="space-y-10 animate-in fade-in duration-1000">
      {/* Executive Query Console */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-muted/20 p-6 rounded-[32px] border-2 border-border/40 backdrop-blur-md">
        <div className="relative flex-1 group w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Query artifact by title or logic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base"
          />
        </div>
        <div className="flex items-center gap-6 w-full lg:w-auto justify-between lg:justify-end">
          <div className="space-y-1 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic leading-none">
              Total Nodes
            </p>
            <p className="text-3xl font-black italic tracking-tighter leading-none">{totalCount}</p>
          </div>
          <Button
            onClick={() => navigate("/content/new")}
            className="rounded-xl h-14 px-8 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/30 group"
          >
            <Plus className="h-5 w-5 mr-3 transition-transform group-hover:rotate-90" /> Initialize Node
          </Button>
        </div>
      </div>

      <ContentFilters values={filters} onChange={setFilters} className="px-2" />

      {content.length === 0 ? (
        <Card className="rounded-[40px] border-2 border-dashed border-border/40 bg-card/10 py-24 text-center">
          <Layers className="h-16 w-16 text-muted-foreground/20 mx-auto mb-6" />
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic">
            Registry Node Null: No logic paths detected.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.map((item) => {
            const config = TYPE_CONFIG[item.content_type] || TYPE_CONFIG.free_video;
            const Icon = config.icon;

            return (
              <Card
                key={item.id}
                className="group rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:shadow-2xl overflow-hidden flex flex-col"
              >
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center border-2 border-white/5 shadow-inner transition-transform duration-500 group-hover:rotate-6",
                        config.bg,
                      )}
                    >
                      <Icon className={cn("h-6 w-6", config.color)} />
                    </div>
                    <Badge
                      className={cn(
                        "rounded-lg font-black text-[8px] uppercase tracking-[0.2em] px-3 py-1 border-none",
                        item.is_published ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground/60",
                      )}
                    >
                      {item.is_published ? "LIVE_NODE" : "IDLE_DRAFT"}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tighter italic leading-none group-hover:text-primary transition-colors line-clamp-2 min-h-[56px]">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-sm font-medium leading-relaxed text-muted-foreground italic line-clamp-2 pt-2">
                    "{item.description}"
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-8 pt-0 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-muted/10 border border-border/10">
                      <ContentReadinessBadge stats={moduleStatsMap[item.id]} />
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary italic leading-none">
                        {config.label}
                      </p>
                      {item.price > 0 ? (
                        <div className="flex items-center gap-1.5 font-black italic text-lg tracking-tighter">
                          <Zap className="h-4 w-4 fill-primary text-primary" /> ${item.price}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[9px] font-black uppercase">
                          ALPHA_FREE
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-border/10 flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-11 border-2 font-black uppercase text-[10px] tracking-widest hover:bg-primary hover:text-white transition-all"
                      onClick={() => navigate(`/content/${item.id}/edit`)}
                    >
                      <Edit className="w-4 h-4 mr-2" /> Recalibrate
                    </Button>
                    <Button
                      variant="ghost"
                      className="rounded-xl h-11 w-11 text-destructive/20 hover:text-destructive hover:bg-destructive/10 transition-all border-none"
                      onClick={() => setDeleteId(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Logic Pagination Terminal */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-8 bg-muted/20 rounded-[32px] border-2 border-border/40 backdrop-blur-md">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 italic leading-none">
              Registry Frame
            </p>
            <p className="text-xl font-black italic tracking-tighter leading-none">
              {page} <span className="text-xs opacity-20">of</span> {totalPages}
            </p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[32px] border-4 border-destructive/20 bg-background/95 p-10 shadow-2xl backdrop-blur-xl">
          <AlertDialogHeader>
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 border-2 border-destructive/20">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-3xl font-black uppercase tracking-tighter italic">
              Terminate Node?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground italic leading-relaxed">
              System warning: Permanent purge requested. Artifact and all associated logic chains (modules, resources,
              analytics) will be terminated. This cycle cannot be reversed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-4">
            <AlertDialogCancel className="rounded-xl h-14 px-8 font-black uppercase text-[10px] tracking-widest border-2">
              Decline Purge
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPurge}
              className="bg-destructive text-white rounded-xl h-14 px-10 font-black uppercase text-[10px] tracking-widest hover:bg-destructive/90"
            >
              Confirm Termination
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Academic Artifact Registry: Secured Access Active
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Protocol: Verified Executive Logic 2026.4
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
};

export default ContentList;
