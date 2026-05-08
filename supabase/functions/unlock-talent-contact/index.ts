// Unlocks a talent's contact for the active company wallet.
// POST { company_id, talent_id } -> { ok, contact, credits_spent, reused }
// Fires a Telegram admin alert on first-time unlock (skips reuses).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ ok: false, error: "missing_auth" }, 401);

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sb = createClient(url, anon, { global: { headers: { Authorization: auth } } });

    const { data: userData, error: userErr } = await sb.auth.getUser(auth.replace("Bearer ", ""));
    if (userErr || !userData?.user) return json({ ok: false, error: "invalid_token" }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const company_id = body?.company_id;
    const talent_id = body?.talent_id;
    if (!company_id || !talent_id) return json({ ok: false, error: "company_id_and_talent_id_required" }, 400);

    const { data, error } = await sb.rpc("unlock_talent_contact", {
      p_company_id: company_id,
      p_talent_id: talent_id,
    });
    if (error) return json({ ok: false, error: error.message }, 500);

    const payload = data as {
      ok: boolean;
      reused?: boolean;
      credits_spent?: number;
      contact?: { full_name?: string };
    };

    // Fire-and-forget Telegram alert on first-time unlocks only.
    if (payload?.ok && payload?.reused === false) {
      notifyAdmin(sb, {
        userEmail: user.email ?? user.id,
        companyId: company_id,
        talentName: payload.contact?.full_name ?? "Unknown talent",
        credits: payload.credits_spent ?? 0,
      }).catch((e) => console.error("[telegram alert] failed:", e));
    }

    return json(payload, 200);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

async function notifyAdmin(
  sb: ReturnType<typeof createClient>,
  ev: { userEmail: string; companyId: string; talentName: string; credits: number },
) {
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  if (!botToken || !chatId) {
    console.log("[telegram alert] skipped — TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID not configured");
    return;
  }

  // Look up company name (best-effort)
  let companyName = ev.companyId;
  try {
    const { data } = await sb.from("companies").select("name").eq("id", ev.companyId).maybeSingle();
    if (data?.name) companyName = data.name as string;
  } catch (_) { /* ignore */ }

  const text = `💰 Unlock Alert! ${ev.userEmail} from ${companyName} just spent ${ev.credits} credits to unlock ${ev.talentName}.`;

  const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (!r.ok) {
    console.error("[telegram alert] non-2xx:", r.status, await r.text());
  }
}

function json(b: unknown, status: number) {
  return new Response(JSON.stringify(b), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
