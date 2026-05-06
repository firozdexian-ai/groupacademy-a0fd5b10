import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are a bid coach for talents on the Gro10x marketplace.
Rewrite a draft bid to be concise (under 180 words), specific, and credible.
Open with the talent's strongest verified credential or relevant past win.
Reference 1-2 acceptance criteria explicitly.
Avoid hype, avoid "I am passionate", focus on what they will deliver and how.
Return strictly via the improve_bid tool.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
    const auth = req.headers.get("authorization") ?? "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: auth } } });
    const { data: u } = await supabase.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const { gig_id, gig_kind, draft_text } = await req.json();

    const { data: gig } = await supabase.from("gigs_unified_view").select("*").eq("id", gig_id).eq("kind", gig_kind || "marketplace").maybeSingle();
    const { data: talent } = await supabase.from("talents").select("id, full_name, headline").eq("user_id", u.user.id).maybeSingle();
    let skills: any[] = [];
    let credentials: any[] = [];
    if (talent) {
      const { data: tsp } = await supabase.from("talent_skill_profile").select("topic_tag, mastery").eq("talent_id", talent.id).gte("mastery", 0.7).limit(10);
      skills = tsp || [];
      try {
        const { data: creds } = await supabase.from("skill_credentials" as any).select("topic_tag, level").eq("talent_id", talent.id).limit(10);
        credentials = creds || [];
      } catch { /* table may not exist */ }
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Gig:\n${JSON.stringify(gig)}\n\nTalent:\n${JSON.stringify({ talent, skills, credentials })}\n\nDraft bid:\n${draft_text || "(empty — write from scratch)"}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "improve_bid",
            parameters: {
              type: "object",
              properties: {
                improved_text: { type: "string" },
                rationale: { type: "string" },
                proof_links: { type: "array", items: { type: "object", properties: { label: { type: "string" }, url: { type: "string" } }, required: ["label"] } },
                key_strengths: { type: "array", items: { type: "string" } },
              },
              required: ["improved_text", "rationale"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "improve_bid" } },
      }),
    });
    if (resp.status === 429) return new Response(JSON.stringify({ error: "rate_limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (resp.status === 402) return new Response(JSON.stringify({ error: "credits_exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: "ai_error", detail: t }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const j = await resp.json();
    const args = JSON.parse(j.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || "{}");
    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
