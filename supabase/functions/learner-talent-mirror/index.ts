// Talent Mirror — cross-course mastery rollup for the authenticated learner.
// Phase 2.8 — read-only aggregation over talent_skill_profile + content + course_modules.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthenticated" }, 401);

  const userClient = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: uErr } = await userClient.auth.getUser(token);
  if (uErr || !userData?.user) return json({ error: "unauthenticated" }, 401);

  const admin = createClient(supabaseUrl, service);
  const { data: talentRow } = await admin
    .from("talents").select("id").eq("user_id", userData.user.id).maybeSingle();
  if (!talentRow) return json({ error: "no_talent" }, 404);
  const talentId = talentRow.id;

  const { data: profiles = [] } = await admin
    .from("talent_skill_profile")
    .select("content_id,module_id,topic_tag,mastery,attempts,due_at,last_attempt_at,last_source")
    .eq("talent_id", talentId);

  if (!profiles || profiles.length === 0) {
    return json({
      talent_id: talentId,
      summary: { courses: 0, modules: 0, topics: 0, avg_mastery: null, due_now: 0 },
      signal_split: { quiz: 0, scenario: 0 },
      courses: [], strongest_topics: [], weakest_topics: [],
    });
  }

  const contentIds = Array.from(new Set(profiles.map(p => p.content_id)));
  const moduleIds = Array.from(new Set(profiles.map(p => p.module_id)));

  const [{ data: contents = [] }, { data: modules = [] }] = await Promise.all([
    admin.from("content").select("id,title,slug,thumbnail_url").in("id", contentIds),
    admin.from("course_modules").select("id,title,content_id").in("id", moduleIds),
  ]);

  const contentById = new Map((contents ?? []).map((c: any) => [c.id, c]));
  const moduleById = new Map((modules ?? []).map((m: any) => [m.id, m]));

  const now = Date.now();
  let dueNow = 0;
  let masterySum = 0;
  const signalSplit = { quiz: 0, scenario: 0 };

  const byCourse = new Map<string, {
    profiles: typeof profiles;
    moduleSet: Set<string>;
    topicSet: Set<string>;
    masterySum: number;
    dueNow: number;
  }>();

  for (const p of profiles) {
    masterySum += Number(p.mastery ?? 0);
    if (p.due_at && new Date(p.due_at).getTime() <= now) dueNow += 1;
    if (p.last_source === "scenario") signalSplit.scenario += 1; else signalSplit.quiz += 1;

    const slot = byCourse.get(p.content_id) ?? {
      profiles: [], moduleSet: new Set(), topicSet: new Set(), masterySum: 0, dueNow: 0,
    };
    slot.profiles.push(p);
    slot.moduleSet.add(p.module_id);
    slot.topicSet.add(p.topic_tag);
    slot.masterySum += Number(p.mastery ?? 0);
    if (p.due_at && new Date(p.due_at).getTime() <= now) slot.dueNow += 1;
    byCourse.set(p.content_id, slot);
  }

  const courses = Array.from(byCourse.entries()).map(([cid, slot]) => {
    const content = contentById.get(cid);
    const sorted = [...slot.profiles].sort((a, b) => Number(a.mastery) - Number(b.mastery));
    return {
      content_id: cid,
      title: content?.title ?? "Untitled course",
      slug: content?.slug ?? null,
      thumbnail_url: content?.thumbnail_url ?? null,
      modules: slot.moduleSet.size,
      topics: slot.topicSet.size,
      avg_mastery: slot.profiles.length > 0 ? slot.masterySum / slot.profiles.length : 0,
      due_now: slot.dueNow,
      weakest: sorted.slice(0, 3).map(p => ({
        topic_tag: p.topic_tag,
        module_title: moduleById.get(p.module_id)?.title ?? null,
        mastery: Number(p.mastery ?? 0),
      })),
    };
  }).sort((a, b) => a.avg_mastery - b.avg_mastery);

  const allSorted = [...profiles].sort((a, b) => Number(a.mastery) - Number(b.mastery));
  const mapTopic = (p: any) => ({
    topic_tag: p.topic_tag,
    module_title: moduleById.get(p.module_id)?.title ?? null,
    course_title: contentById.get(p.content_id)?.title ?? null,
    content_id: p.content_id,
    mastery: Number(p.mastery ?? 0),
  });

  return json({
    talent_id: talentId,
    summary: {
      courses: byCourse.size,
      modules: moduleIds.length,
      topics: profiles.length,
      avg_mastery: profiles.length > 0 ? masterySum / profiles.length : null,
      due_now: dueNow,
    },
    signal_split: signalSplit,
    courses,
    weakest_topics: allSorted.slice(0, 5).map(mapTopic),
    strongest_topics: allSorted.slice(-5).reverse().map(mapTopic),
  });
});
