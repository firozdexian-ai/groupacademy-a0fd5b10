/**
 * Talents tab — every talent who has ever interacted with the active company:
 * job applicants + revealed/shortlisted candidates. Hardened paginated view.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getCompanyEngagedTalents } from "@/domains/jobs/repo/jobsRepo";
import { useActiveCompany } from "../../hooks/useActiveCompany";
import { GRO10X_PANEL, GRO10X_MUTED } from "../../lib/tokens";
import { Loader2, MessageSquare, User } from "lucide-react";

interface Row {
  user_id: string | null;
  talent_id: string | null;
  full_name: string | null;
  profession: string | null;
  photo: string | null;
  public_handle?: string | null;
  source: "applicant" | "shortlist";
  last_at: string;
  job_title?: string;
}

const PAGE_SIZE = 20;

export default function Gro10xTalents() {
  const { companyId } = useActiveCompany();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Reset page when company changes
  useEffect(() => {
    setPage(0);
    setRows([]);
    setHasMore(true);
  }, [companyId]);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;

    const fetchTalents = async () => {
      if (page === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const data = await getCompanyEngagedTalents(companyId, PAGE_SIZE, page * PAGE_SIZE);
        if (cancelled) return;

        const mapped: Row[] = (data ?? []).map((t: any) => ({
          user_id: t.user_id,
          talent_id: t.talent_id,
          full_name: t.full_name,
          profession: t.profession,
          photo: t.photo,
          public_handle: t.public_handle,
          source: t.source,
          last_at: t.last_at,
          job_title: t.job_title || undefined,
        }));

        setRows((prev) => (page === 0 ? mapped : [...prev, ...mapped]));
        setHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        console.error("Failed to load company engaged talents:", err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };

    fetchTalents();

    return () => {
      cancelled = true;
    };
  }, [companyId, page]);

  if (loading && page === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-slate-400">
        <Loader2 className="h-5 w-5 mx-auto animate-spin mb-2" /> Loading talents…
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="px-6 py-12 text-center">
        <User className="h-10 w-10 mx-auto text-slate-500 mb-3" />
        <p className="text-sm text-slate-400">
          Talents who apply to your jobs or get shortlisted will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      <ul className="divide-y divide-white/5">
        {rows.map((r, i) => (
          <li key={`${r.talent_id}-${i}`} className="px-4 py-3 flex items-center gap-3">
            <div
              className={`h-11 w-11 rounded-full ${GRO10X_PANEL} border border-white/10 grid place-items-center overflow-hidden text-sm font-semibold`}
            >
              {r.photo ? (
                <img src={r.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                (r.full_name || "?").charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1 text-left">
              {r.public_handle ? (
                <Link
                  to={`/t/${r.public_handle}`}
                  className="text-sm font-medium hover:underline hover:text-[#33E1E4] text-slate-100"
                >
                  {r.full_name || "Unnamed talent"}
                </Link>
              ) : (
                <p className="text-sm font-medium truncate text-slate-100">{r.full_name || "Unnamed talent"}</p>
              )}
              <p className={`text-[11px] ${GRO10X_MUTED} truncate`}>
                {r.profession || "Talent"}
                {r.job_title ? ` · applied to ${r.job_title}` : r.source === "shortlist" ? " · shortlisted" : ""}
              </p>
            </div>
            <Link
              to={`/gro10x/c/sourcer`}
              className="text-[11px] inline-flex items-center gap-1 text-[#33E1E4] hover:underline"
              title="Discuss with Sourcer"
            >
              <MessageSquare className="h-3 w-3" /> Discuss
            </Link>
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="p-4 flex justify-center">
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={loadingMore}
            className="px-4 py-2 rounded-full text-xs bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
          >
            {loadingMore ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
