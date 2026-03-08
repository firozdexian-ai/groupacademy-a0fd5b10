

# Transactional Email Notifications

## Current State
- RESEND_API_KEY is configured (secret exists)
- `send-job-application` edge function already uses Resend successfully
- No custom email domain configured (emails will send from `noreply@resend.dev` until a domain is set up)
- Notifications table exists with realtime subscriptions

## Architecture

One new edge function `send-transactional-email` that accepts an email type and payload, selects the right HTML template, sends via Resend, and logs a notification in-app.

### Email Types to Support

| Event | Trigger | Data Needed |
|-------|---------|-------------|
| **Welcome / Signup** | DB trigger on `talents` INSERT | name, email |
| **Service Completion** | Called from existing service edge functions | service name, result summary |
| **Gig Bid Accepted** | Called from `award_gig_credits` or admin action | gig title, credits awarded |
| **Credit Purchase Receipt** | Called from credit addition flow | amount, new balance, transaction type |

### Flow

```text
Event occurs → Edge function called → 
  1. Build HTML from template
  2. Send via Resend API
  3. Insert notification row (in-app)
  4. Return success/failure
```

## Files

| Action | File | Purpose |
|--------|------|---------|
| Create | `supabase/functions/send-transactional-email/index.ts` | Main edge function with templates + Resend sending |
| Create | `src/lib/emailNotifications.ts` | Frontend helper to invoke the edge function from service flows |
| Edit | `src/hooks/useCredits.ts` | Call email notification after credit purchase |
| Edit | `src/components/dashboard/GigSubmissionsManager.tsx` | Call email on bid approval |
| Migration | Add `email_notifications_log` table | Track sent emails, prevent duplicates |
| Config | `supabase/config.toml` | Register new function with `verify_jwt = false` |

## Edge Function Design

The function accepts:
```json
{
  "type": "welcome" | "service_complete" | "bid_accepted" | "credit_receipt",
  "talent_id": "uuid",
  "data": { /* type-specific payload */ }
}
```

It looks up the talent's email, builds branded HTML (GroUp Academy styled), sends via Resend, and inserts a notification row. Includes idempotency check via `email_notifications_log` to prevent duplicate sends.

## Email Templates (inline HTML in edge function)

All emails share a consistent branded header/footer with GroUp Academy logo, dark navy theme accent, and clear CTA buttons. Templates are kept as template literal functions inside the edge function (no external dependencies).

## Email Domain Note

Currently no custom email domain is configured. Emails will send from `noreply@resend.dev` which works for testing but may have deliverability issues. Setting up a custom domain (e.g., `notify@groupacademy.com`) is recommended before production launch but is not a blocker for building the infrastructure now.

## Database

New table `email_notifications_log`:
- `id`, `talent_id`, `email_type`, `recipient_email`, `resend_id`, `status` (sent/failed), `error_message`, `created_at`
- RLS: admin read-only, system insert via service role

