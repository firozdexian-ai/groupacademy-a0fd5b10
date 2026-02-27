

# Jobs Hub Redesign -- Tab-Based Navigation

## Overview

Replace the current single-scroll layout with a **4-tab navigation** at the top. Each tab renders its own content view. Remove the "Find Your Dream Job" search hero card and the Saved/Applied/Preferences pill buttons.

## Top Navigation Bar

Four equally-spaced icon tabs at the top of the page, styled as a horizontal icon bar (similar to how many mobile apps do category tabs):

```text
[ Sparkles ]   [ Layers ]     [ Building2 ]   [ Globe ]
  For You     Collection      By Company     By Country
```

- Active tab gets primary color + underline/highlight
- Inactive tabs are muted

## Tab Content

### Tab 1: "For You" (default)
Keep existing content minus the removed sections:
- Featured Jobs carousel
- AI Recommendations button + results
- Recommended for You list
- Promoted / Expiring Soon carousel
- Recent Applications

### Tab 2: "Job Collection"
- Browse by Type pills (existing `JOB_COLLECTIONS`)
- Full list of job type categories as cards/grid instead of just pills

### Tab 3: "By Company"
- The existing company avatars section, but as full page content
- Grid layout (3 columns) of company cards with logos + job counts
- Clicking a company shows filtered jobs

### Tab 4: "By Country"
- The existing country cards section, but as full page content
- Grid layout of location cards with job counts
- Clicking a location shows filtered jobs

## Removals
- "Find Your Dream Job" search hero section (lines 385-403)
- Saved / Applied / Preferences pills (lines 406-444)

## Technical Approach

**Single file change**: `src/pages/app/JobsHub.tsx`

1. Add `activeTab` state with values: `"for-you" | "collection" | "company" | "country"`
2. Render a tab bar at the top using icon buttons
3. Conditionally render content based on `activeTab`
4. Move "Job by Company" and "Job by Country" sections from inline scroll to dedicated grid views in their respective tabs
5. Move "Browse by Type" into the "Collection" tab as a grid layout
6. Remove the search hero and quick-access pills entirely

