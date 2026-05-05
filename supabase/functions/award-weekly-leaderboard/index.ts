import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const PAYOUT_BY_RANK: Record<number, number> = {
  1: 500, 2: 300, 3: 200, 4: 100, 5: 100, 6: 100, 7: 100, 8: 100, 9: 100, 10: 100,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // last week's window (monday-monday, UTC)
    const now = new Date();
    const day = now.getUTCDay() || 7;
    const thisMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day + 1));
    const lastMonday = new Date(thisMonday.getTime() - 7 * 86400_000);
    const weekStart = lastMonday.toISOString().slice(0, 10);

    // idempotency
    const { count } = await supabase.from("leaderboard_payouts").select("id", { count: "exact", head: true }).eq("week_start", weekStart);
    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ ok: true, skipped: true, week_start: weekStart }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rows, error } = await supabase.rpc("get_weekly_winners", { _start: lastMonday.toISOString(), _end: thisMonday.toISOString() });
    if (error) throw error;

    const winners = (rows as Array<{ talent_id: string; credits_earned: number }> ?? []).slice(0, 10);
    const payouts: any[] = [];

    for (let i = 0; i < winners.length; i++) {
      const rank = i + 1;
      const award = PAYOUT_BY_RANK[rank];
      const w = winners[i];
      // credit
      await supabase.rpc("admin_award_credits", { _talent: w.talent_id, _amount: award, _reason: `Weekly leaderboard #${rank}` });
      payouts.push({ week_start: weekStart, talent_id: w.talent_id, rank, credits_awarded: award });
      await supabase.from("notifications").insert({
        talent_id: w.talent_id,
        type: "leaderboard",
        title: `You ranked #${rank} this week!`,
        message: `You earned ${award} bonus credits.`,
        icon: "trophy",
        link: "/feed",
      });
      await supabase.from("creator_badges").insert({ talent_id: w.talent_id, badge: "weekly_winner" });
    }

    if (payouts.length) await supabase.from("leaderboard_payouts").insert(payouts);

    return new Response(JSON.stringify({ ok: true, week_start: weekStart, count: payouts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
