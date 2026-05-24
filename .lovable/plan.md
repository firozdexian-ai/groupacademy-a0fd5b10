# Phase A10 — Admin Visual Polish

Soften the admin shell (`/dashboard/*`) so it matches the calmer, sentence-case tone we shipped across the talent app in A5–A8. Copy-only + class-level changes, no logic.

## Why this next
A9 fixed the *words* in admin but the *visual tone* is still "uppercase-italic-tracking-widest tech console" — clashing with the friendly talent UI. With launch close, admin needs to feel like the same product, not a different one.

## Scope (in)
1. **Header chrome** (`src/pages/Dashboard.tsx`, `src/platform/admin/chrome/*`)
   - Page title: drop `uppercase tracking-[0.2em] font-black` → `text-base font-semibold tracking-tight`.
   - Sidebar group labels + active states: sentence case, normal tracking.
   - Skeleton/error states: match talent app's soft empty-state style.

2. **Hub headers across ~16 domain groups**
   - Standard pattern: small icon + `text-2xl font-semibold` title + `text-sm text-muted-foreground` subtitle.
   - Kill `uppercase tracking-widest` on H1/H2 in hub tabs (Jobs, Gigs, Talent, Companies, Agents, IR, Institutions, Workforce, GTM, UGC, Learn, Abroad, Marketing, Finance, Platform).

3. **Tab triggers + section labels**
   - Remove uppercase on `TabsTrigger`, `CardTitle`, badge labels inside admin hubs.
   - Keep numeric KPI tiles bold but lose the all-caps eyebrow.

4. **Buttons + toasts**
   - Action buttons: sentence case ("Save changes", not "SAVE CHANGES").
   - Toast titles: sentence case, no terminal-prompt prefixes.

5. **Module-not-found fallback** in `Dashboard.tsx`
   - "Module Decryption Failed: ..." → "Unknown tab: ..." with a "Back to overview" button.

## Scope (out)
- No route changes, no `?tab=` slug renames, no business logic, RPCs, edge functions, or schema.
- No JSDoc/identifier sweep (separate low-priority phase).
- No redesign of data tables, dialogs, or color tokens — only typographic/casing tone.
- Gro10x and talent shells already done — untouched.

## Approach
1. **Audit** with `rg` for `uppercase`, `tracking-widest`, `tracking-\[0\.2em\]`, `font-black` inside `src/pages/Dashboard.tsx`, `src/platform/admin/**`, `src/domains/*/components/admin/**`, `src/shells/admin/**`.
2. **Tokenize**: introduce one helper (or just a documented Tailwind pattern) for `adminH1`, `adminH2`, `adminEyebrow` so future hubs stay consistent.
3. **Sweep by domain group** in this order (highest visibility first):
   - Dashboard chrome + sidebar
   - Jobs, Talent, Companies (biggest surfaces)
   - IR, Agents, Learn
   - Gigs, Abroad, Workforce, GTM, UGC, Institutions
   - Marketing, Finance, Platform/misc
4. **Verify** each group visually via preview after the sweep — no functional regressions expected since changes are class-level.

## Estimated surface
~60–90 files, mostly 1–5 class-string edits each. Two `sed`/script passes for the most common patterns (`uppercase tracking-widest` removal, `font-black` → `font-semibold` on headers) followed by hand-tuning the hub headers and the Dashboard shell.

## Open question
Keep the **sidebar group headers** (Talent, Companies, Agents…) in a subtle uppercase eyebrow for navigation hierarchy, or also flatten to sentence case? Default: keep them as small uppercase eyebrows (`text-[10px] uppercase tracking-wider text-muted-foreground/70`) since they aid scanning in a dense sidebar — this is the only place uppercase survives.

Approve and I'll start with Dashboard chrome + sidebar, then sweep domain by domain.
