# Investor Report — March → May 2026 (Trailing 90-Day Update)

I'll produce a new PDF, `GroUp_Academy_Investor_Report_May_2026.pdf`, in the same visual style as the March report, but covering the trailing 3 months (March → April → May 2026) so investors can see the trajectory, not just a single-month snapshot.

## Source of numbers

Pulled live from the production database just now:

| Metric | End of March | End of April | End of May (today) |
|---|---|---|---|
| Talents | 2,211 | 2,642 | 2,670 |
| Companies | 2,759 | 6,594 | 8,395 |
| Jobs (total) | 5,520 | 19,629 | 19,155* (14,951 active after purge) |
| Job Applications | 112 | 135 | 136 |
| Course Modules | 4,821 | 4,823 | 4,823 |
| Credits Issued (lifetime) | 559,440 | — | 674,720 |
| Credits Consumed (lifetime) | 5,315 | 6,210 | 8,300 |
| Unique Active (paid-service) Users | 82 | 109 | 120 |

*The May "Purge Expired Jobs" sweep archived stale LinkedIn imports, hence active jobs < total.

## Document structure (≈12 pages, matching March)

1. **Cover** — "Platform Progress Report — March → May 2026"
2. **Executive Summary** — Trailing-90-day narrative + headline KPI tiles (Talents, Companies, Jobs Active, Apps, Credits in Circulation, Active Users, Countries, AI Agents).
3. **Growth Highlights — Mar / Apr / May** — 3-column comparison table for each KPI with absolute + % deltas.
4. **Q2 Milestones Shipped** — Aisha Auth Agent (Mar) → Gig Matchmaker + Bid Coach (Apr) → Verification Automation, Community Reviewer & Disputes, Managed Projects & Escrow, Public Discovery & Leaderboards (May) → Phase Z0 Code Freeze.
5. **Product Architecture** — Updated layer table; AI Agent network expanded to current 10+ personas (talent + employer + admin agents).
6. **Credit Economy & Monetization** — Lifetime credits issued / consumed / in-circulation, USD equivalents, full service-wise breakdown (14 service categories now, vs 11 in March), bundle pricing.
7. **Talent Pool & Market Presence** — Updated geo distribution (BD 2,243 · US 171 · IN 75 · FR 70 · CA 55 · SG 49 · others), funnel, employer ecosystem (8,395 companies, 14,951 active jobs).
8. **Academic & Content Infrastructure** — 4-tier hierarchy + new Learning Tracks, Cohorts & Live Sessions, Verifiable Skill Credentials, Talent Mirror.
9. **Gig & Project Economy (NEW section)** — Gigs unified hub, Matchmaker, Verification, Reviewer Program, Managed Projects with escrow, Public Discovery.
10. **Technology & Infrastructure** — Updated edge function count, Zod-hardened tool dispatchers, SSE invalidation bridge, RLS coverage, cron sweepers.
11. **Workforce & Operations Model** — Same roles table; commission engine status; Gro10x B2B shell.
12. **Roadmap & KPI Targets** — Refreshed Q3/Q4 2026 roadmap; show actuals vs March's Q2 targets; new Q3 targets.
13. **Thank You / Contact**

## Technical approach

- Python script using `reportlab` (already used for the March PDF) to keep visual consistency: same fonts, margins, KPI tiles, table styling.
- Re-query DB at generation time to lock in the exact numbers, then render.
- QA: convert each page to image, eyeball for clipping/overflow, fix and regenerate before delivery.
- Output: `/mnt/documents/GroUp_Academy_Investor_Report_May_2026.pdf`, surfaced via `<lov-artifact>`.

No code or DB changes — pure document generation.
