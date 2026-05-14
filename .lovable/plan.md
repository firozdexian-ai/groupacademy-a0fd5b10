## Phase HR-Z2 — Close-out audit for Team & Workforce

Re-audit of `/dashboard?tab=hr-*` after HR-Z1. Most fixes landed; three issues remain plus one missing piece I want to confirm before locking the group.

---

### ✅ What HR-Z1 already fixed
- **W2** — `useHrGraph` headcount rollup now reads `workforce_members.team_id` / `grade_id`, and the Deploy Member form actually sets them → Org Tree, Team headcount, and Grade Distribution bars now light up with real data.
- **W4** — `HrOnboardingTab` and `HrPayrollTab` now join `workforce_members.user_id → talents(full_name)` and the dropdowns filter to members where `user_id` is populated. (Backed by trigger that mirrors `talents.user_id` onto `workforce_members.user_id`.)
- **W5** — The `{/* Rest of dialog components remain the same */}` stub in WorkforceTab is gone.
- **W6** — All four `confirm()` calls in HrSimpleTabs replaced (file grew 474 → 552 LOC, consistent with AlertDialog refactor).
- **W8** — `useHrGraph` mutations are now defined statically (no factory anti-pattern).

---

### 🔴 Still open

**Z2-1 — Assign Talent dialog still ripped (was W1 partial).**
WorkforceTab row Action button (`Link2` icon) still calls `setAssignMemberId(m.id); setShowAssignDialog(true);`, but there is **no `<Dialog open={showAssignDialog}>` JSX in the file** (grep returned only the `showAddDialog` dialog). The Assign action is a dead click. State `assignMemberId` / `assignTalentSearch` / `assignTalentOptions` is wired but unused.

Fix: re-add the Assign Talent dialog (talent search input → results list → click row → `handleAssignTalent(talent.id)`). ~80 LOC.

**Z2-2 — TeamTab.tsx (550 LOC) is dead code.**
Not imported anywhere in `Dashboard.tsx` (the registry uses `HrSimpleTabs.HrTeamsTab` for `hr-teams`). Delete the file.

**Z2-3 — Workforce N+1 query storm (was W3).**
`WorkforceTab.fetchMembers` still issues 1 base query + 3 sub-queries per row (`talents`, `talent_assignments` count, `credit_transactions` sum). 100 members ≈ 300+ round-trips. Replace with a single `get_workforce_dashboard()` RPC returning the enriched rows + KPI rollups.

Migration:
```sql
create or replace function public.get_workforce_dashboard()
returns table (
  id uuid, talent_id uuid, role_type text, status text,
  city text, country text, hired_at timestamptz,
  team_id uuid, grade_id uuid,
  talent_name text, talent_email text,
  assigned_count bigint, commission_earned numeric
) language sql stable security definer set search_path = public as $$
  select w.id, w.talent_id, w.role_type::text, w.status,
         w.city, w.country, w.hired_at,
         w.team_id, w.grade_id,
         t.full_name, t.email,
         coalesce((select count(*) from talent_assignments ta where ta.assigned_to = w.id), 0),
         coalesce((select sum(amount) from credit_transactions ct
                   where ct.talent_id = w.talent_id and ct.transaction_type = 'commission'), 0)
  from workforce_members w
  left join talents t on t.id = w.talent_id
  order by w.created_at desc;
$$;
grant execute on function public.get_workforce_dashboard() to authenticated;
```

Hook rewrite swaps the loop for `supabase.rpc("get_workforce_dashboard")` and computes the 4 KPIs locally.

---

### 🟠 Stretch (same pass if approved)

**Z2-4 — Onboarding overdue grouping.** Tabs Pending / Overdue / Done with badge counts; "Overdue" derived from `due_date < today() and status <> 'done'`.

**Z2-5 — Payroll period grouping + CSV export.** Group runs by `to_char(period_end, 'YYYY-MM')`; "Export CSV" button serializes visible runs.

**Z2-6 — HrOverview KPI tiles clickable.** `Active Headcount` → `hr-workforce`, `Verticals/Functions/Teams` → respective subtab.

---

### 🟡 Defer (cosmetic / cross-cutting)

- W9/W11 already covered by Z2-4/Z2-5 above.
- W10 — Targets scope-aware picker (needs richer 3-step UI; defer to a Targets-only pass).
- W12 — Mobile table polish; cross-cutting sweep across all admin groups later.

---

### Files touched

```text
src/components/dashboard/hr/WorkforceTab.tsx              (~+80 LOC Assign dialog, ~-60 LOC fetch loop)
src/components/dashboard/hr/TeamTab.tsx                   DELETE  (550 LOC)
+ migration: get_workforce_dashboard()
[stretch]
src/components/dashboard/hr/HrOnboardingTab.tsx           (~+60 LOC tabs)
src/components/dashboard/hr/HrPayrollTab.tsx              (~+80 LOC groups + CSV)
src/components/dashboard/hr/HrOverviewTab.tsx             (~+10 LOC KPI nav)
mem://admin/groups-7-to-10-stakeholder-structure          (note HR-Z2 closure)
```

Approve "Z2 must-fix" for items 1–3, or "Z2 with stretch" to bundle 4–6 in the same pass. After that the HR group is locked and we move to **Group #8 GTM**.