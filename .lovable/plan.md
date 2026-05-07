## Updated CTO Handoff — May 7, 2026 Edition

Produce a new versioned `.docx` and matching `.pdf` in `/mnt/documents/` that mirrors the visual format of `Group_Academy_CTO_Handoff_May2026.docx` (May 3 edition) but is rebuilt from scratch using *live* platform state, so the incoming CTO can take over and refactor end-to-end.

### Files to deliver
- `/mnt/documents/Group_Academy_CTO_Handoff_May7_2026.docx`
- `/mnt/documents/Group_Academy_CTO_Handoff_May7_2026.pdf`
- (Existing May 3 files left untouched for diff reference.)

### Document outline (sections)

**1. Executive Summary**
- Refreshed headline metrics pulled live: tables, RLS policies, edge functions (174), migrations in last 30 days (128), auth users, talents, companies, jobs, contacts (2,344), conversations, credit txns.
- "What changed since May 3" — Phase 5.2→5.6, Phase 4.7, messaging/Unipile stack, Phase 6 outreach remediation in flight.
- Strategic posture: surface area is now > team capacity; next 90 days = stabilize, not ship.

**2. Platform Architecture**
- Stack, AI Gateway models, payments, email, observability.
- Hard constraints (RBAC via `user_roles`, `search_path = public`, `auth.getUser(token)`, signed URLs for `talent-cvs`, no third-party server-secret integrations, `normalize_country_name`).

**3. Talent-Side (B2C) — Product / Pages / Features / Agents**
For every talent-facing route under `/`, `/app/*`, `/dashboard` (talent role), `/jobs`, `/courses`, `/services`, `/blog`, `/verify/*`, `/t/:handle`, `/projects`, `/leaderboards/*`, `/career-assessment`, `/mock-interview/*`, `/salary-analysis/*`, `/portfolio-*`, `/auth*`:
- Route + component file
- Status (Built / Scaffolded / Broken / Missing)
- Backing edge functions / RPCs
- Linked agent (if any) + agent status
- Known issues
Sub-tables: Career Hub, Jobs Hub (board/companies/locations/tools), Learning (courses/tracks/cohorts/sessions/instructor workspace), Services (CV maker, Application Helper, Salary AI, Mock Interview, Career Assessment, Portfolio), Gigs (For-You/marketplace/projects/disputes/appeals/reviewer cockpit), Career Abroad, Languages, AI Agents (My Agents, Marketplace, Chat), Talent Mirror, Saved Items, Notifications, Messages, Public Profile, Verifiable Credentials.

**4. Company / Contact Side (B2B) — Product / Pages / Features / Agents**
For every Gro10x route (`/gro10x/*`) and company-facing flow:
- Auth (Gro10xAuth, Gro10xSignIn, Gro10xWelcome, signup-company, check-company-account)
- Welcome / Landing / Billing / Offerings
- Work: Jobs list, Job Applicants, Shortlist, Talents, Offer Composer, Applications, Projects
- Sourcing: Gro10xSourcing, Sourcing Lists
- Learn: Gro10xLearn, Gro10xLearnOps (B2B engagements), Branded Catalog (`/c/:slug/learn`, `/c/:slug/projects`)
- Inbox / Chat / Agent Marketplace / Me
- Public Company Page, Company Public Projects, Company Branded Catalog
- Outreach: Gro10x mailto + Talent line (+880 1889 825 025) + Employer line (+880 1708 459 008)
- Agent status: Riya, Companies AI General, Company Outreach Exec, Lead Hunter

**5. Admin Dashboard — 16-Group Update**
For each group (Talent, Companies, AI Agents, Investors, Institutions, Workforce, GTM, UGC & Content, Jobs, Learn, Gig Economy, Career Abroad, Marketing, Finance, Platform Config, Overview):
- Tabs registered in `Dashboard.tsx` + `AdminSidebar.tsx`
- Status delta vs May 3 (Gig Economy mostly Built now; Outreach Console **Broken**; Course Briefs / Cohorts / Instructor Payouts subtabs added under Learn; Reviewer Program / Verification / Matchmaker / Managed Projects subtabs under Gig; B2B Engagements under Companies/Learn)
- Top wiring gaps per group

**6. Agentic OS Update**
- All registered admin chat agents from `src/lib/adminAgents.ts` (current count) + edge function mapping + Built/Scaffolded
- New since May 3: Reviewer/Disputes coach, Project Acceptance coach, Bid Coach, Matchmaker explainer, Project Scoper, Team Recommender, Status Summarizer, Authoring Review digest, Item Rewrite, Item Translate, Tutor Mastery
- Knowledge ingestion + per-agent credit accounting + observability gaps
- Outreach console deprecation pattern: most `*ConsoleTab.tsx` are now `AgentRedirectStub` thin wrappers → flag as candidate dead code

**7. Edge Functions Update (174)**
Full grouped catalog with 1-line "what it actually does today":
- Admin agents (~30)
- Agent OS runtime (agent-runtime, agent-blueprint, agent-event-dispatcher, ingest-agent-knowledge)
- Talent AI (B2C) + Company AI (B2B)
- Career assessments / Job intelligence / Job application / CV pipeline
- Content generation (batch-*)
- Email pipeline (process-email-queue, send-transactional-email, auth-email-hook, etc.)
- Payments (Stripe + bKash)
- Messaging / Unipile (unipile-connect, unipile-webhook, messaging-send, messaging-autoreply, messaging-group-manager, import-employer-contacts)
- Gig Matchmaker / Verification / Reviewer / Disputes (Phase 5.2–5.4)
- Managed Projects / Escrow (Phase 5.5)
- Public Discovery + cron sweepers (Phase 5.6)
- Instructor Workspace + Cohorts + Tracks (Phase 4.1/4.2/4.5/4.7)
- Cron jobs (matchmaker, digest, verification-sweeper, revision-expiry, project-status, escrow-reconciliation, leaderboard-rebuild, sitemap-rebuild, signal-decay, weekly-digest, trust-decay, track-sweeps, instructor-monthly-statement)
- Health
Each row: name · domain · auth posture · current status · known issue.

**8. Database & Security Update**
- Schema delta last 30 days (focus on `messaging_*`, `contacts`, `client_group_members`, gig_*, project_*, reviewer_*, learning_tracks_*, instructor_earnings_*)
- Linter findings count + top categories
- RLS hot spots (USING(true), function search_path)
- RBAC discipline + `requireAdmin(req)` standardization recommendation
- Storage buckets posture (`talent-cvs`, `discovery-og`, `module-resources`)

**9. Dead / Deprecated / No-Longer-Used Code Map**
Concrete refactor targets the CTO can delete in week 1:
- `*ConsoleTab.tsx` thin redirect stubs — many now just wrap `AgentRedirectStub` (e.g. `AgentManagerConsoleTab`, `CompanyOutreachConsoleTab`); audit every match of `<AgentRedirectStub`
- `src/pages/admin/OutreachConsole.tsx` — combined Talent+Employer; being split per Phase 6.2
- `TalentOutreachConsoleTab.tsx` currently a 4-line shim around OutreachConsole — merge or delete after split
- Legacy `RESEND_API_KEY` paths in old email functions vs native `process-email-queue`
- `messaging-send` `auth.getClaims` legacy path (already patched but verify no callers)
- Duplicate AI composer paths: `generate-outreach-message` vs upcoming `ai-outreach-suggest`
- Scaffolded admin agent edge functions returning canned text (15+ candidates for consolidation into one router)
- Unused hooks (run `rg` audit; flag any hook with 0 imports — to be enumerated in the doc as a checklist)
- Legacy quiet-hours block in `outreach_can_send` (Phase 6.1 removes it)
- Dead routes: any `/dashboard?tab=*` keys not present in `Dashboard.tsx` switch
- Old `RESEND_*` secrets pending rotation
- ConsoleTab pattern: list every file under `src/components/dashboard/**/*ConsoleTab.tsx` and mark live vs redirect-stub

**10. Critical Gaps & Placeholders (current P0/P1/P2)**
- **P0 Outreach broken**: quiet-hours hard block, inbox safety filter hides personal-number inbound, Talent+Employer consoles merged, Unipile webhooks not registering for `community-engine`, Phase 6.1/6.2/6.5 in flight per CTO remediation order
- P0 Agent runtime closure, withdrawals/payouts executor, Stripe webhook idempotency, audit log, RLS sweep, Talent Success Exec role boundary tests
- P1 B2C funnel conversion, Jobs freemium counter parity, Gig payout loop closure (mostly built but escrow→worker payout still manual), Company invoice PDF, Career Abroad counselor matching
- P2 Edge function consolidation, Postgres monitoring, `platform_events` partitioning, email warm-up, AI response caching
- P3 Web push, mobile table overflow, dead UI cleanup, i18n

**11. Step-by-Step Stabilization Workflow (Code Editor ↔ CTO)**
This is the new high-value section the user explicitly asked for. A practical handshake protocol:

*Daily loop (Lovable code editor side):*
1. Pull latest `mem://index.md` + this handoff into context.
2. Pick one P0 from §10. Open the related files via `code--view`.
3. Make the change. Run `lovable-exec test` / linter.
4. Capture: files touched, migrations added, edge functions deployed, manual QA steps.
5. Append a 5-line "Change log" entry to `/docs/CHANGELOG-stabilization.md`.

*Weekly loop (CTO side):*
1. Read CHANGELOG, run linter (`supabase--linter`), run security scan (`security--run_security_scan`).
2. Review §9 dead-code list: tick off deletions, open issues for ambiguous ones.
3. Sample 3 edge functions from §7, verify `auth.getUser(token)` + `requireAdmin` posture.
4. Verify §8 RLS warnings count is monotonically decreasing.
5. Sign off the week or block release.

*Pairing protocol (CTO + Lovable on same day):*
- Step A — Reproduce: CTO names the symptom; editor fetches console + network + edge logs.
- Step B — Localize: editor returns top-3 suspect files with line refs.
- Step C — Plan: editor presents a `plan--create` slice (≤6 files, ≤1 migration).
- Step D — Approve: CTO replies "go" or edits the plan inline.
- Step E — Apply: editor implements + verifies + posts diff summary.
- Step F — Promote: CTO merges Built status in §3/§4/§5 of next handoff.

*8-week sequenced sprint plan:*
- Wk 1: Phase 6.1/6.2/6.5/6.4 outreach unblock; delete redirect-stub `*ConsoleTab.tsx` files
- Wk 2: Phase 6.3/6.6/6.7 conversation pane + AIOutreachButton + approval queue
- Wk 3: RLS sweep to 0 warnings; admin action audit log
- Wk 4: Agent OS — promote 5 priority scaffolded agents to Built with tool calls + observability dashboard
- Wk 5: Payments hardening — Stripe idempotency, bKash reconciliation, payout executor v1
- Wk 6: Gig escrow→worker payout closure + worker wallet
- Wk 7: B2C funnel analytics + first A/B test
- Wk 8: Cleanup — remove every file flagged in §9; per-module README; runbook in `/docs`

**12. Operational Runbook**
- Deploy / logs / Cloud scaling / Auth-loop recovery / Cloud incident polling
- AI Gateway 429 backoff / Stripe webhook replay / Email bounce pause / Unipile reconnect for the two WhatsApp lines / Outbound queue flush

**13. Open Decisions for the CTO**
Carry forward May 3 list + new ones: outreach console split sidebar grouping, scrap-vs-warn quiet hours, agent runtime consolidation, multi-tenant isolation, observability stack, AI cost control, talent privacy reveal, mobile native vs PWA.

**14. Appendix**
- A. Talent route map (full)
- B. Gro10x route map (full)
- C. Admin tab key map (`/dashboard?tab=*` → component)
- D. Environment & secrets (rotation plan for legacy RESEND, BKASH manual)
- E. Status legend
- F. How to read the dead-code list (priority + risk)
- G. Glossary (Phase numbering 3.x → 6.x)

### Technical approach (for the agent executing the build)
1. Live counts via `psql`: tables, RLS policies, functions, contacts, migrations, agents.
2. List `supabase/functions/` directory for the 174 edge functions; group by name prefix (`ai-`, `cron-`, `admin-`, `messaging-`, `unipile-`, `gig-`, `notify-`, etc.) and join with the May 3 list to compute deltas.
3. Walk `src/pages/`, `src/pages/app/`, `src/pages/public/`, `src/gro10x/pages/` for route inventory; cross-ref `App.tsx` and `Dashboard.tsx`.
4. `rg "<AgentRedirectStub"` to enumerate redirect-stub `*ConsoleTab.tsx` files for §9.
5. `rg -L "from \"@/" src/hooks` style scans to detect zero-import hooks for §9.
6. Build `.docx` with `docx-js` matching May 3 typography (Arial, Heading1/2 overrides, US Letter 12240×15840 DXA, tables with `D5E8F0` header shading, light-gray cell borders).
7. Convert to PDF via `run_libreoffice.py`.
8. Render every page to JPEG, inspect for clipping/overflow, fix and re-run as needed (QA images discarded).
9. Emit `<lov-artifact>` for both files.

Awaiting approval to execute.