

# Fix Feed Post Generation + Improvements

## Root Cause

The `feed_posts` table has a CHECK constraint that only allows: `'published'`, `'pending'`, `'rejected'`. The edge function inserts with `status: 'draft'` which violates this constraint. Every single insert fails.

The `blog_posts` table allows `'draft'` so that generator works fine.

## Fix

### 1. Edge Function: Use `'pending'` instead of `'draft'`

**File**: `supabase/functions/batch-generate-feed-posts/index.ts`
- Change `status: "draft"` to `status: "pending"` on line 129

### 2. Frontend: Query `'pending'` for feed drafts

**File**: `src/components/dashboard/BatchContentGenerator.tsx`
- Change the feed drafts query from `.eq("status", "draft")` to `.eq("status", "pending")`
- Update the approve action to set `status: "published"` (already correct)

### 3. Improvements to the Content Generation Segment

While fixing this, add these practical improvements:

**A. Show draft/pending count badge on Blog & Feed tabs** — so admins immediately see "5 pending review" without clicking into the tab.

**B. Generation result feedback** — after generating, auto-refresh the drafts list so new items appear immediately without manual page reload.

**C. Character count on feed post previews** — show word count to confirm posts are within the 50-200 word target.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/batch-generate-feed-posts/index.ts` | `status: "pending"` instead of `"draft"` |
| `src/components/dashboard/BatchContentGenerator.tsx` | Query `pending` for feed drafts, add pending count badges on tabs, auto-refresh after generation, word count display |

No database changes needed.

