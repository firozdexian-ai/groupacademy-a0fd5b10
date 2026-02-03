

# Enhanced Investor Relations System

## Understanding Your Requirements

### 1. MRR Target → Credit Usage Breakdown
When you set an MRR target (e.g., $2,000), the system will automatically calculate:
- **Total credits needed**: $2,000 × 50 = 100,000 credits/month
- **Service-wise targets**: Based on expected usage mix, broken down by each service

### 2. AI-Assisted Email Generation with Context
- Store investor replies and feedback
- Use full conversation history when generating emails
- Personalize based on past interactions, interests, and stage of relationship

---

## MRR Breakdown Logic

### Conversion Constants
```
$1 USD = 50 Credits
$10 USD = 500 Credits
1 Credit = $0.02 USD
```

### Service-Wise Expected Mix (Configurable)
Based on your platform's service costs and expected usage patterns:

| Service | Credit Cost | Expected Mix % | For $2,000 MRR (100K credits) |
|---------|-------------|----------------|-------------------------------|
| AI Agent Chat | 10 | 30% | 3,000 sessions |
| Job Match Score | 10 | 15% | 1,500 uses |
| Job Market Insight | 15 | 5% | 333 uses |
| Job Application | 25 | 15% | 600 applications |
| Career Assessment | 50 | 10% | 200 assessments |
| Mock Interview | 50 | 10% | 200 interviews |
| Salary Analysis | 50 | 8% | 160 analyses |
| IELTS Mock | 100 | 3% | 30 tests |
| Study Abroad Roadmap | 100 | 3% | 30 roadmaps |
| Portfolio | 500 | 1% | 2 portfolios |

### Visual Dashboard Widget
```
┌─────────────────────────────────────────────────────────────────────┐
│  MRR TARGET: $2,000                               [Edit Target]     │
├─────────────────────────────────────────────────────────────────────┤
│  Total Credit Target: 100,000 credits/month                         │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Service Targets (Auto-calculated)                           │   │
│  │                                                             │   │
│  │ AI Agent Chat      ████████████████████████  3,000 sessions │   │
│  │ Job Match Score    ████████████             1,500 uses      │   │
│  │ Job Application    ████████████             600 applications│   │
│  │ Career Assessment  ███████                  200 assessments │   │
│  │ Mock Interview     ███████                  200 interviews  │   │
│  │ Salary Analysis    █████                    160 analyses    │   │
│  │ ...                                                         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Current Month Progress: 45,000 / 100,000 (45%)                    │
│  ████████████████████░░░░░░░░░░░░░░░░░░░░░                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## AI-Assisted Email System

### Enhanced Investor Data Model
Store conversation context for personalized emails:

```sql
-- Enhanced ir_investors table
ir_investors:
  - full_name
  - vc_firm_id
  - email
  - notes
  - subscription_status
  - investor_interests TEXT[]     -- ["edtech", "ai", "emerging_markets"]
  - investment_stage TEXT         -- "seed", "series_a"
  - last_feedback TEXT            -- Latest feedback/reply summary
  - conversation_context TEXT     -- AI-readable summary of relationship

-- Investor interactions table (NEW)
ir_investor_interactions:
  - id
  - investor_id (FK)
  - interaction_type: "email_sent" | "reply_received" | "meeting" | "note"
  - subject TEXT
  - content TEXT                  -- Full email/reply content
  - sentiment: "positive" | "neutral" | "negative" | null
  - key_points TEXT[]             -- AI-extracted key points
  - follow_up_needed BOOLEAN
  - created_at
  - created_by (FK to auth.users)
```

### Email Composer with AI Assist
```
┌─────────────────────────────────────────────────────────────────────┐
│  COMPOSE EMAIL TO: John Smith (Sequoia Capital)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Email Type: [Weekly Update ▼]  [Introduction]  [Special Update]   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ CONVERSATION CONTEXT (Auto-loaded)                            │ │
│  │                                                               │ │
│  │ • Last email: Jan 28 - Weekly Update (Opened)                 │ │
│  │ • Last reply: "Interesting growth, keep me posted on MENA"    │ │
│  │ • Interests: EdTech, Emerging Markets, AI                     │ │
│  │ • Stage preference: Series A                                  │ │
│  │ • Sentiment: Positive                                         │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ PASTE INVESTOR REPLY/FEEDBACK (Optional)                      │ │
│  │                                                               │ │
│  │ [Paste any recent reply or meeting notes here...]            │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [🤖 Generate with AI]                                             │
│                                                                     │
│  Subject: ___________________________________________________      │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                                                               │ │
│  │ [AI-generated email content will appear here...]             │ │
│  │                                                               │ │
│  │ The AI will consider:                                         │ │
│  │ - Past conversation history                                   │ │
│  │ - Investor's stated interests                                 │ │
│  │ - Their last feedback/questions                               │ │
│  │ - Current company metrics                                     │ │
│  │                                                               │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  [Save Draft]  [Preview]  [📧 Open in Email Client]                │
└─────────────────────────────────────────────────────────────────────┘
```

### AI Email Generation Edge Function
The edge function will receive:
1. **Investor profile** - Name, firm, interests, stage preference
2. **Conversation history** - All past emails and replies
3. **Latest feedback** - Any new reply/note being added
4. **Current metrics** - MRR, growth, users from dashboard
5. **Email type** - Introduction, Weekly Update, or Special Update

---

## Database Schema (Enhanced)

### New Tables

```sql
-- 1. Monthly KPI Targets (with service mix)
CREATE TABLE ir_monthly_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month DATE NOT NULL UNIQUE,
  mrr_target_usd DECIMAL(12,2) NOT NULL,
  
  -- Auto-calculated fields (stored for historical tracking)
  total_credits_target INTEGER GENERATED ALWAYS AS (mrr_target_usd * 50) STORED,
  arr_target_usd DECIMAL(12,2) GENERATED ALWAYS AS (mrr_target_usd * 12) STORED,
  
  -- Service mix percentages (configurable)
  service_mix JSONB DEFAULT '{
    "AI_AGENT_CHAT": 30,
    "JOB_MATCH_SCORE": 15,
    "JOB_APPLICATION": 15,
    "CAREER_ASSESSMENT": 10,
    "MOCK_INTERVIEW": 10,
    "SALARY_ANALYSIS": 8,
    "JOB_MARKET_INSIGHT": 5,
    "IELTS_MOCK": 3,
    "STUDY_ABROAD_ROADMAP": 3,
    "PORTFOLIO": 1
  }',
  
  -- Other targets
  target_paying_users INTEGER,
  target_churn_rate DECIMAL(5,2) DEFAULT 5,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. VC Firms
CREATE TABLE ir_vc_firms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  stage_focus TEXT[],
  sector_focus TEXT[],
  website TEXT,
  linkedin_url TEXT,
  status TEXT DEFAULT 'prospecting',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Investors (enhanced with context fields)
CREATE TABLE ir_investors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vc_firm_id UUID REFERENCES ir_vc_firms(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  twitter_handle TEXT,
  
  -- Context for AI personalization
  investor_interests TEXT[],
  investment_stage_pref TEXT,
  relationship_summary TEXT,
  last_feedback_summary TEXT,
  
  subscription_status TEXT DEFAULT 'pending',
  last_contacted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Investor Interactions (conversation history)
CREATE TABLE ir_investor_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES ir_investors(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL, -- email_sent, reply_received, meeting, call, note
  subject TEXT,
  content TEXT,
  sentiment TEXT, -- positive, neutral, negative
  key_points TEXT[],
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Email Communications (sent emails with tracking)
CREATE TABLE ir_email_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID REFERENCES ir_investors(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  ai_generated BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  sent_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft',
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Metrics Snapshots (for tracking progress over time)
CREATE TABLE ir_metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  mrr_usd DECIMAL(12,2),
  arr_usd DECIMAL(12,2),
  total_credits_consumed INTEGER,
  paying_users INTEGER,
  total_users INTEGER,
  mom_growth_rate DECIMAL(5,2),
  service_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Edge Function: generate-investor-email

```typescript
// Key inputs for AI email generation:
interface GenerateEmailRequest {
  investorId: string;
  emailType: 'introduction' | 'weekly_update' | 'special_update';
  newFeedback?: string;          // Pasted reply/feedback
  specialUpdateTopic?: string;   // For special updates
  customInstructions?: string;   // Any specific points to include
}

// AI will receive context:
interface AIContext {
  investor: {
    name: string;
    firm: string;
    interests: string[];
    stagePreference: string;
    relationshipSummary: string;
  };
  conversationHistory: Array<{
    date: string;
    type: string;
    content: string;
    sentiment?: string;
  }>;
  currentMetrics: {
    mrr: number;
    mrrGrowth: number;
    users: number;
    highlights: string[];
  };
  newFeedback?: string;
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/lib/irConfig.ts` | IR constants, USD/credit conversion helpers |
| `src/components/dashboard/ir/IRDashboard.tsx` | Main dashboard with MRR breakdown |
| `src/components/dashboard/ir/MRRTargetManager.tsx` | Set targets, view service breakdown |
| `src/components/dashboard/ir/VCFirmsManager.tsx` | CRUD for VC firms |
| `src/components/dashboard/ir/InvestorsManager.tsx` | CRUD for investors with context |
| `src/components/dashboard/ir/InvestorDetailSheet.tsx` | View investor + interactions |
| `src/components/dashboard/ir/EmailComposer.tsx` | AI-assisted email composition |
| `src/components/dashboard/ir/InteractionLogger.tsx` | Log replies, meetings, notes |
| `src/lib/irEmailTemplates.ts` | Base templates for emails |
| `supabase/functions/generate-investor-email/index.ts` | AI email generation |
| Database migration | 6 new tables |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AdminSidebar.tsx` | Add "Investor Relations" nav group |
| `src/pages/Dashboard.tsx` | Add IR tab routing |
| `src/lib/creditPricing.ts` | Add USD conversion constants |

---

## Admin Sidebar Addition

```typescript
{
  title: "Investor Relations",
  icon: Landmark, // or TrendingUp
  roles: ["admin"],
  items: [
    { title: "IR Dashboard", icon: LayoutDashboard, value: "ir-dashboard" },
    { title: "MRR Targets", icon: Target, value: "ir-targets" },
    { title: "VC Firms", icon: Building2, value: "ir-vcs" },
    { title: "Investors", icon: Users, value: "ir-investors" },
    { title: "Email Updates", icon: Mail, value: "ir-emails" },
  ],
}
```

---

## Key Workflows

### 1. Setting MRR Target
1. Admin enters MRR target (e.g., $2,000)
2. System auto-calculates:
   - Total credits needed (100,000)
   - Service-wise targets based on mix percentages
   - ARR, required users, break-even point
3. Dashboard shows progress vs targets

### 2. Managing Investor Relationship
1. Add VC firm → Add investor contact
2. Set investor interests and stage preference
3. View full conversation history in detail sheet
4. Log any replies/meetings/notes

### 3. Sending AI-Assisted Email
1. Select investor to email
2. Optionally paste any recent reply/feedback
3. System loads conversation context
4. Click "Generate with AI"
5. AI creates personalized email considering:
   - All past interactions
   - Investor's interests
   - Current metrics
   - Their last feedback
6. Edit if needed, then send via mailto link
7. System auto-logs as interaction

---

## Summary

This enhanced IR system provides:

1. **Smart MRR Planning** - Set target, see automatic service-wise credit breakdown
2. **Relationship Memory** - Track all interactions with each investor
3. **AI Personalization** - Generate emails that reference past conversations
4. **Feedback Integration** - Paste replies to inform future communications
5. **Global Currency** - All metrics in USD ($10 = 500 credits standard)

