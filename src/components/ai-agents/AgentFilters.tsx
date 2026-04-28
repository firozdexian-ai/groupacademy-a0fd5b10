import { useState } from "react";
import { Search, X, Sparkles, Target, BookOpen, Coins, Heart, Building2, Zap, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Agent Discovery Filter Node
 * CTO Reference: Authoritative interface for neural marketplace discovery.
 */

export type AgentCategory = "all" | "career" | "education" | "finance" | "wellness" | "company";

interface AgentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: AgentCategory;
  onCategoryChange: (category: AgentCategory) => void;
  showCompanyTab?: boolean;
}

const CATEGORY_REGISTRY: { value: AgentCategory; label: string; icon: any; color: string }[] = [
  { value: "all", label: "Registry_All", icon: Sparkles, color: "text-amber-500" },
  { value: "career", label: "Recruit_Ops", icon: Target, color: "text-rose-500" },
  { value: "education", label: "Academy_Core", icon: BookOpen, color: "text-blue-500" },
  { value: "finance", label: "Fiscal_Node", icon: Coins, color: "text-emerald-500" },
  { value: "wellness", label: "Biometric_Sync", icon: Heart, color: "text-pink-500" },
  { value: "company", label: "Enterprise_Hub", icon: Building2, color: "text-indigo-500" },
];

export function AgentFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  showCompanyTab = false,
}: AgentFiltersProps) {
  const [isFocused, setIsFocused] = useState(false);

  const activeRegistry = CATEGORY_REGISTRY.filter((c) => c.value !== "company" || showCompanyTab);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700 text-left">
      {/* HUD: SEARCH_INGRESS */}
      <div className="relative group">
        {/* Dynamic focus glow protocol */}
        <div
          className={cn(
            "absolute inset-0 bg-primary/10 rounded-[20px] transition-all duration-1000 blur-3xl opacity-0 scale-90",
            isFocused && "opacity-100 scale-100",
          )}
        />

        <div className="relative flex items-center">
          <Search
            className={cn(
              "absolute left-5 h-4 w-4 transition-all duration-500",
              isFocused ? "text-primary scale-125 rotate-12" : "text-muted-foreground/40",
            )}
          />
          <Input
            type="text"
            placeholder="Initialize node search or faculty expertise..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "pl-12 pr-12 h-14 bg-muted/20 backdrop-blur-md border-2 border-border/40 rounded-[22px] transition-all duration-500 font-bold italic",
              "focus-visible:ring-primary/20 focus-visible:border-primary/40 focus-visible:bg-background shadow-2xl",
              searchQuery && "border-primary/20 bg-background",
            )}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
              onClick={() => onSearchChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* HUD: CATEGORY_SEGMENTATION */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Filter className="h-3 w-3 text-muted-foreground/60" />
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Trajectory_Filters
          </p>
        </div>

        <div className="relative">
          <div className="flex gap-3 overflow-x-auto pb-4 px-1 no-scrollbar touch-pan-x">
            {activeRegistry.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.value;

              return (
                <button
                  key={category.value}
                  onClick={() => onCategoryChange(category.value)}
                  className={cn(
                    "flex items-center gap-2.5 px-5 py-3 rounded-[18px] text-[10px] font-black uppercase italic tracking-[0.2em] transition-all duration-500 shrink-0",
                    "border-2 active:scale-90",
                    isSelected
                      ? "bg-primary border-primary text-white shadow-[0_10px_25px_-5px_rgba(var(--primary),0.4)] scale-105 z-10"
                      : "bg-card/40 backdrop-blur-sm border-border/40 text-muted-foreground hover:border-primary/20 hover:bg-background hover:text-foreground",
                  )}
                >
                  <div className={cn("p-1.5 rounded-lg transition-colors", isSelected ? "bg-white/20" : "bg-muted/10")}>
                    <Icon className={cn("h-3.5 w-3.5", isSelected ? "text-white" : category.color)} />
                  </div>
                  <span>{category.label}</span>
                  {isSelected && <Zap className="h-3 w-3 fill-current animate-pulse ml-1" />}
                </button>
              );
            })}
          </div>
          {/* Visual edge-fade protocol */}
          <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
