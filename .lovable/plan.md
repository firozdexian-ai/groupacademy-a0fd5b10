

# AI Agent Network - Comprehensive Transformation Plan

## Vision Summary

Transform the current AI Agents feature from a simple utility into a **human-like AI messaging network** where users interact with specialized AI personas. This creates a foundation for:

1. **Platform Agents** - Your career-focused AI experts (existing)
2. **Company Agents** - B2B branded agents ("Financial Advisor from City Bank")
3. **Specialized Agents** - Image generation, mental wellness, creative writing
4. **Variable Pricing** - Different credit costs per agent based on capabilities

---

## Current State Analysis

### What Exists
- 7 platform agents defined in `src/lib/constants/agents.ts`
- Database table `ai_agents` with system prompts (already DB-driven!)
- `agent_chat_sessions` table for conversation history
- Edge function `ai-agent-chat` with streaming responses
- Fixed 10 credits per 30-min session pricing
- Grid-style agent selection UI

### Current Limitations
- Static grid layout doesn't feel like a "network"
- No agent avatars or personality visualization
- Single flat credit rate for all agents
- No way for companies to create/sponsor agents
- No agent specializations (image gen, etc.)

---

## Phase 1: UI Transformation - "Messaging App" Experience

### Goal
Redesign the AI Agents page to feel like a messaging app (WhatsApp/Messenger style) rather than a service grid.

### Changes to `src/pages/app/AIAgents.tsx`

**New Layout Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  🔍 Search agents...                    [Filter ▼]      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐   │
│  │ 💬 ACTIVE CONVERSATIONS                          │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ [Avatar] CV Coach              2m ago • Active 🟢│   │
│  │          "Try adding quantifiable metrics..."    │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ [Avatar] Career Consultant     1h ago            │   │
│  │          "Your background in banking..."         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │ 🤖 ALL AGENTS                                    │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ [Avatar] Career Consultant          10 credits   │   │
│  │          Plan your professional journey           │   │
│  │          🏷️ Career Planning  Job Search          │   │
│  ├──────────────────────────────────────────────────┤   │
│  │ [Avatar] Interview Coach           10 credits    │   │
│  │          Ace your interviews                      │   │
│  │          🏷️ Mock Practice  STAR Method           │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### New Components to Create

1. **`AgentAvatar.tsx`** - Humanized agent representation
   - Circular avatar with gradient/icon
   - Online status indicator
   - Company badge (for B2B agents)

2. **`AgentListItem.tsx`** - Conversation-style row
   - Avatar + Name + Last message preview
   - Time ago + Credit cost badge
   - Active session indicator

3. **`AgentFilters.tsx`** - Category filtering
   - "All" / "Career" / "Skills" / "Education" / "Company"
   - Search functionality

### Changes to `AgentChatDialog.tsx`
- Add "typing" animation with agent personality
- Agent-specific welcome messages
- Suggested follow-up actions based on agent type

---

## Phase 2: Database Extensions for Rich Agent Profiles

### New Columns for `ai_agents` Table

```sql
ALTER TABLE ai_agents ADD COLUMN IF NOT EXISTS
  avatar_url TEXT,                      -- Custom avatar image
  credit_cost INTEGER DEFAULT 10,       -- Variable pricing
  session_duration_minutes INT DEFAULT 30,
  agent_type TEXT DEFAULT 'platform',   -- 'platform' | 'company' | 'specialized'
  company_id UUID REFERENCES companies(id), -- For B2B agents
  capabilities TEXT[] DEFAULT '{}',     -- ['text', 'image_generation', 'document_analysis']
  personality_traits JSONB,             -- {"tone": "warm", "formality": "professional"}
  sample_conversations JSONB,           -- Example Q&A for onboarding
  total_conversations INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),          -- Future: user ratings
  is_featured BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'career';       -- For filtering
```

### New Table: `company_agents` (B2B Agent Sponsorship)

```sql
CREATE TABLE company_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
  sponsorship_type TEXT, -- 'owned' | 'sponsored'
  monthly_budget INTEGER, -- Credit budget allocated
  credits_used INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(company_id, agent_id)
);
```

---

## Phase 3: Variable Credit Pricing

### Update `src/lib/creditPricing.ts`

```typescript
// Replace static AI_AGENT_CHAT cost with dynamic lookup
export const CREDIT_CONFIG = {
  // ...existing config...
  SERVICES: {
    AI_AGENT_CHAT: {
      name: 'AI Agent Session',
      cost: 10, // Default fallback
      description: 'Chat with AI career experts',
      isDynamic: true, // Flag for dynamic pricing
    },
    // New specialized agent types
    AI_AGENT_IMAGE: {
      name: 'AI Image Agent',
      cost: 25,
      description: 'Generate images with AI'
    },
    AI_AGENT_PREMIUM: {
      name: 'Premium AI Agent',
      cost: 50,
      description: 'Advanced AI consultation'
    }
  }
};
```

### Dynamic Credit Lookup in `useAgentChat.ts`

```typescript
// Fetch agent's actual credit cost from database
const getAgentCost = async (agentKey: string): Promise<number> => {
  const { data } = await supabase
    .from('ai_agents')
    .select('credit_cost')
    .eq('agent_key', agentKey)
    .single();
  
  return data?.credit_cost ?? CREDIT_CONFIG.SERVICES.AI_AGENT_CHAT.cost;
};
```

---

## Phase 4: Specialized Agent Capabilities

### Image Generation Agent

Create a new agent type that can generate images using the Lovable AI Gateway with `gemini-2.5-flash-image` model.

**New edge function: `ai-agent-image/index.ts`**

```typescript
// Handle image generation requests
if (agentCapabilities.includes('image_generation')) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [...messages]
    })
  });
  // Return image URL or base64
}
```

### Mental Wellness Agent

New agent with specialized prompts for mental wellness support:
- Mindfulness exercises
- Stress management
- Work-life balance guidance
- Non-clinical support (with clear disclaimers)

### Document Analysis Agent

Agent that can analyze uploaded documents:
- CV review with visual feedback
- Certificate verification
- Portfolio analysis

---

## Phase 5: B2B Company Agent System

### Admin Dashboard Enhancement

Add new section to `AIAgentsManager.tsx`:

```
┌─────────────────────────────────────────────────────────┐
│  🏢 COMPANY AGENTS                                       │
├─────────────────────────────────────────────────────────┤
│  + Create Company Agent                                  │
├─────────────────────────────────────────────────────────┤
│  [City Bank Logo] Financial Advisor                      │
│  🏷️ City Bank • Active • 156 conversations              │
│  💰 Budget: 5000/10000 credits used                      │
│  [Edit] [Deactivate]                                     │
├─────────────────────────────────────────────────────────┤
│  [TechCorp Logo] Tech Recruiter                          │
│  🏷️ TechCorp • Active • 89 conversations                │
│  [Edit] [Deactivate]                                     │
└─────────────────────────────────────────────────────────┘
```

### Company Agent Creation Flow

1. Select existing company from `companies` table
2. Define agent name & description
3. Write system prompt (with template)
4. Set credit cost (company pays per conversation)
5. Upload avatar (optional)
6. Define expertise areas

### User Experience

- Company agents appear with verified badge
- Users see "Powered by City Bank" branding
- Free for users (company pays credits)
- Company gets conversation analytics

---

## Phase 6: Agent Categories & Discovery

### Categories

| Category | Agents |
|----------|--------|
| 🎯 Career | Career Consultant, CV Coach, Interview Coach |
| 💰 Finance | Salary Negotiator, Company: City Bank Advisor |
| 📚 Education | IELTS Tutor, Study Abroad Advisor, Skill Advisor |
| 🎨 Creative | Image Generator, Portfolio Designer |
| 🧘 Wellness | Mental Wellness Coach, Work-Life Balance |
| 🏢 Company | All B2B sponsored agents |

### New UI Component: Category Tabs

```tsx
<Tabs defaultValue="all">
  <TabsList>
    <TabsTrigger value="all">All</TabsTrigger>
    <TabsTrigger value="career">🎯 Career</TabsTrigger>
    <TabsTrigger value="education">📚 Education</TabsTrigger>
    <TabsTrigger value="company">🏢 Companies</TabsTrigger>
  </TabsList>
</Tabs>
```

---

## Implementation Roadmap

### Sprint 1 (Week 1-2): UI Transformation
- [ ] Create `AgentAvatar.tsx` component
- [ ] Create `AgentListItem.tsx` for messaging-style rows
- [ ] Redesign `AIAgents.tsx` with active conversations at top
- [ ] Add search and filter functionality
- [ ] Improve `AgentChatDialog.tsx` welcome experience

### Sprint 2 (Week 3): Database & Pricing
- [ ] Run migration to add new `ai_agents` columns
- [ ] Create `company_agents` table
- [ ] Update `creditPricing.ts` for dynamic pricing
- [ ] Modify `useAgentChat.ts` to fetch agent cost
- [ ] Update edge function to read from DB

### Sprint 3 (Week 4): Specialized Agents
- [ ] Add Mental Wellness Agent to database
- [ ] Create Image Generation edge function
- [ ] Test image generation with Gemini model
- [ ] Add new agents to categories

### Sprint 4 (Week 5): B2B System
- [ ] Add Company Agent section to `AIAgentsManager.tsx`
- [ ] Create company agent creation dialog
- [ ] Implement credit budget tracking
- [ ] Add company branding to user-facing UI

### Sprint 5 (Week 6): Polish & Launch
- [ ] Add agent ratings system
- [ ] Implement conversation analytics
- [ ] Performance optimization
- [ ] User testing and feedback

---

## Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| `src/pages/app/AIAgents.tsx` | Modify | Complete UI redesign |
| `src/components/ai-agents/AgentAvatar.tsx` | Create | Humanized avatar component |
| `src/components/ai-agents/AgentListItem.tsx` | Create | Messaging-style row |
| `src/components/ai-agents/AgentFilters.tsx` | Create | Category & search |
| `src/components/ai-agents/AgentChatDialog.tsx` | Modify | Enhanced welcome, typing |
| `src/lib/constants/agents.ts` | Modify | Add new agent types |
| `src/lib/creditPricing.ts` | Modify | Dynamic pricing support |
| `src/hooks/useAgentChat.ts` | Modify | Fetch agent cost from DB |
| `supabase/functions/ai-agent-chat/index.ts` | Modify | Read prompts from DB |
| `supabase/functions/ai-agent-image/index.ts` | Create | Image generation |
| `src/components/dashboard/AIAgentsManager.tsx` | Modify | Add company agent management |
| Database migration | Create | Add new columns & tables |

---

## Technical Considerations

### Edge Function Enhancement

The current edge function has hardcoded prompts. Update to fetch from database:

```typescript
// Fetch agent config from DB instead of AGENT_PROMPTS constant
const { data: agent } = await supabaseClient
  .from('ai_agents')
  .select('system_prompt, capabilities, credit_cost')
  .eq('agent_key', agentKey)
  .eq('is_active', true)
  .single();

if (!agent) {
  return new Response(JSON.stringify({ error: 'Agent not found' }), { status: 404 });
}
```

### RLS Policies for Company Agents

```sql
-- Users can see active agents
CREATE POLICY "Anyone can view active agents"
ON ai_agents FOR SELECT
USING (is_active = true);

-- Only admins can modify agents
CREATE POLICY "Admins can manage agents"
ON ai_agents FOR ALL
USING (public.has_any_admin_role(auth.uid()));

-- Company agents: companies see their own
CREATE POLICY "Companies see their agents"
ON company_agents FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM company_users WHERE user_id = auth.uid()
  )
);
```

---

## Expected Outcomes

1. **User Experience**: Feels like chatting with knowledgeable professionals
2. **Engagement**: Conversation-style UI encourages return visits
3. **Revenue**: Variable pricing allows premium agent monetization
4. **B2B**: Companies can deploy branded AI representatives
5. **Scalability**: Database-driven agents enable rapid expansion

---

## Future Enhancements (Post-Launch)

1. **Voice Agents** - Real-time voice conversations using OpenAI Realtime API
2. **Agent Marketplace** - Third-party agent creators
3. **Agent-to-Agent** - Agents that can consult each other
4. **Proactive Agents** - Notifications like "Your CV Coach has tips for you"
5. **Multi-Agent Sessions** - Panel discussions with multiple AI experts

