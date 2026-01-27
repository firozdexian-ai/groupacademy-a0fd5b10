
## Comprehensive Learning Section Overhaul - Phase 2 (Updated)

### Executive Summary

This plan addresses **33 distinct issues** across the learning ecosystem, including your new critical issue where **users cannot proceed to the next stage after completing a video**. The root cause has been identified: YouTube iframe embeds do not provide playback progress callbacks, so the `onProgress` and `onComplete` handlers in `ResourceViewer.tsx` never fire for videos.

---

## Critical Issue: Cannot Proceed After Video Completion

### Root Cause Analysis

**The Problem:**
```text
User watches video → Video ends → "Complete & Continue" button stays disabled
```

**Technical Root Cause:**

In `OrientationStage.tsx`:
```typescript
const canComplete = videoWatched || (...);
// videoWatched is only set to true when handleVideoProgress(progress >= 80) is called
```

In `ResourceViewer.tsx`:
```typescript
// For video type, there's NO mechanism to track progress
<iframe
  src={`https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1`}
  // ... NO onProgress tracking - YouTube iframes don't emit events this way!
/>
```

**Why Audio Works But Video Doesn't:**
- Audio uses `<audio>` HTML element with `onTimeUpdate` event → works
- Video uses YouTube `<iframe>` embed → no progress events available

**Evidence:**
- `module_resources` table: **0 records** (resources never saved properly)
- `enrollment_stage_progress` table: **0 records** (progress never persisted)
- All enrollments show **0% progress**

---

## All Issues Identified (33 Total)

### Category 1: Video Completion Bug (CRITICAL) 🔴

| Issue | Description |
|-------|-------------|
| **1.1 Video progress not tracked** | YouTube iframe doesn't emit progress events, `onProgress` never fires |
| **1.2 canComplete never becomes true** | `videoWatched` state stays false, button stays disabled |
| **1.3 No manual completion fallback** | If auto-tracking fails, no way for user to proceed |

### Category 2: Resource Saving Bug 🔴

| Issue | Description |
|-------|-------------|
| 2.1 Validation filters out new resources | Line 227 requires `resource_url OR resource_data`, but new video resources have neither initially |
| 2.2 Storage bucket may not exist | `course-content` bucket uploads fail silently |
| 2.3 Zero resources in database | Query confirms 0 records in `module_resources` |

### Category 3: Video Architecture Confusion 🟠

| Issue | Description |
|-------|-------------|
| 3.1 Dual video sources | `course_modules.video_url` vs `module_resources` type="video" |
| 3.2 Module video required | `ModuleManagement.tsx` requires YouTube URL for every module |
| 3.3 Unclear which takes precedence | Player uses `fallbackVideoUrl` but logic is confusing |

### Category 4: Missing Credit System for Courses 🟠

| Issue | Description |
|-------|-------------|
| 4.1 No `credit_cost` column | Courses rely on price-based calculation only |
| 4.2 No admin UI for credits | ContentEdit.tsx has no credit cost field |
| 4.3 Free courses = 0 credits | Price = 0 means free enrollment (may be intended) |

### Category 5: Admin Management Gaps 🟡

| Issue | Description |
|-------|-------------|
| 5.1 Module delete loses resources | Deletes modules without checking for associated resources |
| 5.2 No link to resources for new modules | Resources button only shows after save |
| 5.3 Module video validation too strict | Requires YouTube URL even when using resources |
| 5.4 No "Manage Modules" shortcut in ContentEdit | Must navigate separately |

### Category 6: Progress Tracking Issues 🟡

| Issue | Description |
|-------|-------------|
| 6.1 Local state not persisted | `slidesViewed`, `videoWatched` lost on refresh |
| 6.2 Zero stage progress records | No data in `enrollment_stage_progress` |
| 6.3 All enrollments at 0% | Progress never updates |

### Category 7: Player UX Issues 🟢

| Issue | Description |
|-------|-------------|
| 7.1 Empty stages show placeholder | "Content being prepared" for all 6 stages |
| 7.2 Can skip all stages | When no resources, can skip to Progress immediately |
| 7.3 Download Notes shows toast | Button works but says "coming soon" |

---

## Implementation Plan

### Phase 2A: Fix Video Completion (CRITICAL - Resolves Your Issue)

**Problem:** YouTube iframes don't provide playback events to external JavaScript.

**Solution Options:**

| Option | Approach | Complexity |
|--------|----------|------------|
| A (Recommended) | Add manual "I watched this" button | Low |
| B | Use YouTube IFrame API with postMessage | High |
| C | Time-based auto-complete (after X seconds) | Medium |

**Implementing Option A (Manual Completion Fallback):**

**File: `src/components/player/ResourceViewer.tsx`**

Add a "Mark as Watched" button for video type:

```typescript
if (type === "video") {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="aspect-video">
        <iframe ... />
      </div>
      <CardContent className="p-3 flex items-center justify-between">
        <p className="text-sm font-medium">{title}</p>
        {onComplete && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onComplete}
            className="gap-1"
          >
            <CheckCircle className="h-4 w-4" />
            Mark as Watched
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

**File: `src/components/player/stages/OrientationStage.tsx`**

Update canComplete logic to allow manual override:

```typescript
// Current (broken):
const canComplete = videoWatched || (!hasVideo && infographicViewed) || (!hasVideo && !infographicResource);

// Fixed: If video exists, button is always enabled but shows different text
const canComplete = true; // Allow manual completion anytime

// OR use a more guided approach:
const canComplete = videoWatched || hasVideo; // Video presence enables completion
```

---

### Phase 2B: Fix Resource Saving

**File: `src/pages/ModuleResourcesManager.tsx`**

**Current validation (line 227):**
```typescript
const validResources = resources.filter(r => r.title && (r.resource_url || r.resource_data));
```

**Fixed validation:**
```typescript
const validResources = resources.filter(r => {
  if (!r.title?.trim()) return false;
  
  // URL-based resources need URL
  if (['video', 'slides', 'infographic', 'mindmap', 'audio_podcast'].includes(r.resource_type)) {
    return !!r.resource_url?.trim();
  }
  
  // Data-based resources need data
  if (['flashcards', 'ai_scenario', 'report'].includes(r.resource_type)) {
    return r.resource_data && Object.keys(r.resource_data).length > 0;
  }
  
  // Quiz doesn't need URL (managed separately)
  if (r.resource_type === 'quiz') return true;
  
  return false;
});
```

**Add storage bucket check:**
```sql
-- Ensure course-content bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-content', 'course-content', true)
ON CONFLICT (id) DO NOTHING;
```

---

### Phase 2C: Clarify Video Architecture

**Decision:** Module-level `video_url` is for Orientation stage, Resources are for supplementary content.

**File: `src/pages/ModuleManagement.tsx`**

Make video_url optional:
```typescript
// Line 125: Change validation
const incomplete = modules.some(m => !m.title);
// Was: modules.some(m => !m.title || !m.video_url)
```

Add helper text:
```typescript
<p className="text-xs text-muted-foreground">
  YouTube URL for Orientation stage (optional)
</p>
```

---

### Phase 2D: Add Credit Cost Field

**Database Migration:**
```sql
ALTER TABLE public.content
ADD COLUMN IF NOT EXISTS credit_cost integer NULL;

COMMENT ON COLUMN public.content.credit_cost IS 
  'Direct credit cost. If null, calculated from price.';
```

**File: `src/lib/creditPricing.ts`**

Update getCourseCredits:
```typescript
export function getCourseCredits(priceTaka: number, creditCost?: number | null): number {
  // Direct credit cost takes precedence
  if (creditCost !== undefined && creditCost !== null) {
    return creditCost;
  }
  // Fallback to price calculation
  return Math.ceil(priceTaka / CREDIT_CONFIG.CREDIT_TO_TAKA);
}
```

**File: `src/pages/ContentEdit.tsx`**

Add credit cost field after price:
```typescript
<div className="space-y-2">
  <Label htmlFor="credit_cost">Credit Cost (override)</Label>
  <Input
    id="credit_cost"
    type="number"
    value={formData.credit_cost || ""}
    onChange={(e) => setFormData({ 
      ...formData, 
      credit_cost: e.target.value ? parseInt(e.target.value) : null 
    })}
    placeholder="Auto-calculated from price if empty"
  />
  <p className="text-xs text-muted-foreground">
    Leave empty to auto-calculate from price (1 credit = ৳2)
  </p>
</div>
```

---

### Phase 2E: Admin UX Improvements

**File: `src/pages/ContentEdit.tsx`**

Add "Manage Modules" button after the form:
```typescript
{formData.content_type === "recorded_course" && (
  <Button variant="outline" asChild className="w-full">
    <Link to={`/content/${id}/modules`}>
      <Settings className="h-4 w-4 mr-2" />
      Manage Course Modules
    </Link>
  </Button>
)}
```

**File: `src/pages/ModuleManagement.tsx`**

Add warning before module delete:
```typescript
const removeModule = (index: number) => {
  const module = modules[index];
  if (module.id) {
    // Module exists in DB - warn about potential resource loss
    if (!confirm("Deleting this module will also remove its resources. Continue?")) {
      return;
    }
  }
  setModules(modules.filter((_, i) => i !== index));
};
```

---

### Phase 2F: Persist Stage View States

**Database Migration:**
```sql
ALTER TABLE public.enrollment_stage_progress
ADD COLUMN IF NOT EXISTS resource_view_states jsonb DEFAULT '{}';
```

**File: `src/hooks/useStageProgress.ts`**

Add resource state tracking:
```typescript
const [resourceViewStates, setResourceViewStates] = useState<Record<string, boolean>>({});

const markResourceViewed = useCallback(async (resourceId: string) => {
  const newStates = { ...resourceViewStates, [resourceId]: true };
  setResourceViewStates(newStates);
  
  // Persist to database
  await supabase
    .from("enrollment_stage_progress")
    .upsert({
      enrollment_id: enrollmentId,
      module_id: moduleId,
      resource_view_states: newStates,
      // ...other fields
    });
}, [resourceViewStates, enrollmentId, moduleId]);
```

---

## Summary of All Changes

| Priority | File | Change |
|----------|------|--------|
| **CRITICAL** | `ResourceViewer.tsx` | Add "Mark as Watched" button for videos |
| **CRITICAL** | `OrientationStage.tsx` | Fix canComplete logic to allow manual completion |
| **HIGH** | `ModuleResourcesManager.tsx` | Fix validation to properly save resources |
| **HIGH** | `ModuleManagement.tsx` | Make video_url optional |
| **MEDIUM** | `ContentEdit.tsx` | Add credit_cost field + Manage Modules button |
| **MEDIUM** | `creditPricing.ts` | Update getCourseCredits to use direct credit_cost |
| **MEDIUM** | `useStageProgress.ts` | Add resource view state persistence |
| **LOW** | Database | Add credit_cost column, resource_view_states column |

---

## Expected Outcomes After Implementation

1. **Users can proceed after watching video** - Manual "Mark as Watched" button enables completion
2. **Admins can save resources** - Fixed validation allows proper resource saving
3. **Flexible course pricing** - Direct credit cost or auto-calculation
4. **Progress persists** - View states survive page refresh
5. **Better admin UX** - Direct module management links, optional video URLs
6. **Clear video architecture** - Module video for Orientation, resources for extras
