

# Fix AI Job Recommendations -- Better Matching Quality

## Root Cause Analysis

Three problems are causing poor results:

1. **Only 50 of 2,628 jobs reach the AI.** The edge function has `.limit(50)`, so the AI never even sees 98% of jobs.
2. **Job descriptions are not sent to the AI.** Every job has a description, but only `requirements` and `preferred_skills` are sent -- and only 5 jobs have those fields filled in. The AI is essentially matching blind.
3. **No pre-filtering strategy.** Sending all 2,628 jobs to the AI is too expensive. We need a smart two-stage approach.

## Solution: Two-Stage Matching Pipeline

### Stage 1: Database-Level Pre-Filtering (narrow 2,628 down to ~200)

Use a broad text search across job `title` and `description` against the talent's skills and experience keywords. This is done via SQL `ILIKE` or full-text search to create a shortlist of ~200 potentially relevant jobs, instead of blindly taking the latest 50.

**Fallback:** If text search returns fewer than 50 results (e.g. sparse profile), supplement with the most recent jobs to ensure the AI always has enough to work with.

### Stage 2: AI Deep Ranking (rank the ~200 down to top 10-12)

Send the shortlisted jobs (with descriptions included) to the AI for proper contextual ranking. The AI now has real content to match against.

## Changes

### File: `supabase/functions/suggest-jobs-for-talent/index.ts`

**1. Extract search keywords from talent profile**
- Pull skill names, job titles from experience, degree fields from education
- Build a list of 10-20 search terms

**2. Replace the single `.limit(50)` query with a smarter approach**
- Query jobs where `description ILIKE` any of the search keywords (using OR conditions)
- Also match on `title ILIKE` for each keyword
- Limit to 200 results
- If fewer than 50 results, backfill with recent jobs

**3. Include job descriptions in the AI payload**
- Add `description` field to `jobSummaries` (truncated to first 300 chars to manage token usage)
- This gives the AI actual content to judge relevance

**4. Update the AI system prompt**
- Remove "Be selective - only include genuinely relevant jobs"
- Instead: "Consider partial matches, transferable skills, and adjacent roles. A 50-60% match is still valuable. Score generously for adjacent relevance."
- This ensures the AI returns useful results even when exact matches are rare

**5. Increase return limit from 10 to 12**
- More results give users a better selection

### Summary of Impact

| Before | After |
|--------|-------|
| AI sees 50 random recent jobs | AI sees ~200 pre-filtered relevant jobs |
| No job descriptions sent | 300-char description included |
| Only 5 jobs have skills data | Descriptions provide rich matching context |
| "Be selective" prompt = few low-score results | Balanced prompt = more useful results |

