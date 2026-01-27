
# Learning Tab Complete Revamp Plan

## Current State Analysis

### What Exists Today

**Route Structure:**
- `/app/learning` - LearningHub (main dashboard)
- `/app/learning/tracks` - Career Tracks/Professions
- `/app/learning/courses` - Course listings
- `/app/learning/courses/:slug` - Course details
- `/app/learning/my-courses` - User's enrollments
- `/app/learning/events` - Events/Webinars
- `/app/learning/competitions` - Competitions
- `/app/learning/blog` - Blog articles
- `/app/learn/:slug` - Immersive course player

**Content Stats:**
- 6 published courses (3 recorded, 1 free video, 2 other types)
- 12 modules across courses
- 15 total enrollments (1 completed)
- 6 blog posts, 3 competitions

### Problems Identified

1. **Fragmented Navigation**: 6 category cards (Tracks, Courses, Events, Competitions, Webinars, Blog) create cognitive overload
2. **Weak "Continue Learning" Section**: Small cards, no urgency indicators, no learning streaks
3. **No Skill Progress Visualization**: Users don't see their overall skill development journey
4. **Banner Carousel Disconnect**: Current banner just shows images with no context or learning relevance
5. **Missing Gamification**: No learning streaks, badges, or achievement indicators
6. **No Quick Actions**: Users must navigate multiple pages to resume learning
7. **Underutilized AI Instructor**: No visibility of AI learning assistants on the hub
8. **Category-Heavy Approach**: Too many separate pages (tracks, courses, events, etc.) instead of unified discovery

---

## Proposed Revamp: "Learning Journey" Design

### Design Philosophy

Transform from a **category browser** to a **personalized learning journey** with:
- Clear progress visualization
- Quick resume actions
- Skill-based discovery
- Gamification elements
- AI instructor integration

---

## New Component Architecture

```text
LearningHub (Revamped)
├── HeaderSection
│   ├── WelcomeMessage (personalized)
│   ├── LearningStreak (days in a row)
│   └── CreditsBalance (mini display)
├── ContinueLearning (Priority Section)
│   ├── ActiveCourseCard (large, prominent)
│   │   ├── Progress Ring
│   │   ├── "Resume" CTA
│   │   ├── NextUpModule indicator
│   │   └── TimeEstimate
│   └── UpNextQueue (horizontal scroll)
├── DiscoverySection
│   ├── CategoryPills (horizontal filter)
│   │   └── All | Courses | Videos | Events | Blog
│   └── ContentGrid (unified cards)
├── SkillProgressSection (New)
│   ├── SkillBadges (earned)
│   └── InProgressSkills (with % completion)
├── AIInstructorWidget (New)
│   └── "Ask Your AI Instructor" CTA
└── QuickStats (Simplified Footer)
    ├── Completed Courses
    ├── Certificates Earned
    └── Learning Hours
```

---

## Detailed Component Specifications

### 1. Header Section (Revamped)

**Current:** Generic "Learning Hub" title with description
**New:** Dynamic, personalized header

```text
┌──────────────────────────────────────────────────────────────┐
│ 🔥 3-day streak!                              15 Credits 💎  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Good morning, Shalal!                                       │
│  You're 65% through "B2B Selling in Bangladesh"              │
│                                                              │
│  [Resume Learning →]                                         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Features:
- Learning streak counter (gamification)
- Personalized greeting with time of day
- Current course progress callout
- Primary CTA to resume immediately

---

### 2. Active Learning Section (Priority)

**Current:** 3-column grid of small course cards
**New:** Hero-style featured active course + up-next queue

```text
┌────────────────────────────────────────────────────────────────────────┐
│ ▶ CONTINUE WHERE YOU LEFT OFF                                          │
├────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐  ┌──────────┐  ┌──────────┐│
│ │ [Course Image]                          │  │ Up Next  │  │ Module 3 ││
│ │                                         │  │ Module 2 │  │ Practice ││
│ │  Introduction to B2B/B2C Selling        │  │ Learn    │  │          ││
│ │  ─────────────────────── 65%            │  │          │  │          ││
│ │  [████████████░░░░░░░░░]                │  │ 15 min   │  │ 20 min   ││
│ │                                         │  └──────────┘  └──────────┘│
│ │  Module 2: Territory Management         │                            │
│ │  Stage 3: Discuss (20 min left)         │                            │
│ │                                         │                            │
│ │  [🎯 Resume Now]  [📋 View Modules]     │                            │
│ └─────────────────────────────────────────┘                            │
└────────────────────────────────────────────────────────────────────────┘
```

Features:
- Large hero card for primary active course
- Progress bar with percentage
- Current module and stage indicator
- Time estimate to complete
- Horizontal scroll for "Up Next" modules
- One-click resume action

---

### 3. Discovery Section (Unified)

**Current:** 6 separate category cards leading to different pages
**New:** Single unified discovery with filter pills

```text
┌──────────────────────────────────────────────────────────────┐
│ 📚 Explore & Learn                                           │
├──────────────────────────────────────────────────────────────┤
│ [All] [Courses(3)] [Videos(1)] [Events(2)] [Articles(6)]    │
├──────────────────────────────────────────────────────────────┤
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ 📖 Course  │ │ 🎬 Video   │ │ 📰 Article │ │ 📖 Course  │ │
│ │ Title...   │ │ Title...   │ │ Title...   │ │ Title...   │ │
│ │ FREE/50cr  │ │ FREE       │ │ 3 min read │ │ 100 cr     │ │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
│                                                              │
│              [View All Courses →]                            │
└──────────────────────────────────────────────────────────────┘
```

Features:
- Horizontal pill filters (in-page, no navigation)
- Unified content cards with type badges
- Inline loading (no page transitions)
- "View All" for full catalog when needed

---

### 4. Skills Progress Section (New)

Track skill development across courses tied to profession lines.

```text
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Your Skills                                               │
├──────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐             │
│ │ 🏅 EARNED   │ │ 📊 75%      │ │ 📊 30%      │             │
│ │ Prospecting │ │ Negotiation │ │ Territory   │             │
│ └─────────────┘ └─────────────┘ └─────────────┘             │
└──────────────────────────────────────────────────────────────┘
```

Features:
- Visual skill badges for completed areas
- Progress rings for in-progress skills
- Connected to profession line competencies

---

### 5. AI Instructor Widget (New)

Surface the AI instructor directly on the learning hub.

```text
┌──────────────────────────────────────────────────────────────┐
│ 🤖 Ask Your AI Instructor                                    │
├──────────────────────────────────────────────────────────────┤
│ [Sarah Rahman - Sales & Distribution Expert]                 │
│                                                              │
│ "Having trouble with territory mapping? I can help you       │
│  understand the FMCG distribution channels in Bangladesh."   │
│                                                              │
│ [💬 Start Conversation]                                      │
└──────────────────────────────────────────────────────────────┘
```

Features:
- Shows relevant AI instructor based on enrolled courses
- Contextual prompt based on current learning
- Direct link to agent chat

---

## Technical Implementation

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/app/LearningHub.tsx` | Complete rewrite |
| `src/components/learning/ActiveCourseHero.tsx` | Hero card for current course |
| `src/components/learning/LearningStreak.tsx` | Streak counter widget |
| `src/components/learning/SkillProgressGrid.tsx` | Skills visualization |
| `src/components/learning/UnifiedDiscovery.tsx` | Filterable content grid |
| `src/components/learning/AIInstructorWidget.tsx` | AI instructor CTA |
| `src/hooks/useLearningStats.ts` | Aggregate learning metrics |

### Database Enhancements

Add learning streak tracking:

```sql
-- Track daily learning activity for streaks
CREATE TABLE IF NOT EXISTS public.learning_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id uuid REFERENCES talents(id) NOT NULL,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  minutes_learned integer DEFAULT 0,
  modules_completed integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(talent_id, activity_date)
);

-- Enable RLS
ALTER TABLE public.learning_activity ENABLE ROW LEVEL SECURITY;

-- Users can only see their own activity
CREATE POLICY "Users can view own learning activity"
  ON public.learning_activity FOR SELECT
  USING (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own learning activity"
  ON public.learning_activity FOR INSERT
  WITH CHECK (talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid()));
```

### Hook: useLearningStats

```typescript
interface LearningStats {
  currentStreak: number;
  longestStreak: number;
  totalHoursLearned: number;
  coursesCompleted: number;
  certificatesEarned: number;
  currentCourse: Enrollment | null;
  upNextModules: Module[];
  skillProgress: SkillProgress[];
}
```

---

## Migration Strategy

### Phase 1: Core Revamp
1. Create new `LearningHub.tsx` with revamped layout
2. Build `ActiveCourseHero` component
3. Build `UnifiedDiscovery` with filter pills
4. Keep existing sub-routes unchanged (courses, tracks, etc.)

### Phase 2: Gamification
1. Add `learning_activity` table
2. Build `LearningStreak` component
3. Track activity on stage completions

### Phase 3: Skills & AI
1. Build `SkillProgressGrid` 
2. Build `AIInstructorWidget`
3. Connect to profession line competencies

---

## Visual Design Guidelines

**Color Palette for Learning:**
- Primary actions: Tech Blue (#2A7DDE)
- Progress indicators: Success Green (#10D576)
- Streak/gamification: Warning Yellow/Orange
- Content type badges: Varied by type

**Card Styling:**
- Active course: Large shadow, prominent border
- Discovery cards: Subtle, hover elevation
- Skill badges: Circular with ring progress

**Mobile Considerations:**
- Stack layout for active course
- Horizontal scroll for discovery
- Bottom sheet for AI instructor

---

## Expected Outcomes

1. **Reduced Navigation Friction**: 60% fewer page transitions to resume learning
2. **Increased Engagement**: Streak visualization encourages daily return
3. **Clearer Progress**: Users see exactly where they are and what's next
4. **Unified Discovery**: One place to find all learning content
5. **AI Integration**: Visible learning assistant increases feature usage

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/app/LearningHub.tsx` | Complete rewrite with new architecture |
| `src/App.tsx` | No changes needed (routes stay same) |
| `src/hooks/useStageProgress.ts` | Add activity tracking call |
| `src/layouts/TalentAppShell.tsx` | No changes needed |

### New Files

| File | Purpose |
|------|---------|
| `src/components/learning/ActiveCourseHero.tsx` | Large hero card |
| `src/components/learning/LearningStreak.tsx` | Streak widget |
| `src/components/learning/UnifiedDiscovery.tsx` | Filter + grid |
| `src/components/learning/QuickStats.tsx` | Summary stats |
| `src/hooks/useLearningStats.ts` | Aggregate data hook |

