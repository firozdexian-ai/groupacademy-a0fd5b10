// Cron: pick up submissions lacking a verification and run the verifier.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const limit = 25;

  // 1. Fetch pending/submitted gigs
  const { data: rows, error: queryError } = await admin
    .from("gig_submissions_unified_view")
    .select("submission_id, gig_kind, status")
    .in("status", ["pending", "submitted"])
    .limit(limit);

  if (queryError) {
    console.error("Sweeper query error:", queryError);
    return new Response(JSON.stringify({ error: queryError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let processed = 0;
  let failed = 0;

  // 2. Process each row with isolated error handling
  for (const r of rows ?? []) {
    try {
      // Check for existing verification to avoid duplicate processing
      const { data: existing, error: checkError } = await admin
        .from("gig_verifications")
        .select("id")
        .eq("submission_id", r.submission_id)
        .eq("gig_kind", r.gig_kind)
        .maybeSingle();

      if (checkError) {
        console.error(`Verification check failed for ${r.submission_id}:`, checkError);
        failed += 1;
        continue;
      }

      if (existing) continue;

      // Invoke the Al verifier. NOTE: Supabase does not throw on HTTP 5xx; it returns an error object.
      const { error: invokeError } = await admin.functions.invoke("ai-gig-verifier", {
        body: { submission_id: r.submission_id, gig_kind: r.gig_kind },
      });

      if (invokeError) {
        console.error(`Verifier invoke returned error for ${r.submission_id}:`, invokeError);
        failed += 1;
        continue;
      }

      processed += 1;
    } catch (e) {
      // Catch unexpected runtime exceptions (e.g., isolate memory limits, network drops)
      console.error(`Unexpected runtime exception for ${r.submission_id}:`, e);
      failed += 1;
    }
  }

  return new Response(JSON.stringify({ processed, failed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
