import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Target,
  Briefcase,
  Building2,
  Code,
  HeartPulse,
  Megaphone,
  DollarSign,
  Palette,
  Gavel,
  ChevronRight,
  Zap,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Career Specialization Router
 * CTO Reference: Authoritative micro-ingress point for professional track segmentation.
 */

const PROFESSION_ICONS: Record<string, React.ElementType> = {
  sales: Megaphone,
  marketing: Megaphone,
  banking: Building2,
  finance: DollarSign,
  tech: Code,
  dev: Code,
  software: Code,
  healthcare: HeartPulse,
  medical: HeartPulse,
  design: Palette,
  creative: Palette,
  legal: Gavel,
  abroad: Globe,
  default: Briefcase,
};

function getIconForCategory(name: string = ""): React.ElementType {
  const lowerName = name.toLowerCase();
  const match = Object.keys(PROFESSION_ICONS).find((key) => lowerName.includes(key));
  return match ? PROFESSION_ICONS[match] : PROFESSION_ICONS.default;
}

const TRACK_STYLES = [
  {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "group-hover:border-blue-500/30",
    shadow: "shadow-blue-500/5",
  },
  {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "group-hover:border-emerald-500/30",
    shadow: "shadow-emerald-500/5",
  },
  {
    bg: "bg-violet-500/10",
    text: "text-violet-500",
    border: "group-hover:border-violet-500/30",
    shadow: "shadow-violet-500/5",
  },
  {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "group-hover:border-amber-500/30",
    shadow: "shadow-amber-500/5",
  },
  {
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "group-hover:border-rose-500/30",
    shadow: "shadow-rose-500/5",
  },
];

export function CareerTracksPreview() {
  const navigate = useNavigate();

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["career-tracks-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profession_categories")
        .select("id, name, slug, icon, description")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .limit(8);

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading) {
    return (
      <section className="space-y-4 px-1">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40 rounded-lg opacity-40" />
          <Skeleton className="h-4 w-12 rounded-md opacity-20" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[140px] w-[110px] rounded-[28px] shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="px-1">
        <SectionHeader icon={Target} title="Career Tracks" viewAllPath="/app/learning/tracks" />
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-6 pt-1 px-1">
          {tracks.map((track, index) => {
            const Icon = getIconForCategory(track.name);
            const style = TRACK_STYLES[index % TRACK_STYLES.length];

            return (
              <Card
                key={track.id}
                className={cn(
                  "group relative cursor-pointer transition-all duration-500 shrink-0 w-[115px] rounded-[28px] border-2 border-border/40 overflow-hidden bg-card/30 backdrop-blur-md",
                  "hover:shadow-2xl hover:-translate-y-1.5 active:scale-90",
                  style.border,
                  style.shadow,
                )}
                onClick={() => navigate(`/app/learning/tracks/${track.slug}`)}
              >
                {/* Visual Glow Node */}
                <div
                  className={cn(
                    "absolute -top-10 -right-10 w-20 h-20 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity",
                    style.bg,
                  )}
                />

                <CardContent className="p-5 flex flex-col items-center text-center gap-4">
                  <div
                    className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-700 group-hover:rotate-6 shadow-inner border border-white/5",
                      style.bg,
                      style.text,
                    )}
                  >
                    <Icon className="h-6 w-6 stroke-[2.5px]" />
                  </div>

                  <div className="space-y-2">
                    <p className="font-black text-[10px] uppercase tracking-widest leading-none text-foreground italic">
                      {track.name.replace(" ", "_")}
                    </p>
                    <div className="flex items-center justify-center opacity-40 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                      <Zap className={cn("h-3 w-3 fill-current", style.text)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </section>
  );
}
