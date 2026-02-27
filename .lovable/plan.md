

# Platform Improvement Areas

After a thorough audit of the codebase, here are the most impactful improvement opportunities organized by priority.

---

## 1. Security -- Overly Permissive RLS Policies (HIGH PRIORITY)

The database linter found **11 RLS policies using `USING (true)` or `WITH CHECK (true)`** on INSERT/UPDATE/DELETE operations. This means anyone with the anon key can modify data in those tables without authentication checks.

**Fix**: Audit each permissive policy and restrict to `auth.uid()` or role-based checks. This is critical for data integrity.

---

## 2. Jobs Page -- Missing Pagination (HIGH PRIORITY)

`AppJobs.tsx` fetches ALL active jobs in a single query with no `.limit()`. With 2,600+ jobs, this loads everything into memory at once. The default Supabase limit of 1,000 rows means users may not even see all jobs.

**Fix**: Add server-side pagination (e.g., 50 jobs per page) with a "Load More" button or infinite scroll.

---

## 3. Search -- Limited to Jobs Only (MEDIUM)

The global search bar in `TalentAppShell.tsx` only redirects to `/app/jobs/all?search=...`. Users cannot search courses, blog posts, agents, or gigs from the top bar.

**Fix**: Implement a unified search that shows results across jobs, courses, blog posts, and events -- or at minimum add a search scope selector.

---

## 4. Mobile Search -- Non-functional (MEDIUM)

The mobile search icon in `TalentAppShell.tsx` (line 109) is a button that does nothing -- no `onClick` handler. Mobile users cannot search at all.

**Fix**: Wire it to open a search overlay or navigate to a search page.

---

## 5. Notifications -- No Real-time Updates (MEDIUM)

`TalentAppShell.tsx` fetches unread notification count once on mount and never updates. Users must refresh the page to see new notifications.

**Fix**: Subscribe to the notifications table via Supabase Realtime to update the badge count live.

---

## 6. Feed -- No Infinite Scroll / Pagination (MEDIUM)

The Feed page loads items once and shows a "Load More" button that just calls `refresh()` (reloads the same data). There's no actual pagination -- users always see the same set of items.

**Fix**: Implement cursor-based pagination so "Load More" actually fetches older content.

---

## 7. Profile -- No Phone Number Display (LOW)

The Profile page shows email but not the user's phone number, even though phone is collected during signup and stored in the talents table.

**Fix**: Add phone display in the profile header alongside email.

---

## 8. Dark Mode Toggle -- Missing from App Shell (LOW)

The landing page Navbar has a dark/light theme toggle, but the in-app `TalentAppShell` has no way to switch themes. Users are stuck with whatever theme they had before logging in.

**Fix**: Add a theme toggle to the profile dropdown menu or settings page.

---

## 9. Error Boundary -- No Error Reporting (LOW)

`ErrorBoundary.tsx` only logs to console. There's an `errorTracking.ts` utility with a `trackError` function ready for integration but it's not connected to the ErrorBoundary.

**Fix**: Call `trackError` from `componentDidCatch` so errors are consistently tracked.

---

## 10. Help Center -- Dead Link (LOW)

In the profile dropdown (TalentAppShell line 176), "Help Center" is a `DropdownMenuItem` with no `onClick` handler -- clicking it does nothing.

**Fix**: Link it to a help page, FAQ, or external support channel.

---

## Summary by Priority

| Priority | Area | Impact |
|----------|------|--------|
| HIGH | RLS policy security audit | Data protection |
| HIGH | Jobs pagination | Performance, data completeness |
| MEDIUM | Unified search | User experience |
| MEDIUM | Mobile search fix | Mobile usability |
| MEDIUM | Real-time notifications | Engagement |
| MEDIUM | Feed pagination | Content discovery |
| LOW | Phone on profile | Completeness |
| LOW | Dark mode in-app | User preference |
| LOW | Error tracking integration | Debugging |
| LOW | Help Center link | Support |

I'd recommend tackling the **security (RLS)** and **jobs pagination** issues first, then moving to the UX improvements. Which areas would you like me to work on?

