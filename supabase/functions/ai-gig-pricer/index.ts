import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `You are a fair-pricing engine for the Gro10x gig marketplace. Credits: 1cr = 2 BDT.
Quick: 5-50, Marketplace: 50-5000, Content: 50-500.
Given a scope and (optionally) historical comparable gigs, output a fair credit price band with rationale.
Return strictly via propose_price tool.`;

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

    const { kind, title, description, deliverables, skills, suggested_deadline_days } = await req.json();

    const { data: comps } = await supabase
      .from("gigs_unified_view")
      .select("title, credits, skill_category")
      .eq("kind", kind || "marketplace")
      .limit(20);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Scope:\n${JSON.stringify({ kind, title, description, deliverables, skills, suggested_deadline_days })}\n\nComparable gigs:\n${JSON.stringify(comps || [])}` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "propose_price",
            description: "Suggest a fair credit price",
            parameters: {
              type: "object",
              properties: {
                min_credits: { type: "integer" },
                max_credits: { type: "integer" },
                recommended_credits: { type: "integer" },
                rationale: { type: "string" },
              },
              required: ["min_credits", "max_credits", "recommended_credits", "rationale"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "propose_price" } },
      }),
    });
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
