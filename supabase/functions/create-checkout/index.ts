import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUNDLES = [
  { credits: 100, price: 200 },    // $2.00
  { credits: 500, price: 900 },    // $9.00
  { credits: 1000, price: 1600 },  // $16.00
  { credits: 2500, price: 3750 },  // $37.50
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe is not configured. Please add your Stripe secret key." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // Get talent_id
    const { data: talent, error: talentErr } = await supabase
      .from("talents")
      .select("id, email, full_name")
      .eq("user_id", userId)
      .single();

    if (talentErr || !talent) {
      return new Response(JSON.stringify({ error: "Talent profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { credits, priceInCents, successUrl, cancelUrl } = await req.json();

    // Validate bundle
    const bundle = BUNDLES.find((b) => b.credits === credits && b.price === priceInCents);
    if (!bundle) {
      return new Response(JSON.stringify({ error: "Invalid bundle selection" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read stripe mode from platform_settings
    const adminClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: modeSetting } = await adminClient
      .from("platform_settings")
      .select("value")
      .eq("key", "stripe_mode")
      .single();

    const isLive = modeSetting?.value === "live";

    // Create Stripe Checkout Session via API
    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "success_url": successUrl || `${req.headers.get("origin")}/app/feed?checkout=success`,
        "cancel_url": cancelUrl || `${req.headers.get("origin")}/app/feed?checkout=cancelled`,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": `${credits} Credits`,
        "line_items[0][price_data][product_data][description]": `GroUp Academy credit bundle — ${credits} credits`,
        "line_items[0][price_data][unit_amount]": String(priceInCents),
        "line_items[0][quantity]": "1",
        "customer_email": talent.email,
        "metadata[talent_id]": talent.id,
        "metadata[credits]": String(credits),
        "metadata[user_id]": userId,
      }),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error("Stripe error:", session);
      return new Response(
        JSON.stringify({ error: session.error?.message || "Stripe session creation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record pending transaction
    await adminClient.from("credit_transactions").insert({
      talent_id: talent.id,
      amount: credits,
      balance_after: 0, // Will be updated by webhook
      transaction_type: "stripe_purchase",
      service_type: "credit_purchase",
      reference_id: null,
      description: `Pending: ${credits} credits via Stripe (${session.id})`,
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("create-checkout error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
