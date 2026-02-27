
# AI General -- Platform Guide Search Agent

## Vision

Transform the top search bar from a simple job search into an AI-powered platform concierge called **"AI General"**. When users type a query and press Enter, instead of navigating to jobs, they enter a free conversational chat with AI General -- the ultimate platform guide that helps seekers discover features, courses, agents, jobs, and more.

## How It Works

1. **User types in the search bar** (e.g., "How do I improve my CV?" or "IELTS preparation")
2. **Presses Enter** -- navigates to `/app/ai-general` with the query as a URL param
3. **AI General page opens** -- immediately sends the query as the first message to the AI agent
4. **Conversation continues** -- no session timer, no credit cost (free forever)
5. **AI General responds** with platform-aware guidance, inline links to features/agents/courses

## What AI General Does

- **Platform Guide**: Knows all features (Jobs, Learning, AI Agents, Gigs, Abroad, Services) and directs users with markdown links
- **Agent Router**: Suggests specialized agents (e.g., "For CV help, talk to our [CV Coach](/app/agents/cv-coach)")
- **Content Discovery**: Recommends courses, blog posts, jobs based on the query
- **Free & Unlimited**: No credits, no session timer -- its job is to increase platform engagement
- **Trackable**: Admin can see total conversations, queries, and set engagement targets

## Technical Plan

### 1. Add "ai-general" to agent constants (`src/lib/constants/agents.ts`)

Add a new agent entry with `id: "ai-general"` using the `Sparkles` icon. This is used for the static fallback only.

### 2. Insert AI General into the database (`ai_agents` table)

Insert a row with:
- `agent_key`: "ai-general"
- `name`: "AI General"
- `system_prompt`: A comprehensive prompt that knows every platform feature and generates markdown links to direct users
- `credit_cost`: 0
- `session_duration_minutes`: 1440 (24 hours -- effectively unlimited)
- `is_active`: true

### 3. Create a dedicated page (`src/pages/app/AIGeneral.tsx`)

A lightweight chat page that:
- Reads `?q=` from URL params as the initial query
- Uses a **simplified version** of `useAgentChat` -- no credit gating, no session timer
- Creates a free session automatically (no CreditGateModal)
- Reuses the existing `AgentChatDialog` component for the chat UI
- Has a back button that returns to Feed

### 4. Create a free chat hook (`src/hooks/useAIGeneralChat.ts`)

A slimmed-down version of `useAgentChat` that:
- Auto-creates a session without credit checks
- No session expiry enforcement
- Streams responses from the same `ai-agent-chat` edge function
- Saves messages to `agent_chat_sessions` for analytics

### 5. Update search bar behavior (`src/layouts/TalentAppShell.tsx`)

Change `handleSearch`:
```
// Before: navigate(`/app/jobs/all?search=${searchQuery}`)
// After:  navigate(`/app/ai-general?q=${searchQuery}`)
```

Update placeholder text from "Search jobs, courses..." to "Ask AI General anything..."

### 6. Add route (`src/App.tsx`)

Add route: `/app/ai-general` pointing to the new `AIGeneral.tsx` page.

### 7. Admin tracking (database)

The existing `ai_agents` table already has `total_conversations` which gets incremented via `increment_agent_conversations` RPC. AI General will use this same mechanism. Admin can view stats in the existing `AIAgentsManager` dashboard.

Optionally add a `monthly_target` column to `ai_agents` so admins can set conversation targets for AI General.

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/app/AIGeneral.tsx` | **Create** -- Free AI chat page |
| `src/hooks/useAIGeneralChat.ts` | **Create** -- Credit-free chat hook |
| `src/lib/constants/agents.ts` | **Modify** -- Add ai-general agent |
| `src/layouts/TalentAppShell.tsx` | **Modify** -- Redirect search to AI General |
| `src/App.tsx` | **Modify** -- Add route |
| `src/lib/routes.ts` | **Modify** -- Add route constant |
| Database migration | Add `monthly_target` column to `ai_agents` |
| Database insert | Add ai-general agent row with system prompt |

## AI General System Prompt (Key Points)

The system prompt will instruct AI General to:
- Always respond with platform feature suggestions using markdown links
- Know routes like `/app/jobs`, `/app/learning`, `/app/agents/cv-coach`, etc.
- Suggest connecting to specialized agents for deeper help
- Be warm, brief, and action-oriented
- Never discuss topics outside the platform scope
- Use occasional Bangla phrases for rapport
