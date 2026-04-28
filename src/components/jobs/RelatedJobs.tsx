import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { JobCard, type JobCardData } from "@/components/jobs/JobCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, Zap, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Contextual Opportunity Recommender
 * CTO Reference: Authoritative engine for tier-based job fallbacks.
 */

interface RelatedJobsProps {
  currentJobId: string;
  companyName: string;
  location: string | null;
  linkPrefix: "/jobs" | "/app/jobs";
}

function extractInstitutionalGeography(location: string | null): string | null {
  if (!location) return null;
  const sanitized = location.trim().toLowerCase();
  if (sanitized.includes("remote") || sanitized.includes("hybrid")) return null;
  const components = location.split(",");
  const countryCluster = components[components.length - 1].trim();
  return countryCluster.length >= 2 ? countryCluster : null;
}

export function RelatedJobs({ currentJobId, companyName, location, linkPrefix }: RelatedJobsProps) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionTitle, setSectionTitle] = useState("Recommended_Syncs");

  useEffect(() => {
    executeDiscoveryProtocol();
  }, [currentJobId, companyName, location]);

  const executeDiscoveryProtocol = async () => {
    setLoading(true);
    try {
      const trajectoryBuffer: JobCardData[] = [];
      const filterRegistry = new Set<string>([currentJobId]);
      const baseFields =
        "id, title, company_name, company_logo_url, location, job_type, experience_level, is_featured, created_at, deadline, salary_range_min, salary_range_max";

      // PHASE 1: Institutional Core Sync (Same Company)
      const { data: institutionalNodes } = await supabase
        .from("jobs")
        .select(baseFields)
        .ilike("company_name", companyName)
        .neq("id", currentJobId)
        .eq("is_active", true)
        .limit(3);

      if (institutionalNodes?.length) {
        institutionalNodes.forEach((node) => {
          trajectoryBuffer.push(node);
          filterRegistry.add(node.id);
        });
        setSectionTitle(`Institutional_Sync: ${companyName.toUpperCase()}`);
      }

      // PHASE 2: Geographic Vector Sync (Same Country)
      const targetCountry = extractInstitutionalGeography(location);
      if (targetCountry && trajectoryBuffer.length < 6) {
        const quota = 6 - trajectoryBuffer.length;
        let geoQuery = supabase
          .from("jobs")
          .select(baseFields)
          .ilike("location", `%${targetCountry}%`)
          .eq("is_active", true)
          .limit(quota);

        filterRegistry.forEach((id) => {
          geoQuery = geoQuery.neq("id", id);
        });

        const { data: geographicNodes } = await geoQuery;
        if (geographicNodes?.length) {
          geographicNodes.forEach((node) => {
            trajectoryBuffer.push(node);
            filterRegistry.add(node.id);
          });
          if (!institutionalNodes?.length) {
            setSectionTitle(`Regional_Sync: ${targetCountry.toUpperCase()}`);
          }
        }
      }

      // PHASE 3: High-Intensity Fallback (Featured Nodes)
      if (trajectoryBuffer.length < 3) {
        const fallbackQuota = 6 - trajectoryBuffer.length;
        let fallbackQuery = supabase
          .from("jobs")
          .select(baseFields)
          .eq("is_featured", true)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(fallbackQuota);

        filterRegistry.forEach((id) => {
          fallbackQuery = fallbackQuery.neq("id", id);
        });

        const { data: featuredNodes } = await fallbackQuery;
        if (featuredNodes?.length) {
          featuredNodes.forEach((node) => trajectoryBuffer.push(node));
          if (!institutionalNodes?.length && !targetCountry) {
            setSectionTitle("Strategic_Deployments");
          }
        }
      }

      setJobs(trajectoryBuffer.slice(0, 6));
    } catch (err) {
      console.error("DISCOVERY_ENGINE_FAULT:", err);
    } finally {
      setLoading(false);
    }
  };

  const initializeJobHandshake = (jobId: string) => {
    if (linkPrefix === "/app/jobs") {
      navigate(`${linkPrefix}/${jobId}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.location.href = `${linkPrefix}/${jobId}`;
    }
  };

  if (loading)
    return (
      <div className="mt-12 space-y-6">
        <Skeleton className="h-6 w-64 bg-muted/20 rounded-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-[28px] bg-muted/10" />
          ))}
        </div>
      </div>
    );

  if (jobs.length === 0) return null;

  return (
    <section className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-inner">
            <Compass className="h-4 w-4 text-primary animate-pulse" />
          </div>
          <h2 className="text-sm font-black uppercase italic tracking-widest text-foreground/80">{sectionTitle}</h2>
        </div>
        <div className="flex items-center gap-1 opacity-30">
          <Zap className="h-3 w-3 fill-current" />
          <span className="text-[8px] font-bold uppercase tracking-[0.3em]">Discovery_v3</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            variant="default"
            className="hover:scale-[1.02] transition-transform duration-500 shadow-xl"
            onClick={() => initializeJobHandshake(job.id)}
          />
        ))}
      </div>
    </section>
  );
}
