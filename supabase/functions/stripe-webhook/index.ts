import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function getWebhookSecret(adminClient: any): Promise<string | null> {
  const envSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (envSecret) return envSecret;

  const { data } = await adminClient
    .from("platform_settings")
    .select("value")
    .eq("key", "stripe_webhook_secret")
    .single();

  return data?.value || null;
}

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const parts = sigHeader.split(",").reduce((acc: Record<string, string>, part) => {
    const [key, val] = part.split("=");
    acc[key.trim()] = val;
    return acc;
  }, {});

  const timestamp = parts["t"];
  const signature = parts["v1"];
  if (!timestamp || !signature) return false;

  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (Math.abs(age) > 300) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSig === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const webhookSecret = await getWebhookSecret(supabase);
    if (!webhookSecret) {
      console.error("STRIPE_WEBHOOK_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const body = await req.text();
    const sigHeader = req.headers.get("stripe-signature");

    if (!sigHeader) {
      return new Response("Missing stripe-signature header", { status: 400 });
    }

    const valid = await verifyStripeSignature(body, sigHeader, webhookSecret);
    if (!valid) {
      console.error("Invalid Stripe signature");
      return new Response("Invalid signature", { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = event.data.object;
    const talentId = session.metadata?.talent_id;
    const credits = parseInt(session.metadata?.credits || "0");
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0; // Assuming USD/BDT cents

    if (!talentId || credits <= 0) {
      console.error("Missing metadata in checkout session:", session.id);
      return new Response("Missing metadata", { status: 400 });
    }

    // 1. Idempotency Check: Verify if we've already processed this exact Stripe event
    const { data: existingInvoice } = await supabase
      .from("credit_invoices")
      .select("id")
      .eq("stripe_event_id", event.id)
      .maybeSingle();

    if (existingInvoice) {
      console.log(`Idempotency guard: Event ${event.id} already processed. Skipping.`);
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Lock the event by writing the invoice EXACTLY once
    const { error: invoiceError } = await supabase.from("credit_invoices").insert({
      stripe_event_id: event.id,
      stripe_session_id: session.id,
      talent_id: talentId,
      credits_purchased: credits,
      amount_paid: amountPaid,
      status: "paid",
    });

    if (invoiceError) {
      console.error("Failed to write to credit_invoices:", invoiceError);
      return new Response("Failed to write invoice lock", { status: 500 });
    }

    // 3. Add credits using atomic RPC to prevent memory race conditions
    const { error: rpcError } = await supabase.rpc("add_credits", {
      p_talent_id: talentId,
      p_amount: credits,
      p_type: "purchase",
      p_reference: `Stripe Checkout (${session.id})`,
    });

    if (rpcError) {
      // Fallback to manual insert if RPC is unavailable in current schema
      console.warn("RPC add_credits failed, falling back to direct ledger insert", rpcError);
      await supabase.from("credit_transactions").insert({
        talent_id: talentId,
        amount: credits,
        type: "purchase",
        status: "completed",
        description: `Purchased ${credits} credits via Stripe (${session.id})`,
      });
    }

    // 4. Send notification
    await supabase.from("notifications").insert({
      talent_id: talentId,
      type: "reward",
      title: `${credits} credits added! 💳`,
      message: `Your purchase of ${credits} credits has been confirmed.`,
      icon: "coins",
      link: "/app/transactions",
    });

    console.log(`Successfully fulfilled ${credits} credits for talent ${talentId} (Event: ${event.id})`);

    return new Response(JSON.stringify({ received: true, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response("Webhook handler error", { status: 500 });
  }
});
