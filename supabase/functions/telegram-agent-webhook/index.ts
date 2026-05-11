// Telegram inbound webhook → AI agent router (multi-bot, agent_key-scoped).
// URL contract: POST /telegram-agent-webhook?agent_key=<agent_key>
// Telegram delivers updates here; we look up the per-agent bot_token from
// workforce_channel_connections, generate a reply via the Lovable AI gateway,
// and send it back via Telegram's sendMessage. Completely separate from the
// legacy /telegram-webhook (bKash payment callbacks).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

async function tg(botToken: string, method: string, body: unknown) {
  try {
    const r = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) console.error(`[tg ${method}]`, r.status, await r.text());
    return r.ok;
  } catch (e) {
    console.error(`[tg ${method}] threw`, (e as Error).message);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const agentKey = url.searchParams.get("agent_key")?.trim();

  // Handy GET probe (e.g. when admin pastes the URL in a browser).
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, agent_key: agentKey, hint: "POST Telegram updates here." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!agentKey) {
    return new Response(JSON.stringify({ ok: false, error: "missing agent_key" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Always 200 back to Telegram unless we want them to retry.
  const ok = (extra: Record<string, unknown> = {}) =>
    new Response(JSON.stringify({ ok: true, ...extra }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  let update: any = {};
  try {
    update = await req.json();
  } catch {
    return ok({ ignored: "no json body" });
  }

  const message = update.message ?? update.edited_message;
  const chatId = message?.chat?.id;
  const text: string = (message?.text ?? "").toString();
  if (!chatId) return ok({ ignored: "no chat id" });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // 1) Resolve per-agent Telegram credentials.
  const { data: conn, error: connErr } = await admin
    .from("workforce_channel_connections")
    .select("agent_key, credentials, is_active")
    .eq("agent_key", agentKey)
    .eq("channel_provider", "telegram")
    .maybeSingle();

  if (connErr) {
    console.error("[telegram-agent-webhook] conn lookup", connErr);
    return ok({ skipped: "conn lookup failed" });
  }
  const botToken: string | undefined = (conn?.credentials as any)?.bot_token;
  if (!conn || !botToken) {
    console.warn(`[telegram-agent-webhook] no telegram connection for agent_key=${agentKey}`);
    return ok({ skipped: "no connection" });
  }
  if (conn.is_active === false) {
    return ok({ skipped: "connection paused" });
  }

  // 2) Friendly greeting on /start (and /help) — no AI call needed.
  if (/^\/(start|help)\b/i.test(text)) {
    const { data: agentMeta } = await admin
      .from("ai_agents")
      .select("name")
      .eq("agent_key", agentKey)
      .maybeSingle();
    const name = agentMeta?.name ?? "your AI assistant";
    await tg(botToken, "sendMessage", {
      chat_id: chatId,
      text: `👋 Hi! I'm *${name}*. Ask me anything and I'll do my best to help.`,
      parse_mode: "Markdown",
    });
    return ok({ greeted: true });
  }

  if (!text.trim()) return ok({ ignored: "no text" });

  // 3) Load agent persona from the central registry.
  const { data: agent } = await admin
    .from("ai_agents")
    .select("agent_key, name, system_prompt, model, is_active, kill_switch")
    .eq("agent_key", agentKey)
    .maybeSingle();

  if (!agent || agent.is_active === false || agent.kill_switch) {
    await tg(botToken, "sendMessage", {
      chat_id: chatId,
      text: "⚠️ This assistant is currently offline. Please try again later.",
    });
    return ok({ skipped: "agent offline" });
  }

  // 4) Show "typing…" while the AI thinks.
  await tg(botToken, "sendChatAction", { chat_id: chatId, action: "typing" });

  // 5) Generate reply via the Lovable AI gateway (same pattern as messaging-autoreply).
  const systemPrompt =
    `${agent.system_prompt ?? ""}\n\n---\nCHANNEL CONTEXT: You are replying over Telegram. ` +
    `Keep replies concise (1–4 short paragraphs), match the user's language, and offer a clear next step. ` +
    `If you can't help, suggest contacting a human teammate.`;

  let reply = "";
  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: agent.model || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
      }),
    });
    if (!aiRes.ok) {
      const err = await aiRes.text();
      console.error("[telegram-agent-webhook] AI error", aiRes.status, err);
      reply = "Sorry — I hit a temporary error. Please try again in a moment.";
    } else {
      const aiData = await aiRes.json();
      reply = aiData?.choices?.[0]?.message?.content?.trim() ?? "";
    }
  } catch (e) {
    console.error("[telegram-agent-webhook] AI threw", (e as Error).message);
    reply = "Sorry — I hit a temporary error. Please try again in a moment.";
  }

  if (!reply) reply = "I'm here, but didn't catch that. Could you rephrase?";

  // 6) Send the reply back to the user.
  await tg(botToken, "sendMessage", {
    chat_id: chatId,
    text: reply,
    parse_mode: "Markdown",
  });

  return ok({ replied: true });
});
