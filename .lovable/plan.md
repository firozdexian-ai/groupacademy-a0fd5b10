
## Fix: Jobs Vanishing After Creation

### Problem Identified

The `handleSaveJob` function in `JobsManager.tsx` **silently swallows database errors**:

```javascript
// Current broken code (lines 892-925)
const handleSaveJob = async (formData: any) => {
  try {
    // ...company logic...
    if (editingJob) 
      await supabase.from("jobs").update(payload).eq("id", editingJob.id);
    else 
      await supabase.from("jobs").insert(payload);  // ← NO error check!
    toast.success("Job saved");  // ← Shows even on failure!
  } catch {
    toast.error("Save failed");  // ← Only catches exceptions, not Supabase errors
  }
};
```

**Root Cause**: Supabase client returns `{ data, error }` but the code doesn't check the `error` object. The insert fails silently, showing "Job saved" while the data is never persisted.

---

### Solution

Fix the `handleSaveJob` function to properly check for database errors:

**File: `src/components/dashboard/JobsManager.tsx`**

```typescript
const handleSaveJob = async (formData: any) => {
  setSaving(true);
  try {
    // Company linking logic (unchanged)
    let companyId = null;
    if (formData.company_name) {
      const { data: co } = await supabase
        .from("companies")
        .select("id")
        .ilike("name", formData.company_name)
        .maybeSingle();
      if (co) companyId = co.id;
      else {
        const { data: newCo, error: coError } = await supabase
          .from("companies")
          .insert({ name: formData.company_name })
          .select()
          .single();
        if (coError) console.warn("Company creation failed:", coError);
        if (newCo) companyId = newCo.id;
      }
    }
    
    const payload = { ...formData, company_id: companyId };
    delete payload.id;
    
    // FIX: Actually check for errors!
    let error;
    if (editingJob) {
      const result = await supabase
        .from("jobs")
        .update(payload)
        .eq("id", editingJob.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("jobs")
        .insert(payload)
        .select()  // Return the inserted row to confirm success
        .single();
      error = result.error;
    }
    
    if (error) {
      console.error("Job save error:", error);
      // Provide specific error messages
      if (error.message?.includes("null value")) {
        toast.error("Please fill all required fields (title, company, description)");
      } else if (error.message?.includes("row-level security")) {
        toast.error("Permission denied. Please contact admin.");
      } else {
        toast.error(`Save failed: ${error.message}`);
      }
      return; // Don't close dialog on error
    }
    
    toast.success("Job saved successfully!");
    setIsDialogOpen(false);
    setEditingJob(null);
    loadJobs();
  } catch (err: any) {
    console.error("Unexpected error saving job:", err);
    toast.error(`Unexpected error: ${err.message}`);
  } finally {
    setSaving(false);
  }
};
```

---

### Additional Improvements

1. **Add form validation before submit** (already exists but may not be called):
   - The `validateForm()` function checks required fields
   - Ensure it runs before `onSave` is called

2. **Log the payload for debugging**:
   ```typescript
   console.log("Saving job payload:", payload);
   ```

3. **Verify company creation errors** are also captured

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/JobsManager.tsx` | Fix `handleSaveJob` to check `error` from Supabase response |

---

### Why Jobs "Vanished"

Your 2 jobs were never saved to the database. The insert failed (likely due to missing required field or validation), but the code showed "Job saved" anyway because it never checked the `error` response from Supabase.

After fixing this, you'll see the actual error message explaining why the save failed, and jobs will no longer appear to vanish.
