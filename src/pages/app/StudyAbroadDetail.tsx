import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap,
  MapPin,
  Calendar,
  DollarSign,
  ArrowLeft,
  ExternalLink,
  Clock,
  Award,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  MessageCircle,
  ShieldCheck,
  Zap,
  Globe,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getCountryFlag } from "@/lib/constants/countries";
import { useTalent } from "@/hooks/useTalent";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Academic Specification Viewport
 * High-fidelity orchestrator for university interrogation and admission telemetry.
 * 2026 Standard: Executive Logic geometry with reinforced lead-gen handshakes.
 */

export default function StudyAbroadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();

  const {
    data: program,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["study-abroad-program", id],
    queryFn: async () => {
      if (!id) throw new Error("Registry Error: Null Program ID");
      const { data, error } = await supabase.from("study_abroad_programs").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return data;
    },
    enabled: !!id,
    retry: 1,
  });

  const handleExternalClick = async (url: string) => {
    if (talent?.id && program) {
      // CTO Lead-Gen Protocol: Sync interest artifact with contact registry
      await supabase.from("contacts").insert([
        {
          full_name: talent.fullName || "Anonymous Participant",
          email: talent.email || "internal-sync-node",
          subject: `Admission Intel: ${program.university_name}`,
          message: `High-intent lead generated for ${program.program_name} logic path. Initializing recruitment handshake.`,
        },
      ]);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (isLoading)
    return (
      <div className="max-w-5xl mx-auto p-12 space-y-10 animate-pulse">
        <Skeleton className="h-10 w-48 rounded-xl bg-muted/40" />
        <Skeleton className="h-[500px] w-full rounded-[40px] bg-muted/40" />
      </div>
    );

  if (isError || !program)
    return (
      <div className="max-w-4xl mx-auto py-32 text-center animate-in zoom-in-95">
        <AlertTriangle className="h-16 w-16 text-destructive/20 mx-auto mb-6 rotate-12" />
        <h2 className="text-3xl font-black uppercase tracking-tighter italic">Registry Sync Failure</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 italic mt-2">
          Artifact disappeared or access restricted by protocol.
        </p>
        <Button
          onClick={() => navigate("/app/abroad/study")}
          variant="outline"
          className="mt-8 rounded-xl px-10 h-12 font-black uppercase text-[10px] border-2"
        >
          Return to Catalog
        </Button>
      </div>
    );

  const requirements = Array.isArray(program.requirements) ? (program.requirements as string[]) : [];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in duration-1000">
      {/* Executive Navigation Handshake */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Button
          variant="ghost"
          className="group rounded-xl h-11 px-4 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 -ml-4"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-3 h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Discovery
        </Button>
        <div className="flex items-center gap-4">
          <Badge
            variant="outline"
            className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] px-3 py-1.5 tracking-widest"
          >
            REGISTRY_ID: {program.id.split("-")[0].toUpperCase()}
          </Badge>
          {program.url && (
            <Button
              onClick={() => handleExternalClick(program.url!)}
              className="hidden sm:flex rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
            >
              Initialize Application <ExternalLink className="h-4 w-4 ml-3" />
            </Button>
          )}
        </div>
      </header>

      {/* Hero Module: University Identity */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-end border-b border-border/10 pb-10">
        <div className="h-28 w-28 rounded-[32px] bg-primary/5 border-2 border-primary/20 flex items-center justify-center text-5xl shadow-2xl rotate-3 shrink-0">
          {getCountryFlag(program.country_code)}
        </div>
        <div className="space-y-3 text-center md:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9] selection:bg-primary/20">
              {program.university_name}
            </h1>
            {program.featured && (
              <Badge className="bg-amber-500 text-white border-none px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg shadow-xl animate-pulse">
                <Zap className="h-3 w-3 mr-2 fill-current" /> Elite Artifact
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">
              <MapPin className="h-4 w-4" /> {program.country_name}
            </div>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
            <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest italic">
              Global Node Verified
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Primary Spec: Program Logic */}
        <div className="lg:col-span-8 space-y-10">
          <Card className="rounded-[48px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
              <Globe className="h-64 w-64" />
            </div>
            <div className="h-2.5 bg-gradient-to-r from-primary via-blue-600 to-primary" />
            <CardHeader className="p-10 pb-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary italic">
                  Pathway Specification
                </p>
                <CardTitle className="text-4xl font-black tracking-tight leading-none uppercase italic selection:bg-primary/20">
                  {program.program_name}
                </CardTitle>
                <p className="text-lg font-medium text-muted-foreground italic pt-2">{program.field_of_study}</p>
              </div>
            </CardHeader>
            <CardContent className="p-10 pt-0 space-y-12">
              {/* Telemetry Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {
                    icon: GraduationCap,
                    label: "Degree Logic",
                    val: program.degree_type,
                    color: "text-primary",
                    bg: "bg-primary/5",
                  },
                  {
                    icon: Clock,
                    label: "Temporal Span",
                    val: program.duration || "N/A",
                    color: "text-blue-500",
                    bg: "bg-blue-500/5",
                  },
                  {
                    icon: DollarSign,
                    label: "Economic Value",
                    val: program.tuition_range || "Syncing...",
                    color: "text-emerald-500",
                    bg: "bg-emerald-500/5",
                  },
                  {
                    icon: Calendar,
                    label: "Sync Deadline",
                    val: program.application_deadline
                      ? format(new Date(program.application_deadline), "MMM d, yyyy")
                      : "OPEN",
                    color: "text-orange-500",
                    bg: "bg-orange-500/5",
                  },
                ].map((spec, i) => (
                  <div
                    key={i}
                    className={cn(
                      "p-5 rounded-3xl border border-border/10 space-y-3 shadow-inner group/spec transition-all hover:bg-card",
                      spec.bg,
                    )}
                  >
                    <spec.icon className={cn("h-6 w-6 group-hover/spec:scale-110 transition-transform", spec.color)} />
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">
                        {spec.label}
                      </p>
                      <p className="text-sm font-black uppercase tracking-tight">{spec.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Requirement Protocol */}
              <div className="space-y-8">
                <div className="flex items-center gap-4 border-b border-border/10 pb-4">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <h3 className="text-lg font-black uppercase tracking-tighter italic">Calibration Requirements</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requirements.length > 0 ? (
                    requirements.map((req, idx) => (
                      <div
                        key={idx}
                        className="flex gap-5 p-6 rounded-[28px] border-2 border-border/40 bg-background/50 hover:border-primary/40 transition-all group/req"
                      >
                        <div className="h-8 w-8 rounded-xl bg-muted/50 text-muted-foreground flex items-center justify-center text-[11px] font-black shrink-0 border group-hover/req:bg-primary group-hover/req:text-white transition-colors">
                          {(idx + 1).toString().padStart(2, "0")}
                        </div>
                        <span className="text-sm font-medium italic leading-relaxed text-foreground/80">{req}</span>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-10 text-center border-2 border-dashed rounded-[32px] bg-muted/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
                        Standard Registry Logic applies. Initialize consultation for specific artifacts.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: AI Consultant Node */}
        <aside className="lg:col-span-4 space-y-8 sticky top-24">
          <Card className="rounded-[40px] border-2 border-primary/20 bg-primary/5 shadow-[0_40px_80px_-20px_rgba(var(--primary-rgb),0.2)] overflow-hidden">
            <CardContent className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                  <Sparkles className="h-6 w-6 fill-current animate-pulse" />
                  <span className="text-xl font-black uppercase tracking-tighter italic">Neural Advisor</span>
                </div>
                <p className="text-sm font-medium italic text-muted-foreground leading-relaxed">
                  Synthesize a custom admission roadmap, visa logic paths, and automated SOP editing with our global
                  node.
                </p>
              </div>
              <Button
                className="w-full h-16 rounded-[24px] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
                onClick={() => navigate("/app/agents/study-abroad-advisor")}
              >
                <MessageCircle className="mr-3 h-5 w-5 fill-current" /> Initialize Consult
              </Button>
            </CardContent>
          </Card>

          {program.scholarship_available && (
            <Card className="rounded-[32px] border-2 border-emerald-500/20 bg-emerald-500/5 shadow-sm group">
              <CardContent className="p-8 flex items-center gap-6">
                <div className="h-16 w-16 rounded-[24px] bg-emerald-100 flex items-center justify-center text-emerald-600 transition-transform group-hover:rotate-6">
                  <Award className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest italic">
                    Financial Aid Active
                  </p>
                  <p className="text-base font-black uppercase tracking-tighter leading-tight mt-1">
                    Scholarship Node Accessible
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="px-6 opacity-30">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] italic leading-relaxed text-center">
              Academy Registry: Encrypted Protocol v2.6.4 Synchronized
            </p>
          </div>
        </aside>
      </div>

      {/* Mobile Tactical Control */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-2xl border-t-2 border-border/10 z-50 flex gap-4 sm:hidden shadow-[0_-20px_50px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-700">
        <Button
          variant="outline"
          className="flex-1 h-16 rounded-[24px] border-2 font-black uppercase text-[10px] tracking-widest"
          onClick={() => navigate("/app/agents/study-abroad-advisor")}
        >
          Neural Advisor
        </Button>
        {program.url && (
          <Button
            className="flex-1 h-16 rounded-[24px] font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/30"
            onClick={() => handleExternalClick(program.url!)}
          >
            Authorize Entry
          </Button>
        )}
      </div>
    </div>
  );
}
