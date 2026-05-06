import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE);

    // Find recently created/updated open gigs that have no matches yet (or stale matches > 1 day old).
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: gigs } = await supabase
      .from("gigs_unified_view")
      .select("id, kind, status, updated_at")
      .in("status", ["active", "approved", "pending"])
      .gte("updated_at", since)
      .limit(100);

    const results: any[] = [];
    for (const g of gigs || []) {
      const { data: count } = await supabase.rpc("refresh_gig_matches", {
        _gig_id: g.id,
        _gig_kind: g.kind,
        _limit: 25,
      });
      results.push({ gig_id: g.id, kind: g.kind, matched: count });
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
