

# Gigs Redesign: Admin-Quality Tools for Seekers

## The Problem

The current Gigs submission forms are basic text inputs (paste name, paste text). Meanwhile, the admin dashboard has sophisticated AI-powered workflows:

- **CV Outreach Generator**: Upload CV, AI parses it, generates personalized WhatsApp message with share button
- **Jobs Manager**: Paste raw job text, AI parses into structured data, share across platforms with tracking
- **Job Sharing**: Social sharing with templates, tracked link generation, multi-platform support

The goal is to give seekers those SAME tools inside Gigs, so admin just approves -- no more manual uploading, parsing, sharing, or content creation.

## What Changes

### 1. CV Upload Gig -- Full AI-Powered Flow

**Current**: User types friend's name, email, phone manually.

**New**: User uploads a friend's CV file (or pastes URL). The system:
1. Uploads to storage
2. Calls `parse-cv` edge function to extract name, phone, email, skills, profession
3. Shows parsed result preview (name, phone, profession badge)
4. Generates a WhatsApp onboarding message with a "Share on WhatsApp" button
5. Submits: parsed data + CV URL + outreach message stored in `submission_data`

This mirrors the admin CVOutreachGenerator but simplified for seekers. Admin just sees the parsed profile + generated message and hits Approve.

### 2. Job Posting Gig -- AI Parse + Structured Output

**Current**: User pastes raw text into a textarea.

**New**: User pastes job post text OR uploads a screenshot. The system:
1. Calls `parse-job-post` edge function to extract structured fields (title, company, location, type, requirements, deadline)
2. Shows a preview card of the parsed job (like a mini JobCard)
3. User can upload a source image (screenshot from Facebook/LinkedIn)
4. Submits: parsed job data + source image URL in `submission_data`

Admin reviews the parsed job and can one-click approve to create it in the `jobs` table directly.

### 3. Job Sharing Gig -- Real Share Tools

**Current**: User pastes a "proof URL" and types platform name.

**New**: User selects a job from the active jobs list, then:
1. Gets share links with tracking (WhatsApp, LinkedIn, Facebook, Copy Link)
2. Clicks to share -- share action is recorded automatically
3. No manual proof needed -- the system knows they shared

This mirrors the admin ShareJobDialog but for seekers.

### 4. Content Creation Gig -- Structured Content Forms

**Current**: User types content type and pastes text.

**New**: User picks content type (Post, Poll, Article) and gets a dedicated mini-editor:
- **Post**: Text area + optional image upload (to `feed-images` bucket)
- **Poll**: Question + 2-4 options
- **Article/Blog**: Title + rich text body

Submitted content goes to admin for approval before being published to the feed.

### 5. Course Resell Gig -- Course Picker + Share

**Current**: User types referral name, email, course name manually.

**New**: User selects a course from a dropdown of active courses, then:
1. Gets a referral link with their talent ID embedded
2. Share buttons (WhatsApp, Copy Link) with a pre-written pitch
3. Submits with course ID + referral link

---

## Technical Implementation

### New Components

| Component | Purpose |
|-----------|---------|
| `src/components/gigs/CVUploadGigForm.tsx` | CV upload + AI parse + WhatsApp message generator |
| `src/components/gigs/JobPostingGigForm.tsx` | Job text paste + AI parse + source image upload |
| `src/components/gigs/JobSharingGigForm.tsx` | Job picker + multi-platform share with tracking |
| `src/components/gigs/ContentCreationGigForm.tsx` | Post/Poll/Article mini-editor with image upload |
| `src/components/gigs/CourseResellGigForm.tsx` | Course picker + referral link + share buttons |

### Modified Components

| Component | Change |
|-----------|--------|
| `src/components/gigs/GigSubmissionForm.tsx` | Route to category-specific form components instead of generic fields |
| `src/components/dashboard/GigSubmissionsManager.tsx` | Enhanced review UI: show parsed CV data, parsed job preview, share proof -- one-click approve to create job/talent records |

### Database Changes

- **New table `gig_share_logs`**: Tracks seeker shares (talent_id, gig_submission_id, job_id, channel, shared_at) -- proves sharing happened without manual screenshots
- No other schema changes needed; `submission_data` JSONB already handles rich structured data

### Edge Functions Used (Existing)

- `parse-cv` -- for CV Upload gig (already built)
- `parse-job-post` -- for Job Posting gig (already built)
- `generate-outreach-message` -- for CV Upload WhatsApp message (already built)

### Storage

- CV files uploaded to `portfolio-uploads` bucket (existing)
- Job source images uploaded to `job-assets` bucket (existing)
- Content images uploaded to `feed-images` bucket (existing)

---

## Implementation Steps

### Step 1: Database
- Create `gig_share_logs` table with RLS

### Step 2: Category-Specific Form Components
- Build all 5 specialized form components
- Each reuses existing edge functions and storage buckets

### Step 3: Update GigSubmissionForm Router
- Replace the generic switch/case with imports of specialized forms

### Step 4: Enhanced Admin Review
- Update GigSubmissionsManager to render rich previews of submissions (parsed CV card, job preview card, share logs)
- Add one-click "Approve and Create Job" action for job posting submissions

### Step 5: Testing and Polish
- Verify CV parsing flow end-to-end
- Verify job parsing and preview
- Verify share tracking for job sharing gig

---

## What This Means for Admin Workflow

**Before**: Admin uploads CVs, parses them, generates WhatsApp messages, posts jobs, shares them across platforms, creates content -- all manually.

**After**: Seekers do all that work through Gigs (motivated by credits). Admin just opens the review queue and approves/rejects. The AI parsing, message generation, and sharing infrastructure is the same -- it just runs on the seeker side now.

