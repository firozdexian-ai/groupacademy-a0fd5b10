import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const { match_id } = await req.json();
    const { data: match } = await supabase.from("gig_matches").select("*").eq("id", match_id).maybeSingle();
    if (!match) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: corsHeaders });
    const { data: gig } = await supabase.from("gigs_unified_view").select("title, description, skills, skill_category, credits").eq("id", match.gig_id).eq("kind", match.gig_kind).maybeSingle();

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Write ONE concise sentence (max 22 words) explaining why this talent matches this gig. Use the signals only. No hype." },
          { role: "user", content: `Gig: ${JSON.stringify(gig)}\nMatch signals: ${JSON.stringify(match.signals)}\nScore: ${match.score}` },
        ],
      }),
    });
    const j = await resp.json();
    const text = j.choices?.[0]?.message?.content?.trim() || "Strong skill + trust signals on this brief.";

    await supabase.from("gig_matches").update({ why_text: text, updated_at: new Date().toISOString() }).eq("id", match_id);
    return new Response(JSON.stringify({ why_text: text }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
