## Phase INST-Z2 — Re-Audit of Institutions & Organizations

INST-Z1 fixed real bugs (edit, RPC rollups, club_id wiring, AlertDialog, status filter, event temporal tabs). But during the rewrite we **ripped a chunk of user-facing fields** and shipped one fresh crash. Here's what's still wrong.

---

### 🔴 Regressions — fields ripped during INST-Z1

**R1. StakeholderRegistry dialog lost 6 fields.**
DB columns exist (and are queried back into the row type), but the form only edits **name / type / status**. Missing:
- `country` (also breaks the `normalize_country_name` trigger value chain)
- `website`
- `contact_name`
- `contact_email`
- `contact_phone`
- `notes`

Effect: any institution / partner org created from the current UI has no contact info, no country, no website. Pre-Z1 these were editable.

**R2. Stakeholder card hides those same fields.**
Cards show name, type, country, status — but never `website` or any contact field. Even rows imported externally look empty.

**R3. Child-registry cards under-display data.**
- Reps: never shows `role / email / phone / club_id`.
- Clubs: never shows `department / notes`.
- Events: never shows `location / url / ends_at / status`.

**R4. Events form missing `url` field.** Column exists in `institution_events` but not in `OrgEventsManager.fields`.

---

### 🔴 Fresh bug introduced in INST-Z1

**B4. Empty-string `SelectItem` crashes Radix.**
`InstitutionChildRegistry.tsx:351`:
```tsx
<SelectItem value="">NO SPECIFIC CLUB</SelectItem>
```
Radix throws "A `<Select.Item />` must have a value prop that is not an empty string." Opening the rep dialog crashes the tab. Use sentinel `"__none__"` and map to `null` on save.

**B5. Clearing club_id never persists `null`.**
Combined with B4 there is no way to unset a club association after one is set.

**B6. RPC return cast as `any`.**
Not a runtime bug, but `get_institution_rollups` isn't in `types.ts` yet. Drop the `(supabase as any)` cast in `StakeholderRegistry.tsx:107` once types regenerate.

---

### 🟠 Polish gaps still open

- **P1.** Overview still does 4 client `count(*)` queries. Defer to a future RPC pass with leaderboard.
- **P5.** No empty state on either registry — blank grid when no rows.
- **D2.** `badgeKey="status"` set on `ClubsManager` but clubs has no status column — cosmetic dead path.

---

### ✅ What's correct now (don't touch)

B1/B2 edit handlers, B3 rollup RPC, O1 club_id Select, P2 status filter, P3 AlertDialog, P4 Upcoming/Past tabs, D1 dead-hook removal (already done in `useInstitutionGraph.ts`).

---

### Phase INST-Z2 work

**Must-fix (this pass):**
1. **R1** — Restore the 6 fields in StakeholderRegistry dialog. Layout as Identity / Contact / Notes blocks; keep brutalist styling.
2. **R2** — Surface `website` + `contact_email` (small mono row) on the stakeholder card.
3. **R3 + R4** — Add missing fields to child-registry cards (role/email/phone for reps, department for clubs, location/status/url for events) and add `url` to event form.
4. **B4 + B5** — Replace `SelectItem value=""` with `"__none__"` sentinel; convert to `null` in save payload; allow clearing.
5. **P5** — Empty-state card on both registries.
6. **D2** — Drop unused `badgeKey` on `ClubsManager`.

**Defer:**
- P1 (overview RPC + leaderboard).
- B6 (drop `as any` once types regenerate).
- CSV import / export.
- Splitting StakeholderRegistry (419 LOC) and InstitutionChildRegistry (503 LOC).

---

### Files touched

```text
src/components/dashboard/institutions/StakeholderRegistry.tsx       (~+80 LOC)
src/components/dashboard/institutions/InstitutionChildRegistry.tsx  (~+50 LOC)
mem://admin/institutions-stakeholder-structure                      (note Z2 closure)
```

No DB migrations — schema already supports everything; we're just re-exposing existing columns.

After Z2 ships, Institutions is locked. Next group up: **Group #7 Workforce** (per `mem://admin/groups-7-to-10-stakeholder-structure`).

Approve and I'll execute Z2 in a single pass.