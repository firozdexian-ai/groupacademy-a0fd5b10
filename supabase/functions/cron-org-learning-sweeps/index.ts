import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Mark overdue
  const { data: overdueCount } = await supabase.rpc("org_mark_overdue");

  // Seat-low alerts
  const { data: seats } = await supabase
    .from("company_learning_seats")
    .select("id, company_id, seats_total, seats_used, content_id");

  let alerted = 0;
  for (const s of seats ?? []) {
    if (s.seats_total > 0 && s.seats_used / s.seats_total >= 0.8) {
      // notify company admins
      const { data: admins } = await supabase
        .from("company_members")
        .select("user_id")
        .eq("company_id", s.company_id)
        .eq("role", "admin")
        .eq("status", "active");
      for (const a of admins ?? []) {
        await supabase.functions.invoke("notify-org-learning", {
          body: {
            kind: "seat_low",
            company_id: s.company_id,
            user_id: a.user_id,
            payload: {
              message: `Only ${s.seats_total - s.seats_used} of ${s.seats_total} seats left.`,
              content_id: s.content_id,
            },
          },
        });
        alerted++;
      }
    }
  }

  return new Response(JSON.stringify({ overdue: overdueCount, alerted }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
