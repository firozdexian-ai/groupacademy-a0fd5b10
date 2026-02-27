

# Fix "reference_id is of type uuid but expression is of type text" Error

## Root Cause

The `award_gig_credits` database function contains this line:

```sql
INSERT INTO credit_transactions (..., reference_id, ...)
VALUES (..., p_submission_id::text, ...);
```

The `reference_id` column in `credit_transactions` is of type `uuid`, but the function casts `p_submission_id` (already a uuid) to `text`, causing a type mismatch error.

## Fix

Run a database migration to update the `award_gig_credits` function, changing `p_submission_id::text` to just `p_submission_id` (no cast needed since both are uuid).

The same issue exists in the `track_shared_job_click` function (line: `v_submission.id::text`), so that will be fixed at the same time.

## Technical Details

| What | Detail |
|------|--------|
| Affected functions | `award_gig_credits`, `track_shared_job_click` |
| Column | `credit_transactions.reference_id` (type: uuid) |
| Fix | Remove `::text` cast, pass uuid directly |
| Files changed | Database migration only (no frontend code changes needed) |

