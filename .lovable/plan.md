

# For You Tab Redesign -- 4 Vertical Sections

## Overview

Completely restructure the "For You" tab content into four distinct vertical sections with no horizontal scrolling anywhere. Each section shows 2-3 jobs initially with a "Show More" button to expand.

## Section Order

```text
1. Recommended for You (AI-powered, persisted)
2. Featured / Promoted Jobs
3. Expiring Soon
4. Hot Jobs (most clicks + applications)
```

## Detailed Section Design

### 1. Recommended for You
- **First-time users**: Show empty state with prompt to run AI recommendations
- **Above the list**: "Get AI Recommendations" button (10 credits) -- always visible until recommendations exist
- **After generating**: Show top 3 jobs vertically (compact JobCard), with "Show More" to reveal up to 12
- **Persistence**: AI recommendations are saved to the database (new `ai_job_recommendations` table) so they persist across sessions
- **Timestamp**: Show "Last updated: [date]" below the section header so users know when to regenerate
- **Regenerate**: Button changes to "Refresh Recommendations" once results exist
- Remove the old `personalizedJobs` (preference-based) and `topPicks` sections -- replaced entirely by this

### 2. Featured / Promoted Jobs
- Query: `is_featured = true`, active, not expired
- Show 3 vertically, "Show More" expands to all (up to 10)
- No horizontal scroll -- vertical list of compact JobCards

### 3. Expiring Soon
- Query: deadline within next 7 days, active, ordered by deadline ascending
- Show 3, "Show More" expands to all
- Vertical list, compact JobCards

### 4. Hot Jobs (Most Popular)
- Query: Count clicks from `job_analytics` + applications from `job_applications` for active jobs in last 30 days, rank by total engagement
- Show 3, "Show More" to expand
- Display with a fire/trending icon

## Database Changes

**New table: `ai_job_recommendations`**
- `id` (uuid, PK)
- `talent_id` (uuid, references talents)
- `job_id` (uuid, references jobs)
- `match_score` (integer)
- `reason` (text)
- `generated_at` (timestamptz, default now())
- RLS: talent can only read/delete their own rows
- On regeneration: delete old rows for this talent, insert new ones

## Code Changes (single file + migration)

### `src/pages/app/JobsHub.tsx`

**Remove:**
- `topPicks` state and `fetchTopPicks()` -- no longer needed
- `personalizedJobs` state and `fetchPersonalizedJobs()` -- replaced by persisted AI recommendations
- `promotedJobs` combined query -- split into separate featured and expiring queries
- All `ScrollArea` / horizontal scroll usage in the For You tab
- `aiSuggestions` in-memory state -- replaced by DB-persisted recommendations

**Add:**
- `recommendations` state: loaded from `ai_job_recommendations` table joined with `jobs`
- `recommendationsGeneratedAt` state: timestamp of last generation
- `featuredJobs` state: `is_featured = true` active jobs
- `expiringJobs` state: deadline within 7 days, ordered by deadline asc
- `hotJobs` state: jobs ranked by total clicks + applications in last 30 days (fetched via two queries aggregated in JS)
- `showMore` state object: `{ recommended: boolean, featured: boolean, expiring: boolean, hot: boolean }` to toggle expansion per section
- `INITIAL_SHOW_COUNT = 3` constant

**Fetch functions:**
- `fetchRecommendations()`: Select from `ai_job_recommendations` where `talent_id` = current talent, join jobs data, order by `match_score` desc
- `fetchFeaturedJobs()`: `is_featured = true`, active, not expired, limit 10
- `fetchExpiringJobs()`: deadline between now and now+7days, active, order by deadline asc, limit 10
- `fetchHotJobs()`: Fetch job_analytics counts and job_applications counts for last 30 days, merge in JS, rank by total engagement, fetch job details for top 10

**AI Recommendation flow update:**
- On "Get AI Recommendations" click: call edge function as before, then INSERT results into `ai_job_recommendations` (delete old first), reload from DB
- Show "Last updated: X" timestamp
- Button text: "Refresh Recommendations (10 credits)" if recommendations already exist

**UI per section:**
```
[SectionHeader]
[JobCard compact] -- job 1
[JobCard compact] -- job 2  
[JobCard compact] -- job 3
[Show More button] -- if more than 3 exist
```

All vertical, no horizontal scroll, consistent pattern across all four sections.

## Technical Notes

- Hot Jobs aggregation: Two queries (job_analytics grouped by job_id, job_applications grouped by job_id for last 30 days), merge counts in JS Map, sort by total, take top 10, then fetch job details in one query
- The `ai_job_recommendations` table keeps recommendations persistent -- no need to re-fetch from AI on every page load
- Remove `Recent Applications` section from For You tab (it was minor and doesn't fit the new structure)
- Keep the existing `handleShowAllAI` logic but modify it to persist results to DB

