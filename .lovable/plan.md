

# Profile Edit & Save Functionality Deep Dive - Fix Plan

## Issues Identified

### Issue 1: Save Button Hidden by Mobile Bottom Navigation (CRITICAL)
**Location**: `src/pages/app/ProfileEdit.tsx` (lines 454-474)

The save button bar is positioned with `fixed bottom-0`, but the mobile bottom navigation in `TalentAppShell.tsx` has a height of `68px` plus safe-area padding. This means:
- Save button is rendered at `bottom-0`
- Bottom nav is `68px + safe-area` tall
- **Result**: Save button is completely covered by bottom navigation on mobile

**Current Code**:
```tsx
<div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t z-50 md:relative md:p-0 md:bg-transparent md:border-0">
```

**Problem**: `bottom-0` places it behind the 68px bottom nav.

### Issue 2: CV Upload in Profile Edit Not Saving to Database
**Location**: `src/pages/app/ProfileEdit.tsx` (lines 97-203)

When uploading CV in ProfileEdit, the flow is:
1. Upload file to storage - works
2. Call `parse-cv` edge function - works
3. Update local state (`setFormData`, `setSkills`, etc.) - works
4. **BUT the data is never persisted to the database until user clicks Save**

The problem is the user doesn't see a Save button (Issue 1), so they never save. If they refresh before clicking Save, all parsed data is lost because it was only in React state.

### Issue 3: CV Upload During Onboarding Has Different Behavior
**Location**: `src/components/onboarding/CVUploadStep.tsx` (lines 166-202)

In the onboarding wizard, CV upload correctly saves to database immediately:
```tsx
await updateTalent(updateData);
await refreshTalent();
```

But users who skip CV during onboarding and upload later via ProfileEdit face Issue 1 & 2.

### Issue 4: No Auto-Save or Dirty State Warning
When users make changes but don't save (because they can't see the button), there's no warning when navigating away. All changes are lost silently.

### Issue 5: Inconsistent Save Patterns Across Components
| Component | Save Behavior |
|-----------|---------------|
| `ProfileEdit.tsx` | Manual save via hidden button |
| `CVUploadStep.tsx` | Auto-save after CV parse |
| `ProfileEditDialog.tsx` | Manual save in dialog |
| `ProfileQuickSetup.tsx` | Manual save before continue |

---

## Solution Plan

### Fix 1: Raise Save Bar Above Bottom Navigation

**File**: `src/pages/app/ProfileEdit.tsx`

Change the sticky save bar positioning to account for mobile bottom navigation:

```tsx
// Before (line 455)
<div className="fixed bottom-0 left-0 right-0 p-4 ...">

// After - Add bottom padding for mobile nav
<div className="fixed bottom-[68px] md:bottom-0 left-0 right-0 p-4 safe-bottom ...">
```

Also update the main container's bottom padding:
```tsx
// Line 251: Add extra padding to prevent content being hidden
<div className="max-w-2xl mx-auto px-4 py-6 pb-40">
```

### Fix 2: Auto-Save CV Data Immediately After Parse

**File**: `src/pages/app/ProfileEdit.tsx`

After CV parsing succeeds, immediately save to database (not just local state):

```tsx
// After line 186 (toast.success)
// Immediately persist CV data to database
const immediateUpdate = {
  cvUrl: publicUrl,
  cvParsedAt: new Date().toISOString(),
  ...(parsed.full_name && { fullName: parsed.full_name }),
  ...(parsed.phone && { phone: parsed.phone }),
  ...(parsed.skills?.length && { skills: parsed.skills }),
  ...(parsed.experience?.length && { experience: parsed.experience }),
  ...(parsed.education?.length && { education: parsed.education }),
};

await updateTalent(immediateUpdate);
await refreshTalent();

toast.success("Profile Updated!", { 
  description: "Your CV data has been saved. Continue editing or go back." 
});
```

### Fix 3: Add Unsaved Changes Warning

**File**: `src/pages/app/ProfileEdit.tsx`

Track form dirty state and warn before navigation:

```tsx
const [isDirty, setIsDirty] = useState(false);

// Mark dirty on any form change
const handleChange = (field: string, value: string) => {
  setFormData((prev) => ({ ...prev, [field]: value }));
  setIsDirty(true);
};

// Warn on navigation
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

### Fix 4: Add Visual Save Indicator

Add a floating "Unsaved changes" indicator when form is dirty:

```tsx
{isDirty && (
  <div className="fixed top-16 md:top-4 right-4 z-50">
    <Badge variant="destructive" className="animate-pulse">
      Unsaved changes
    </Badge>
  </div>
)}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/app/ProfileEdit.tsx` | Fix save bar position, auto-save CV data, add dirty state warning |
| `src/index.css` | (Optional) Add utility class for nav-aware bottom positioning |

---

## Technical Details

### Save Bar Positioning Fix

The bottom navigation has:
- Base height: `68px` (line 328 in TalentAppShell)
- Safe area padding: `env(safe-area-inset-bottom)` via `.safe-bottom` class

The fix uses `bottom-[68px]` on mobile which places the save bar directly above the nav. On desktop (`md:bottom-0`), it returns to normal positioning since there's no bottom nav.

### CV Auto-Save Strategy

Instead of storing parsed CV data only in React state, we:
1. Parse CV via edge function
2. Update local state for immediate UI feedback
3. **Also persist to database immediately** via `updateTalent()`
4. This ensures data survives page refreshes

### Page Padding Adjustment

With save bar at `bottom-[68px]` plus its own height (~76px), content needs `pb-40` (160px) minimum to prevent last form fields from being hidden.

---

## Expected Outcome

After these fixes:
1. Save button visible above bottom navigation on all devices
2. CV data auto-saved immediately after parsing
3. Users warned before losing unsaved changes
4. Consistent save behavior across all profile editing flows

