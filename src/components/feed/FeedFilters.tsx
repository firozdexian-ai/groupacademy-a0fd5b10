import { useState } from "react";
import { Play, BookOpen, LayoutGrid, Newspaper, FileText, BarChart3, MoreHorizontal, LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { FeedFilters as FeedFiltersType, FeedFilterType } from "@/hooks/useFeedRecommendations";

/**
 * FeedFilters — compact 4-slot row + "More" sheet.
 * Mirrors AgentFilters pattern; no horizontal scroll.
 */

interface FeedFiltersProps {
  filters: FeedFiltersType;
  onChange: (filters: FeedFiltersType) => void;
  counts?: Partial<Record<FeedFilterType, number>>;
}

interface FilterDef {
  value: FeedFilterType;
  label: string;
  icon: LucideIcon;
}

const PRIMARY: FilterDef[] = [
  { value: "all", label: "All", icon: LayoutGrid },
  { value: "post", label: "Posts", icon: FileText },
  { value: "course", label: "Courses", icon: BookOpen },
];

const EXTRA: FilterDef[] = [
  { value: "video", label: "Videos", icon: Play },
  { value: "blog", label: "Articles", icon: Newspaper },
  { value: "poll", label: "Polls", icon: BarChart3 },
];

export function FeedFilters({ filters, onChange, counts }: FeedFiltersProps) {
  const [open, setOpen] = useState(false);
  const selectedExtra = EXTRA.find((c) => c.value === filters.type);
  const slot4: FilterDef | "more" = selectedExtra ?? "more";

  const tile = (def: FilterDef, onClick: () => void) => {
    const isActive = filters.type === def.value;
    const Icon = def.icon;
    const count = counts?.[def.value];
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex flex-col items-center justify-center gap-1 rounded-2xl border p-2 h-[60px] transition-all active:scale-95",
          isActive
            ? "bg-primary border-primary text-primary-foreground shadow-md"
            : "bg-card border-border/60 text-foreground hover:border-primary/40",
        )}
      >
        <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")} />
        <span className="text-[10px] font-semibold leading-none">
          {def.label}
          {typeof count === "number" && count > 0 && (
            <span className={cn("ml-1 opacity-70", isActive ? "text-primary-foreground" : "text-muted-foreground")}>
              ({count})
            </span>
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="grid grid-cols-4 gap-2">
      {PRIMARY.map((c) => tile(c, () => onChange({ ...filters, type: c.value })))}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {slot4 === "more" ? (
            <button
              type="button"
              className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-border/60 bg-card p-2 h-[60px] transition-all active:scale-95 hover:border-primary/40"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground">More</span>
            </button>
          ) : (
            tile(slot4, () => setOpen(true))
          )}
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>More filters</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 mt-4">
            {EXTRA.map((c) =>
              tile(c, () => {
                onChange({ ...filters, type: c.value });
                setOpen(false);
              }),
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
