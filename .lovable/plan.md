

# Complete Feed Simplification Plan

## Summary of Changes

Remove the AI recommendation system from the feed entirely. Replace it with a simple, fast, **free** content-first experience. This also fixes the "jobs still showing" issue.

---

## Why Remove AI from Feed?

| Current (AI-Powered) | Proposed (Simple) |
|---------------------|-------------------|
| Jobs need skill matching (complex) | Posts/tips are for everyone (simple) |
| 20 credits per refresh | FREE |
| 2-5 second AI call | Instant load |
| "85% match" score | Just show great content |
| Edge function + caching | Direct DB query |

**Bottom line**: AI scoring was valuable for job matching. For social content (posts, tips, polls), it's unnecessary complexity.

---

## Technical Changes

### 1. Rewrite `useFeedRecommendations.ts` (Simplified)

Remove:
- All AI edge function calls
- Credit charging for refresh
- AI recommendations caching logic
- `canAfford` and `deductCredits` calls

Keep:
- Basic feed fetching from `feed_posts`, `content`, `blog_posts`
- Filtering by type (post, course, video, blog, poll)
- Sorting by pinned, recency
- Dismissed items tracking

New sorting logic:
```typescript
// Priority order:
// 1. Pinned posts (always first)
// 2. New content from last 24 hours
// 3. Posts matching user's skills/tags
// 4. Everything else by recency
```

### 2. Delete or Deprecate Edge Function

The `generate-feed-recommendations` edge function becomes unused. Options:
- **Option A**: Keep it for future use (e.g., job matching in Jobs Hub)
- **Option B**: Delete it to reduce code

Recommendation: Keep it - may be useful for Jobs Hub AI features later.

### 3. Update Feed UI

**Remove from Feed.tsx**:
- "Load More (20 credits)" button at bottom
- Credit-related imports (`useCredits`, `Coins` icon)
- AI refresh logic

**Update**:
- Change refresh to simple data reload (free)
- Update "insights" section to use static tips instead of AI-generated ones

### 4. Clear Cached Recommendations

Run SQL to clear the cache so no old jobs appear:
```sql
DELETE FROM ai_recommendations;
```

### 5. Update FeedFilters and UI

Since jobs are removed, ensure all filter options work correctly:
- All, Posts, Courses, Videos, Articles, Polls

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useFeedRecommendations.ts` | Complete rewrite - remove AI, add simple fetch |
| `src/pages/app/Feed.tsx` | Remove credit UI, update refresh logic |
| Database | Clear `ai_recommendations` table |
| `supabase/functions/generate-feed-recommendations/index.ts` | Optional: Keep or remove |

---

## New `useFeedRecommendations.ts` Logic

```typescript
// Simplified hook structure:
export function useFeedRecommendations() {
  // 1. Fetch posts, courses, blogs in parallel
  // 2. No AI call
  // 3. No credit deduction
  // 4. Simple sorting: pinned → recent → rest
  // 5. Filter by type
  
  const fetchFeed = async () => {
    const [postsResult, coursesResult, blogsResult] = await Promise.all([
      supabase.from("feed_posts").select("*").eq("is_active", true),
      supabase.from("content").select("*").eq("is_published", true),
      supabase.from("blog_posts").select("*").eq("status", "published"),
    ]);
    
    // Merge and sort
    // No AI scoring needed
  };
  
  return {
    items,
    isLoading,
    filters,
    setFilters,
    refresh, // Now FREE
    markInterested,
    markNotInterested,
  };
}
```

---

## What Happens to "Career Insights"?

Currently, AI generates 3 personalized career tips. Options:

**Option A**: Remove insights section entirely
**Option B**: Use static curated tips (no AI)
**Option C**: Keep insights but generate once on profile creation (not on every feed load)

Recommendation: **Option B** - Keep the insights card but use curated tips:
```typescript
const staticInsights = [
  "Keep your profile updated to increase visibility to employers",
  "Practice common interview questions using our Mock Interview service",
  "Check the Jobs Hub daily for new opportunities",
];
```

This maintains the UI without the AI cost.

---

## Credit System Impact

| Service | Before | After |
|---------|--------|-------|
| Feed Refresh | 20 credits | FREE |
| Career Assessment | 50 credits | 50 credits (unchanged) |
| Mock Interview | 50 credits | 50 credits (unchanged) |
| Salary Analysis | 50 credits | 50 credits (unchanged) |

Users save 20 credits per feed refresh, encouraging more engagement.

---

## Expected Outcome

After these changes:
1. **Feed loads instantly** - No AI call needed
2. **Jobs completely removed** - Only posts, courses, videos, blogs
3. **Free to use** - No credits for browsing
4. **Simpler codebase** - Less edge function complexity
5. **Better UX** - Users can refresh as often as they want

---

## Optional: Keep AI for Jobs Hub

The edge function could be repurposed for the Jobs Hub (`/app/jobs`) to provide AI-scored job matches. This would:
- Make jobs exclusive to Jobs Hub
- Provide AI value where it matters (job matching)
- Charge credits only when users actively seek job recommendations

This is a future enhancement, not part of this immediate fix.

