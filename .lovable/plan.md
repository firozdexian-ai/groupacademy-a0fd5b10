

# Phase 2: AI Agent Personas + Services Merge

## Overview

Transform the AI Agents page into a two-tab hub ("Agent Network" and "Chats") with persona-style agent cards that prioritize photos over icons. Merge Career Services (Assessment, Mock Interview, Salary Analysis, Portfolio) into this hub as service-type agents, giving seekers a unified conversational experience.

---

## What Changes

### 1. AI Agents Page -- Two-Tab Layout

Replace the current single-scroll layout in `AIAgents.tsx` with two tabs:

- **Agent Network tab**: Shows the hero header, filters, and agent grid (same content as now, but with updated cards showing avatar photos)
- **Chats tab**: Shows active sessions at top, then recent chat history below (content currently scattered across the page moves here)

This uses Radix Tabs -- already installed in the project.

### 2. Agent Card Redesign (Photo-First Personas)

Update `AgentCard.tsx` to prioritize `avatar_url` photos:
- If `avatar_url` exists: show a circular photo with the agent name and description below
- If no photo: fall back to the current icon-in-circle design
- Keep credit cost badge and Chat Now / Resume button

Update `AgentListItem.tsx` similarly for the Chats tab list items -- show avatar photo when available.

### 3. Merge Career Services into Agent Network

Add career service shortcuts directly into the Agent Network tab as a "Career Tools" section below the agent grid. These are NOT chat agents -- they link to existing service pages:

| Tool | Route | Credit Cost |
|------|-------|-------------|
| Career Scorecard | /app/services/assessment | 50 |
| Mock Interview | /app/services/mock-interview | 50 |
| Salary Analysis | /app/services/salary-analysis | 50 |
| Portfolio Builder | /app/services/portfolio | 500 |

This eliminates the need for a separate Services page. The `/app/services` route will redirect to `/app/agents` so existing links and Quick Actions still work.

### 4. Quick Actions Grid Update

Update `QuickActionsGrid.tsx`:
- Remove the separate "Services" quick action (since it merges into Agents)
- Keep "AI Agents" which now covers both
- Replace "Services" slot with "Abroad" (currently missing from quick actions)

### 5. AgentChat Page -- Avatar Support

Update `AgentChat.tsx` and `AgentChatDialog.tsx` to show the agent's avatar photo in the chat header and message bubbles instead of just icon fallbacks.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/app/AIAgents.tsx` | Add Tabs (Agent Network / Chats), add Career Tools section |
| `src/components/ai-agents/AgentCard.tsx` | Photo-first avatar rendering |
| `src/components/ai-agents/AgentListItem.tsx` | Photo-first avatar in list items |
| `src/components/ai-agents/AgentChatDialog.tsx` | Support avatar_url in chat header and message bubbles |
| `src/pages/app/AgentChat.tsx` | Pass avatar_url to chat dialog, fetch from DB agents |
| `src/components/feed/QuickActionsGrid.tsx` | Remove "Services", add "Abroad" |
| `src/App.tsx` | Add redirect from `/app/services` to `/app/agents` |

## No Database Changes Needed

The `ai_agents` table already has all required columns (`avatar_url`, `personality_traits`, `category`). Admins can upload agent photos via the existing AI Agents Manager in the dashboard.

---

## Technical Details

### Tab Structure (AIAgents.tsx)

```text
Tabs
  +-- TabsList: "Agent Network" | "Chats"
  +-- TabsContent "network":
  |     +-- Hero Header (existing)
  |     +-- AgentFilters (existing)
  |     +-- Agent Grid (existing, with photo-first cards)
  |     +-- Career Tools Section (NEW -- 4 service cards)
  +-- TabsContent "chats":
        +-- Active Sessions (moved from current page)
        +-- Recent Chats (moved from current page)
        +-- Empty state if no conversations
```

### Career Tools Section

A simple grid of 4 cards linking to existing service routes. Each card shows icon, title, description, and credit cost. Clicking navigates directly to the service page (no chat, just existing form flow). Styled consistently with agent cards but with a subtle "Tool" badge to differentiate.

### Services Route Redirect

In `App.tsx`, change the `/app/services` route to render a `Navigate` component that redirects to `/app/agents`. This ensures existing bookmarks, Quick Action links, and shared URLs continue to work.

