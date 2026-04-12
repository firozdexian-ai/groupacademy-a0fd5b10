import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { parseEmailWebhookPayload } from "npm:@lovable.dev/email-js";
import { WebhookError, verifyWebhookRequest } from "npm:@lovable.dev/webhooks-js";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SignupEmail } from "../_shared/email-templates/signup.tsx";
import { InviteEmail } from "../_shared/email-templates/invite.tsx";
import { MagicLinkEmail } from "../_shared/email-templates/magic-link.tsx";
import { RecoveryEmail } from "../_shared/email-templates/recovery.tsx";
import { EmailChangeEmail } from "../_shared/email-templates/email-change.tsx";
import { ReauthenticationEmail } from "../_shared/email-templates/reauthentication.tsx";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-signature, x-lovable-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: "Confirm your GroUp Academy account",
  invite: "You've been invited to GroUp Academy",
  magiclink: "Your GroUp Academy login link",
  recovery: "Reset your GroUp Academy password", // Standardized for clarity
  email_change: "Confirm your new email address",
  reauthentication: "Your verification code",
};

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
};

// CTO CONFIGURATION FIX:
// Ensure these match your verified sending domain in your email provider dashboard.
const SITE_NAME = "GroUp Academy";
const SENDER_DOMAIN = "notify.groupacademy.online";
const FROM_DOMAIN = "groupacademy.online";

async function handleWebhook(req: Request): Promise<Response> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey)
    return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500, headers: corsHeaders });

  let payload: any;
  let run_id = "";

  try {
    const verified = await verifyWebhookRequest({
      req,
      secret: apiKey,
      parser: parseEmailWebhookPayload,
    });
    payload = verified.payload;
    run_id = payload.run_id;
  } catch (error) {
    console.error("Webhook verification failed", { error });
    return new Response(JSON.stringify({ error: "Invalid webhook payload" }), { status: 400, headers: corsHeaders });
  }

  const emailType = payload.data.action_type;

  // CTO LOGGING: Critical for debugging password reset failures
  console.log(`Processing Auth Email: ${emailType}`, {
    recipient: payload.data.email,
    url: payload.data.url,
    run_id,
  });

  const EmailTemplate = EMAIL_TEMPLATES[emailType];
  if (!EmailTemplate) {
    console.error("Unknown email type received", { emailType });
    return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const templateProps = {
    siteName: SITE_NAME,
    siteUrl: `https://groupacademy.lovable.app`,
    recipient: payload.data.email,
    confirmationUrl: payload.data.url,
    token: payload.data.token,
    email: payload.data.email,
    newEmail: payload.data.new_email,
  };

  const html = await renderAsync(React.createElement(EmailTemplate, templateProps));
  const text = await renderAsync(React.createElement(EmailTemplate, templateProps), { plainText: true });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const messageId = crypto.randomUUID();

  // TRANSACTION LOGGING: Ensuring we see the "recovery" attempt in the DB
  await supabase.from("email_send_log").insert({
    message_id: messageId,
    template_name: emailType,
    recipient_email: payload.data.email,
    status: "pending",
  });

  const { error: enqueueError } = await supabase.rpc("enqueue_email", {
    queue_name: "auth_emails",
    payload: {
      run_id,
      message_id: messageId,
      to: payload.data.email,
      from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: EMAIL_SUBJECTS[emailType] || "Notification",
      html,
      text,
      purpose: "transactional",
      label: emailType,
      queued_at: new Date().toISOString(),
    },
  });

  if (enqueueError) {
    console.error("Email Queue Error:", enqueueError);
    return new Response(JSON.stringify({ error: "Queue failed" }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ success: true, queued: true }), { status: 200, headers: corsHeaders });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Standard routing
  try {
    return await handleWebhook(req);
  } catch (error) {
    console.error("Critical Hook Error:", error);
    return new Response(JSON.stringify({ error: "Internal Error" }), { status: 500, headers: corsHeaders });
  }
});
