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
  Search,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

// CTO: Extended Mapping for better DB-to-UI synchronization
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
  default: Briefcase,
};

function getIconForCategory(name: string = ""): React.ElementType {
  const lowerName = name.toLowerCase();
  const match = Object.keys(PROFESSION_ICONS).find((key) => lowerName.includes(key));
  return match ? PROFESSION_ICONS[match] : PROFESSION_ICONS.default;
}

// Professional Track Palettes
const TRACK_STYLES = [
  { bg: "bg-blue-500/10", text: "text-blue-600", border: "group-hover:border-blue-500/30" },
  { bg: "bg-emerald-500/10", text: "text-emerald-600", border: "group-hover:border-emerald-500/30" },
  { bg: "bg-violet-500/10", text: "text-violet-600", border: "group-hover:border-violet-500/30" },
  { bg: "bg-amber-500/10", text: "text-amber-600", border: "group-hover:border-amber-500/30" },
  { bg: "bg-rose-500/10", text: "text-rose-600", border: "group-hover:border-rose-500/30" },
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
    staleTime: 1000 * 60 * 60, // 1-hour cache for track categories
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-32 rounded-[24px] shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <section className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <SectionHeader icon={Target} title="Career Tracks" viewAllPath="/app/learning/tracks" />

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4 pt-1 px-1">
          {tracks.map((track, index) => {
            const Icon = getIconForCategory(track.name);
            const style = TRACK_STYLES[index % TRACK_STYLES.length];

            return (
              <Card
                key={track.id}
                className={cn(
                  "group cursor-pointer transition-all shrink-0 w-[120px] rounded-[24px] border-border/40 overflow-hidden",
                  "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 active:scale-95",
                  style.border,
                )}
                onClick={() => navigate(`/app/learning/tracks/${track.slug}`)}
              >
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div
                    className={cn(
                      "p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300",
                      style.bg,
                      style.text,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-black text-[11px] uppercase tracking-tight leading-tight line-clamp-2">
                      {track.name}
                    </p>
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className={cn("h-3 w-3", style.text)} />
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
