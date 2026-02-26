

# Jobs Sharing Status + Live KPI + Auto-Deactivation

## 1. Sharing Status Indicator on Jobs Table

**What it does**: Shows how many channels each job has been shared to (out of 4: LinkedIn, Facebook, WhatsApp, Telegram) directly in the jobs table row.

**How**:
- When loading jobs, also fetch share logs grouped by job_id from `job_share_logs` for the current page's jobs
- Add a "Shared" column to the table showing a visual indicator:
  - `4/4` with a green checkmark badge = fully shared
  - `2/4` with a partial indicator = partially shared
  - `0/4` in gray = not shared yet
- Each count shows unique channels shared (not total shares)

**File**: `src/components/dashboard/JobsManager.tsx`
- In `loadJobs()`, after fetching jobs, also query `job_share_logs` for those job IDs to get distinct channel counts per job
- Add a new "Shared" column between "Status" and "Deadline" in the table
- Display colored badges: green (4/4), yellow (1-3/4), gray (0/4)

## 2. Live Jobs Count in KPI Dashboard

**What it does**: Adds a new KPI card showing the count of currently active (`is_active = true`) jobs.

**File**: `src/components/dashboard/JobsKPIDashboard.tsx`
- Add `liveJobs` field to the `KPIData` interface
- In `loadData()`, query `jobs` where `is_active = true` to get the count
- Add a new stat card (green, with a "signal" icon) in the Quick Stats grid showing "Live Jobs"

## 3. Auto-Deactivate Expired Jobs

**What it does**: Automatically sets `is_active = false` for any job whose `deadline` has passed, without waiting for admin action. This runs every time the Jobs KPI dashboard or Jobs Manager loads.

**How**:
- Create a database function `auto_deactivate_expired_jobs()` that updates all active jobs with a past deadline
- Call this function at the start of `loadData()` in the KPI dashboard and `loadJobs()` in Jobs Manager using `supabase.rpc()`
- This ensures expired jobs are always cleaned up on page load

**Database migration**:
```sql
CREATE OR REPLACE FUNCTION public.auto_deactivate_expired_jobs()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE jobs
  SET is_active = false
  WHERE is_active = true
    AND deadline IS NOT NULL
    AND deadline < now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
```

## Technical Summary

| File | Change |
|------|--------|
| `src/components/dashboard/JobsManager.tsx` | Add share log fetching per page, add "Shared" column with 0-4/4 badge |
| `src/components/dashboard/JobsKPIDashboard.tsx` | Add "Live Jobs" KPI card, call auto-deactivate on load |
| Database migration | Create `auto_deactivate_expired_jobs()` RPC function |

