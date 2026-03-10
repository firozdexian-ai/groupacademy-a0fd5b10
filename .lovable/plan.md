

# Add Job Filter to Applications Manager + Recruitment Section Final Audit

## Problem
Currently there is no way to filter applications by job. An admin managing 50+ jobs cannot quickly see "all applications for Job X." The only filters are application status and delivery status.

## Solution

### 1. Add a Job Filter dropdown to Applications Manager

- Fetch distinct jobs from `job_applications` (joined with `jobs` for title/company) on mount
- Add a third `Select` dropdown: "All Jobs" + list of jobs with application counts (e.g., "Marketing Manager - ABC Corp (12)")
- When a job is selected, the server-side query adds `.eq('job_id', selectedJobId)`
- Reset pagination on filter change
- **Bonus**: Accept `?jobId=xxx` URL param so the Jobs Manager can link directly to "View Applications" for a specific job

### 2. Add "View Applications" action to Jobs Manager

- In the Jobs Manager action menu (per-job), add a "View Applications" option
- Clicking it navigates to `?tab=applications&jobId={job_id}`
- Applications Manager reads this param on mount and pre-applies the job filter

### 3. Recruitment Section Final Audit Summary

After this change, the Recruitment section will have:
- **Jobs KPI**: Analytics dashboard with conversion tracking, targets, trends -- done
- **Manage Jobs**: Cascading cross-filters (country/company/status), mobile cards, search -- done
- **Applications**: KPI cards, mobile cards, search, status/delivery/job filters, job deep-link -- done after this
- **Companies & Contacts**: Separate group, already audited -- done

No remaining gaps in Recruitment.

## Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/JobApplicationsManager.tsx` | Add job filter state, fetch distinct jobs list, add Select dropdown, read `jobId` URL param, wire into query |
| `src/components/dashboard/JobsManager.tsx` | Add "View Applications" action in per-job dropdown menu |

No database changes needed.

