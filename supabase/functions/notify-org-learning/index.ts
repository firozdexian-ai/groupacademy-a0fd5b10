import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { kind, company_id, user_id, assignment_id, payload } = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const titleMap: Record<string, string> = {
      assignment_created: "New course assigned by your employer",
      assignment_overdue: "Course assignment overdue",
      assignment_completed: "Sponsored course completed",
      seat_low: "Sponsored seats running low",
    };
    const title = titleMap[kind] ?? "Learning update";
    if (user_id) {
      await supabase.from("notifications").insert({
        user_id,
        type: `org_learning.${kind}`,
        title,
        body: payload?.message ?? null,
        data: { company_id, assignment_id, ...payload },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
