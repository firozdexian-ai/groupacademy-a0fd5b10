import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Building2, MapPin, Clock, Briefcase, Star, ArrowRight, X, Filter } from "lucide-react";

interface Job {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string | null;
  job_type: string;
  experience_level: string;
  is_featured: boolean;
  created_at: string;
  salary_range_min?: number;
  salary_range_max?: number;
}

const JOB_TYPES: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
  remote: "Remote",
};

const JOB_TYPE_COLORS: Record<string, string> = {
  full_time: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  part_time: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  contract: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  internship: "bg-green-500/10 text-green-600 dark:text-green-400",
  freelance: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  remote: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Jobs" },
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "internship", label: "Internship" },
  { value: "remote", label: "Remote" },
  { value: "contract", label: "Contract" },
];

// Extracted JobCard Component for cleaner rendering
const JobCard = ({ job, onClick, style }: { job: Job; onClick: () => void; style?: React.CSSProperties }) => (
  <Card
    className="cursor-pointer overflow-hidden hover:shadow-md transition-all press-scale group"
    style={style}
    onClick={onClick}
  >
    <CardContent className="p-4">
      <div className="flex gap-4">
        {/* Company Logo */}
        <div className="shrink-0">
          {job.company_logo_url ? (
            <img
              src={job.company_logo_url}
              alt={job.company_name}
              className="w-12 h-12 rounded-xl object-cover border bg-muted"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
          )}
        </div>

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            {job.is_featured && (
              <Badge className="shrink-0 gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 h-5 text-[10px] px-1.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                Featured
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{job.company_name}</p>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={`text-[10px] font-medium h-5 px-2 border-0 ${JOB_TYPE_COLORS[job.job_type] || "bg-secondary text-secondary-foreground"}`}
            >
              <Clock className="w-2.5 h-2.5 mr-1" />
              {JOB_TYPES[job.job_type] || job.job_type.replace("_", " ")}
            </Badge>

            {job.location && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {job.location}
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <div className="self-center hidden sm:flex">
          <div className="w-8 h-8 rounded-full bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AppJobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state sync
  const initialSearch = searchParams.get("search") || "";
  const initialType = searchParams.get("type") || "all";

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [activeFilter, setActiveFilter] = useState(initialType);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);

      // Update URL without reloading
      const newParams = new URLSearchParams(searchParams);
      if (searchQuery) newParams.set("search", searchQuery);
      else newParams.delete("search");
      setSearchParams(newParams, { replace: true });
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery, setSearchParams, searchParams]);

  // Update filter in URL
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (activeFilter !== "all") newParams.set("type", activeFilter);
    else newParams.delete("type");
    setSearchParams(newParams, { replace: true });
  }, [activeFilter, setSearchParams, searchParams]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          "id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, salary_range_min, salary_range_max",
        )
        .eq("is_active", true)
        .or("deadline.is.null,deadline.gte.now()")
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtering for performance
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        !debouncedSearch ||
        job.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        job.company_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (job.location && job.location.toLowerCase().includes(debouncedSearch.toLowerCase()));

      const matchesFilter = activeFilter === "all" || job.job_type === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [jobs, debouncedSearch, activeFilter]);

  const clearFilters = () => {
    setSearchQuery("");
    setActiveFilter("all");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-muted"
          onClick={() => navigate("/app/feed")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Find Your Next Role</h1>
          <p className="text-xs text-muted-foreground">
            {loading ? "Loading jobs..." : `${filteredJobs.length} open positions`}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Search by role, company, or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-11 text-sm rounded-xl border-muted-foreground/20 focus:border-primary shadow-sm"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted"
            onClick={() => setSearchQuery("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide snap-x">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50 shrink-0 snap-start">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        {FILTER_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={activeFilter === option.value ? "default" : "outline"}
            size="sm"
            className={`rounded-full h-8 px-4 text-xs font-medium shrink-0 transition-all snap-start ${
              activeFilter === option.value
                ? "shadow-md scale-105"
                : "bg-background border-muted-foreground/20 hover:border-primary/50"
            }`}
            onClick={() => setActiveFilter(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </div>

      {/* Job List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden border-border/50">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Briefcase className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="font-bold text-lg mb-2">No jobs match your search</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
              {searchQuery || activeFilter !== "all"
                ? "Try adjusting your filters or search terms to find more results."
                : "Check back later for new opportunities."}
            </p>

            {(searchQuery || activeFilter !== "all") && (
              <Button variant="outline" onClick={clearFilters} className="rounded-full">
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 pb-8">
          {filteredJobs.map((job, index) => (
            <div
              key={job.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-backwards"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <JobCard job={job} onClick={() => navigate(`/app/jobs/${job.id}`)} />
            </div>
          ))}

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">End of list</p>
          </div>
        </div>
      )}
    </div>
  );
}
