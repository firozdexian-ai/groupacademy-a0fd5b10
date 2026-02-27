

# Fix: LinkedIn JSON Upload Freezing on Large Files

## Root Cause

When you upload a JSON file, `handleFileUpload` runs two dedup passes:
1. A single `IN` query on `source_url` (fast)
2. Individual `ilike` queries per unique title+company pair -- one DB call per pair (lines 337-349)

For a file with 100 jobs from 80 companies, that's ~80 sequential network requests before anything appears on screen. There's no loading state during this phase, so the dialog appears frozen.

## Fix

### 1. Add a "processing" loading state during file parsing

Show a spinner immediately after the file is selected, before the dedup queries run. This gives instant visual feedback.

### 2. Replace individual dedup queries with a single bulk query

Instead of querying each title+company pair one by one, fetch all existing jobs' `title` and `company_name` in a single query filtered by the company names present in the upload. Then do the comparison in-memory.

```text
Before: 80 sequential queries (one per pair)
After:  1 query fetching existing jobs by company names, then in-memory Set comparison
```

### 3. Add error handling for the parsing phase

Wrap the dedup logic in try/catch so any network failure during parsing surfaces a toast error instead of silently hanging.

## Files Changed

| File | Change |
|------|--------|
| `src/components/dashboard/BatchLinkedInJobUpload.tsx` | Add loading state for file processing; replace per-pair dedup queries with single bulk query; add error handling |

## Technical Detail

Replace lines 333-349 with:

```typescript
// Secondary dedup: bulk fetch existing jobs by company names, compare in-memory
const companyNamesForDedup = [...new Set(mapped.map(j => j.company_name))];
const existingJobPairs = new Set<string>();

for (let i = 0; i < companyNamesForDedup.length; i += 20) {
  const batch = companyNamesForDedup.slice(i, i + 20);
  const { data: existingJobs } = await supabase
    .from("jobs")
    .select("title, company_name")
    .in("company_name", batch);
  existingJobs?.forEach(j => {
    existingJobPairs.add(`${j.title.toLowerCase().trim()}|||${j.company_name.toLowerCase().trim()}`);
  });
}
```

This reduces ~80 queries down to ~4-5 batch queries (20 company names each), making the upload respond in seconds instead of hanging.

