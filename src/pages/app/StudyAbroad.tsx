import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap,
  MapPin,
  Calendar,
  ArrowLeft,
  Search,
  Award,
  AlertCircle,
  Coins,
  Sparkles,
  ArrowRight,
  Target,
  Zap,
  Globe,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Global Academic Discovery Node
 * High-fidelity orchestrator for international degree pathways and university matching.
 * 2026 Standard: Executive Logic geometry with reinforced search telemetry.
 */

const STUDY_COUNTRIES = COUNTRIES.filter((c) =>
  ["US", "UK", "CA", "AU", "DE", "SG", "JP", "SE", "NL", "MY"].includes(c.code),
);

const DEGREE_TYPES = ["All Degrees", "Bachelor", "Master", "PhD", "Diploma"];

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function StudyAbroad() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { balance } = useCredits();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "all");
  const [selectedDegree, setSelectedDegree] = useState(searchParams.get("degree") || "All Degrees");

  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    const params: any = {};
    if (selectedCountry !== "all") params.country = selectedCountry;
    if (selectedDegree !== "All Degrees") params.degree = selectedDegree;
    if (debouncedSearch) params.search = debouncedSearch;
    setSearchParams(params, { replace: true });
  }, [selectedCountry, selectedDegree, debouncedSearch, setSearchParams]);

  const {
    data: programs,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["study-abroad-programs", selectedCountry, selectedDegree, debouncedSearch],
    queryFn: async ({ signal }) => {
      let query = supabase
        .from("study_abroad_programs")
        .select("*")
        .eq("is_active", true)
        .order("featured", { ascending: false })
        .order("university_name")
        .abortSignal(signal);

      if (selectedCountry !== "all") query = query.eq("country_code", selectedCountry);
      if (selectedDegree !== "All Degrees") query = query.eq("degree_type", selectedDegree);
      if (debouncedSearch) {
        query = query.or(`university_name.ilike.%${debouncedSearch}%,program_name.ilike.%${debouncedSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Executive Header: Global Admissions Context */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="flex items-center gap-5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl h-12 w-12 hover:bg-primary/10 transition-all active:scale-90"
            onClick={() => navigate("/app/abroad")}
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Academic Discovery</h1>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/5 text-primary border-primary/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest italic">
                Global Registry v2.6
              </Badge>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 italic">
                Cross-Border Admissions Protocol
              </p>
            </div>
          </div>
        </div>

        <Card className="rounded-[32px] border-2 border-primary/20 bg-primary/5 shadow-2xl overflow-hidden min-w-[320px] group transition-all hover:border-primary/40">
          <CardContent className="p-6 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-[24px] bg-primary flex items-center justify-center rotate-3 shadow-primary/20 shadow-xl group-hover:rotate-0 transition-transform">
                <Coins className="h-7 w-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black tracking-tighter italic leading-none">{balance}</p>
                <p className="text-[9px] font-black uppercase text-primary tracking-widest mt-1 italic">
                  Active Credits
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="rounded-xl h-11 px-5 font-black uppercase text-[9px] tracking-widest shadow-xl shadow-primary/20 gap-2"
              onClick={() => navigate("/app/agents/global_admissions_bot")}
            >
              <Sparkles className="h-4 w-4 fill-current" /> AI Consultant
            </Button>
          </CardContent>
        </Card>
      </header>

      {/* Logic Query HUD: Sticky Filter Protocol */}
      <div className="sticky top-20 z-30 bg-background/60 backdrop-blur-2xl border-2 border-border/40 rounded-[32px] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Query universities or logic paths (fields of study)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 bg-card/50 border-2 border-border/10 rounded-2xl font-bold tracking-tight text-base"
            />
          </div>
          <div className="flex gap-3">
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-full lg:w-[220px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                <SelectValue placeholder="Destination" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2">
                <SelectItem value="all" className="font-bold">
                  🌍 Global Registry
                </SelectItem>
                {STUDY_COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="font-bold">
                    {getCountryFlag(c.code)} {c.name.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDegree} onValueChange={setSelectedDegree}>
              <SelectTrigger className="w-full lg:w-[180px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-card/50">
                <SelectValue placeholder="Degree" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2">
                {DEGREE_TYPES.map((d) => (
                  <SelectItem key={d} value={d} className="font-bold">
                    {d.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(searchTerm || selectedCountry !== "all" || selectedDegree !== "All Degrees") && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCountry("all");
                  setSelectedDegree("All Degrees");
                }}
                className="h-14 rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest text-destructive hover:bg-destructive/5"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Registry Viewport */}
      {isLoading ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-[40px] bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <Card className="rounded-[40px] border-2 border-destructive/20 bg-destructive/5 py-24 text-center animate-in zoom-in-95">
          <CardContent className="space-y-6">
            <AlertCircle className="h-16 w-16 text-destructive/40 mx-auto rotate-12" />
            <div className="space-y-2">
              <h3 className="text-3xl font-black uppercase tracking-tighter italic">Sync Error</h3>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
                Could not retrieve academic registry artifacts.
              </p>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="rounded-xl h-12 px-10 font-black uppercase text-[10px] border-2"
            >
              Retry Sequence
            </Button>
          </CardContent>
        </Card>
      ) : programs?.length ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 pb-20">
          {programs.map((p) => (
            <Card
              key={p.id}
              className="group rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-sm transition-all duration-500 hover:border-primary/40 hover:shadow-2xl overflow-hidden flex flex-col hover:-translate-y-1"
            >
              <div className="h-2.5 bg-muted/50 group-hover:bg-primary/20 transition-colors" />
              <CardHeader className="p-8 pb-4">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-16 w-16 rounded-[24px] bg-muted/50 border-2 border-border/10 flex items-center justify-center text-3xl shadow-inner group-hover:rotate-3 transition-transform duration-500">
                    {getCountryFlag(p.country_code)}
                  </div>
                  {p.featured && (
                    <Badge className="bg-amber-500/10 text-amber-600 border-none px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg shadow-sm italic">
                      <Zap className="h-3 w-3 mr-2 fill-current" /> Elite Artifact
                    </Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black tracking-tighter uppercase italic leading-none group-hover:text-primary transition-colors line-clamp-1">
                    {p.university_name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">
                    <MapPin className="h-3.5 w-3.5 text-primary/40" /> {p.country_name}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6 flex-1">
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 italic font-bold text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                  "{p.program_name}"
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 bg-muted/30 p-3 rounded-xl border border-border/10">
                    <GraduationCap className="h-4 w-4 text-primary" /> {p.degree_type}
                  </div>
                  <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 bg-muted/30 p-3 rounded-xl border border-border/10">
                    <Calendar className="h-4 w-4 text-primary" /> {p.duration || "N/A"}
                  </div>
                </div>
                {p.scholarship_available && (
                  <div className="flex items-center gap-3 pt-4 border-t border-border/10">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Award className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 italic">
                      Financial Aid Protocol Active
                    </span>
                  </div>
                )}
              </CardContent>
              <div className="p-8 pt-0">
                <Button
                  className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/20 group-hover:scale-[1.02] active:scale-95 transition-all"
                  onClick={() => navigate(`/app/abroad/study/${p.id}`)}
                >
                  Interrogate Node{" "}
                  <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-[48px] border-2 border-dashed border-border/40 bg-muted/5 py-32 text-center animate-in zoom-in-95 duration-700">
          <div className="h-24 w-24 rounded-[40px] bg-muted/10 flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-border/60 rotate-6">
            <Globe className="h-12 w-12 text-muted-foreground/20" />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black uppercase tracking-tighter italic">Registry Null</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic max-w-xs mx-auto leading-relaxed">
              No academic artifacts match this logic sequence. Adjust parameters to widen discovery.
            </p>
          </div>
          <Button
            onClick={() => {
              setSearchTerm("");
              setSelectedCountry("all");
              setSelectedDegree("All Degrees");
            }}
            className="mt-10 rounded-xl h-12 px-10 font-black uppercase text-[10px] tracking-widest border-2"
          >
            Broaden Protocol
          </Button>
        </Card>
      )}

      {/* Operational Trace Footer */}
      <footer className="mt-20 pt-10 border-t border-border/40 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Global Academic Registry: Active Sync
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Protocol: Executive Logic 2026.4
          </p>
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-1 w-8 rounded-full bg-primary/20" />
          ))}
        </div>
      </footer>
    </div>
  );
}
