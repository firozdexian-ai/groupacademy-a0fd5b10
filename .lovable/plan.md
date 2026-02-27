

# Profile Page Redesign -- LinkedIn-Style Layout

## Overview

Rebuild the Profile view page (`src/pages/app/Profile.tsx`) to match the wireframe. The page becomes a clean, section-by-section professional profile with inline edit/add capabilities per section, removing dashboard-style widgets that now live in the sidebar.

## Target Layout

```text
+---------------------------------------+
| <-  Profile               [Settings]  |
+---------------------------------------+
| [Cover Image / Gradient Banner]       |
|                                       |
|  [Avatar]                             |
|  FIROZ UDDIN AHMED                    |
|  Headline                             |
|  Current Position                     |
|  Education | Location                 |
|  Contact Info              [Edit btn] |
+---------------------------------------+
| Profile Completion: 72%               |
| Suggested: Add skills, Upload CV...   |
+---------------------------------------+
| About                      [Edit]     |
| "Summary text..."                     |
+---------------------------------------+
| Experience (3)        [Add] [Edit]    |
| [icon] Designation                    |
|        Company - Full-Time            |
|        Jan 2020 - Present             |
|        Location                       |
+---------------------------------------+
| Education (2)         [Add] [Edit]    |
| [icon] Degree                         |
|        Institution                    |
|        2016 - 2020                    |
+---------------------------------------+
| Skills (12)           [Add] [Edit]    |
| [badge] [badge] [badge] ...          |
+---------------------------------------+
| Honors & Awards (1)  [Add] [Edit]    |
| Award Name - Issuer - Date           |
+---------------------------------------+
| Languages             [Add] [Edit]    |
| English - Fluent                      |
| Bangla - Native                       |
+---------------------------------------+
```

## What Gets Removed

These elements exist on the current Profile page but are now redundant (moved to sidebar or unnecessary):

1. **Credits card** (floating) -- already accessible via sidebar "Transactions"
2. **Quick Actions 2x2 grid** (My Learning, Saved Jobs, Applications, Edit Profile) -- all in sidebar now
3. **CV upload/status card** -- belongs on Edit page only, not the view page
4. **Service History card** -- accessible via sidebar or dedicated page
5. **Application History card** -- accessible via sidebar "Applications"
6. **Sign Out button** -- already in sidebar

## What Gets Added

### 1. Cover Image / Background Banner
- A gradient banner area at the top (default: brand gradient)
- Future: allow user to upload a custom cover image (placeholder for now)

### 2. Enhanced Profile Card
- Larger, more detailed info display: Name, Headline/Profession, Current Position (from latest experience), Education (from latest education), Location (from country), Contact info (email + phone)
- Single Edit button (pencil icon) that navigates to ProfileEdit for basic info only

### 3. Settings Icon in Header
- A gear/settings icon in the top-right of the header bar
- For now, links to ProfileEdit (or a future Account Preferences page)

### 4. Section Counts
- Each section header shows the count: "Experience (3)", "Skills (12)", etc.

### 5. Per-Section Edit and Add Buttons
- Each section gets its own Edit (pencil) and Add (plus) buttons
- These navigate to ProfileEdit with a hash/scroll target: `/app/profile/edit#experience`

### 6. Honors and Awards Section (New)
- New section displaying achievements/awards from `talent.achievements` (already exists in the database schema)
- Shows: Award name, issuer/organization, date

### 7. Languages Section (New)
- New section for language proficiency
- This will require a new field in the professionals table (`languages` jsonb array)
- Each entry: language name + proficiency level (Native, Fluent, Intermediate, Basic)

## Database Changes

A single migration to add a `languages` column to the `professionals` table:

```sql
ALTER TABLE public.professionals
ADD COLUMN IF NOT EXISTS languages jsonb DEFAULT '[]'::jsonb;
```

## File Changes

### `src/pages/app/Profile.tsx` (Major Rewrite)
- Remove: Credits card, Quick Actions grid, CV status card, ServiceHistoryCard, ApplicationHistoryCard, Sign Out button
- Restructure: Cover banner at top, enhanced profile card beneath, then vertical sections
- Add: Honors/Awards section rendering from `talent.achievements`
- Add: Languages section rendering from new `talent.languages` field
- Add: Item counts on all section headers
- Add: Per-section Edit + Add buttons (linking to ProfileEdit with hash anchors)
- Add: Settings icon in header

### `src/pages/app/ProfileEdit.tsx` (Minor Updates)
- Add: Languages editor section (similar pattern to SkillsEditor)
- Add: Honors/Awards editor section
- Add: Scroll-to-section logic to handle hash anchors from Profile page

### `src/contexts/TalentContext.tsx` (Minor Update)
- Ensure `languages` and `achievements` fields are included in the TalentProfile type and data fetching

## Technical Notes

- The Edit and Add buttons per section will navigate to `/app/profile/edit#experience` (etc.), and the ProfileEdit page will use `useEffect` with `location.hash` to auto-scroll to the relevant section
- Honors/Awards will read from the existing `achievements` jsonb column in professionals
- Languages requires a new `languages` jsonb column (migration included above)
- The cover image feature will be a gradient placeholder for now, with the upload capability deferred to a follow-up task
- No changes to the bottom nav bar or sidebar -- those remain as recently redesigned

