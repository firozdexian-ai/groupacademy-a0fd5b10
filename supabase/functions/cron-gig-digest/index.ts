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

    const today = new Date().toISOString().slice(0, 10);
    // Pull talents with fresh offered matches not yet digested today
    const { data: rows } = await supabase
      .from("gig_matches")
      .select("id, talent_id, score, gig_id, gig_kind")
      .eq("status", "offered")
      .gte("offered_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const byTalent = new Map<string, any[]>();
    for (const r of rows || []) {
      const arr = byTalent.get(r.talent_id) || [];
      arr.push(r);
      byTalent.set(r.talent_id, arr);
    }

    let sent = 0;
    for (const [talent_id, matches] of byTalent) {
      // Skip if already sent today
      const { data: existing } = await supabase
        .from("gig_match_digests")
        .select("id")
        .eq("talent_id", talent_id)
        .eq("digest_date", today)
        .maybeSingle();
      if (existing) continue;

      const { data: avail } = await supabase
        .from("talent_availability").select("notify_via_email, daily_match_cap, paused_until")
        .eq("talent_id", talent_id).maybeSingle();
      if (avail?.paused_until && new Date(avail.paused_until) > new Date()) continue;
      if (avail && avail.notify_via_email === false) continue;

      const cap = avail?.daily_match_cap ?? 5;
      const top = matches.sort((a, b) => Number(b.score) - Number(a.score)).slice(0, cap);

      // Queue native transactional email (best-effort, ignore errors)
      try {
        const { data: talent } = await supabase.from("talents").select("user_id, full_name, email").eq("id", talent_id).maybeSingle();
        if (talent?.email) {
          await supabase.from("email_queue" as any).insert({
            to_email: talent.email,
            template_key: "gig_match_digest",
            payload: { name: talent.full_name, count: top.length, matches: top },
          });
        }
      } catch { /* swallow */ }

      await supabase.from("gig_match_digests").insert({
        talent_id, digest_date: today,
        match_count: top.length,
        match_ids: top.map(m => m.id),
        channel: "email",
      });
      sent += 1;
    }

    return new Response(JSON.stringify({ digests_sent: sent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
