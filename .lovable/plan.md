

# Professions Manager — Consolidated Improvement Plan

## What You Asked For

1. Show **conversation count** for each AI Instructor (from `ai_chat_sessions` table)
2. Make each **Profession Line credit-gated** (e.g., 200 credits to enter) and show **total credits** (entry + sum of course credits) on seeker side
3. Show which **Profession Lines have no AI Instructor** (visual indicator)
4. **Filter AI Instructors** by Academy and School (not just Profession Line)
5. Previous audit items: KPI cards, AlertDialog deletes, mobile fixes, search, auto-slug, content counts

---

## Plan

### A. Database Migration

Add `credit_cost` column to `profession_categories` table (default 0, nullable integer) to enable per-profession-line credit gating.

```sql
ALTER TABLE public.profession_categories
ADD COLUMN credit_cost integer DEFAULT 0;
```

### B. KPI Cards (top of page)

4 stat cards: Academies, Schools, Profession Lines, AI Instructors — each showing total count and active count. Additionally show:
- Profession Lines without AI Instructor count (warning indicator)

### C. AI Instructor Conversation Counts

Query `ai_chat_sessions` grouped by `ai_instructor_id` to get session counts. Display as a badge on each instructor card (e.g., "42 conversations").

### D. Profession Line Enhancements

- **Credit cost field** in the Profession Line create/edit dialog (new `credit_cost` input)
- **"No Instructor" warning badge** on profession lines that have zero instructors (already partially shown — upgrade to a red warning badge)
- **Course count + total credits** badge: Query `content` by `profession_line_id` to show "X courses · Y total credits" on each profession card. Total credits = profession `credit_cost` + sum of course `credit_cost` values.

### E. AI Instructors — Academy & School Filters

Replace the single "Filter by Profession Line" dropdown with a cascading filter:
1. Filter by Academy → narrows School options
2. Filter by School → narrows Profession Line options
3. Filter by Profession Line (existing)

This lets admin view all instructors under an Academy or School.

### F. Seeker Side (AppProfessionDetail)

Show **total credit cost** for the profession line: entry fee + sum of all course credits. Display prominently as "Total: X credits" so seekers know the full investment.

### G. UX Fixes (from previous audit)

- Replace all `confirm()` calls with `AlertDialog`
- Add `flex-wrap` on TabsList for mobile
- Dialog grids: `grid-cols-1 sm:grid-cols-2`
- Auto-slug generation from name field
- Search input above tabs (client-side filter by name)
- Empty state for Academies tab

---

## Files to Change

| File | Change |
|------|--------|
| **Migration** | Add `credit_cost` column to `profession_categories` |
| `src/components/dashboard/ProfessionsManager.tsx` | KPI cards, conversation counts, credit cost field, cascading instructor filters, no-instructor warnings, course/credit counts, AlertDialog deletes, mobile fixes, search, auto-slug |
| `src/pages/app/AppProfessionDetail.tsx` | Show total credit cost (entry + courses) |

