import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap, MapPin, Calendar, ArrowLeft, Search, Award,
  Coins, Sparkles, ArrowRight, Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { useCredits } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

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

  const { data: programs, isLoading, isError, refetch } = useQuery({
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

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCountry("all");
    setSelectedDegree("All Degrees");
  };

  return (
    <div className={PAGE_SHELL_WIDE}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/learning")} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <h1 className={PAGE_TITLE}>Study Abroad</h1>
        </div>
        <p className={PAGE_SUBTITLE}>Browse global universities and degree programs.</p>
      </header>

      {/* Balance + AI consultant */}
      <Card className={CARD}>
        <CardContent className="p-3 flex items-center gap-3">
          <Coins className="h-4 w-4 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold leading-none">{balance} credits</p>
            <p className={cn(META_TEXT, "mt-0.5")}>Available for AI consultation</p>
          </div>
          <Button
            size="sm"
            className="h-8 rounded-lg gap-1 text-xs"
            onClick={() => navigate("/app/agents/global_admissions_bot")}
          >
            <Sparkles className="h-3.5 w-3.5" /> Ask AI
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search universities or programs…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm rounded-xl"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 All countries</SelectItem>
              {STUDY_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>{getCountryFlag(c.code)} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDegree} onValueChange={setSelectedDegree}>
            <SelectTrigger className="h-9 text-xs rounded-xl"><SelectValue placeholder="Degree" /></SelectTrigger>
            <SelectContent>
              {DEGREE_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : isError ? (
        <EmptyState
          icon={Globe}
          title="Couldn't load programs"
          description="We hit an error fetching universities. Try again."
          action={{ label: "Retry", onClick: () => refetch() }}
        />
      ) : programs?.length ? (
        <div className="space-y-2">
          {programs.map((p) => (
            <Card
              key={p.id}
              className={cn(CARD, "cursor-pointer hover:border-primary/40 transition-colors")}
              onClick={() => navigate(`/app/abroad/study/${p.id}`)}
            >
              <CardContent className="p-3 flex gap-3">
                <div className="h-12 w-12 rounded-xl bg-muted/40 flex items-center justify-center text-2xl shrink-0">
                  {getCountryFlag(p.country_code)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold line-clamp-1">{p.university_name}</h3>
                    {p.featured && <Badge variant="outline" className="text-[10px] shrink-0">Featured</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.program_name}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={cn(META_TEXT, "flex items-center gap-1")}>
                      <MapPin className="h-3 w-3" /> {p.country_name}
                    </span>
                    <span className={cn(META_TEXT, "flex items-center gap-1")}>
                      <GraduationCap className="h-3 w-3" /> {p.degree_type}
                    </span>
                    {p.duration && (
                      <span className={cn(META_TEXT, "flex items-center gap-1")}>
                        <Calendar className="h-3 w-3" /> {p.duration}
                      </span>
                    )}
                    {p.scholarship_available && (
                      <span className="text-[11px] text-emerald-600 flex items-center gap-1">
                        <Award className="h-3 w-3" /> Scholarship
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground self-center shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Globe}
          title="No programs match your filters"
          description="Try broadening your search."
          action={{ label: "Clear filters", onClick: resetFilters }}
        />
      )}
    </div>
  );
}
