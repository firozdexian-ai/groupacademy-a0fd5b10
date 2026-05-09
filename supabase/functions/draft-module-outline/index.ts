/**
 * Phase C2 — draft_module_outline tool handler.
 * Generates 4-6 module titles + objectives via Lovable AI for a given course
 * (content_id), and optionally inserts them as empty course_modules rows
 * (only when no modules exist yet, so we never clobber the instructor's work).
 *
 * Auth: caller must be an active engagement on the content_id (or admin).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return j({ ok: false, error: "unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: { user }, error: aErr } = await userClient.auth.getUser();
    if (aErr || !user) return j({ ok: false, error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const contentId = String(body.content_id ?? "").trim();
    const topic = String(body.topic ?? "").trim();
    const count = Math.max(3, Math.min(10, Number(body.count ?? 5)));
    const insert = Boolean(body.insert ?? false);
    if (!contentId) return j({ ok: false, error: "content_id_required" }, 400);

    // Authorize: instructor on this content OR admin
    const { data: eng } = await admin
      .from("course_engagements")
      .select("id")
      .eq("content_id", contentId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!eng) {
      const { data: roles } = await admin
        .from("user_roles").select("role").eq("user_id", user.id);
      const isAdmin = (roles ?? []).some((r: any) => ["admin", "super_admin"].includes(r.role));
      if (!isAdmin) return j({ ok: false, error: "forbidden" }, 403);
    }

    const { data: content } = await admin
      .from("content").select("title, description").eq("id", contentId).maybeSingle();

    const subject = topic || (content?.title ?? "this course");
    const ctxLine = content?.description ? `\nCourse description: ${content.description}` : "";

    // Call Lovable AI to draft modules
    if (!LOVABLE_API_KEY) return j({ ok: false, error: "ai_key_missing" }, 500);
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a curriculum designer. Output ONLY a JSON array of objects with fields {title, objective, est_minutes}. No prose, no code fences.",
          },
          {
            role: "user",
            content: `Draft ${count} progressive course modules for: "${subject}".${ctxLine}\nReturn a JSON array of length ${count}.`,
          },
        ],
        stream: false,
      }),
    });
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return j({ ok: false, error: "ai_fault", detail: t.slice(0, 500) }, 502);
    }
    const aiJson = await aiRes.json();
    const raw = aiJson.choices?.[0]?.message?.content ?? "[]";
    let modules: Array<{ title: string; objective?: string; est_minutes?: number }> = [];
    try {
      const cleaned = raw.replace(/```json\s*|\s*```/g, "").trim();
      modules = JSON.parse(cleaned);
      if (!Array.isArray(modules)) modules = [];
    } catch {
      modules = [];
    }
    modules = modules.slice(0, count).filter((m) => m && typeof m.title === "string");

    let inserted = 0;
    if (insert && modules.length > 0) {
      const { count: existing } = await admin
        .from("course_modules").select("id", { count: "exact", head: true })
        .eq("content_id", contentId);
      if ((existing ?? 0) === 0) {
        const rows = modules.map((m, i) => ({
          content_id: contentId,
          title: m.title.slice(0, 200),
          description: (m.objective ?? "").slice(0, 1000),
          display_order: i + 1,
          stage_order: i + 1,
          estimated_time_minutes: Math.max(15, Math.min(240, Number(m.est_minutes ?? 45))),
        }));
        const { error: insErr } = await admin.from("course_modules").insert(rows);
        if (!insErr) inserted = rows.length;
      }
    }

    return j({ ok: true, modules, inserted });
  } catch (e: any) {
    return j({ ok: false, error: String(e?.message || e) }, 500);
  }
});

function j(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
