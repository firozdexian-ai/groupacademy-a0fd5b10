import { useState } from "react";
import { Sparkles, Target, BookOpen, Coins, Heart, Building2, GraduationCap, MoreHorizontal, LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

/**
 * Phase 11I: compact 4-slot icon filter row + "More" sheet.
 * No internal search bar — search lives in the page header.
 */
export type AgentCategory = "all" | "career" | "education" | "instructor" | "finance" | "wellness" | "company";

interface AgentFiltersProps {
  selectedCategory: AgentCategory;
  onCategoryChange: (c: AgentCategory) => void;
  showCompanyTab?: boolean;
  // Kept for back-compat; ignored.
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

interface CategoryDef {
  value: AgentCategory;
  label: string;
  icon: LucideIcon;
}

const PRIMARY: CategoryDef[] = [
  { value: "all", label: "All", icon: Sparkles },
  { value: "career", label: "Career", icon: Target },
  { value: "education", label: "Learning", icon: BookOpen },
];

const EXTRA: CategoryDef[] = [
  { value: "instructor", label: "Instructors", icon: GraduationCap },
  { value: "finance", label: "Finance", icon: Coins },
  { value: "wellness", label: "Wellness", icon: Heart },
  { value: "company", label: "Companies", icon: Building2 },
];

export function AgentFilters({ selectedCategory, onCategoryChange, showCompanyTab = false }: AgentFiltersProps) {
  const [open, setOpen] = useState(false);
  const extras = EXTRA.filter((c) => c.value !== "company" || showCompanyTab);
  // If user has an extra category selected, surface that into slot 4 instead of "More"
  const selectedExtra = extras.find((c) => c.value === selectedCategory);

  const slot4: CategoryDef | "more" = selectedExtra ?? "more";

  return (
    <div className="grid grid-cols-4 gap-2">
      {PRIMARY.map((c) => (
        <FilterTile
          key={c.value}
          icon={c.icon}
          label={c.label}
          active={selectedCategory === c.value}
          onClick={() => onCategoryChange(c.value)}
        />
      ))}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {slot4 === "more" ? (
            <button
              type="button"
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl border border-border/60 bg-card p-2 h-[68px] transition-all active:scale-95",
                "hover:border-primary/40",
              )}
            >
              <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground">More</span>
            </button>
          ) : (
            <FilterTile
              icon={slot4.icon}
              label={slot4.label}
              active
              onClick={() => setOpen(true)}
            />
          )}
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>More categories</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <FilterTile
              icon={Sparkles}
              label="All"
              active={selectedCategory === "all"}
              onClick={() => {
                onCategoryChange("all");
                setOpen(false);
              }}
            />
            {extras.map((c) => (
              <FilterTile
                key={c.value}
                icon={c.icon}
                label={c.label}
                active={selectedCategory === c.value}
                onClick={() => {
                  onCategoryChange(c.value);
                  setOpen(false);
                }}
              />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilterTile({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-2xl border p-2 h-[68px] transition-all active:scale-95",
        active
          ? "bg-primary border-primary text-primary-foreground shadow-md"
          : "bg-card border-border/60 text-foreground hover:border-primary/40",
      )}
    >
      <Icon className={cn("h-5 w-5", active ? "text-primary-foreground" : "text-primary")} />
      <span className="text-[10px] font-semibold leading-none">{label}</span>
    </button>
  );
}
