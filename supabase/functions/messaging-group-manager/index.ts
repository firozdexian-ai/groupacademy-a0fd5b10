// WhatsApp group manager (admin-only) — channel-aware via agent_key
// Actions: create / add / remove / rename / list / exit
// Channels (agent_key):
//   community-engine   → default for 'community' and 'course_cohort' groups
//   employer-outreach  → 'whiteglove' option for 'client_success' groups
//   talent-outreach    → not used for managed groups (returns 400 if requested)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_GROUP_KINDS = new Set(["client_success", "community", "course_cohort", "internal"]);

function dsnBase(dsn: string) {
  return dsn.startsWith("http") ? dsn : `https://${dsn}`;
}
function waJid(phone: string): string {
  const d = String(phone).replace(/\D/g, "");
  return `${d}@s.whatsapp.net`;
}
function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
    if (!authHeader.startsWith("Bearer ")) return jsonResp({ error: "Unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub;
    if (!userId) return jsonResp({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return jsonResp({ error: "Admin only" }, 403);

    if (!UNIPILE_API_KEY || !UNIPILE_DSN) return jsonResp({ error: "Unipile not configured" }, 400);
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
    const body = await req.json().catch(() => ({}));
    const action = url.searchParams.get("action") ?? body?.action;

    // ---------- helpers ----------
    async function loadChannelById(channel_id: string) {
      const { data: ch } = await admin
        .from("messaging_channels")
        .select("id, provider, agent_key, unipile_account_id, status, metadata")
        .eq("id", channel_id).maybeSingle();
      if (!ch) throw new Error("Channel not found");
      if (ch.provider !== "whatsapp" || !ch.unipile_account_id) throw new Error("WhatsApp channel not connected");
      return ch;
    }
    async function loadChannelByAgentKey(agent_key: string) {
      const { data: ch } = await admin
        .from("messaging_channels")
        .select("id, provider, agent_key, unipile_account_id, status, metadata")
        .eq("agent_key", agent_key).eq("provider", "whatsapp").maybeSingle();
      if (!ch) throw new Error(`No channel for agent_key='${agent_key}'`);
      if (!ch.unipile_account_id) throw new Error(`Channel '${agent_key}' is not connected to Unipile yet`);
      return ch;
    }
    /**
     * channel_preference:
     *   'community'  → community-engine line (default for community + course_cohort)
     *   'whiteglove' → employer-outreach line (only if metadata.allow_whiteglove_groups=true)
     *   'auto'       → community-engine
     * If channel_id is explicitly provided, it wins (with a safety check).
     */
    async function resolveChannel({ channel_id, channel_preference, group_kind }: { channel_id?: string; channel_preference?: string; group_kind: string; }) {
      if (channel_id) {
        const ch = await loadChannelById(channel_id);
        if (ch.agent_key === "talent-outreach") throw new Error("Talent-outreach line cannot host managed groups");
        return ch;
      }
      const pref = (channel_preference ?? "auto").toLowerCase();
      if (pref === "whiteglove") {
        const ch = await loadChannelByAgentKey("employer-outreach");
        if (!(ch.metadata as any)?.allow_whiteglove_groups) throw new Error("White-glove groups disabled on employer line");
        if (group_kind !== "client_success") throw new Error("White-glove only valid for client_success groups");
        return ch;
      }
      // 'community' OR 'auto' OR anything else → community-engine
      return await loadChannelByAgentKey("community-engine");
    }

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

    // ============================ CREATE ============================
    if (action === "create") {
      const {
        channel_id,
        channel_preference,        // 'community' | 'whiteglove' | 'auto'
        group_kind = "client_success",
        company_id = null,
        name,
        team_user_ids = [],
        contact_ids = [],
        metadata: extraMeta = {},  // expects { course_id?, community_key?, ... }
      } = body;

      if (!ALLOWED_GROUP_KINDS.has(group_kind)) return jsonResp({ error: `invalid group_kind '${group_kind}'` }, 400);

      // group_kind-specific required keys for idempotency
      if (group_kind === "course_cohort" && !extraMeta?.course_id) {
        return jsonResp({ error: "metadata.course_id is required for course_cohort groups" }, 400);
      }
      if (group_kind === "community" && !extraMeta?.community_key) {
        return jsonResp({ error: "metadata.community_key (e.g. 'sales:bd') is required for community groups" }, 400);
      }
      if (group_kind === "client_success" && !company_id) {
        return jsonResp({ error: "company_id is required for client_success groups" }, 400);
      }

      const ch = await resolveChannel({ channel_id, channel_preference, group_kind });

      // ---- Idempotency lookup ----
      let existingQuery = admin.from("messaging_conversations")
        .select("id, external_chat_id")
        .eq("channel_id", ch.id)
        .eq("is_group", true)
        .eq("group_kind", group_kind);

      if (group_kind === "client_success") {
        existingQuery = existingQuery.eq("company_id", company_id);
      } else if (group_kind === "course_cohort") {
        // CTO-required: dedupe specifically on metadata->>'course_id'
        existingQuery = existingQuery.eq("metadata->>course_id", String(extraMeta.course_id));
      } else if (group_kind === "community") {
        existingQuery = existingQuery.eq("metadata->>community_key", String(extraMeta.community_key));
      }
      const { data: existing } = await existingQuery.maybeSingle();
      if (existing) {
        return jsonResp({ ok: true, conversation_id: existing.id, external_chat_id: existing.external_chat_id, existed: true, channel_id: ch.id, agent_key: ch.agent_key });
      }

      // ---- Default name ----
      let defaultName = name && String(name).trim() ? String(name).trim() : null;
      if (!defaultName) {
        if (group_kind === "client_success" && company_id) {
          const { data: company } = await admin.from("companies").select("name").eq("id", company_id).single();
          defaultName = `GroUp Academy ⨯ ${company?.name ?? "Client"}`;
        } else if (group_kind === "community") {
          defaultName = `GroUp Academy · ${extraMeta.community_key}`;
        } else if (group_kind === "course_cohort") {
          defaultName = `Course Cohort · ${extraMeta.course_id}`;
        } else {
          defaultName = "GroUp Academy Internal";
        }
      }

      const teamJids = await Promise.all((team_user_ids as string[]).map(resolveTeamJid));
      const contactJids = await Promise.all((contact_ids as string[]).map(resolveContactJid));
      const attendees = Array.from(new Set([...teamJids, ...contactJids]));
      if (attendees.length === 0) return jsonResp({ error: "At least one participant required" }, 400);

      const r = await unipile(`/api/v1/chats`, {
        method: "POST",
        body: JSON.stringify({ account_id: ch.unipile_account_id, attendees_ids: attendees, name: defaultName }),
      });
      const data = await r.json();
      if (!r.ok) return jsonResp({ error: "Unipile create failed", detail: data }, 502);
      const externalChatId: string | undefined = data?.chat_id || data?.id || data?.provider_id;
      if (!externalChatId) return jsonResp({ error: "Unipile did not return a chat id", detail: data }, 502);

      const persistMeta = {
        ...extraMeta,
        is_managed_group: true,
        created_by: userId,
        channel_agent_key: ch.agent_key,
      };

      const { data: conv, error: convErr } = await admin.from("messaging_conversations").insert({
        channel_id: ch.id,
        external_chat_id: externalChatId,
        peer_display_name: defaultName,
        company_id,
        is_group: true,
        group_kind,
        metadata: persistMeta,
      }).select("id").single();
      if (convErr) return jsonResp({ error: "DB insert failed", detail: convErr.message }, 500);

      const memberRows: any[] = [];
      (team_user_ids as string[]).forEach((uid, i) => {
        memberRows.push({ conversation_id: conv.id, member_kind: "team", user_id: uid, whatsapp_id: teamJids[i], role: "admin", added_by: userId });
      });
      (contact_ids as string[]).forEach((cid, i) => {
        memberRows.push({ conversation_id: conv.id, member_kind: "contact", contact_id: cid, whatsapp_id: contactJids[i], added_by: userId });
      });
      if (memberRows.length) await admin.from("client_group_members").insert(memberRows);

      return jsonResp({
        ok: true,
        conversation_id: conv.id,
        external_chat_id: externalChatId,
        name: defaultName,
        members: memberRows.length,
        channel_id: ch.id,
        agent_key: ch.agent_key,
        group_kind,
      });
    }

    // ============================ ADD ============================
    if (action === "add") {
      const { conversation_id, members = [] } = body as { conversation_id: string; members: { kind: "team" | "contact"; id: string }[] };
      const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id, is_group").eq("id", conversation_id).maybeSingle();
      if (!conv?.is_group) return jsonResp({ error: "Not a group conversation" }, 400);
      const ch = await loadChannelById(conv.channel_id);

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
      return jsonResp({ ok: true, results });
    }

    // ============================ REMOVE ============================
    if (action === "remove") {
      const { conversation_id, whatsapp_id } = body;
      const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id, is_group").eq("id", conversation_id).maybeSingle();
      if (!conv?.is_group) return jsonResp({ error: "Not a group conversation" }, 400);
      const ch = await loadChannelById(conv.channel_id);
      const r = await unipile(`/api/v1/chats/${conv.external_chat_id}/participants/${encodeURIComponent(whatsapp_id)}?account_id=${ch.unipile_account_id}`, { method: "DELETE" });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        await admin.from("client_group_members").update({ removed_at: new Date().toISOString() })
          .eq("conversation_id", conversation_id).eq("whatsapp_id", whatsapp_id).is("removed_at", null);
      }
      return jsonResp({ ok: r.ok, detail: data }, r.ok ? 200 : 502);
    }

    // ============================ RENAME ============================
    if (action === "rename") {
      const { conversation_id, name } = body;
      const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id, is_group").eq("id", conversation_id).maybeSingle();
      if (!conv?.is_group) return jsonResp({ error: "Not a group conversation" }, 400);
      const ch = await loadChannelById(conv.channel_id);
      const r = await unipile(`/api/v1/chats/${conv.external_chat_id}?account_id=${ch.unipile_account_id}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) await admin.from("messaging_conversations").update({ peer_display_name: name }).eq("id", conversation_id);
      return jsonResp({ ok: r.ok, detail: data }, r.ok ? 200 : 502);
    }

    // ============================ LIST ============================
    if (action === "list") {
      const { conversation_id } = body;
      const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id, is_group, peer_display_name, group_kind, metadata").eq("id", conversation_id).maybeSingle();
      if (!conv?.is_group) return jsonResp({ error: "Not a group conversation" }, 400);
      const ch = await loadChannelById(conv.channel_id);
      const { data: local } = await admin.from("client_group_members").select("*").eq("conversation_id", conversation_id).is("removed_at", null);
      const r = await unipile(`/api/v1/chats/${conv.external_chat_id}/participants?account_id=${ch.unipile_account_id}&limit=100`);
      const remote = await r.json().catch(() => ({}));
      return jsonResp({ ok: true, conversation: conv, agent_key: ch.agent_key, local_members: local ?? [], remote_participants: remote });
    }

    // ============================ EXIT ============================
    if (action === "exit") {
      const { conversation_id } = body;
      const { data: conv } = await admin.from("messaging_conversations").select("id, external_chat_id, channel_id, is_group").eq("id", conversation_id).maybeSingle();
      if (!conv?.is_group) return jsonResp({ error: "Not a group conversation" }, 400);
      const ch = await loadChannelById(conv.channel_id);
      const acc = await unipile(`/api/v1/accounts/${ch.unipile_account_id}`);
      const accData = await acc.json().catch(() => ({}));
      const selfJid: string | undefined = accData?.user_id || accData?.connection_params?.im?.id;
      if (!selfJid) return jsonResp({ error: "Could not resolve account owner WA id", detail: accData }, 502);
      const r = await unipile(`/api/v1/chats/${conv.external_chat_id}/participants/${encodeURIComponent(selfJid)}?account_id=${ch.unipile_account_id}`, { method: "DELETE" });
      const data = await r.json().catch(() => ({}));
      return jsonResp({ ok: r.ok, detail: data }, r.ok ? 200 : 502);
    }

    return jsonResp({ error: "Unknown action", action }, 400);
  } catch (e) {
    return jsonResp({ error: (e as Error).message }, 500);
  }
});
