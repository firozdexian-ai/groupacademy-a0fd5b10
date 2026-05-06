# Phase 4 — Completion Report

Phase 4 is fully shipped. All eight sub-phases landed end-to-end (schema → RPCs → edges → UI → admin → memory).

| Sub-phase | Theme | Key shipped surfaces |
|---|---|---|
| 4.1 | Instructor Workspace closed loop | `course_briefs` → instructor jobs, accepted-offer trigger seeds engagement + `instructor` role + 50 AI credits, 60/40 splits, `/app/instructor`, admin Course Briefs |
| 4.2 | Cohorts & Live Sessions | `cohorts`, `cohort_enrollments`, extended `course_sessions`, `session_attendance`, `/app/cohorts/:id`, `/app/sessions/:id/join`, instructor cockpit, admin Cohorts tab, reminder cron |
| 4.3 | Tracks foundation (rolled into 4.5) | `learning_tracks` schema seeded |
| 4.4 | Gro10x Learning Ops B2B | Sponsored assignments deduct `company_credits`, `/gro10x/learn/ops` 5-tab admin, `org_assign_talents` / `org_learning_health` RPCs, hourly overdue + seat-low cron, admin B2B Engagements |
| 4.5 | Tracks & Branded Catalog | `learning_tracks` + items + assignments, `certificates.kind`, `org_assign_track` / `talent_enroll_track` / `get_track_progress`, `/gro10x/learn/track/:id`, public `/c/:slug/learn` branded catalog, daily `cron-track-sweeps` |
| 4.5b + 4.6 | Desktop polish + Outcome signals | ⌘K command palette + `gro10x_global_search` RPC, `get_talent_outcome_signal` RPC, `TalentSignalPanel` in CRM, `/t/:handle` Completed Tracks, `score-job-match` verified-skill boost |
| 4.7 | Instructor monetization & payouts | `instructor_earnings_ledger` auto-fed by `course_revenue_splits` trigger, request/process payout RPCs (min 500cr), `/app/instructor?tab=earnings`, admin Learn → Instructor Payouts, monthly statement cron, `ActiveInstructorChip` |
| 4.8 | Study Abroad + AI IELTS Coach + Language Lab | Roadmap Creator absorbed into per-country **Destination Agents** (8 launched), 8-stage `abroad_applications` + counsellor cockpit, `ai-ielts-evaluate` (writing/speaking via `ielts-audio`), `ielts_streaks` gamification, `ai-language-partner` + `book-language-session`, admin tabs (Destinations / Applications / IELTS Prompts / Language Lab) |

### Cross-cutting outcomes
- **Closed-loop learning**: brief → instructor → cohort → certificate → outcome signal → job match.
- **AI signals everywhere**: verified mastery + CEFR + IELTS bands flow into `talent_skill_profile`, `score-job-match`, `/t/:handle`, employer CRM.
- **Monetization unified**: single `instructor_earnings_ledger` covers course splits, cohort sessions, abroad applications, language sessions, IELTS sessions.
- **Admin coverage**: Career Abroad group expanded from 4 → 8 tabs; Learn group has Cohorts, B2B Engagements, Instructor Payouts.
- **Public discovery**: `/c/:slug/learn`, `/verify/skill/:code`, `/t/:handle`, `/jobs/:id` mobile-first.

### Known follow-ups deferred from Phase 4
- Real-time full-duplex voice (IELTS / language partner — currently upload-based).
- Stripe Connect international payouts (still credits → existing flow).
- Visa appointment integrations.
- Counsellor public marketplace (cockpit shipped; discovery surface pending).

---

# Phase 5 — Gig Economy (AI Assistance + Verification Automation)

## North-star
Turn the gig economy into a **self-driving marketplace** where AI scopes work, matches talent, verifies deliverables, and releases payouts — across all three existing gig systems (`gigs` / `marketplace_gigs` / `content_gigs`) plus a new B2B services layer. Every action a human takes today (scope a brief, pick a winner, review a submission, score quality, release credits, dispute) gets an AI co-pilot or full automation with a human override.

## Stakeholders
1. **Talents** (workers / bidders / content leads / language tutors / counsellors / instructors)
2. **Companies / B2B clients** (project posters, ops sponsors)
3. **Admins** (gig ops, finance, trust & safety)
4. **AI Agents** (scoper, matcher, verifier, dispute mediator, payouts)
5. **Reviewers / Content Leads** (specialised QA tier)
6. **Public visitors** (SEO landings, project showcase, talent for-hire pages)

## Sub-phase breakdown

### 5.1 — Unified Gig Hub v2 + AI Scoper
Consolidate the three gig surfaces behind one schema-aware hub. Add **AI Scoper** that turns a one-line ask ("I need 10 product images for Shopify") into a structured gig: scope, deliverables, acceptance criteria, fair credit price, suggested deadline, required skills.

- Schema: `gig_briefs` (raw ask), `gig_scope_drafts` (AI output, versioned), unify `gig_kind` enum across the 3 tables, add `acceptance_criteria jsonb` to every gig table.
- Edges: `ai-gig-scoper`, `ai-gig-pricer` (uses historical `gig_submissions` + market data).
- Surfaces: `/app/gigs/new` wizard (talent self-post or company post), unified `/app/gigs` v2 with filters by kind/skill/credits/deadline.
- Admin: Gig Ops dashboard merges Quick / Marketplace / Content under one queue.

### 5.2 — AI Matchmaker + Bid Coach
Stop relying on talents finding gigs. Push gigs to qualified talent and coach their bids.

- RPC: `match_talents_to_gig(gig_id)` — uses `talent_skill_profile`, verified credentials, CEFR, past gig quality scores, availability.
- Edge: `ai-bid-coach` (rewrites talent's bid with rationale + proof links from their portfolio + verified skills).
- Notifications: native email + in-app for top-N matches; daily digest for talents.
- Company side: "AI-recommended bidders" panel on every project; one-tap shortlist.
- Admin: matchmaker quality dashboard (offered → bid → won → completed funnel).

### 5.3 — AI Verification Layer (the heart of Phase 5)
Automate deliverable QA so payouts release faster and scale. Different verifier per `gig_kind`.

- Schema: `gig_verifications` (one row per submission attempt: `verifier_kind`, `score`, `pass_threshold`, `findings jsonb`, `evidence jsonb`, `status`, `human_override_by`).
- Verifiers (each its own edge function):
  - `verify-cv-upload` — parse PDF, check completeness, plagiarism vs prior uploads, real-person heuristics.
  - `verify-job-posting` — dedupe, title sanity, JD quality score, salary plausibility per market.
  - `verify-job-sharing` — fetch shared URL, confirm `utm_source=gro10x` + ref code, count reach.
  - `verify-content-gig` — Gemini multimodal: rubric scoring vs `module_resources` spec (length, accuracy, brand voice, examples).
  - `verify-marketplace-deliverable` — image/video/code QA per `acceptance_criteria`; runs lint/visual diff/transcription as relevant.
  - `verify-cv-outreach` / `verify-portfolio` (reuses Phase 3 work).
- Auto-release: when AI score ≥ pass_threshold AND no fraud flags → credit + ledger row written immediately. Below threshold → routes to human reviewer with AI's findings prefilled.
- Trust score: `talent_trust_score` table aggregating verification outcomes, age of account, dispute rate; gates higher-credit gigs.

### 5.4 — Reviewer Tier + Dispute Mediator
Even with AI, some calls need humans. Build a paid Reviewer tier and a structured dispute flow.

- Roles: extend `app_role` with `gig_reviewer`. Reviewers earn per verified item; tracked in `instructor_earnings_ledger` with `source_kind = 'gig_review'`.
- Schema: `gig_reviewer_assignments` (round-robin), `gig_disputes` (poster ↔ talent, with AI-mediator transcript).
- Edge: `ai-dispute-mediator` — reads scope, deliverable, both sides' messages, proposes settlement (full / partial / reject + reasoning). Admin can accept/override.
- Surface: `/app/reviewer` cockpit (mirrors counsellor cockpit pattern from 4.8) with kanban: pending / in-review / decided / appealed.
- Admin: Trust & Safety tab — fraud pattern dashboard, reviewer leaderboard, dispute SLA.

### 5.5 — B2B Project Marketplace + Managed Services
Open the marketplace to companies properly (paying in `company_credits`), with optional "Managed by Gro10x" tier where admin acts as PM.

- Schema: `marketplace_projects` (rename/extend `marketplace_gigs`), `project_milestones` with escrow (`credits_escrowed`, `released_at`), `project_managed_assignments` (Gro10x PM).
- RPCs: `escrow_project_funds`, `release_milestone`, `refund_project`.
- Edges: `ai-project-pm` (drafts milestone plan + risks + weekly status), `ai-deliverable-summarizer` (digest for company stakeholders).
- Surfaces: `/c/:slug/projects` (company-branded board), `/app/projects/:id` (talent workspace with milestone chat + files + verification badges), admin Managed Projects queue.

### 5.6 — Content Studio v2 (academy build-out scaled by AI)
Phase 4 closed the learning loop; Phase 5 makes the content side self-replenishing.

- Auto-discovery: nightly cron compares `learning_tracks` → `module_resources` → flags gaps → AI Scoper auto-creates `content_gigs` with full scope + rubric + estimated credits.
- Content Lead workspace: `/app/studio` v2 — claim queue, AI co-writer (`ai-content-cowriter`), auto-citation checker, brand-voice linter.
- Verification: `verify-content-gig` writes a quality score that directly drives the existing `approve_content_gig(p_quality_score)` multiplier (0.6×–1.25×) — admin only confirms.
- Admin: Content Ops dashboard shows AI-flagged risk gigs (low rubric score, plagiarism, off-brand) at the top.

### 5.7 — Earnings, Payouts & Tax (Gig-wide)
Unify all gig income (Quick / Marketplace / Content / Reviewer / Managed PM cuts) into the existing `instructor_earnings_ledger` model, extend it for non-instructor sources, and add tax/withdrawal automation.

- Schema: rename ledger to `talent_earnings_ledger` (view alias kept for compat); add `source_kind` values for every gig flow; `payout_tax_profile` per user (country, ID type, withholding %).
- RPCs: `request_gig_payout`, `process_gig_payout` (mirrors instructor payouts), monthly statement cron extended.
- AI: `ai-tax-helper` answers withholding questions; `ai-payout-coach` warns "you'll cross threshold X, want to split?".
- Surfaces: `/app/earnings` unified for all gig roles; admin `Finance → Gig Payouts` tab.

### 5.8 — Public Gig Marketplace + SEO
Make the gig economy a discovery surface, not just an in-app feature.

- Public routes: `/gigs` (browse open quick gigs + projects, JSON-LD `JobPosting` for project gigs), `/gigs/:slug` (rich brief + AI-generated FAQ), `/for-hire/:handle` (talent's verified gig portfolio + trust score badge).
- Edge: `ai-gig-seo` generates titles, meta, FAQ from `gig_scope_drafts`.
- Sitemap + RSS feeds per gig kind.
- Auth gate stays on submission; browsing is public (matches `/jobs/:id` pattern from 3.5).

## Cross-cutting (applies to every sub-phase)
- **Memory contract**: `talent_skill_profile`, `talent_trust_score`, `get_talent_outcome_signal` extended with gig signals so Phase 4 surfaces (CRM, `/t/:handle`, job match) automatically benefit.
- **Storage**: private buckets `gig-deliverables`, `gig-evidence`, `gig-disputes`, all signed-URL only.
- **RLS**: posters see own gigs + bids; bidders see public gigs + own bids; reviewers see assigned items via `has_role('gig_reviewer')`; admins via `has_role('admin')`.
- **Notifications**: native email queue for new match, bid received, verification pass/fail, dispute opened, payout released.
- **Credits**: fractional `numeric(12,1)` model unchanged; escrow uses same wallet with `held_amount` column.

## Out of scope (Phase 6 candidates)
- Real-time collab (live whiteboard / pair coding inside a gig).
- On-chain proof-of-work / NFT credentials.
- Cross-border fiat payouts (still credits → existing rails).
- Voice/video calls between bidders and posters in-app.

## SOP for execution (matches Phase 4 pattern)
For each sub-phase: schema migration → RLS + RPCs → edge functions → talent surfaces → admin tab → memory entry → completion checkpoint, then move to next.

## Open questions before kickoff

1. **Sub-phase ordering** — start with **5.1 (Unified Hub + AI Scoper)** as foundation, or jump to **5.3 (Verification Layer)** first because it unblocks faster payouts on existing volume?
2. **Reviewer tier** — open to all talents who pass a calibration test, or invitation-only by admin?
3. **Escrow model for B2B projects (5.5)** — full upfront escrow per project, or per-milestone top-ups?
4. **Public marketplace (5.8)** — launch under `/gigs` on the main domain, or keep gig discovery inside `/app` only for trust reasons?
