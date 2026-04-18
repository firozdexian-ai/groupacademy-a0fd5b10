import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSavedItems } from "@/hooks/useSavedItems";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Search, Briefcase, X, SlidersHorizontal, AlertCircle, RefreshCw } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { JOB_TYPES } from "@/lib/constants/jobTypes";

interface JobWithSalary extends JobCardData {
  salary_range_min?: number | null;
  salary_range_max?: number | null;
  salary_currency?: string | null;
}

export default function AppJobs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSaved, toggleSave } = useSavedItems();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>(
    searchParams.get("type") ? [searchParams.get("type")!] : [],
  );

  const targetCompany = searchParams.get("company");
  const targetLocation = searchParams.get("location");
  const sortOrder = searchParams.get("sort") || "newest";

  const [jobs, setJobs] = useState<JobWithSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExpLevels, setSelectedExpLevels] = useState<string[]>([]);
  const [salaryRange, setSalaryRange] = useState([0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const PAGE_SIZE = 50;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      const newParams = new URLSearchParams(searchParams);
      if (searchQuery) newParams.set("search", searchQuery);
      else newParams.delete("search");
      setSearchParams(newParams, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, setSearchParams]);

  const fetchJobs = useCallback(
    async (pageNum = 0, append = false) => {
      if (!append) {
        setLoading(true);
        setError(null);
      } else {
        setLoadingMore(true);
      }
      try {
        const from = pageNum * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        let query = supabase
          .from("jobs")
          .select(
            `
          id, title, company_name, company_logo_url, location, job_type, 
          experience_level, is_featured, created_at, deadline, 
          salary_range_min, salary_range_max, salary_currency
        `,
          )
          .eq("is_active", true)
          .or("deadline.is.null,deadline.gte.now()");

        if (targetCompany) query = query.ilike("company_name", `%${targetCompany}%`);
        if (targetLocation && targetLocation !== "abroad") query = query.ilike("location", `%${targetLocation}%`);

        if (sortOrder === "hot") query = query.order("is_featured", { ascending: false });
        else if (sortOrder === "expiring") query = query.order("deadline", { ascending: true });

        const { data, error } = await query.order("created_at", { ascending: false }).range(from, to);

        if (error) throw error;
        const newJobs = (data as JobWithSalary[]) || [];
        setHasMore(newJobs.length === PAGE_SIZE);
        setJobs((prev) => (append ? [...prev, ...newJobs] : newJobs));
        setPage(pageNum);
      } catch (err: any) {
        setError(err.message || "Failed to load jobs.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [targetCompany, targetLocation, sortOrder],
  );

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchSearch =
        !debouncedSearch ||
        job.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        job.company_name.toLowerCase().includes(debouncedSearch.toLowerCase());

      const matchType = selectedJobTypes.length === 0 || selectedJobTypes.includes(job.job_type);

      const normalizedExpLevel = job.experience_level?.replace("_level", "") || job.experience_level;
      const matchExp =
        selectedExpLevels.length === 0 ||
        selectedExpLevels.some((sel) => sel.replace("_level", "") === normalizedExpLevel);

      const minSalaryK = salaryRange[0];
      let matchSalary = true;
      if (minSalaryK > 0 && job.salary_range_max) {
        const thresholdInUSD = minSalaryK * 1000;
        const jobMaxInUSD = job.salary_currency === "BDT" ? job.salary_range_max / 110 : job.salary_range_max;
        matchSalary = jobMaxInUSD >= thresholdInUSD;
      }

      const matchLocationFilter =
        targetLocation !== "abroad" ||
        ["remote", "international", "abroad", "overseas"].some((term) => job.location?.toLowerCase().includes(term)) ||
        job.job_type === "remote";

      return matchSearch && matchType && matchExp && matchSalary && matchLocationFilter;
    });
  }, [jobs, debouncedSearch, selectedJobTypes, selectedExpLevels, salaryRange, targetLocation]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedJobTypes([]);
    setSelectedExpLevels([]);
    setSalaryRange([0]);
    setSearchParams({}, { replace: true });
  };

  return (
    // CTO FIX: Standardized max-w-6xl for platform consistency (Audit Polish)
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/jobs")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {targetCompany ? `${targetCompany} Jobs` : "All Jobs"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {loading ? "Scanning..." : `${filteredJobs.length} roles available`}
            </p>
          </div>
        </div>

        <div className="flex gap-2 w-full md:w-auto md:min-w-[400px]">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary" />
            <Input
              placeholder="Role, company, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-background"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-11 px-4 border-dashed">
                <SlidersHorizontal className="h-4 w-4 mr-2" /> Filters
                {selectedJobTypes.length + selectedExpLevels.length > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                    !
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Refine Results</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-180px)] pr-4 mt-4">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label>Job Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(JOB_TYPES).map(([key, value]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <Checkbox
                            id={key}
                            checked={selectedJobTypes.includes(key)}
                            onCheckedChange={(c) =>
                              c
                                ? setSelectedJobTypes([...selectedJobTypes, key])
                                : setSelectedJobTypes(selectedJobTypes.filter((t) => t !== key))
                            }
                          />
                          <label htmlFor={key} className="text-sm cursor-pointer">
                            {value.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <Label>Min Salary (USD Eq.)</Label>
                      <span className="text-xs font-mono">{salaryRange[0] > 0 ? `$${salaryRange[0]}k+` : "Any"}</span>
                    </div>
                    <Slider value={salaryRange} onValueChange={setSalaryRange} max={150} step={5} />
                  </div>
                </div>
              </ScrollArea>
              <SheetFooter className="mt-4 gap-2">
                <Button variant="outline" className="flex-1" onClick={clearFilters}>
                  Reset
                </Button>
                <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                  Show Results
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-48">
              <CardContent className="p-4 space-y-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="py-20 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">No matches found</h3>
          <Button variant="link" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={isSaved(job.id, "job")}
              onSaveToggle={() => toggleSave(job.id, "job")}
              onClick={() => navigate(`/app/jobs/${job.id}`)}
            />
          ))}
          {hasMore && (
            <div className="col-span-full flex justify-center py-8">
              <Button variant="outline" onClick={() => fetchJobs(page + 1, true)} disabled={loadingMore}>
                {loadingMore ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : null}Load More
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
