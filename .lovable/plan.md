

# Upgrade Job Sharing Gig to Match Admin-Level Sharing Experience

## Problem
The current seeker job sharing flow has three major issues:
1. **No AI captions** -- uses a basic static template ("Job Title at Company, Apply now: link") that looks unprofessional and gets ignored on social media
2. **No copy-to-clipboard for captions** -- LinkedIn and Facebook share buttons just open a URL sharer that doesn't include the caption text, so seekers can't paste a polished message
3. **Only 20 jobs, no search/filter** -- with 2,000+ active jobs, seekers can't find the ones they want to share
4. **Cramped UI** -- tiny job cards in a small scrollable area

## Solution
Bring the admin-level AI caption experience into the seeker gig form, plus add search/filter to handle 2,000+ jobs.

## Changes

### 1. Redesign `src/components/gigs/JobSharingGigForm.tsx` (major rewrite)

**Search and Filter (top section):**
- Add a search input filtering by job title or company name
- Add horizontal filter chips: "All", "Bangladesh", "Remote", "International" for quick location filtering
- Fetch up to 100 jobs sorted by featured first, then newest
- Client-side filtering for instant results

**Job Picker (middle section):**
- Taller scrollable list (max-h-64 instead of max-h-48)
- Each card shows company name bold, title below, location and type badges
- "NEW" badge for jobs posted in last 48 hours
- Clear selected state with checkmark and highlighted border

**AI Caption + Share (bottom section, after selecting a job):**
- Channel tabs (LinkedIn, Facebook, WhatsApp, Telegram) -- same layout as admin panel
- On tab click, call the existing `generate-job-share-caption` edge function to get an AI-generated caption for that channel
- Show caption in a read-only text area with a loading skeleton while generating
- **"Copy Caption" button** -- copies the AI caption to clipboard so seekers can paste it into LinkedIn/Facebook posts
- **"Share" button** -- opens the social platform share URL (for WhatsApp/Telegram this includes the caption; for LinkedIn/Facebook it opens the URL sharer)
- "Regenerate" button to get a fresh caption variation
- After sharing on at least one channel, show "Submit for Review" button

**Share logging:**
- Log to `gig_share_logs` table (same as current) when a share action is taken, so admin can verify

### 2. Widen dialog in `src/components/gigs/GigSubmissionForm.tsx`

- Change `max-w-md` to `max-w-lg` specifically for `job_sharing` category to give room for the caption area and filters

## Technical Details

The existing `generate-job-share-caption` edge function already handles all 4 channels and returns polished, multi-line captions. No backend changes needed -- we just need to call it from the seeker form the same way the admin panel does.

```
Query (job fetch):
  .from("jobs")
  .select("id, title, company_name, location, job_type, created_at, is_featured, requirements")
  .eq("is_active", true)
  .gte("deadline", now)
  .order("is_featured", { ascending: false })
  .order("created_at", { ascending: false })
  .limit(100)

AI caption call (per channel):
  supabase.functions.invoke("generate-job-share-caption", {
    body: { title, company, location, job_type, requirements, apply_link, channel }
  })

Client-side location filter:
  "bangladesh" -> location includes "bangladesh" or "dhaka"
  "remote" -> location includes "remote"
  "international" -> neither of the above
```

## Files Changed

| File | Change |
|------|--------|
| `src/components/gigs/JobSharingGigForm.tsx` | Major rewrite: add search/filter, AI captions with copy, channel tabs, regenerate |
| `src/components/gigs/GigSubmissionForm.tsx` | Widen dialog for job_sharing category |

