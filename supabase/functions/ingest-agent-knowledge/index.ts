// Agent OS — Knowledge Base Ingestor
// Accepts raw text / URL / file content for an agent, chunks it, embeds via Lovable AI,
// and stores chunks in agent_knowledge_chunks (vector(768)).
// Admin-only (verifies user_roles).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const CHUNK_SIZE = 1200;     // characters
const CHUNK_OVERLAP = 150;
const EMBED_BATCH = 16;

interface IngestRequest {
  agent_id: string;
  source_kind: "text" | "url" | "file";
  title: string;
  content?: string;          // for text & file (text contents)
  source_ref?: string;       // for url & file (storage path)
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return j({ error: "UNAUTHORIZED" }, 401);

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return j({ error: "UNAUTHORIZED" }, 401);
    const { data: isAdmin } = await admin.rpc("has_any_admin_role", { _user_id: u.user.id });
    if (!isAdmin) return j({ error: "FORBIDDEN" }, 403);

    const body = (await req.json()) as IngestRequest;
    if (!body?.agent_id || !body?.source_kind || !body?.title) {
      return j({ error: "agent_id, source_kind, title required" }, 400);
    }

    // Resolve text payload
    let text = "";
    if (body.source_kind === "text") {
      if (!body.content) return j({ error: "content required for text" }, 400);
      text = body.content;
    } else if (body.source_kind === "url") {
      if (!body.source_ref) return j({ error: "source_ref (URL) required" }, 400);
      const r = await fetch(body.source_ref);
      if (!r.ok) return j({ error: `Fetch failed: ${r.status}` }, 400);
      text = htmlToText(await r.text());
    } else if (body.source_kind === "file") {
      if (!body.content) return j({ error: "content required (pre-extracted file text)" }, 400);
      text = body.content;
    } else {
      return j({ error: "invalid source_kind" }, 400);
    }

    text = text.replace(/\s+/g, " ").trim();
    if (text.length < 20) return j({ error: "Content too short" }, 400);

    // Create source row
    const { data: source, error: sErr } = await admin.from("agent_knowledge_sources").insert({
      agent_id: body.agent_id, source_kind: body.source_kind, title: body.title,
      source_ref: body.source_ref, status: "ingesting", created_by: u.user.id,
    }).select("id").single();
    if (sErr || !source) return j({ error: "Failed to create source" }, 500);

    // Chunk
    const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);

    // Embed in batches
    let stored = 0;
    try {
      for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
        const slice = chunks.slice(i, i + EMBED_BATCH);
        const embResp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: "google/text-embedding-004", input: slice }),
        });
        if (!embResp.ok) {
          if (embResp.status === 429) throw new Error("Rate limited by AI gateway");
          if (embResp.status === 402) throw new Error("AI credits exhausted");
          throw new Error(`Embed failed: ${embResp.status}`);
        }
        const emb = await embResp.json();
        const rows = (emb.data as any[]).map((e, k) => ({
          agent_id: body.agent_id, source_id: source.id,
          chunk_index: i + k, content: slice[k],
          embedding: e.embedding, token_count: Math.ceil(slice[k].length / 4),
        }));
        const { error: insErr } = await admin.from("agent_knowledge_chunks").insert(rows);
        if (insErr) throw new Error(insErr.message);
        stored += rows.length;
      }

      await admin.from("agent_knowledge_sources").update({
        status: "ready", chunk_count: stored,
      }).eq("id", source.id);

      return j({ success: true, source_id: source.id, chunks: stored });
    } catch (e: any) {
      await admin.from("agent_knowledge_sources").update({
        status: "failed", error: e?.message ?? "ingest failed", chunk_count: stored,
      }).eq("id", source.id);
      throw e;
    }
  } catch (err: any) {
    console.error("[ingest-agent-knowledge]", err);
    return j({ error: err?.message ?? "INGEST_FAULT" }, 500);
  }
});

function j(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function chunkText(text: string, size: number, overlap: number): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    const end = Math.min(i + size, text.length);
    let slice = text.slice(i, end);
    // try to end on sentence boundary
    if (end < text.length) {
      const lastDot = slice.lastIndexOf(". ");
      if (lastDot > size * 0.6) slice = slice.slice(0, lastDot + 1);
    }
    out.push(slice.trim());
    i += slice.length - overlap;
    if (i <= 0) i = end;
  }
  return out.filter(Boolean);
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/\s+/g, " ").trim();
}
