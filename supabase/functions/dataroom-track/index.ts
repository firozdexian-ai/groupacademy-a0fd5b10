// Public, CORS-enabled telemetry + signed-URL resolver for IR Data Room share links.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function resolveToken(token: string) {
  const { data: link, error } = await supabase
    .from("ir_data_room_share_links")
    .select("id, document_id, expires_at, revoked_at, require_email, investor_id")
    .eq("token", token)
    .maybeSingle();
  if (error || !link) return { error: "Invalid token" };
  if (link.revoked_at) return { error: "Link revoked" };
  if (link.expires_at && new Date(link.expires_at) < new Date()) return { error: "Link expired" };

  const { data: doc } = await supabase
    .from("ir_data_room_documents")
    .select("id, title, doc_type, file_url, external_url, total_slides, version")
    .eq("id", link.document_id)
    .maybeSingle();
  if (!doc) return { error: "Document missing" };

  let signedUrl: string | null = null;
  if (doc.file_url) {
    const { data: signed } = await supabase.storage
      .from("ir-data-room")
      .createSignedUrl(doc.file_url, 300);
    signedUrl = signed?.signedUrl ?? null;
  }

  return { link, doc, signedUrl };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "resolve") {
      const token = url.searchParams.get("token");
      if (!token) return json({ error: "token required" }, 400);
      const result = await resolveToken(token);
      if ("error" in result) return json(result, 404);
      return json({
        document: result.doc,
        signedUrl: result.signedUrl,
        requireEmail: result.link.require_email,
        shareLinkId: result.link.id,
      });
    }

    if (action === "view" && req.method === "POST") {
      const body = await req.json();
      const { token, viewerEmail } = body ?? {};
      if (!token) return json({ error: "token required" }, 400);
      const result = await resolveToken(token);
      if ("error" in result) return json(result, 404);

      const ipHeader = req.headers.get("x-forwarded-for") ?? "";
      const ip = ipHeader.split(",")[0]?.trim() || null;

      const { data: view, error } = await supabase
        .from("ir_document_views")
        .insert({
          share_link_id: result.link.id,
          document_id: result.doc.id,
          investor_id: result.link.investor_id,
          viewer_email: viewerEmail ?? null,
          viewer_ip: ip,
          user_agent: req.headers.get("user-agent"),
        })
        .select("id")
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ viewId: view.id });
    }

    if (action === "slide" && req.method === "POST") {
      const body = await req.json();
      const { viewId, slideNumber, dwellSeconds, slideLabel } = body ?? {};
      if (!viewId || slideNumber == null) return json({ error: "viewId and slideNumber required" }, 400);
      const { error } = await supabase.from("ir_document_slide_events").insert({
        view_id: viewId,
        slide_number: slideNumber,
        slide_label: slideLabel ?? null,
        dwell_seconds: Math.max(0, Math.round(dwellSeconds ?? 0)),
      });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
