
# Improve AI-Generated Share Caption Formatting

## Problem
The AI captions come out as a single unstructured paragraph — no line breaks, no visual separation between the hook, job details, and call-to-action. This makes them hard to read and unattractive when pasted into social media.

## Solution
Update the prompt in the `generate-job-share-caption` edge function to instruct the AI to produce **structured, multi-line captions** with clear visual sections. Also increase the character limit to allow breathing room.

## Changes

### 1. Update `supabase/functions/generate-job-share-caption/index.ts`

Rewrite the prompt rules to enforce a structured format:

**New prompt structure instructions:**
- Line 1: A creative hook or attention-grabbing opening (question, bold statement)
- Blank line
- Job details block: Role title, company, location, type -- each on its own line with relevant emojis
- Blank line
- 1-2 lines about key requirements or what makes this role exciting
- Blank line
- Call-to-action + apply link
- Optional: relevant hashtags (2-3 max)

**Key prompt changes:**
- Remove the tight character limit (500 chars forces a blob). Replace with "under 800 characters" for LinkedIn/Facebook/WhatsApp, keep Telegram at 280.
- Add explicit instruction: "Use line breaks to separate sections. Do NOT write a single paragraph."
- Add: "Format the job details clearly -- one detail per line"
- Add channel-specific formatting hints (e.g., WhatsApp supports bold with asterisks, LinkedIn supports line breaks well)

**Channel-specific formatting guidance:**
- LinkedIn: Use line breaks generously. Professional structure.
- Facebook: Community tone. Encourage tagging. Separate hook from details.
- WhatsApp: Use *bold* for job title and company. Short paragraphs with blank lines between.
- Telegram: Keep concise but still use 2-3 lines instead of one blob.

### 2. Update Textarea display in `JobsManager.tsx`

Increase the textarea rows from 6 to 10 to better display the multi-line formatted captions without scrolling.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-job-share-caption/index.ts` | Rewrite prompt to enforce structured multi-line formatting with sections; increase char limits |
| `src/components/dashboard/JobsManager.tsx` | Increase textarea rows from 6 to 10 |
