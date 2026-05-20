## Phase 5.5 — `messaging` domain vertical slice

Compact phase covering peer DM threads, agent inbox, and the Unipile WhatsApp/SMS channel admin tab. Application-thread messaging already lives in `domains/jobs` (Phase J pipeline) and stays there.

### Scope

**Talent UI → `src/domains/messaging/components/talent/` (+ barrels at `src/components/messages/*`)** — 2 files
- `ChatBubble`
- `ThreadListItem`

**Admin UI → `src/domains/messaging/components/admin/` (+ barrels at `src/components/dashboard/messaging/*`)** — 1 file
- `MessagingChannelsTab` (already consumed by Talent/Employer/Community channel tabs via re-export — those wrappers keep their current paths and simply re-import from the new domain location)

**Hooks → `src/domains/messaging/hooks/` (+ barrels at `src/hooks/*`)** — 2 files
- `useMessageThreads`
- `useDirectMessages` (incl. `ensureDirectThread` helper)
- Note: `useApplicationMessages` already lives in `domains/jobs/hooks/`; leave it there.

**Typed edge contract → `src/edge/contracts/messaging.ts`**
- `unipile-connect` — request `{ agent_key, region, label }`, response `{ url, channel_id }` (permissive `Record<string, unknown>`)

**API manifest → `src/domains/messaging/api/manifest.ts`**
- `messagingApi.{ unipileConnect }`

**Domain index → `src/domains/messaging/index.ts`**
Re-export the 2 talent components, the admin tab, both hooks, and `messagingApi`.

**F3 sweep**
Replace the 1 direct `supabase.functions.invoke('unipile-connect', …)` call inside `MessagingChannelsTab` with `messagingApi.unipileConnect`.

### Importers that keep working via barrels
- `src/pages/app/Messages.tsx`, `MessageThread.tsx` → `useMessageThreads`, `useDirectMessages`, `ThreadListItem`, `ChatBubble`
- `src/pages/AdminLiveInbox.tsx` → `useMessageThreads`
- `TalentMessagingChannelTab`, `EmployerMessagingChannelTab`, `CommunityMessagingChannelTab` → `MessagingChannelsTab` (their import path `@/components/dashboard/messaging/MessagingChannelsTab` resolves to the barrel)

### Verification
- Type-check passes.
- `/app/messages`, `/app/messages/:agentKey`, `/dashboard` Talent/Employer/Community channel tabs still mount.
- No remaining `functions.invoke('unipile-connect'` outside the manifest.
- Realtime subscriptions in `useDirectMessages` and `useMessageThreads` still bind (no path-sensitive logic).

### Out of scope
- `useApplicationMessages` (already in `domains/jobs`).
- Agent chat hooks (`useAgentChat`, `useAIGeneralChat`) — they belong to the `agents` domain and are already extracted.
- Notification ledger (`useNotifications`) — separate domain (`platform/notifications` in Phase 6).
- Phases 6–9 still deferred.

### Risk
- Low. 6 files, 1 edge fn, no shared-hook entanglement. Realtime channels untouched.

### Progress after 5.5
~46%. Next: 5.6 companies.

### Roadmap remainder
```text
5.6  companies
5.7  marketing
5.8  ir
5.9  finance
5.10 institutions
5.11 workforce
5.12 ugc
5.13 dashboard residuals (jobs admin, agents admin, etc.)
Phase 6  platform/ extraction (notifications, credits, payments)
Phase 7  shells/*/routes.tsx + React.lazy
Phase 8  retire barrel re-exports
Phase 9  edge/contracts/ for every domain
```
