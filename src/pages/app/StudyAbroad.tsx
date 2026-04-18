import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  GraduationCap,
  MapPin,
  Calendar,
  DollarSign,
  ArrowLeft,
  Search,
  Award,
  X,
  AlertCircle,
  Coins,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { COUNTRIES, getCountryFlag } from "@/lib/constants/countries";
import { useCredits } from "@/hooks/useCredits";

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
    error,
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

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCountry("all");
    setSelectedDegree("All Degrees");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* CTO Header: Awareness of Credit Economy */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/abroad")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Study Abroad</h1>
            <p className="text-sm text-muted-foreground italic">Global degree programs and university matching.</p>
          </div>
        </div>

        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="p-3 flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Your Balance</p>
              <p className="text-sm font-bold flex items-center justify-end gap-1">
                <Coins className="h-3 w-3 text-amber-500" /> {balance}
              </p>
            </div>
            <Button size="sm" className="h-8 gap-1.5" onClick={() => navigate("/app/agents/global_admissions_bot")}>
              <Sparkles className="h-3.5 w-3.5" /> AI Consultant
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Unified Filter Bar */}
      <div className="bg-card border rounded-2xl p-4 shadow-sm sticky top-2 z-20">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search universities or fields of study..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-11 bg-background"
            />
          </div>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger className="w-full md:w-[200px] h-11">
              <SelectValue placeholder="Destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">🌍 All Destinations</SelectItem>
              {STUDY_COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {getCountryFlag(c.code)} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedDegree} onValueChange={setSelectedDegree}>
            <SelectTrigger className="w-full md:w-[160px] h-11">
              <SelectValue placeholder="Degree" />
            </SelectTrigger>
            <SelectContent>
              {DEGREE_TYPES.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(searchTerm || selectedCountry !== "all" || selectedDegree !== "All Degrees") && (
            <Button variant="ghost" onClick={clearFilters} className="h-11">
              Reset
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/20 bg-destructive/5 py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-4" />
          <h3 className="font-bold">Sync Error</h3>
          <p className="text-sm text-muted-foreground mb-4">Could not retrieve program list.</p>
          <Button onClick={() => refetch()} variant="outline">
            Retry Connection
          </Button>
        </Card>
      ) : programs?.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-20">
          {programs.map((p) => (
            <Card
              key={p.id}
              className="group hover:shadow-xl transition-all hover:border-primary/50 overflow-hidden flex flex-col"
            >
              <div className="h-2 bg-muted group-hover:bg-primary/20 transition-colors" />
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-2xl border shadow-sm shrink-0">
                    {getCountryFlag(p.country_code)}
                  </div>
                  {p.featured && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
                      <Star className="w-3 h-3 fill-current mr-1" /> Featured
                    </Badge>
                  )}
                </div>
                <div className="pt-3">
                  <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                    {p.university_name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 font-medium">
                    <MapPin className="h-3 w-3" /> {p.country_name}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-1">
                <p className="text-sm font-bold text-foreground/80 line-clamp-1">{p.program_name}</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <GraduationCap className="h-3.5 w-3.5" /> {p.degree_type}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/50 p-2 rounded-lg">
                    <Calendar className="h-3.5 w-3.5" /> {p.duration || "N/A"}
                  </div>
                </div>
                {p.scholarship_available && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold">
                    <Award className="h-4 w-4" /> Financial Aid Available
                  </div>
                )}
              </CardContent>
              <div className="p-4 pt-0">
                <Button
                  className="w-full h-10 group-hover:bg-primary"
                  onClick={() => navigate(`/app/abroad/study/${p.id}`)}
                >
                  View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4 bg-muted/20 rounded-3xl border-2 border-dashed">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto" />
          <h3 className="text-xl font-bold">No Matching Programs</h3>
          <p className="text-muted-foreground">Try broadening your destination or degree filters.</p>
          <Button onClick={clearFilters} variant="link">
            Clear all criteria
          </Button>
        </div>
      )}
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return <Sparkles className={className} />;
}
