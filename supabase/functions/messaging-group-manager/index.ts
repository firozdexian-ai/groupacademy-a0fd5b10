// WhatsApp group manager (admin-only) — create/add/remove/rename/list/exit
// Mirrors Unipile group operations and persists state in messaging_conversations + client_group_members.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function dsnBase(dsn: string) {
  return dsn.startsWith("http") ? dsn : `https://${dsn}`;
}
function waJid(phone: string): string {
  // Expect digits-only E.164 without '+'. Normalize defensively.
  const d = String(phone).replace(/\D/g, "");
  return `${d}@s.whatsapp.net`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const UNIPILE_API_KEY = Deno.env.get("UNIPILE_API_KEY");
    const UNIPILE_DSN = Deno.env.get("UNIPILE_DSN");

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub;
    if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (!UNIPILE_API_KEY || !UNIPILE_DSN) {
      return new Response(JSON.stringify({ error: "Unipile not configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const base = dsnBase(UNIPILE_DSN);
    const unipile = (path: string, init?: RequestInit) => fetch(`${base}${path}`, {
      ...init,
      headers: {
        "X-API-KEY": UNIPILE_API_KEY,
        "accept": "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? (await req.clone().json().catch(() => ({})))?.action;
    const body = await req.json().catch(() => ({}));

    async function loadChannel(channel_id: string) {
      const { data: ch } = await admin.from("messaging_channels").select("id, provider, unipile_account_id").eq("id", channel_id).maybeSingle();
      if (!ch || ch.provider !== "whatsapp" || !ch.unipile_account_id) throw new Error("WhatsApp channel not configured");
      return ch;
    }

    // Resolve WA jid for a contact or team user (team requires phone in talents table)
    async function resolveTeamJid(uid: string): Promise<string> {
      const { data: t } = await admin.from("talents").select("phone").eq("user_id", uid).maybeSingle();
      if (!t?.phone) throw new Error(`No phone on file for team user ${uid}`);
      return waJid(t.phone);
    }
    async function resolveContactJid(cid: string): Promise<string> {
      const { data: c } = await admin.from("contacts").select("whatsapp_number").eq("id", cid).maybeSingle();
      if (!c?.whatsapp_number) throw new Error(`No WhatsApp number for contact ${cid}`);
      return waJid(c.whatsapp_number);
    }

    // ----------------- ACTIONS -----------------
    if (action === "create") {
      const { company_id, channel_id, name, team_user_ids = [], contact_ids = [] } = body;
      if (!company_id || !channel_id) {
        return new Response(JSON.stringify({ error: "company_id and channel_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const ch = await loadChannel(channel_id);

      // Idempotency: existing client_success group for this company+channel?
      const { data: existing } = await admin.from("messaging_conversations")
        .select("id, external_chat_id")
        .eq("company_id", company_id)
        .eq("channel_id", channel_id)
        .eq("is_group", true)
        .eq("group_kind", "client_success")
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ ok: true, conversation_id: existing.id, external_chat_id: existing.external_chat_id, existed: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Resolve company name for default group name
      const { data: company } = await admin.from("companies").select("name").eq("id", company_id).single();
      const groupName = (name && String(name).trim()) || `GroUp Academy ⨯ ${company?.name ?? "Client"}`;

      const teamJids = await Promise.all((team_user_ids as string[]).map(resolveTeamJid));
      const contactJids = await Promise.all((contact_ids as string[]).map(resolveContactJid));
      const attendees = Array.from(new Set([...teamJids, ...contactJids]));
      if (attendees.length === 0) {
        return new Response(JSON.stringify({ error: "At least one participant required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const r = await unipile(`/api/v1/chats`, {
        method: "POST",
        body: JSON.stringify({
          account_id: ch.unipile_account_id,
          attendees_ids: attendees,
          name: groupName,
        }),
      });
      const data = await r.json();
      if (!r.ok) {
        return new Response(JSON.stringify({ error: "Unipile create failed", detail: data }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const externalChatId: string = data?.chat_id || data?.id || data?.provider_id;
      if (!externalChatId) {
        return new Response(JSON.stringify({ error: "Unipile did not return a chat id", detail: data }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: conv, error: convErr } = await admin.from("messaging_conversations").insert({
        channel_id,
        external_chat_id: externalChatId,
        peer_display_name: groupName,
        company_id,
        is_group: true,
        group_kind: "client_success",
        metadata: { is_client_group: true, company_id, created_by: userId },
      }).select("id").single();
      if (convErr) {
        return new Response(JSON.stringify({ error: "DB insert failed", detail: convErr.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Persist members
      const memberRows: any[] = [];
      (team_user_ids as string[]).forEach((uid, i) => {
        memberRows.push({ conversation_id: conv.id, member_kind: "team", user_id: uid, whatsapp_id: teamJids[i], role: "admin", added_by: userId });
      });
      (contact_ids as string[]).forEach((cid, i) => {
        memberRows.push({ conversation_id: conv.id, member_kind: "contact", contact_id: cid, whatsapp_id: contactJids[i], added_by: userId });
      });
      if (memberRows.length) await admin.from("client_group_members").insert(memberRows);

      return new Response(JSON.stringify({ ok: true, conversation_id: conv.id, external_chat_id: externalChatId, name: groupName, members: memberRows.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "add") {
      const { conversation_id, members = [] } = body as { conversation_id: string; members: { kind: "team" | "contact"; id: string }[] };
      const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id, is_group").eq("id", conversation_id).maybeSingle();
      if (!conv?.is_group) return new Response(JSON.stringify({ error: "Not a group conversation" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const ch = await loadChannel(conv.channel_id);

      const results: any[] = [];
      for (const m of members) {
        const jid = m.kind === "team" ? await resolveTeamJid(m.id) : await resolveContactJid(m.id);
        const r = await unipile(`/api/v1/chats/${conv.external_chat_id}/participants?account_id=${ch.unipile_account_id}`, {
          method: "POST",
          body: JSON.stringify({ user_id: jid }),
        });
        const data = await r.json();
        if (r.ok) {
          await admin.from("client_group_members").insert({
            conversation_id,
            member_kind: m.kind,
            user_id: m.kind === "team" ? m.id : null,
            contact_id: m.kind === "contact" ? m.id : null,
            whatsapp_id: jid,
            added_by: userId,
          });
        }
        results.push({ id: m.id, ok: r.ok, detail: data });
      }
      return new Response(JSON.stringify({ ok: true, results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "remove") {
      const { conversation_id, whatsapp_id } = body;
      const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id, is_group").eq("id", conversation_id).maybeSingle();
      if (!conv?.is_group) return new Response(JSON.stringify({ error: "Not a group conversation" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const ch = await loadChannel(conv.channel_id);
      const r = await unipile(`/api/v1/chats/${conv.external_chat_id}/participants/${encodeURIComponent(whatsapp_id)}?account_id=${ch.unipile_account_id}`, { method: "DELETE" });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        await admin.from("client_group_members").update({ removed_at: new Date().toISOString() })
          .eq("conversation_id", conversation_id).eq("whatsapp_id", whatsapp_id).is("removed_at", null);
      }
      return new Response(JSON.stringify({ ok: r.ok, detail: data }), { status: r.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "rename") {
      const { conversation_id, name } = body;
      const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id, is_group").eq("id", conversation_id).maybeSingle();
      if (!conv?.is_group) return new Response(JSON.stringify({ error: "Not a group conversation" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const ch = await loadChannel(conv.channel_id);
      const r = await unipile(`/api/v1/chats/${conv.external_chat_id}?account_id=${ch.unipile_account_id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        await admin.from("messaging_conversations").update({ peer_display_name: name }).eq("id", conversation_id);
      }
      return new Response(JSON.stringify({ ok: r.ok, detail: data }), { status: r.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list") {
      const { conversation_id } = body;
      const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id, is_group, peer_display_name").eq("id", conversation_id).maybeSingle();
      if (!conv?.is_group) return new Response(JSON.stringify({ error: "Not a group conversation" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const ch = await loadChannel(conv.channel_id);
      const { data: local } = await admin.from("client_group_members").select("*").eq("conversation_id", conversation_id).is("removed_at", null);
      const r = await unipile(`/api/v1/chats/${conv.external_chat_id}/participants?account_id=${ch.unipile_account_id}&limit=100`);
      const remote = await r.json().catch(() => ({}));
      return new Response(JSON.stringify({ ok: true, conversation: conv, local_members: local ?? [], remote_participants: remote }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "exit") {
      const { conversation_id } = body;
      const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id, is_group").eq("id", conversation_id).maybeSingle();
      if (!conv?.is_group) return new Response(JSON.stringify({ error: "Not a group conversation" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const ch = await loadChannel(conv.channel_id);
      const acc = await unipile(`/api/v1/accounts/${ch.unipile_account_id}`);
      const accData = await acc.json().catch(() => ({}));
      const selfJid: string | undefined = accData?.user_id || accData?.connection_params?.im?.id;
      if (!selfJid) return new Response(JSON.stringify({ error: "Could not resolve account owner WA id", detail: accData }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const r = await unipile(`/api/v1/chats/${conv.external_chat_id}/participants/${encodeURIComponent(selfJid)}?account_id=${ch.unipile_account_id}`, { method: "DELETE" });
      const data = await r.json().catch(() => ({}));
      return new Response(JSON.stringify({ ok: r.ok, detail: data }), { status: r.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action", action }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
