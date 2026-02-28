

# "Apply with AI" -- Dual-Path Smart Application Assistant

## Overview

Build the "Apply with AI" feature with two extraction paths (Firecrawl scrape + screenshot fallback), question caching to avoid redundant scraping, and personalized AI answer generation. This ensures coverage across all job types including LinkedIn Easy Apply.

## How It Works

```text
User clicks "Apply with AI" (50 credits)
        |
        v
  [Check cache: do we already have questions for this URL?]
        |
   YES -+-> Skip to AI answer generation (fast path, ~10s)
        |
   NO --+-> Try Firecrawl scrape
        |       |
        |   SUCCESS -> Extract questions -> Cache them -> Generate answers
        |       |
        |   FAILURE -> Show "Upload Screenshots" fallback
        |                   |
        |               User uploads 1-3 screenshots
        |                   |
        |               AI Vision extracts questions -> Cache them -> Generate answers
        |
        v
  [Show Prep Sheet with copy buttons + "Open Application" link]
```

## Key Design Decisions

### 1. Question Caching (Your Question #1)
- Store scraped/extracted questions in a new `external_application_questions` table, keyed by `application_url`
- On repeat visits (same or different user), skip Firecrawl entirely and go straight to answer generation
- Questions are cached indefinitely (job postings rarely change their form questions)
- Admin can clear cache if needed
- This saves Firecrawl API credits and cuts response time in half (~10s vs ~25s)

### 2. Screenshot Fallback (Your Question #2)
- When Firecrawl fails OR user chooses "I'll upload screenshots instead"
- User can upload 1-5 screenshots of the application form questions
- AI Vision (Gemini 2.5 Flash -- same model already used in Job Posting Gig screenshot parsing) extracts questions from the images
- Extracted questions follow the same pipeline: cache, then generate answers
- This covers LinkedIn Easy Apply, login-gated portals, mobile app screenshots, and any other unscrappable source

### 3. Credit Model
- 50 credits per application (charged once, covers both extraction + answer generation)
- If cached questions exist, still 50 credits (the value is in the personalized answers, not the scraping)

## Implementation Plan

### Step 1: Database -- `external_application_questions` table
New table to cache extracted questions per URL:
- `id` (uuid, PK)
- `application_url` (text, unique index)
- `job_id` (uuid, nullable FK to jobs)
- `questions` (jsonb -- array of {question_text, field_type})
- `extraction_method` (text -- 'firecrawl' or 'screenshot')
- `created_at`, `updated_at`
- RLS: readable by authenticated users, writable by service role only

### Step 2: Edge Function -- `prepare-external-application`
Single edge function handling both paths:
- **Input**: `{ job_id, application_url, mode: 'scrape' | 'screenshot', screenshots?: base64[], talent_id }`
- **Flow**:
  1. Check cache for existing questions by URL
  2. If no cache: either scrape via Firecrawl or extract from screenshots via AI Vision
  3. Cache the extracted questions
  4. Fetch user's profile data (skills, experience, education, CV text)
  5. Send questions + profile to Gemini 2.5 Flash for personalized answer generation
  6. Return structured Q&A pairs
- **Credit deduction**: 50 credits via `deduct_credits` RPC

### Step 3: Frontend Component -- `ExternalApplicationPrep.tsx`
Dialog/sheet with two phases:

**Phase 1 -- Question Extraction:**
- Show ProcessingCard with stages ("Scraping application page..." / "Analyzing screenshots...")
- If Firecrawl fails, show fallback UI: "We couldn't read this page. Upload screenshots of the questions instead."
- Screenshot upload: reuse existing `ImageUpload` or `MultiFileUpload` pattern, limit 1-5 images
- Submit screenshots to the same edge function with `mode: 'screenshot'`

**Phase 2 -- Answer Prep Sheet:**
- List each detected question with AI-generated answer
- Copy button next to each answer (clipboard + toast)
- Editable textarea so user can tweak before copying
- "Open Application" button at the bottom to open the external URL
- "General Summary" section: elevator pitch + key strengths for this role (always shown, useful even if no specific questions detected)

### Step 4: Update `AppJobDetail.tsx`
- For `application_type === 'link'` jobs: change button from "Apply Externally" to "Apply with AI"
- Add dialog state management for `ExternalApplicationPrep`
- Keep the existing tracking via `track_job_apply_click`
- Credit gate: check balance before opening the dialog

### Step 5: Credit Config Update
Add `EXTERNAL_APPLICATION` to `creditPricing.ts`:
- Name: "AI Application Assistant"
- Cost: 50 credits
- Description: "AI-powered answers for external job applications"

### Step 6: Link Firecrawl Connector
Connect the workspace's Firecrawl connection to this project so `FIRECRAWL_API_KEY` is available in edge functions.

## Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | Create `external_application_questions` table |
| `src/lib/creditPricing.ts` | Add EXTERNAL_APPLICATION service |
| `supabase/functions/prepare-external-application/index.ts` | New edge function (scrape + screenshot + AI) |
| `src/components/jobs/ExternalApplicationPrep.tsx` | New prep sheet component with dual-path UI |
| `src/pages/app/AppJobDetail.tsx` | Update apply button + dialog integration |
| `supabase/config.toml` | Auto-updated with function config |

## Coverage Analysis

| Job Source | Method | Coverage |
|------------|--------|----------|
| Company career portals (Lever, Greenhouse, Workable) | Firecrawl scrape | High |
| Google Forms / Typeform applications | Firecrawl scrape | High |
| LinkedIn Easy Apply | Screenshot fallback | High |
| Login-gated portals | Screenshot fallback | High |
| Mobile-only applications | Screenshot fallback | Medium |
| Simple "email your CV" jobs | Not applicable (already handled by email apply) | N/A |

With both paths combined, virtually all external application types are covered.

