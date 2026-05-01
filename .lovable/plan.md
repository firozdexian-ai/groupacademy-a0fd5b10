
# Phase 11H — Agent Marketplace + Messenger Inbox

Reframe the platform around two pillars:
1. **`/app/agents`** = Agent **Marketplace / Discovery** (LinkedIn-style profiles, no inline chat).
2. **`/app/notifications`** → **`/app/messages`** = WhatsApp-style **Inbox** where every conversation, system alert, and broadcast is a message thread from an agent (including a system "AI General" agent).

---

## 1. Agent Marketplace Redesign (`/app/agents`)

Strip the current "Registry / Chats" tabs. Make this a **pure discovery surface**.

**New structure (mobile-first, vertical):**
- Compact header (no rotated badge) + search + horizontal scrollable category pills (reuse `.no-scrollbar`).
- **Featured strip** (1 row, horizontal scroll): top 5 agents by usage.
- **All Agents grid** (2-col mobile, 3-col desktop): each `AgentCard` becomes denser:
  - Avatar + name + 1-line tagline
  - Stats row: ⭐ rating · 👥 users count · 💰 connection fee
  - **Primary CTA: "View Profile"** (was "Initialize Sync")
  - Secondary text link: "Message" → opens thread in `/app/messages/:agentKey`
- Remove the inline "Logic Suite" career-tools block and the "Chats / Active Uplinks / Interaction Logs" tab (these move to Messages).

**New route: `/app/agents/:agentKey/profile`** (LinkedIn-style human profile)
- Hero: large avatar, name, headline, "Created by {company/Lovable}" badge.
- About section (long bio).
- Skills / Expertise chips.
- "What I can do" — bullet list of capabilities.
- Stats card: total conversations, avg rating, response style, languages.
- Reviews section (list of feedbacks with stars + talent name + date).
- Pricing card: connection fee + per-response cost.
- Sticky bottom CTA: **"Connect & Message"** → deducts connection fee (one-time), then routes to `/app/messages/:agentKey`.
- "Leave a review" button (only enabled if user has chatted ≥3 times).

---

## 2. Messenger Inbox (replaces Notifications)

Rename `/app/notifications` → `/app/messages` (keep redirect from old path). Bell icon in `TalentAppShell` becomes a **chat bubble icon** with unread badge.

**Inbox view (`/app/messages`)** — WhatsApp-style:
- Search bar at top: "Search conversations…"
- Optional filter chips: All · Unread · Agents · System
- Vertical list of **thread rows**:
  - 56×56 avatar (agent or system "AI General" logo)
  - Name (bold if unread) + last message preview (1 line, truncated)
  - Right column: timestamp + unread count pill
- Pinned **"AI General"** thread always at top — receives all platform/system notifications (credit added, withdrawal approved, course unlocked, gig auto-approved, etc.).
- Empty state: "No conversations yet — visit the Agent Marketplace."

**Thread view (`/app/messages/:threadKey`)** — chat surface:
- Sticky header: back arrow, agent avatar + name, "View Profile" link.
- Chat bubbles (user right, agent left, system center grey).
- For **system/notification messages**: render as agent bubble with optional CTA button (e.g. "View Job", "Open Course") derived from the existing `notifications.link`.
- Composer at bottom (only enabled for actual AI agents, hidden for AI General system thread or set to read-only).
- Reuses existing `useAgentChat` streaming for AI agents.

**Web layout:** split-pane (inbox left 360px, thread right) — like WhatsApp Web / LinkedIn messaging. On mobile, single pane with navigation.

---

## 3. Data Model Changes

**New table: `message_threads`**
```
id uuid pk
talent_id uuid → talents
thread_type text  -- 'agent' | 'system'
agent_key text nullable  -- null for system
last_message_at timestamptz
last_message_preview text
unread_count int default 0
is_pinned boolean default false
is_archived boolean default false
```
Unique index on `(talent_id, agent_key)` where `thread_type='agent'`; one `(talent_id, 'system')` row per user.

**Existing `notifications` table**: add `thread_id uuid` + trigger that on insert:
1. Finds/creates the user's "system" (`AI General`) thread.
2. Updates `last_message_*` and increments `unread_count`.
This way every notification automatically appears as a message in the AI General thread without breaking existing notification producers.

**Existing `agent_chat_sessions`**: add `thread_id uuid` (nullable). Trigger on insert/update mirrors `last_message_at/preview/unread_count` to the matching thread row.

**New table: `agent_reviews`**
```
id uuid pk
agent_key text
talent_id uuid
rating int (1-5)
review_text text
created_at timestamptz
```
RLS: anyone authenticated can read; talent can insert/update own.

**`ai_agents` augmentation**: add view `ai_agents_with_stats` (security invoker) exposing `total_users`, `avg_rating`, `total_messages` aggregated from `agent_chat_sessions` + `agent_reviews`.

---

## 4. Routing & Navigation

- `/app/messages` (inbox) and `/app/messages/:threadKey` (thread).
- `/app/notifications` → `<Navigate to="/app/messages" replace />`.
- `/app/agents/:agentKey/profile` (new profile page).
- `/app/agents/:agentKey` (existing chat page) stays but is reached **only via "Connect & Message"** from profile. Internally it can redirect to `/app/messages/:agentKey` in Phase 2 once thread persistence is verified.
- Update `TalentAppShell` bottom nav and top bar bell → MessageCircle icon pointing to `/app/messages`.

---

## 5. Files to Create / Edit

**Create**
- `src/pages/app/Messages.tsx` (inbox)
- `src/pages/app/MessageThread.tsx` (thread)
- `src/pages/app/AgentProfile.tsx` (LinkedIn-style profile)
- `src/components/messages/ThreadListItem.tsx`
- `src/components/messages/ChatBubble.tsx`
- `src/components/messages/SystemMessageBubble.tsx`
- `src/components/agents/AgentReviewSection.tsx`
- `src/hooks/useMessageThreads.ts`
- `supabase/migrations/...messenger_inbox.sql`

**Edit**
- `src/pages/app/AIAgents.tsx` — strip tabs, redesign as marketplace, "View Profile" CTA.
- `src/components/ai-agents/AgentCard.tsx` — denser layout with stats + dual CTA.
- `src/layouts/TalentAppShell.tsx` — bell → chat icon → `/app/messages`.
- `src/App.tsx` + `src/lib/routes.ts` — new routes + redirect.
- `src/hooks/useNotifications.ts` — keep as compatibility layer; inbox uses `useMessageThreads` instead.

---

## 6. Out of Scope (Phase 11I+)
- Push/web-push delivery layer (Capacitor + service worker).
- Real-time typing indicators / read receipts in threads.
- Group threads (multi-agent conversations).
- Voice notes.

These can be added once the inbox model is stable.

---

**Approve to implement Phase 11H?**
