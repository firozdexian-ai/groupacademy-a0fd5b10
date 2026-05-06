// AI gig verifier — pulls submission + acceptance criteria, scores via Lovable AI, applies verdict.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { submission_id, gig_kind } = await req.json();
    if (!submission_id || !gig_kind) {
      return new Response(JSON.stringify({ error: "submission_id and gig_kind required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Ensure verification row
    const { data: verId, error: reqErr } = await admin.rpc("request_gig_verification", {
      _submission_id: submission_id, _gig_kind: gig_kind,
    });
    if (reqErr) throw reqErr;

    // Pull verification + gig + submission
    const { data: ver } = await admin.from("gig_verifications").select("*").eq("id", verId).maybeSingle();
    if (!ver) throw new Error("verification missing");

    let gig: any = null; let submissionPayload: any = null;
    if (gig_kind === "quick") {
      const { data: g } = await admin.from("gigs").select("*").eq("id", ver.gig_id).maybeSingle();
      gig = g;
      const { data: s } = await admin.from("gig_submissions").select("submission_data").eq("id", submission_id).maybeSingle();
      submissionPayload = s?.submission_data ?? {};
    } else {
      const { data: g } = await admin.from("marketplace_gigs").select("*").eq("id", ver.gig_id).maybeSingle();
      gig = g;
      const { data: d } = await admin.from("marketplace_deliverables").select("*").eq("id", submission_id).maybeSingle();
      submissionPayload = d ?? {};
    }

    const { data: rule } = await admin.from("verification_rules").select("*")
      .eq("gig_kind", gig_kind).is("category", null).maybeSingle();
    const autoFloor = Number(rule?.auto_approve_floor ?? 0.85);
    const escalateFloor = Number(rule?.escalate_floor ?? 0.55);

    const acceptanceCriteria = gig?.acceptance_criteria ?? [];
    const started = Date.now();

    // Call Lovable AI with structured tool
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a strict gig submission verifier. Score each acceptance criterion fairly and flag risks." },
          { role: "user", content: JSON.stringify({
            gig: { title: gig?.title, description: gig?.description, requirements: gig?.requirements, acceptance_criteria: acceptanceCriteria },
            submission: submissionPayload,
          }) },
        ],
        tools: [{
          type: "function",
          function: {
            name: "record_verification",
            description: "Score the submission",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", description: "0..1 overall pass score" },
                per_criterion: { type: "array", items: {
                  type: "object",
                  properties: {
                    criterion: { type: "string" },
                    pass: { type: "boolean" },
                    score: { type: "number" },
                    note: { type: "string" },
                  },
                  required: ["criterion","pass","score","note"],
                  additionalProperties: false,
                }},
                risk_flags: { type: "array", items: { type: "string", enum: ["plagiarism","ai_generated","brand_safety","scope_mismatch","low_effort","missing_evidence"] } },
                rationale: { type: "string" },
                suggested_revisions: { type: "array", items: { type: "string" } },
              },
              required: ["score","per_criterion","risk_flags","rationale","suggested_revisions"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "record_verification" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      await admin.from("gig_verifications").update({ verdict: "escalated", rationale: "AI unavailable, escalated" }).eq("id", verId);
      await admin.rpc("apply_verification_verdict", { _verification_id: verId });
      return new Response(JSON.stringify({ error: "ai_unavailable", verification_id: verId }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const toolArgs = aiJson?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    const parsed = toolArgs ? JSON.parse(toolArgs) : null;
    if (!parsed) throw new Error("AI returned no structured output");

    const score = Number(parsed.score ?? 0);
    let verdict: string;
    if (score >= autoFloor && (parsed.risk_flags?.length ?? 0) === 0) verdict = "auto_approved";
    else if (score < escalateFloor) verdict = "escalated";
    else verdict = "auto_revise";

    const latency = Date.now() - started;

    await admin.from("gig_verifications").update({
      verdict,
      score: Math.round(score * 100) / 100 * 100 / 100, // keep numeric(5,2) range
      criteria_results: parsed.per_criterion ?? [],
      risk_flags: parsed.risk_flags ?? [],
      rationale: parsed.rationale ?? null,
      suggested_revisions: parsed.suggested_revisions ?? [],
      model: "google/gemini-2.5-flash",
      latency_ms: latency,
      updated_at: new Date().toISOString(),
    }).eq("id", verId);

    await admin.rpc("apply_verification_verdict", { _verification_id: verId });

    // Fire notification (best-effort)
    admin.functions.invoke("notify-verification-outcome", { body: { verification_id: verId } }).catch(() => {});

    return new Response(JSON.stringify({ verification_id: verId, verdict, score }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("verifier error", err);
    return new Response(JSON.stringify({ error: err?.message ?? "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
