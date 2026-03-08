import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin
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

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleCheck } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "talent_exec"])
      .limit(1);

    if (!roleCheck?.length) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, stripeSecretKey, stripeWebhookSecret } = await req.json();

    if (action === "check") {
      // Check if keys are configured (without exposing them)
      const hasSecretKey = !!Deno.env.get("STRIPE_SECRET_KEY");
      const hasWebhookSecret = !!Deno.env.get("STRIPE_WEBHOOK_SECRET");
      return new Response(
        JSON.stringify({ hasSecretKey, hasWebhookSecret }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For security, this function only checks status.
    // Actual secret storage must be done via Supabase secrets management (CLI/dashboard).
    // We store a masked indicator in platform_settings so the UI knows if it's set.
    if (action === "validate-key") {
      // Test the provided key against Stripe API
      if (!stripeSecretKey?.startsWith("sk_")) {
        return new Response(
          JSON.stringify({ error: "Invalid key format. Must start with sk_test_ or sk_live_" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const testRes = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });

      if (!testRes.ok) {
        return new Response(
          JSON.stringify({ error: "Invalid Stripe key — could not authenticate" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ valid: true, message: "Stripe key is valid. Please store it as a secret via your project settings." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("update-stripe-secret error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
