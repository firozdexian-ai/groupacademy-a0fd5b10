import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Calendar,
  MapPin,
  Clock,
  Users,
  Video,
  ExternalLink,
  LayoutGrid,
  Trophy,
  Gift,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isPast, isToday, isFuture } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Event & Competition Ingress (EventsTab)
 * CTO Reference: Authoritative node for institutional engagement scheduling.
 */

type EventFilter = "all" | "live_webinar" | "offline_seminar" | "competitions";

const filterOptions: { key: EventFilter; icon: any; label: string }[] = [
  { key: "all", icon: LayoutGrid, label: "ALL_NODES" },
  { key: "live_webinar", icon: Video, label: "WEBINARS" },
  { key: "offline_seminar", icon: MapPin, label: "IN-PERSON" },
  { key: "competitions", icon: Trophy, label: "COMPETE" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  upcoming: { label: "UPCOMING", variant: "secondary" },
  active: { label: "LIVE_NOW", variant: "default" },
  judging: { label: "JUDGING", variant: "outline" },
  completed: { label: "ARCHIVED", variant: "secondary" },
  cancelled: { label: "TERMINATED", variant: "destructive" },
};

export function EventsTab({ onOpenCompetition }: EventsTabProps) {
  const navigate = useNavigate();
  const [eventType, setEventType] = useState<EventFilter>("all");

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["app-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content")
        .select(
          "id, title, description, content_type, event_date, event_duration_minutes, venue_name, venue_address, max_capacity, current_enrollment, cover_image_url, thumbnail_url, slug, whatsapp_group_link",
        )
        .eq("is_published", true)
        .in("content_type", ["live_webinar", "offline_seminar"])
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: eventType !== "competitions",
  });

  const { data: competitions = [], isLoading: competitionsLoading } = useQuery({
    queryKey: ["app-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: eventType === "all" || eventType === "competitions",
  });

  const isLoading = eventsLoading || (eventType === "competitions" && competitionsLoading);

  const filteredEvents =
    eventType === "all" || eventType === "competitions" ? events : events.filter((e) => e.content_type === eventType);

  const upcomingEvents = filteredEvents.filter((e) => e.event_date && isFuture(new Date(e.event_date)));
  const todayEvents = filteredEvents.filter((e) => e.event_date && isToday(new Date(e.event_date)));

  const EventCard = ({ event }: { event: any }) => {
    const eventDate = event.event_date ? new Date(event.event_date) : null;
    const isWebinar = event.content_type === "live_webinar";
    const spotsLeft = event.max_capacity ? event.max_capacity - (event.current_enrollment || 0) : null;

    return (
      <Card className="group overflow-hidden rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:border-primary/40">
        <div className="relative h-44 overflow-hidden bg-muted border-b-2 border-border/10">
          {event.cover_image_url ? (
            <img
              src={event.cover_image_url}
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5">
              <Calendar className="h-12 w-12 text-primary/10" />
            </div>
          )}
          <Badge
            variant="outline"
            className="absolute top-4 left-4 bg-background/80 backdrop-blur-md border-2 font-black italic px-3 py-1"
          >
            {isWebinar ? (
              <Video className="w-3.5 h-3.5 mr-2 text-blue-500" />
            ) : (
              <MapPin className="w-3.5 h-3.5 mr-2 text-rose-500" />
            )}
            <span className="text-[9px] uppercase tracking-widest">{isWebinar ? "WEBINAR" : "SEMINAR"}</span>
          </Badge>
        </div>
        <CardHeader className="p-6 pb-2 text-left">
          <CardTitle className="text-lg font-black leading-tight uppercase italic tracking-tighter group-hover:text-primary transition-colors">
            {event.title}
          </CardTitle>
          <CardDescription className="text-[11px] font-bold italic line-clamp-2 mt-2 uppercase opacity-60">
            {event.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-2 space-y-5 text-left">
          <div className="space-y-3 p-4 rounded-2xl bg-muted/20 border-2 border-border/10">
            {eventDate && (
              <div className="flex items-center gap-3 text-[10px] font-black uppercase italic tracking-widest text-primary">
                <Calendar className="w-4 h-4" />
                <span>{format(eventDate, "PPP")}</span>
              </div>
            )}
            <div className="flex items-center gap-5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> {format(eventDate || new Date(), "p")}
              </div>
              {spotsLeft !== null && (
                <div className={cn("flex items-center gap-2", spotsLeft <= 5 ? "text-rose-500 animate-pulse" : "")}>
                  <Users className="h-3.5 w-3.5" /> {spotsLeft > 0 ? `${spotsLeft} NODES_LEFT` : "NODE_FULL"}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              className="flex-1 rounded-2xl h-11 text-[10px] font-black uppercase italic tracking-widest shadow-lg active:scale-95"
              size="sm"
            >
              REGISTER_SYNC
            </Button>
            {event.whatsapp_group_link && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-2xl h-11 border-2 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/10 gap-2 font-black uppercase italic text-[10px]"
                asChild
              >
                <a href={event.whatsapp_group_link} target="_blank" rel="noopener noreferrer">
                  COMM_NODE
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[400px] w-full rounded-[40px] opacity-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* CATEGORY_SELECTOR: Segmented Navigation */}
      <div className="grid grid-cols-4 gap-4 p-2 bg-muted/20 backdrop-blur-md rounded-[28px] border-2 border-border/40">
        {filterOptions.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setEventType(key)}
            className="flex flex-col items-center gap-2 group outline-none"
          >
            <div
              className={cn(
                "h-14 w-14 rounded-[20px] flex items-center justify-center transition-all duration-500 border-2",
                "group-hover:scale-110",
                eventType === key
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                  : "bg-background/50 border-border/10 text-muted-foreground/60",
              )}
            >
              <Icon className="h-6 w-6 stroke-[2.5px]" />
            </div>
            <span
              className={cn(
                "text-[9px] font-black uppercase tracking-[0.2em] italic",
                eventType === key ? "text-primary" : "text-muted-foreground/40",
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-12">
        {/* TEMPORAL_SIGNAL: Happening Today */}
        {todayEvents.length > 0 && eventType !== "competitions" && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-1">
              <div className="h-3 w-3 rounded-full bg-rose-500 animate-ping shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
              <h2 className="text-xs font-black uppercase tracking-[0.4em] italic text-rose-500">HAPPENING_TODAY</h2>
            </div>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              {todayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* COMPETITION_HUB: High-Yield Engagements */}
        {(eventType === "all" || eventType === "competitions") && competitions.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-1">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                <Trophy className="h-5 w-5" />
              </div>
              <h2 className="text-sm font-black uppercase italic tracking-tighter">INSTITUTIONAL_COMPETITIONS</h2>
            </div>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              {competitions.map((comp) => (
                <Card
                  key={comp.id}
                  className="group cursor-pointer rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl overflow-hidden hover:border-primary/40 transition-all active:scale-[0.98]"
                  onClick={() =>
                    onOpenCompetition
                      ? onOpenCompetition(comp.slug)
                      : navigate(`/app/learning/competitions/${comp.slug}`)
                  }
                >
                  <div className="flex h-36 bg-muted relative border-b-2 border-border/10">
                    {comp.featured_image && (
                      <img
                        src={comp.featured_image}
                        className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent p-6 flex flex-col justify-center text-left">
                      <div className="mb-3">
                        <Badge className="bg-amber-500/10 text-amber-600 border-2 border-amber-500/20 text-[9px] font-black uppercase italic tracking-widest">
                          {STATUS_CONFIG[comp.status]?.label || "UPCOMING"}
                        </Badge>
                      </div>
                      <h3 className="font-black text-lg tracking-tighter uppercase italic line-clamp-1">
                        {comp.title}
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-widest italic">
                        {comp.category}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase italic tracking-widest text-primary">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Gift className="h-4 w-4" />
                      </div>
                      <span>{Array.isArray(comp.prizes) ? comp.prizes.length : 0} PRIZE_LAYERS</span>
                    </div>
                    <div className="flex items-center text-[10px] font-black uppercase italic tracking-widest gap-2 opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">
                      ENTER_HUB <Zap className="h-3 w-3 fill-current" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* SCHEDULE_NODE: Upcoming Trajectory */}
        {upcomingEvents.length > 0 && eventType !== "competitions" && (
          <section className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] px-1 italic opacity-40">UPCOMING_SCHEDULE</h2>
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </div>

      {events.length === 0 && competitions.length === 0 && (
        <div className="py-24 text-center space-y-6">
          <Calendar className="h-16 w-16 text-muted-foreground/10 mx-auto animate-pulse" />
          <p className="text-[10px] font-black uppercase italic tracking-[0.3em] text-muted-foreground/40">
            NO_ENGAGEMENT_NODES_LISTED
          </p>
        </div>
      )}
    </div>
  );
}
