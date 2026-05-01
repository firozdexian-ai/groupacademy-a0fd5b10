## Gro10x — Phase 2: Make the Shell Real

The foundation works but every screen except auth is a stub. This phase turns Gro10x into a functional B2B super-app by wiring real data into the 5 main surfaces and closing the agent → feed loop.

### What you'll see when this ships

1. **Inbox** — a WhatsApp-style list of agent threads with last message + unread badges, pinned by the goals Riya collected at signup.
2. **Feed** — real posts from your company + connected workspaces, with a composer that lets agents draft on your behalf.
3. **Company Page** — editable cover/logo/tagline, team grid (auto-pulled from members), open jobs, and services. Public mirror at `/c/:slug`.
4. **Me** — personal profile (CV, role, skills) bridged from the existing `talents` row, plus role badge (Owner/Member).
5. **Agent Marketplace** — curated B2B agents (Recruiter, Lead Hunter, Growth, Billing, etc.) with one-tap "Add to Inbox".

---

### Step 1 — Inbox + Chat (real threads)

- Reuse `useMessageThreads` pattern but scoped to `company_id`.
- New table `gro10x_agent_threads` (user_id, company_id, agent_key, last_message_at, unread_count, pinned).
- Auto-seed pinned threads from `companies.goals` on first load (e.g. goal `hire` → Recruiter + Lead Hunter pinned).
- `Gro10xChat.tsx` reuses `useAgentChat` but passes `context: { mode: 'b2b', company_id }` so the agent knows it's acting for a company.

### Step 2 — Agent-Authored Feed

- Wire `Gro10xFeed.tsx` to fetch from `feed_posts` filtered by `author_company_id IN (member companies)` plus the user's own posts.
- Extend `company-agent-tools` edge function with a `draft_company_post` tool that inserts into `company_post_drafts`.
- Add a "Drafts awaiting your approval" strip at the top of the feed for Owners — one-tap Publish moves it to `feed_posts` with `author_type='company'`.
- Composer at the bottom: free text + "Ask Growth Agent to write this" button.

### Step 3 — Company Page (editable + public)

- `/gro10x/page` — Owner sees inline-edit fields (tagline, cover, logo, services). Members see read-only.
- Sections: Header (logo/cover/tagline) → Team grid (query `companies_members` → `talents`) → Open jobs (existing `jobs` table filtered by `company_id`) → Services (`company_services`).
- `/c/:slug` — public mirror, no auth, SEO-friendly with JSON-LD `Organization`. Routes added to main `App.tsx` (academy host) so the page works on both domains.

### Step 4 — Me (profile bridge)

- `Gro10xMe.tsx` reads from `talents` (existing) + `companies_members` for role badge.
- Inline edit: headline, role, skills, CV re-upload (calls `parse-cv` to refresh).
- "Switch to Talent App" link for users who also have a personal talent flow.

### Step 5 — Agent Marketplace (curated B2B set)

- New constant `GRO10X_AGENTS` in `src/gro10x/lib/agents.ts` — filtered subset of `src/lib/constants/agents.ts` tagged `b2b: true`, plus 4 new ones (Recruiter, Lead Hunter, Growth, Billing).
- One-tap "Add to Inbox" → inserts into `gro10x_agent_threads` with `pinned=true`.

### Step 6 — Welcome flow polish

- After Riya completes signup, `/gro10x/welcome` shows a 3-card walkthrough (Your inbox is ready · Invite teammates · Edit company page) then drops into `/gro10x/inbox`.

---

### Technical Details

**New tables (1 migration):**
```sql
gro10x_agent_threads (
  id uuid pk, user_id uuid, company_id uuid,
  agent_key text, last_message text, last_message_at timestamptz,
  unread_count int default 0, pinned boolean default false,
  created_at timestamptz default now(),
  unique (user_id, company_id, agent_key)
)

companies_members (  -- if not already present
  company_id uuid, user_id uuid, role text check (role in ('owner','admin','member')),
  joined_at timestamptz default now(),
  primary key (company_id, user_id)
)
```
RLS: members can read their own company rows; only owners/admins can update company page fields and publish drafts.

**Edge function changes:**
- `company-agent-tools`: add `draft_company_post`, `list_team_members`, `update_company_page` tools.
- `ai-company-auth-agent`: on completion, seed `gro10x_agent_threads` based on collected goals.

**Frontend new/edited:**
- New: `src/gro10x/lib/agents.ts`, `src/gro10x/hooks/useGro10xThreads.ts`, `src/gro10x/hooks/useCompanyPage.ts`, `src/gro10x/components/CompanyPageEditor.tsx`, `src/gro10x/components/FeedComposer.tsx`, `src/gro10x/components/DraftApprovalStrip.tsx`, `src/pages/public/PublicCompanyPage.tsx` (for `/c/:slug`).
- Edited: all 5 `Gro10x*` page stubs, `App.tsx` (add `/c/:slug`), `Gro10xRoutes.tsx`.

**Out of scope for this phase** (next phases): teammate invitations by email, billing/subscription per company, cross-company DM, public company directory.

---

### Suggested order
Step 1 (Inbox) → Step 5 (Marketplace, since it feeds Inbox) → Step 4 (Me) → Step 3 (Company Page) → Step 2 (Feed + drafts) → Step 6 (Welcome polish).

Approve to proceed, or tell me which step to drop/reprioritize.