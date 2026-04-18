import { Play, BookOpen, LayoutGrid, Newspaper, FileText, BarChart3, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedFilters as FeedFiltersType, FeedFilterType } from "@/hooks/useFeedRecommendations";

interface FeedFiltersProps {
  filters: FeedFiltersType;
  onChange: (filters: FeedFiltersType) => void;
  counts?: {
    all: number;
    course: number;
    video: number;
    blog: number;
    post: number;
    poll: number;
  };
}

const filterOptions: {
  value: FeedFilterType;
  label: string;
  icon: LucideIcon;
}[] = [
  { value: "all", label: "All Feed", icon: LayoutGrid },
  { value: "post", label: "Updates", icon: FileText },
  { value: "poll", label: "Polls", icon: BarChart3 },
  { value: "course", label: "Courses", icon: BookOpen },
  { value: "video", label: "Videos", icon: Play },
  { value: "blog", label: "Articles", icon: Newspaper },
];

export function FeedFilters({ filters, onChange, counts }: FeedFiltersProps) {
  const handleTypeChange = (type: FeedFilterType) => {
    onChange({ ...filters, type });
  };

  return (
    <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex sm:grid sm:grid-cols-6 gap-1.5 p-1 bg-muted/30 rounded-xl border border-border/40 min-w-max sm:min-w-full">
        {filterOptions.map((option) => {
          const count = counts?.[option.value] ?? 0;
          const isActive = filters.type === option.value;
          const isEmpty = counts && count === 0 && !isActive;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              onClick={() => handleTypeChange(option.value)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 sm:px-1 rounded-lg transition-all duration-200 min-w-[70px] sm:min-w-0",
                isActive
                  ? "bg-background shadow-sm text-primary ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                isEmpty && "opacity-40 grayscale",
              )}
            >
              <Icon className={cn("h-4 w-4 mb-1 transition-transform", isActive && "scale-110")} />

              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-tighter transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {option.label}
              </span>

              {counts && (
                <span
                  className={cn(
                    "text-[9px] font-black mt-0.5 tabular-nums px-1.5 rounded-full bg-muted/50",
                    isActive ? "text-primary bg-primary/10" : "text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
