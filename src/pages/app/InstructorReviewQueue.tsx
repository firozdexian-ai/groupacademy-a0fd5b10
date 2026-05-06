import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, BarChart3, ChevronRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ModuleDigest {
  module: { id: string; title: string; content_id: string };
  content: { id: string; title: string } | null;
  owner: { instructor_id: string; full_name: string | null; email: string | null } | null;
  summary: { flagged_quiz: number; flagged_scenarios: number; quiz_items: number; scenario_items: number };
  weak_topics?: { topic_tag: string; learner_mastery_mean: number | null }[];
}

export default function InstructorReviewQueue() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [digests, setDigests] = useState<ModuleDigest[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) { setError("Sign in required."); setLoading(false); return; }
      const { data: role } = await supabase.from("user_roles")
        .select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!role);

      // Find courses owned by this instructor (or all, if admin)
      let contentIds: string[] = [];
      if (role) {
        const { data: courses = [] } = await supabase
          .from("content").select("id").eq("is_published", true).limit(50);
        contentIds = (courses ?? []).map((c: any) => c.id);
      } else {
        const { data: instr } = await supabase
          .from("instructors").select("id").eq("email", u.user.email ?? "").maybeSingle();
        if (!instr) { setError("No instructor profile found for your account."); setLoading(false); return; }
        const { data: ci = [] } = await supabase
          .from("content_instructors").select("content_id").eq("instructor_id", (instr as any).id);
        contentIds = (ci ?? []).map((r: any) => r.content_id);
      }
      if (!contentIds.length) { setDigests([]); setLoading(false); return; }

      const { data: mods = [] } = await supabase
        .from("course_modules").select("id,content_id").in("content_id", contentIds);
      const moduleIds = (mods ?? []).map((m: any) => m.id);

      const results: ModuleDigest[] = [];
      // Limit fan-out to avoid hammering the function
      for (const mid of moduleIds.slice(0, 30)) {
        const { data, error: e } = await supabase.functions.invoke("authoring-review-digest", {
          body: { mode: "single", module_id: mid, days: 30 },
        });
        if (e || !data) continue;
        const d = data as ModuleDigest;
        const flagged = (d.summary?.flagged_quiz ?? 0) + (d.summary?.flagged_scenarios ?? 0);
        if (flagged > 0) results.push(d);
      }
      results.sort((a, b) => {
        const fb = (b.summary.flagged_quiz + b.summary.flagged_scenarios);
        const fa = (a.summary.flagged_quiz + a.summary.flagged_scenarios);
        return fb - fa;
      });
      setDigests(results);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load review queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const sendWeekly = async () => {
    toast.loading("Sending weekly digests…", { id: "wd" });
    const { data, error } = await supabase.functions.invoke("authoring-review-digest", {
      body: { mode: "weekly", days: 7 },
    });
    toast.dismiss("wd");
    if (error) { toast.error(error.message); return; }
    toast.success(`Sent ${(data as any)?.sent_count ?? 0} digest emails.`);
  };

  return (
    <div className="px-4 py-4 space-y-3 pb-safe-bottom">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-black tracking-tight">Author review queue</h1>
          <p className="text-xs text-muted-foreground">Items learners flagged this month.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          {isAdmin && (
            <Button size="sm" onClick={sendWeekly}>Send weekly</Button>
          )}
        </div>
      </header>

      {loading && (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="py-6 text-center space-y-2">
            <AlertTriangle className="h-6 w-6 mx-auto text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && digests.length === 0 && (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
          No items flagged. Your courses are humming. 🎉
        </CardContent></Card>
      )}

      {digests.map((d) => (
        <Card key={d.module.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between gap-2">
              <span className="truncate">{d.module.title}</span>
              <Badge variant="destructive" className="text-[10px]">
                {d.summary.flagged_quiz + d.summary.flagged_scenarios} flagged
              </Badge>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground truncate">
              {d.content?.title ?? "Course"}{d.owner?.full_name ? ` · ${d.owner.full_name}` : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              <Badge variant="outline">{d.summary.flagged_quiz} quiz</Badge>
              <Badge variant="outline">{d.summary.flagged_scenarios} scenario</Badge>
              {d.weak_topics?.slice(0, 3).map(t => (
                <Badge key={t.topic_tag} variant="secondary" className="text-[10px]">
                  {t.topic_tag}
                </Badge>
              ))}
            </div>
            <Link to={`/content/${d.module.content_id}/modules`}>
              <Button size="sm" variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Open analytics</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
