

# Add "Related Jobs" Section to Job Detail Pages

## Goal
Reduce the 75-80% bounce rate on job detail pages by showing related jobs at the bottom, keeping visitors engaged and browsing more listings.

## Approach

Create a shared `RelatedJobs` component that fetches and displays up to 6 related jobs, prioritizing:
1. Jobs from the **same company** (if any exist)
2. Jobs from the **same country/location** (extracted from the location string)
3. Fallback to **recent featured jobs** if neither yields enough results

Add this component to both `PublicJobDetail.tsx` (public visitors) and `AppJobDetail.tsx` (logged-in users).

## Changes

### 1. New Component: `src/components/jobs/RelatedJobs.tsx`

A reusable component that accepts the current job's `id`, `company_name`, and `location`.

**Logic:**
- Query up to 3 active jobs with matching `company_name` (excluding current job)
- Query up to 6 active jobs with matching location country (e.g., `ilike "%Canada%"`) excluding current job and any already fetched
- Combine and cap at 6 total
- If fewer than 3, backfill with recent featured jobs
- Display in a responsive grid (2 cols on mobile, 3 on desktop) using the existing `JobCard` component in compact variant
- Section header: "More from [Company]" if company jobs exist, otherwise "More Jobs in [Country]", with a fallback "You Might Also Like"

**Country extraction:** Simple last-segment parsing from location string (e.g., "Toronto, Canada" -> "Canada"), matching against known patterns.

### 2. Update `src/pages/PublicJobDetail.tsx`

Insert `<RelatedJobs>` between the "Bottom CTA" and the end of the page (after line 375). Jobs link to `/jobs/{id}` (public route).

### 3. Update `src/pages/app/AppJobDetail.tsx`

Insert `<RelatedJobs>` after the source image card and before the sticky bottom bar (after line 621). Jobs link to `/app/jobs/{id}` (app route). Pass the `navigate` function for in-app navigation.

## Technical Details

```text
Component Props:
  currentJobId: string
  companyName: string
  location: string | null
  linkPrefix: "/jobs" | "/app/jobs"  (determines public vs app routing)

Query Strategy:
  1. Company query:  .ilike("company_name", companyName).neq("id", currentJobId).eq("is_active", true).limit(3)
  2. Location query:  .ilike("location", `%${extractedCountry}%`).not("id", "in", `(${excludeIds})`).eq("is_active", true).limit(6)
  3. Featured fallback: .eq("is_featured", true).eq("is_active", true).order("created_at", { ascending: false }).limit(6)

Country Extraction:
  - Split location by comma, take last segment, trim
  - e.g., "Dhaka, Bangladesh" -> "Bangladesh"
  - "Remote" -> skip location query
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/jobs/RelatedJobs.tsx` | **New** -- Shared component with related jobs grid |
| `src/pages/PublicJobDetail.tsx` | Add RelatedJobs before the bottom CTA section |
| `src/pages/app/AppJobDetail.tsx` | Add RelatedJobs after source image card, before sticky bar |

