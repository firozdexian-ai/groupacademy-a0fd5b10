# v0.5 Plan — Revised (P1 audit + P2 micro-tasks + AI Agents v0.5 + Public Showcase)

I'll restructure so we move in **small, verifiable steps**. Each step = one chat turn, one deliverable, one approval. Nothing branches until the prior step is green.

---

## Track A — P1 Completion Audit (do first, 1 turn)

Before touching P2, verify P1 is actually complete.

**A1. P1 audit pass** — re-read `.lovable/v05/inventory.md`, cross-check against:
- `src/App.tsx` (talent routes), `src/gro10x/Gro10xRoutes.tsx`, `src/shells/admin/routes/*.ts`
- `mem://admin/*` group files (16 groups, 118 admin tabs)
- Public routes in `src/App.tsx` (`/`, `/jobs`, `/projects`, `/leaderboards`, `/c/:slug`, `/t/:handle`, `/verify/*`)

**Deliverable:** append `## P1 Audit Result` section to `inventory.md` listing:
- Routes missed in first pass
- Regression suspects re-confirmed or dismissed (with file evidence)
- Coverage % for each shell

**Stop and wait for your sign-off** before Track B.

---

## Track B — P2 broken into 6 micro-steps

Originally P2 was "defer matrix + ComingSoonGate + waitlist table + wire it up". Splitting:

**B1. Defer matrix doc only** (1 turn)
- Create `.lovable/v05/defer-matrix.md`
- Every Talent + Public surface flagged "looks empty" in P1, classified `keep | coming-soon | hide`
- Include rationale + data-readiness check per row
- No code. You approve the matrix.

**B2. ComingSoonGate component** (1 turn)
- Build `src/components/common/ComingSoonGate.tsx` only
- Props: `featureKey`, `title`, `description`, optional `illustration`
- No waitlist wiring yet — just visual shell using design tokens
- Render-test on one surface as a preview

**B3. Waitlist backend** (1 turn, migration only)
- `feature_waitlist` table (`user_id`, `feature_key`, `email`, `created_at`) + RLS + unique constraint
- One RPC `join_feature_waitlist(feature_key)`
- Migration approval required before code

**B4. Wire waitlist into ComingSoonGate** (1 turn)
- Add form + submit → RPC
- Toast confirmation, idempotent re-submit
- Test on one surface

**B5. Apply gate to `coming-soon` surfaces** (1 turn per ~5 surfaces, batched)
- Wrap each flagged surface per the approved matrix
- Update nav labels where needed (small "Soon" pill)

**B6. Hide `hide` surfaces + admin waitlist signals widget** (1 turn)
- Remove nav entries, add 404 redirect
- Admin tab: `feature_waitlist` aggregated by `feature_key` with signup counts → drives "what to build next"

---

## Track C — AI Agents v0.5 (new, agent-by-agent)

Per your direction: **one agent at a time, skip if too complex, ship minimum viable interaction.**

Three capabilities defined as the v0.5 floor for every customer-facing agent:

1. **Text chatbot wrapper** — info-only, uses agent persona + system prompt. No tool calls required. Already mostly built via `useAgentRuntime` — just verify each agent has a working persona.
2. **Inbox push** — agent can send a transactional message to the talent's in-app inbox (existing `notifications` infra) on triggers (e.g. new job match, new course).
3. **Daily feed post** — each agent posts 1 text post/day to `feed_posts` via cron. Variety driven by agent persona + light context (recent platform activity).

### Micro-steps:

**C0. Agent inventory & triage** (1 turn)
- Read `ai_agents` table + `src/lib/constants/agents.ts`
- Doc `.lovable/v05/agents-triage.md`: per agent → has persona? has working chat? credit cost set? — classify `ship | fix | defer`
- You approve the shortlist

**C1. Verify text-wrapper chat works for all `ship` agents** (1 turn)
- Smoke test `/app/agents/:agentKey` in browser for each
- Fix broken persona prompts only (no new features)

**C2. Inbox-push infrastructure** (1 turn)
- Edge function `agent-push-inbox` (input: `agent_key`, `user_id`, `subject`, `body`, `cta_url`)
- Writes to `notifications` with `source='agent'` + agent metadata
- RLS verified

**C3. Wire 2-3 high-value inbox triggers** (1 turn)
- Examples: Jobs agent on new high-match job; Learning agent on new course in tracked topic
- Pick triggers WITH you before building

**C4. Daily feed post — single agent pilot** (1 turn)
- Edge function `agent-daily-post` for ONE agent (e.g. AI General or Career agent)
- Cron daily, posts to `feed_posts` with `author_type='agent'` (new column if needed)
- Feed UI shows agent badge

**C5. Roll out daily-post to remaining `ship` agents** (1 turn)
- Same function, parameterized by agent
- Stagger post times to avoid feed flood

---

## Track D — Jobs UI Polish (talent-facing)

You called out text alignment is "fucking horrible" in `/app/jobs`. Treating as one focused pass.

**D1. Jobs hub visual audit** (1 turn)
- Browser screenshots of `/app/jobs` at 390px (your current viewport) + 768px + 1280px
- Doc issues: alignment, hierarchy, spacing, card density, mobile horizontal-scroll violations
- No code. You approve the fix list.

**D2. Job card + list polish** (1 turn)
- Fix alignment per D1 findings
- Apply mobile design system rules (py-2, space-y-2, no horizontal scroll, 3:1 banner if any)
- Scoped to `JobCard`, `InfiniteJobsList`, hub tabs

**D3. Job detail polish** (1 turn)
- `/app/jobs/:id` + public `/jobs/:id` alignment + hierarchy pass

---

## Track E — Public AI Agent Network Showcase

Your point: we sell AI-agent-first but our public site never says so.

**E1. Public AI Network landing section** (1 turn, design directions first)
- New section on `/` (home) introducing the agent network
- Carousel/grid of agent personas with name, role, avatar, "Chat" CTA → routes to public agent profile or signup
- I'll generate 2-3 design directions for your approval

**E2. Public agent profile pages** (1 turn)
- Route `/agents/:agentKey` (public, SEO-indexed)
- Persona bio, "institutions/credentials" panel, recent feed posts (from Track C5), chat CTA
- JSON-LD `Person` schema so social platforms pick it up
- This gives you the LinkedIn-shareable artifact you want

**E3. Admin promo tools for agent network** (1 turn)
- Admin tab under AI Agents group: "Public showcase" → toggle which agents appear on `/`, edit public bio, schedule social posts (text export for now; full social automation is post-v0.5)

---

## Execution order (proposed)

```text
A1                          → audit, gate to B
B1 → B2 → B3 → B4 → B5 → B6 → defer/coming-soon shipped
C0 → C1 → C2 → C3 → C4 → C5 → agents at v0.5 floor
D1 → D2 → D3                → jobs polish
E1 → E2 → E3                → public agent showcase
P3 (smoke tests) — unchanged from prior plan, runs after B+C+D
P4 (publish punch list)     — last
```

Each arrow = one chat turn = one approval gate. If a step balloons, we split it again.

---

## What's explicitly OUT of v0.5 (constraining your scope per your ask)

- Agent tool-calling beyond text + inbox + feed-post
- Full social-media automation for agents (LinkedIn/FB posting)
- Gro10x B2B polish
- Admin UX polish beyond the one waitlist widget
- New features not listed above
- Performance work beyond what A19 already did

---

## Technical notes (for me, not for the user-facing dashboard)

- `feed_posts` likely needs `author_type` enum (`talent | agent`) + `author_agent_key` column — confirm in C4 migration
- `agent-push-inbox` should respect notification preferences (existing prefs table from agentic-feed-notifications memory)
- Daily-post cron: stagger via `pg_cron` with different minute offsets per agent
- Public agent pages must be in public shell bundle (`src/shells/public/agents.ts` already exists, currently exports registry only — extend)
- `ComingSoonGate` form submit blocked for unauthenticated users → show signup CTA instead

---

**Next turn after you approve this plan:** I execute A1 only (P1 completion audit), output the audit section, stop.