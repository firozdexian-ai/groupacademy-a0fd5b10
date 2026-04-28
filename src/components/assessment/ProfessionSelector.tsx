import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Zap, ShieldCheck, Sparkles } from "lucide-react";
import { getIcon } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Professional Trajectory Selector
 * CTO Reference: Authoritative entry node for category-based assessment routing.
 */

interface ProfessionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
}

interface ProfessionSelectorProps {
  categories: ProfessionCategory[];
  onSelect: (category: ProfessionCategory) => void;
  onBack: () => void;
}

export function ProfessionSelector({ categories, onSelect, onBack }: ProfessionSelectorProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 text-left">
      {/* HUD: NAVIGATION_INGRESS */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-10 rounded-xl font-black uppercase italic text-[10px] tracking-widest gap-2 transition-all hover:bg-muted/10"
      >
        <ArrowLeft className="h-4 w-4" /> ABORT_TRAJECTORY
      </Button>

      {/* HUD: REGISTRY_HEADER */}
      <div className="mb-16 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground leading-none">
            Initialize_Sync
          </h2>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground italic max-w-lg ml-1">
          Select your professional trajectory to commence neural artifact alignment.
        </p>
      </div>

      {/* COMPONENT: REGISTRY_GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const IconComponent = getIcon(category.icon);

          return (
            <Card
              key={category.id}
              className={cn(
                "group cursor-pointer rounded-[32px] border-2 border-border/40 bg-card/40 backdrop-blur-xl transition-all duration-500",
                "hover:border-primary/40 hover:shadow-2xl hover:-translate-y-2 active:scale-95 overflow-hidden",
              )}
              onClick={() => onSelect(category)}
            >
              <CardHeader className="p-8 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 bg-primary/5 rounded-[22px] border-2 border-primary/10 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                    <IconComponent className="w-8 h-8 text-primary fill-current opacity-60" />
                  </div>
                  <Sparkles className="h-4 w-4 text-primary/20 group-hover:text-primary transition-colors animate-pulse" />
                </div>
                <CardTitle className="text-xl font-black uppercase italic tracking-tighter text-foreground group-hover:text-primary transition-colors">
                  {category.name.replace(" ", "_")}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8 pt-0 space-y-6">
                <CardDescription className="text-xs font-medium italic text-muted-foreground/80 leading-relaxed min-h-[40px]">
                  {category.description || `High-fidelity assessment protocol tailored for ${category.name} artifacts.`}
                </CardDescription>

                <div className="flex items-center justify-between pt-4 border-t border-border/10">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">
                      Verified_Track
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary">
                    <span className="text-[9px] font-black uppercase tracking-tighter italic">Initialize</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
