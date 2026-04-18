import { useState } from "react";
import { Search, X, Sparkles, Target, BookOpen, Coins, Heart, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AgentCategory = "all" | "career" | "education" | "finance" | "wellness" | "company";

interface AgentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: AgentCategory;
  onCategoryChange: (category: AgentCategory) => void;
  showCompanyTab?: boolean;
}

const CATEGORIES: { value: AgentCategory; label: string; icon: any; color: string }[] = [
  { value: "all", label: "All", icon: Sparkles, color: "text-amber-500" },
  { value: "career", label: "Career", icon: Target, color: "text-rose-500" },
  { value: "education", label: "Academy", icon: BookOpen, color: "text-blue-500" },
  { value: "finance", label: "Finance", icon: Coins, color: "text-emerald-500" },
  { value: "wellness", label: "Wellness", icon: Heart, color: "text-pink-500" },
  { value: "company", label: "Enterprise", icon: Building2, color: "text-indigo-500" },
];

export function AgentFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  showCompanyTab = false,
}: AgentFiltersProps) {
  const [isFocused, setIsFocused] = useState(false);

  const visibleCategories = CATEGORIES.filter((c) => c.value !== "company" || showCompanyTab);

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
      {/* Search Input Bar */}
      <div className="relative group">
        <div
          className={cn(
            "absolute inset-0 bg-primary/5 rounded-2xl transition-all duration-300 scale-95 opacity-0 group-focus-within:scale-100 group-focus-within:opacity-100 blur-xl",
            isFocused && "opacity-100",
          )}
        />

        <div className="relative flex items-center">
          <Search
            className={cn(
              "absolute left-4 h-4 w-4 transition-all duration-300",
              isFocused ? "text-primary scale-110" : "text-muted-foreground",
            )}
          />
          <Input
            type="text"
            placeholder="Search AI agents or expertise..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "pl-11 pr-11 h-12 bg-muted/40 border-0 rounded-2xl transition-all",
              "focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-background shadow-sm",
            )}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 h-8 w-8 rounded-xl hover:bg-muted"
              onClick={() => onSearchChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Horizontal Category Slider */}
      <div className="relative">
        <div className="flex gap-2 overflow-x-auto pb-2 px-1 no-scrollbar mask-fade-right touch-pan-x">
          {visibleCategories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.value;

            return (
              <button
                key={category.value}
                onClick={() => onCategoryChange(category.value)}
                aria-selected={isSelected}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shrink-0",
                  "border border-transparent active:scale-95",
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105 z-10"
                    : "bg-card border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                )}
              >
                <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : category.color)} />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
