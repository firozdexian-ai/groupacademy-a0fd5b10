
# Gro10x Closeout Plan

A focused audit of every Gro10x file. Below are the issues found, grouped by severity, and the concrete fixes I'll make. Nothing here adds new features — it tightens what exists so we can confidently move to the admin panel.

---

## A. Bugs (must-fix)

### A1. Stale agent keys in `GOAL_TO_AGENTS` — broken inbox seeding
`src/gro10x/lib/tokens.ts` maps goals to agent keys that don't exist in `src/gro10x/lib/agents.ts`:
- `freelance` → `escrow` (not registered)
- `sell_b2b` → `outreach_writer` (registered key is `outreach`)
- `train` → `curriculum`, `cohort_manager`, `progress_tracker` (none registered)

Effect: when a new B2B user picks Sell-to-companies / Find freelancers / Train my team during Riya signup, their inbox seeds with rows that render as the generic 🤖 fallback and a key with no chat behavior.

Fix: rewrite the map to use only registered keys:
- `hire`: `recruiter`, `sourcer`, `outreach`
- `freelance`: `gig_finder`, `briefing`
- `sell_b2b`: `lead_hunter`, `outreach`, `crm`, `sales`
- `train`: `concierge` (until training agents land — keeps inbox sane)
- `ops`: `billing`, `ops`, `calendar`
- `explore`: `concierge`

### A2. `Gro10xCompanyPage` infinite "Loading company…" when not signed in
`load()` early-returns when there's no `companyId` but only after the auth-aware branch. If a logged-out user opens `/gro10x/page/:companyId`, the membership lookup branch is skipped and it falls through correctly — but for a logged-in user with no membership the page sits on "Loading company…" because `setLoading(false)` is reached only after the company fetch (which is skipped). Confirmed by the session replay: "Loading company…" reappears after the empty-state flashes.

Fix: when `!companyId`, set `loading=false` and render the existing "not connected" empty state immediately. Also re-run `load` only when auth resolves (currently runs once with `user=null` → never re-runs).

### A3. `Gro10xChat.bumpThread` records the wrong "last message"
`handleSend` reads `messages[messages.length - 1]` synchronously after `await sendMessage(text)`. Because the assistant reply streams asynchronously, this almost always captures the user's own message (or stale state). The inbox preview then mirrors what the user typed, not what the agent answered.

Fix: subscribe to `messages` length via `useEffect` and bump only when the last message is `role==="assistant"` and streaming has stopped.

### A4. `Gro10xBilling` country fetch runs every render
`if (user && country === null) void supabase.from(...).then(...)` lives in render scope. It triggers a query on every render until state updates, and risks setState-during-render warnings.

Fix: move to a `useEffect` keyed on `user?.id`.

### A5. `Gro10xFeed` realtime missing
Drafts and feed posts both refetch only on mount. A user publishing from the agent thread won't see the draft disappear until they revisit. Lightweight fix: subscribe to `feed_posts` and `company_post_drafts` filtered by `company_id` and refetch on insert/update.

### A6. `pinAgent` returns the upserted row even when it isn't pinned
The upsert sets `pinned: true` unconditionally. If a previously discarded thread exists with `pinned=false` and unread messages, this silently re-pins it (intended) but also resets nothing else (fine). However, `pinAgent` then calls `refresh()` and returns `data` from the first await — there's a brief race where the inbox renders before `refresh` finishes. Cosmetic; leaving as-is unless reported.

---

## B. Refactors (cleanups, no behavior change)

### B1. Replace ad-hoc `company_members` lookups with `useActiveCompany`
The same query is hand-rolled in: `Gro10xCompanyPage`, `Gro10xFeed`, `Gro10xMe`, `Gro10xTopBar`, `Gro10xCompanyCredits`, `work/Gro10xJobsList`. Five copies, slightly different filters (`order created_at`, `limit 1`, `maybeSingle`). Migrate everything to the existing `useActiveCompany` hook so caching, role, and companyId stay consistent. Saves ~80 lines and removes drift between pages.

### B2. Extract `Gro10xPageGate` wrapper
Six pages reproduce the same "not signed in / no company" gating UI (Inbox, Work, CRM, Offerings, Chat, Me). Extract a single `<Gro10xPageGate requireCompany>` component that renders the gates and slots the page content. Cuts ~150 lines, ensures consistent CTA copy and design.

### B3. Centralize agent-key fallback
`AGENT_BY_KEY[k] ?? { name: k, desc: "AI agent", emoji: "🤖" }` is repeated in Inbox and Chat. Move to a `getAgentMeta(key)` helper in `agents.ts`.

### B4. Drop dead route `/gro10x/notifications`
The bottom nav and top bar both removed the bell. `Gro10xNotifications.tsx` is still mounted but unreachable from anywhere in the shell. Either remove the file + route, or wire it up from Atlas (concierge) replies. Plan: delete the file and route; notifications surface inside the Atlas thread by design.

### B5. `Gro10xWelcome` is a placeholder
Says "Two starter agents are pinned" but the seeding logic actually pins per-goal. Update the copy to reference the user's selected goals so it reflects reality, and add a single CTA button (currently has two competing primary actions cosmetically).

---

## C. UI polish (mobile-first, vertical-only, brand consistency)

### C1. TopBar credit pill — clarify "co. credits" vs personal
Members see their personal+bonus pool but the label still reads "credits" with no indication of pool. Add a tiny prefix:
- Owner/Admin: `🪙 1,200  Company`
- Member: `🪙 250  My credits` and on tap show breakdown (free / bonus / earned) in a small popover instead of just a tooltip.

### C2. Bottom nav active state needs more contrast on small phones
Active tab uses `text-[#33E1E4]` only. Add a 2px top accent bar on the active item for instant glanceability — matches the talent app's own bottom nav.

### C3. Company page: collapsing banner + sticky header
At 390px the banner takes 130px before any content appears. On scroll, collapse banner to 56px and pin the company name + logo. Pure CSS (`sticky top-0` + intersection-driven shrink) — no new deps.

### C4. Offerings card density
Each offering card currently has 3 stacked text rows + price + tags. On a 390px viewport that's ~110px tall. Drop the description to a single line clamp, move price inline next to name, drop tag pills below 24px. Targets ~72px per row — twice as many visible without scroll.

### C5. CRM stage chips overflow on small phones
Six stages in a horizontal scroll work, but the count badge `(3)` pushes the chip past 86px. Compress label to first letter + count when overflow detected, or wrap to two rows when ≥5 chips have non-zero counts.

### C6. Feed audience toggle position
Network/Internal pill is below the header text but above the composer — on a phone it adds an extra ~36px before the user sees content. Move it inline with the header (right-aligned), saving vertical space.

### C7. Chat footer collides with bottom nav
`footer` uses `sticky bottom-[calc(64px+env(safe-area-inset-bottom))]` but the chat route has its own header and the bottom nav still renders on `/gro10x/c/:agentKey`. Either hide the bottom nav for chat routes (better) or remove the offset (redundant with shell padding). Plan: hide bottom nav in chat (`hideBottomNav` prop already exists on `Gro10xAppShell`, just thread it via a `useMatch` check).

### C8. Standardize loading states
Mix of "Loading…", "Loading inbox…", spinner-only, and skeleton-less placeholders. Adopt the spinner-with-text pattern used in `work/Gro10xShortlist` everywhere via a small `<Gro10xLoading label />` component.

### C9. Brand color consistency check
Tech Blue `#2A7DDE` from project memory is never used in Gro10x — the shell goes all-in on Vibrant Cyan `#33E1E4` and Success Green `#10D576`. That's intentional for visual differentiation but verify with the user. If kept, document as a Gro10x-specific design rule in memory.

### C10. Minor accessibility
- Bottom-nav buttons missing `aria-current="page"` on active.
- Composer textarea in Feed has no `aria-label`.
- Modals (`NewLeadSheet`, `LeadDetail`, `OfferingEditor`) trap focus only by chance — add `role="dialog"` and `aria-modal="true"`, plus Esc-to-close.

---

## D. Out-of-scope follow-ups (flag, do not build now)

- **Company tracks (multi-course paths)** — placeholder card on Learn. Backend table not designed yet; punt to the admin-panel work where curated tracks live.
- **Offering → Sales-agent grounding** — the `v_company_sales_context` view exists, but no agent currently reads it. Wire when we touch the Sales agent prompts in the agent-tooling phase.
- **Activity feed for CRM contacts** — currently we record notes but never auto-log emails, calls, or stage changes. Worth a dedicated pass.
- **Welcome wizard** — `Gro10xWelcome` is still a stub. Step-by-step onboarding (profile → invites → agents) is a separate feature.

---

## Execution order

1. Bug fixes (A1–A5) — single migration-free pass, fast.
2. Refactors (B1–B4) — extract shared hook + gate, delete dead route.
3. UI polish (C1–C10) — do C7, C2, C5, C6, C10 first (highest user-visible impact); then density tweaks.
4. Update memory with confirmed brand color decision.
5. Ready for admin-panel work.

No DB migrations, no new dependencies. Fully reversible.

Approve and I'll execute in build mode.
