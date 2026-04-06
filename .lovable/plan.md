

# Platform Data Hygiene, Jobs Dashboard Fixes & Credit Economy Redesign

This plan addresses five interconnected areas: Jobs Manager filters, Jobs KPI accuracy, country/profession standardization, job recommendation locality, and a per-response credit model for AI agents.

---

## Part 1: Jobs Manager — Fix Location Filter Counts & Add Application Type Filter

**Problem**: Country counts next to location filter items are incorrect because the Supabase query fetching `location` data is capped at 1,000 rows (default limit), but the platform has 4,500+ jobs. Additionally, there's no way to filter by application type (LinkedIn/link, email, internal).

**Fix**:
1. **Country counts query** — Change `supabase.from("jobs").select("location")` to use `select("location", { count: "exact" })` with batch pagination (fetch in 1,000-row chunks) or use a head count approach per country. The simplest fix: fetch ALL locations by paginating in a loop (1,000 rows at a time) before computing counts.
2. **Application Type filter** — Add a new `appTypeFilter` state (`all | link | email | internal`) with a dropdown next to the existing filters. Apply `.eq("application_type", filter)` to both the jobs query and cascading filter queries.

**Files changed**: `src/components/dashboard/JobsManager.tsx`

---

## Part 2: Jobs KPI Dashboard — Fix Stagnant Numbers & Add Country Breakdown

**Problem**: KPI numbers like "total job posts" only show current month's jobs (capped at 1,000 rows). The dashboard lacks country-wise active job distribution.

**Fixes**:
1. **Total Jobs (all-time)** — Add a new query: `select("id", { count: "exact", head: true })` without date filter for the true total count. Display as a new "Total Jobs" KPI card.
2. **Live Jobs accuracy** — Already uses `count: "exact", head: true` so should be correct. Verify and keep.
3. **This-month jobs hitting 1,000 limit** — The current query fetches full rows for this month. If there are >1,000 jobs/month, use `head: true` count + separate daily data query. For now, add pagination loop.
4. **Country-wise active jobs** — Add a new section: fetch all active job locations (paginated), compute country counts using the same alias logic from JobsManager, display as a horizontal bar chart or ranked list.
5. **General improvements** — Add "Total All-Time Jobs" card, "Total Companies" card, and a country distribution chart.

**Files changed**: `src/components/dashboard/JobsKPIDashboard.tsx`

---

## Part 3: Country & Profession Standardization

**Problem**: Country data is inconsistent (e.g., "BD" vs "Bangladesh", "UAE" vs "United Arab Emirates"). Professions assigned to talents don't match the `profession_categories` table.

**Approach**:
1. **Country standardization** — Create a database migration adding a `normalize_country()` function that maps common aliases (BD→Bangladesh, US→United States, UAE→United Arab Emirates, UK→United Kingdom, IN→India, etc.) to canonical names. Run a one-time data update (via insert tool) to normalize existing `talents.country` and `jobs.location` country segments.
2. **Add a trigger** on the `talents` table to auto-normalize country on insert/update.
3. **Profession alignment** — The `talents` table has `profession_category_id` (FK to `profession_categories`). For bulk-uploaded talents where this is NULL or incorrect, create an edge function or script that uses AI to match `custom_profession` text to the closest `profession_categories.name` and sets the FK. For new registrations, ensure onboarding collects profession from the existing dropdown.

**Files changed**: New migration SQL, `src/components/onboarding/OnboardingWizard.tsx` (ensure profession step)

---

## Part 4: Job Recommendations — Prioritize User's Country

**Problem**: The `suggest-jobs-for-talent` edge function doesn't consider the user's location, so recommendations include irrelevant international jobs.

**Fix**: In the edge function:
1. Fetch the talent's `country` field alongside the existing profile data.
2. In Stage 1 (keyword pre-filtering), add a location-prioritized query: first fetch jobs matching the talent's country (up to 100), then fill remaining slots with international jobs.
3. In Stage 2 (AI prompt), add explicit instruction: "Strongly prefer jobs in or near {talent_country}. Only rank international jobs highly if they are remote or an exceptional skill match."

**Files changed**: `supabase/functions/suggest-jobs-for-talent/index.ts`

---

## Part 5: Per-Response Credit Model for AI Agents

**Problem**: Current model charges 10 credits for a 30-minute session, which is rigid and doesn't scale for different agent types (e.g., image generation agents cost more compute).

**New Model**:
1. **Per-response charging** — Instead of deducting credits at session start, deduct a fractional amount per AI response. Store per-agent cost in the existing `ai_agents.credit_cost` field (e.g., 1 credit/response for text, 5 for image generation).
2. **Fractional credits** — Change `talent_credits.balance` and related columns from `integer` to `numeric(10,1)` to support one decimal place. Update the `deduct_credits` RPC to accept numeric amounts.
3. **Remove session time limits** — Drop `session_expires_at` enforcement. Keep a single continuous conversation per agent (no new session creation each time). The `useAgentChat` hook will deduct credits after each successful AI response rather than upfront.
4. **AI General = 0 credits** — Set `credit_cost = 0` for the general AI chat agent.
5. **Update UI** — Remove countdown timer, show running credit cost in chat. Update `CreditPurchaseSheet` and agent cards to reflect per-response pricing.

**Files changed**:
- New migration: alter `talent_credits.balance` to numeric, alter `credit_transactions.amount` to numeric, update `deduct_credits` RPC
- `src/hooks/useAgentChat.ts` — Remove session timer, add per-response deduction
- `src/components/ai-agents/AgentChatDialog.tsx` — Remove timer UI, show per-message cost
- `src/lib/creditPricing.ts` — Update AI_AGENT_CHAT cost description
- `supabase/functions/ai-agent-chat/index.ts` — Remove session validation if present

---

## Implementation Order

1. **Part 1** — Jobs Manager filter fixes (highest friction, quick win)
2. **Part 2** — Jobs KPI dashboard accuracy + country chart
3. **Part 3** — Country & profession standardization (data foundation)
4. **Part 4** — Job recommendation locality (depends on Part 3)
5. **Part 5** — Per-response credit economy (largest scope, most critical for scaling)

---

## Technical Details

- All Supabase queries fetching more than 1,000 rows will use pagination loops (`range(0,999)`, `range(1000,1999)`, etc.) until no more rows are returned.
- Country normalization mapping will cover: BD→Bangladesh, IN→India, US/USA→United States, UK/GB→United Kingdom, AE/UAE→United Arab Emirates, SA→Saudi Arabia, plus all codes from the existing `COUNTRIES` constant.
- The `numeric(10,1)` migration for credits preserves all existing integer balances (1 → 1.0) with zero data loss.
- Per-response deduction uses the existing `deduct_credits` RPC (modified for numeric), keeping atomic transaction safety.

