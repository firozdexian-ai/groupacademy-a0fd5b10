import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Calendar,
  MessageSquare,
  FileText,
  PhoneCall,
  MailOpen,
  Zap,
  ShieldCheck,
  TrendingUp,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import { IR_CONFIG } from "@/lib/irConfig";
import { InteractionLogger } from "./InteractionLogger";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Stakeholder Intelligence Terminal (InvestorDetailSheet)
 * CTO Reference: High-fidelity node for relationship auditing and sentiment telemetry.
 */

interface InvestorDetailSheetProps {
  investorId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InvestorDetailSheet({ investorId, open, onOpenChange }: InvestorDetailSheetProps) {
  const [showLogger, setShowLogger] = useState(false);

  const { data: investor } = useQuery({
    queryKey: ["ir-investor-detail", investorId],
    queryFn: async () => {
      if (!investorId) return null;
      const { data, error } = await supabase
        .from("ir_investors")
        .select("*, vc_firm:ir_vc_firms(id, name, status)")
        .eq("id", investorId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!investorId,
  });

  const { data: interactions } = useQuery({
    queryKey: ["ir-investor-interactions", investorId],
    queryFn: async () => {
      if (!investorId) return [];
      const { data, error } = await supabase
        .from("ir_investor_interactions")
        .select("*")
        .eq("investor_id", investorId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!investorId,
  });

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "email_sent":
        return <Mail className="h-4 w-4" />;
      case "reply_received":
        return <MailOpen className="h-4 w-4" />;
      case "meeting":
        return <Calendar className="h-4 w-4" />;
      case "call":
        return <PhoneCall className="h-4 w-4" />;
      case "note":
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const option = IR_CONFIG.SUBSCRIPTION_STATUS_OPTIONS.find((o) => o.value === status);
    return (
      <Badge
        className={cn(
          "font-black text-[10px] uppercase italic border-2 rounded-full px-3",
          status === "active" ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-muted text-muted-foreground",
        )}
      >
        {option?.label || status}
      </Badge>
    );
  };

  if (!investor) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl border-l-4 border-primary/20 bg-background/95 backdrop-blur-xl p-0 overflow-hidden flex flex-col">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />

        <SheetHeader className="p-8 border-b border-border/10 text-left bg-muted/20">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <SheetTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 text-primary" /> {investor.full_name}
              </SheetTitle>
              <SheetDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 italic">
                {investor.title ? `${investor.title.toUpperCase()} @ ` : ""}
                <span className="text-primary">{investor.vc_firm?.name?.toUpperCase() || "INDEPENDENT_NODE"}</span>
              </SheetDescription>
            </div>
            {getStatusBadge(investor.subscription_status)}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-8 py-6">
          <div className="space-y-10">
            {/* CORE CHANNELS */}
            <section className="space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic flex items-center gap-2">
                <Activity className="h-4 w-4" /> Core Channels
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <ChannelNode icon={Mail} value={investor.email} href={`mailto:${investor.email}`} />
                {investor.phone && <ChannelNode icon={Phone} value={investor.phone} href={`tel:${investor.phone}`} />}
                <div className="flex gap-3">
                  {investor.linkedin_url && (
                    <SocialBadge icon={Linkedin} href={investor.linkedin_url} label="LinkedIn" />
                  )}
                  {investor.twitter_handle && (
                    <SocialBadge
                      icon={Twitter}
                      href={`https://twitter.com/${investor.twitter_handle.replace("@", "")}`}
                      label="Twitter"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* NEURAL FEEDBACK SUMMARY */}
            {(investor.relationship_summary || investor.last_feedback_summary) && (
              <section className="space-y-4 bg-primary/5 p-6 rounded-[32px] border-2 border-primary/10">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary italic flex items-center gap-2">
                  <Zap className="h-4 w-4 fill-current" /> Neural Context
                </h4>
                <div className="space-y-4">
                  {investor.relationship_summary && (
                    <div>
                      <p className="text-[9px] font-black text-muted-foreground uppercase mb-1">Relationship Pulse</p>
                      <p className="text-sm font-medium italic leading-relaxed text-foreground/80">
                        {investor.relationship_summary}
                      </p>
                    </div>
                  )}
                  {investor.last_feedback_summary && (
                    <div className="border-t border-primary/10 pt-4">
                      <p className="text-[9px] font-black text-primary uppercase mb-1">Latest Feedback Artifact</p>
                      <p className="text-sm font-black italic leading-relaxed">"{investor.last_feedback_summary}"</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* PREFERENCE MAPPING */}
            <section className="space-y-4">
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground italic flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Sector Preferences
              </h4>
              <div className="flex flex-wrap gap-2">
                {investor.investor_interests?.map((interest: string) => (
                  <Badge
                    key={interest}
                    variant="outline"
                    className="bg-background border-2 font-bold text-[9px] uppercase italic rounded-xl px-3 py-1"
                  >
                    {interest}
                  </Badge>
                ))}
                {investor.investment_stage_pref && (
                  <Badge className="bg-blue-600/10 text-blue-600 border-2 border-blue-600/20 font-black italic text-[9px] rounded-xl px-3 py-1">
                    STAGE: {investor.investment_stage_pref.toUpperCase()}
                  </Badge>
                )}
              </div>
            </section>

            {/* INTERACTION TELEMETRY */}
            <section className="space-y-6 pb-10">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
                  Interaction Registry
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogger(true)}
                  className="rounded-xl border-2 font-black uppercase text-[10px] h-9"
                >
                  Log Pulse
                </Button>
              </div>

              <div className="space-y-4">
                {interactions && interactions.length > 0 ? (
                  interactions.map((interaction) => (
                    <div
                      key={interaction.id}
                      className="group flex gap-4 p-5 rounded-[24px] bg-muted/20 border-2 border-border/5 hover:border-primary/20 transition-all"
                    >
                      <div
                        className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center border-2 shrink-0",
                          interaction.sentiment === "positive"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : interaction.sentiment === "negative"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-muted/50 text-muted-foreground border-border/40",
                        )}
                      >
                        {getInteractionIcon(interaction.interaction_type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black uppercase italic tracking-tighter">
                            {IR_CONFIG.INTERACTION_TYPES.find(
                              (t) => t.value === interaction.interaction_type,
                            )?.label.toUpperCase() || interaction.interaction_type}
                          </p>
                          <span className="text-[10px] font-bold text-muted-foreground opacity-40 italic">
                            {format(new Date(interaction.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        {interaction.subject && (
                          <p className="text-sm font-bold leading-tight">{interaction.subject}</p>
                        )}
                        {interaction.content && (
                          <p className="text-xs font-medium text-muted-foreground leading-relaxed line-clamp-2 italic">
                            {interaction.content}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 opacity-20 italic font-black uppercase text-xs tracking-widest">
                    Zero interaction artifacts found
                  </div>
                )}
              </div>
            </section>
          </div>
        </ScrollArea>

        <InteractionLogger investorId={investorId} open={showLogger} onOpenChange={setShowLogger} />
      </SheetContent>
    </Sheet>
  );
}

function ChannelNode({ icon: Icon, value, href }: { icon: any; value: string; href: string }) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between p-4 rounded-2xl bg-muted/10 border-2 border-border/5 hover:border-primary/40 hover:bg-primary/5 transition-all"
    >
      <div className="flex items-center gap-3 text-sm font-bold italic">
        <Icon className="h-4 w-4 text-primary" />
        {value}
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </a>
  );
}

function SocialBadge({ icon: Icon, href, label }: { icon: any; href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-border/10 bg-muted/5 hover:bg-muted/20 hover:border-primary/20 transition-all"
    >
      <Icon className="h-4 w-4 text-primary" />
      <span className="text-[10px] font-black uppercase italic tracking-widest">{label}</span>
    </a>
  );
}
