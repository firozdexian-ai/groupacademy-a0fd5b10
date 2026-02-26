

# Wire Up "Approve & Create" Actions in GigSubmissionsManager

## Overview

Add two one-click actions to the admin review dialog so that when approving a CV Upload or Job Posting submission, the system automatically creates the corresponding record in the `talents` or `jobs` table -- eliminating manual data entry.

## Changes

### 1. GigSubmissionsManager.tsx -- Add Two New Mutations

**"Approve & Create Talent" (for `cv_upload` submissions)**

After calling `award_gig_credits` (existing approve flow), insert a new row into `talents` using the parsed CV data from `submission_data`:

```
INSERT INTO talents:
- full_name: submission_data.parsed_name
- email: submission_data.parsed_email
- phone: submission_data.parsed_phone
- cv_url: submission_data.cv_url
- custom_profession: submission_data.parsed_profession
- skills: submission_data.parsed_skills (as JSONB array)
```

Uses the existing `get_or_create_talent` DB function (already built) to avoid duplicates -- if a talent with that email exists, it updates instead.

**"Approve & Create Job" (for `job_posting` submissions)**

After calling `award_gig_credits`, insert a new row into `jobs` using the parsed job data from `submission_data.parsed_job`:

```
INSERT INTO jobs:
- title: parsed_job.title
- company_name: parsed_job.company_name
- location: parsed_job.location
- job_type: parsed_job.job_type (default: 'full_time')
- experience_level: parsed_job.experience_level (default: 'entry')
- description: parsed_job.description or raw_text fallback
- source_image_url: submission_data.source_image_url
- source_platform: 'other'
- is_active: true
```

### 2. UI Changes in the Review Dialog

In the `selectedSubmission.status === "pending"` section, add category-specific approve buttons:

- **CV Upload submissions**: Show "Approve & Create Talent" button (with User icon) alongside the plain "Approve" button
- **Job Posting submissions**: Show "Approve & Create Job" button (with Briefcase icon) alongside the plain "Approve" button
- Other categories keep just the standard "Approve" button

The enhanced buttons call the new mutations which: (1) award credits via `award_gig_credits`, then (2) create the record. Toast confirms what was created.

### 3. Quick-Approve Buttons in Table Row

Add the same enhanced approve icons in the table row actions column -- if the category is `cv_upload` or `job_posting`, the green checkmark calls the "approve & create" flow instead of plain approve.

## Technical Details

### No Database Changes Needed

- `get_or_create_talent` RPC already handles upsert by email
- `jobs` table accepts direct inserts from admin (RLS allows admin writes via `has_any_admin_role`)
- `award_gig_credits` already handles credit awarding and status update

### New Mutations (inside GigSubmissionsManager)

```typescript
// Approve + Create Talent
const approveAndCreateTalentMutation = useMutation({
  mutationFn: async (submission) => {
    // 1. Award credits
    await supabase.rpc("award_gig_credits", { ... });
    // 2. Create/update talent via RPC
    await supabase.rpc("get_or_create_talent", {
      p_email, p_full_name, p_phone
    });
    // 3. Update talent record with CV URL and skills
    await supabase.from("talents").update({ cv_url, skills, custom_profession })
      .eq("email", p_email);
  }
});

// Approve + Create Job
const approveAndCreateJobMutation = useMutation({
  mutationFn: async (submission) => {
    // 1. Award credits
    await supabase.rpc("award_gig_credits", { ... });
    // 2. Insert job
    await supabase.from("jobs").insert({
      title, company_name, location, description, ...
    });
  }
});
```

### Files Modified

| File | Change |
|------|--------|
| `src/components/dashboard/GigSubmissionsManager.tsx` | Add 2 mutations, update dialog buttons for cv_upload/job_posting categories, update table row quick-actions |

Single file change -- all logic stays in the existing manager component.

