

# AI Study Abroad Roadmap - Personalized Application Planner

## Problem Analysis

Study abroad seekers face these key pain points:

1. **Information Overload** - Too many countries, universities, programs to research
2. **No Clear Timeline** - Don't know when to start, what deadlines matter
3. **Document Confusion** - Unclear what documents are needed and when
4. **Financial Uncertainty** - Budget planning, scholarship opportunities unclear
5. **Generic Advice** - Most resources aren't personalized to their profile

## Solution: AI-Powered Study Abroad Roadmap

A premium credit-gated service that generates a **fully personalized 12-month application roadmap** based on the user's profile, goals, and constraints.

---

## Feature Overview

### User Flow

```text
┌─────────────────────────────────────────────────────────────────┐
│  1. ENTRY POINT (from CareerAbroad or StudyAbroad page)         │
│     "Get My Personalized Roadmap" → 100 credits                 │
├─────────────────────────────────────────────────────────────────┤
│  2. INTAKE FORM (multi-step wizard)                             │
│     • Target Countries (1-3 selections)                         │
│     • Degree Level (Bachelor/Master/PhD)                        │
│     • Field of Study preference                                 │
│     • Target Intake (Fall 2026, Spring 2027, etc.)              │
│     • Budget Range (Low/Medium/High/Scholarship-dependent)      │
│     • Current IELTS/TOEFL score (or "Not taken yet")            │
│     • Profile source: Use existing CV OR fill form              │
├─────────────────────────────────────────────────────────────────┤
│  3. AI PROCESSING                                               │
│     • Analyze CV/profile for eligibility signals                │
│     • Match against country requirements                        │
│     • Generate month-by-month timeline                          │
│     • Identify scholarship opportunities                        │
│     • Create document checklist                                 │
├─────────────────────────────────────────────────────────────────┤
│  4. ROADMAP OUTPUT                                              │
│     • Interactive timeline view                                 │
│     • Downloadable PDF report                                   │
│     • Recommended universities (3-5)                            │
│     • Month-by-month action items                               │
│     • Document checklist with deadlines                         │
│     • Estimated budget breakdown                                │
│     • Scholarship matches                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Roadmap Output Structure

The AI will generate a comprehensive report containing:

### 1. Profile Assessment Summary
- Education match score for target country
- Skills/experience alignment with field
- Identified strengths and gaps

### 2. Recommended Universities (3-5)
For each university:
- University name and ranking
- Program name and duration
- Tuition estimate
- Why it's a good fit for this profile
- Application deadline
- Acceptance rate tier (Reach/Target/Safety)

### 3. 12-Month Application Timeline
Month-by-month breakdown:
- **Month 1-2**: Research & Test Prep
- **Month 3-4**: IELTS/TOEFL preparation
- **Month 5**: Take standardized tests
- **Month 6-7**: Document preparation (SOP, LORs)
- **Month 8-9**: Application submissions
- **Month 10-11**: Interview preparation
- **Month 12**: Decision & Visa process

### 4. Document Checklist
- Academic transcripts
- IELTS/TOEFL scores
- Statement of Purpose (SOP)
- Letters of Recommendation
- CV/Resume
- Portfolio (if applicable)
- Financial documents
- Passport copy

### 5. Budget Breakdown
- Tuition range
- Living expenses estimate
- Application fees
- Test fees
- Visa costs
- Travel costs
- Emergency fund recommendation

### 6. Scholarship Opportunities
Matched scholarships based on:
- Nationality
- Field of study
- Academic performance
- Financial need

---

## Technical Implementation

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/app/StudyAbroadRoadmap.tsx` | Main setup wizard page |
| `src/pages/app/StudyAbroadRoadmapResults.tsx` | Results display page |
| `src/components/abroad/RoadmapIntakeForm.tsx` | Multi-step intake form |
| `src/components/abroad/RoadmapTimeline.tsx` | Visual timeline component |
| `src/components/abroad/RoadmapPDFTemplate.tsx` | PDF generation template |
| `supabase/functions/generate-study-roadmap/index.ts` | AI edge function |

### Database Changes

New table: `study_abroad_roadmaps`

```sql
CREATE TABLE study_abroad_roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  talent_id UUID REFERENCES talents(id),
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  
  -- Intake preferences
  target_countries TEXT[] NOT NULL,
  degree_level TEXT NOT NULL,
  field_of_study TEXT,
  target_intake TEXT,
  budget_level TEXT,
  ielts_score DECIMAL(2,1),
  has_taken_ielts BOOLEAN DEFAULT false,
  
  -- Profile data snapshot
  cv_text TEXT,
  education_summary JSONB,
  experience_summary JSONB,
  
  -- AI Output
  roadmap_result JSONB,
  status TEXT DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

### Credit Pricing

Add to `creditPricing.ts`:

```typescript
STUDY_ABROAD_ROADMAP: {
  name: 'AI Study Abroad Roadmap',
  cost: 100,
  description: 'Personalized 12-month application plan with university recommendations'
}
```

### Edge Function: `generate-study-roadmap`

AI prompt will include:
- User's education history and GPA
- Work experience
- Target countries and their requirements
- Field of study preferences
- Budget constraints
- Current English proficiency

Output structure:
```typescript
interface RoadmapResult {
  profileSummary: {
    strengths: string[];
    gaps: string[];
    overallReadiness: 'high' | 'medium' | 'low';
  };
  recommendedUniversities: Array<{
    name: string;
    country: string;
    program: string;
    ranking?: string;
    tuitionRange: string;
    fitReason: string;
    deadline: string;
    tier: 'reach' | 'target' | 'safety';
  }>;
  timeline: Array<{
    month: number;
    title: string;
    tasks: string[];
    deadline?: string;
  }>;
  documents: Array<{
    name: string;
    required: boolean;
    deadline?: string;
    tips: string;
  }>;
  budget: {
    tuitionRange: string;
    livingExpenses: string;
    applicationFees: string;
    testFees: string;
    visaCosts: string;
    totalEstimate: string;
  };
  scholarships: Array<{
    name: string;
    amount: string;
    eligibility: string;
    deadline?: string;
  }>;
}
```

---

## UI/UX Design

### Entry Point - Add to CareerAbroad.tsx

New prominent card in the Career Abroad hub:

```text
┌─────────────────────────────────────────────────────────────────┐
│  🗺️  GET YOUR PERSONALIZED ROADMAP                              │
│                                                                 │
│  Not sure where to start? Let AI create a step-by-step         │
│  application plan tailored to your profile and goals.          │
│                                                                 │
│  ✓ University recommendations based on your profile            │
│  ✓ 12-month timeline with deadlines                            │
│  ✓ Document checklist                                          │
│  ✓ Scholarship matches                                         │
│  ✓ Budget breakdown                                            │
│                                                                 │
│  [Get My Roadmap - 100 Credits]                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Intake Form (3-step wizard)

**Step 1: Destination & Program**
- Target countries (multi-select, max 3)
- Degree level (Bachelor/Master/PhD)
- Field of study (dropdown)
- Target intake semester

**Step 2: Profile & Readiness**
- Use existing CV? (toggle)
- Current IELTS score (optional)
- GPA or academic standing
- Years of work experience

**Step 3: Budget & Preferences**
- Budget level (Low/Medium/High/Scholarship-only)
- Part-time work interest
- Family support available
- Specific requirements (e.g., spouse visa)

### Results Page

Interactive dashboard with:
- **Timeline Tab**: Visual month-by-month roadmap
- **Universities Tab**: Recommended schools with details
- **Documents Tab**: Checklist with progress tracking
- **Budget Tab**: Cost breakdown
- **Download PDF**: Full report export

---

## Integration Points

### 1. Connect to Existing Study Abroad Advisor Agent
- CTA: "Have questions about your roadmap? Chat with our Study Abroad Advisor"
- Pass roadmap context to agent for follow-up conversations

### 2. Connect to IELTS Prep
- If IELTS score is low or not taken, recommend IELTS prep resources
- "Your timeline shows IELTS in Month 3 - Start preparing now"

### 3. Save to Profile
- Store roadmap preferences in talent profile
- Enable "Re-generate" with updated info

---

## Business Value

| Metric | Impact |
|--------|--------|
| **Revenue** | 100 credits per roadmap = significant monetization |
| **Engagement** | Users return to track progress against timeline |
| **Lead Quality** | Captures detailed study abroad intent data |
| **Upsell Path** | Roadmap → IELTS Prep → Advisor Chat → Portfolio |
| **Differentiation** | No competitor offers AI-personalized roadmaps |

---

## Implementation Phases

### Phase 1: Core Feature (Week 1-2)
- Database table and RLS policies
- Intake form wizard (3 steps)
- Edge function with AI prompt
- Basic results display

### Phase 2: Results Enhancement (Week 3)
- Interactive timeline component
- University cards with details
- Document checklist with checkboxes
- PDF export

### Phase 3: Integration (Week 4)
- Connect to Study Abroad Advisor agent
- Add to CareerAbroad hub
- Progress tracking persistence
- Re-generate functionality

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/pages/app/StudyAbroadRoadmap.tsx` | Create | Setup wizard page |
| `src/pages/app/StudyAbroadRoadmapResults.tsx` | Create | Results display |
| `src/components/abroad/RoadmapIntakeForm.tsx` | Create | Multi-step form |
| `src/components/abroad/RoadmapTimeline.tsx` | Create | Timeline visualization |
| `src/components/abroad/RoadmapPDFTemplate.tsx` | Create | PDF export template |
| `supabase/functions/generate-study-roadmap/index.ts` | Create | AI analysis function |
| `src/pages/app/CareerAbroad.tsx` | Modify | Add entry point CTA |
| `src/lib/creditPricing.ts` | Modify | Add service pricing |
| `src/lib/routes.ts` | Modify | Add new routes |
| Database migration | Create | New table + RLS |

---

## Summary

This feature transforms the Study Abroad section from a **passive directory** into an **active AI career planning tool**. Users get:

1. **Clarity** - Know exactly what to do and when
2. **Personalization** - Recommendations based on their unique profile
3. **Confidence** - Expert-level guidance at a fraction of consultant costs
4. **Action** - Downloadable plan they can execute immediately

It aligns perfectly with GroUp Academy's mission of **AI-powered career guidance** and creates a high-value monetization opportunity while genuinely solving user pain points.

