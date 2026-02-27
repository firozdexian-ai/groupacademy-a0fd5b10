

# Sidebar Redesign -- Profile & Settings Panel

## Overview

Rebuild the mobile sidebar (Sheet) in `TalentAppShell.tsx` to match the wireframe. The sidebar becomes a comprehensive "Profile & Settings" hub with all quick-access links a seeker needs.

## Target Layout

```text
+---------------------------------------+
| <- Profile & Settings        [logo]   |
+---------------------------------------+
| [Avatar] Name              [Edit btn] |
| [flag]   +880 1700 0000               |
|          email@example.com            |
+---------------------------------------+
| Transactions                     >    |
| Disbursement Account             >    |
| Saved Jobs                       >    |
| My Learning                      >    |
| Applications                     >    |
| Download CV                      >    |
| Profile Verification             >    |
| Customer Service                 >    |
| Learn About Academy              >    |
| Refer App                        >    |
| Language                         >    |
| Theme                      [toggle]   |
+---------------------------------------+
|           [Logout]                    |
+---------------------------------------+
```

## Changes

### File: `src/layouts/TalentAppShell.tsx`

**1. Sidebar Header**
- Replace the current avatar+name header with a top bar containing:
  - A back arrow (closes the sheet)
  - "Profile & Settings" title
  - The GroUp Academy logo (from existing `logo-icon.png`)

**2. Profile Card Section**
- Show a larger avatar with the user's profile photo
- Display full name, phone number, and email
- Add an Edit button (pencil icon) that navigates to `/app/profile/edit`
- Country flag (if available from talent data; otherwise skip for now)

**3. Menu Items**
Replace the current nav items with a comprehensive vertical list:

| Menu Item | Icon | Route / Action |
|-----------|------|----------------|
| Transactions | `Receipt` | `/app/profile` (credits section -- reuse existing) |
| Disbursement Account | `Wallet` | `/app/profile` (placeholder for now) |
| Saved Jobs | `Bookmark` | `/app/saved` |
| My Learning | `BookOpen` | `/app/learning/my-courses` |
| Applications | `FileText` | `/app/applications` |
| Download CV | `Download` | Trigger CV download (if CV exists) or show toast |
| Profile Verification | `ShieldCheck` | `/app/profile/edit` (scrolls to verification) |
| Customer Service | `HelpCircle` | Opens WhatsApp support link |
| Learn About Academy | `Info` | Opens academy website or `/` landing |
| Refer App | `Share2` | Opens native share or copies referral link |
| Language | `Globe` | Placeholder (shows "English" for now) |
| Theme | `Sun`/`Moon` | Toggle dark/light (existing logic) |

**4. Footer**
- Keep the Logout button at the bottom, styled consistently

### What stays the same
- The desktop top bar and dropdown menu remain unchanged
- The mobile bottom navigation bar stays as is
- All existing routes and navigation logic are preserved
- The `Sheet` component from shadcn/ui is reused

### What gets removed from the sidebar
- The "Credits Balance" card (replaced by "Transactions" menu item)
- The "View Profile" button (replaced by Edit button in the profile card)
- The 5 main nav items (Home/Jobs/etc.) -- these are already in the bottom tab bar, so they don't need to be duplicated in the sidebar

### Notes on placeholder items
- **Transactions** and **Disbursement Account**: These will navigate to the profile page for now. Full transaction history can be built later.
- **Language**: Will show "English" as the only option. Multi-language support is a future feature.
- **Refer App**: Will use the Web Share API (`navigator.share`) if available, otherwise copy a referral link to clipboard.
- **Profile Verification**: Links to profile edit page for now.

## Technical Details

All changes are contained within a single file: `src/layouts/TalentAppShell.tsx`. The sidebar `SheetContent` (lines 111-163) will be fully rewritten with the new structure. New icons imported from `lucide-react`: `Receipt`, `Wallet`, `Download`, `ShieldCheck`, `Info`, `Share2`, `Globe`, `ChevronRight`, `ArrowLeft`, `Edit2`.

The download CV action will reuse the existing `downloadFile` utility from `@/lib/downloadFile`.

