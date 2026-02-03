
# Admin Dashboard Reorganization Plan

## Current Issues Identified

### Issue 1: Content Management is Bloated (15 items!)
The "Content Management" group has become a catch-all with unrelated items mixed together:
- Core content tools (All Content, Videos, Courses, Webinars, Batches, Seminars)
- Learning analytics (Enrollments, Learner Progress)
- Marketing outreach (Content Outreach, Service Outreach)
- Career abroad content (Study Abroad, IELTS Resources)
- Social/engagement content (Blog Posts, Feed Posts, Competitions)

### Issue 2: Marketing Analytics Misplaced
"Marketing Analytics" is under **Recruitment** but it tracks content shares, service shares, and job shares - it's a cross-cutting concern that belongs with other marketing tools.

### Issue 3: Outreach Tools Scattered
- **CV Outreach** is under Talent Management
- **Content Outreach** is under Content Management
- **Service Outreach** is under Content Management

These are all marketing/outreach activities and should be grouped together.

### Issue 4: Missing Study Abroad Roadmap Leads
We just built the AI Study Abroad Roadmap feature but there's no admin view to see roadmap requests/leads.

### Issue 5: Platform Settings is a Dumping Ground
Contains unrelated items: UI config (Banners), data config (Professions), AI systems (Agents), monetization (Credits), and team management.

---

## Proposed Reorganization

### Before (Current Structure):
```
Talent Management (7 items)
├── Talent Pool
├── Lead Hunter
├── Assessment Leads
├── Mock Interviews
├── Salary Analysis
├── Portfolio Requests
└── CV Outreach          ← Outreach tool

Recruitment (6 items)
├── Jobs KPIs
├── Manage Jobs
├── Applications
├── Companies
├── Contacts
└── Marketing Analytics  ← Cross-cutting, misplaced

Content Management (15 items!)  ← Too many!
├── All Content
├── Enrollments          ← Learning analytics
├── Learner Progress     ← Learning analytics
├── Content Outreach     ← Marketing tool
├── Service Outreach     ← Marketing tool
├── Free Videos
├── Recorded Courses
├── Webinars
├── Batch Classes
├── Seminars
├── Blog Posts           ← Marketing/engagement
├── Feed Posts           ← Marketing/engagement
├── Study Abroad         ← Career Abroad
├── IELTS Resources      ← Career Abroad
└── Competitions

Platform Settings (9 items)
├── Access Codes
├── Banners
├── Professions
├── AI Agents
├── Company Agents
├── Agent Sessions
├── Credits
├── Notifications
└── Team Members
```

### After (Proposed Structure):
```
Talent & Leads (6 items)
├── Talent Pool
├── Lead Hunter
├── Assessment Leads
├── Mock Interview Leads
├── Salary Analysis Leads
└── Portfolio Requests

Recruitment (5 items)
├── Jobs KPIs
├── Manage Jobs
├── Applications
├── Companies
└── Contacts

Learning (6 items)
├── All Content
├── Enrollments
├── Learner Progress
├── Free Videos
├── Recorded Courses
├── Webinars/Batches/Seminars

Marketing & Outreach (7 items)  ← NEW consolidated group
├── Marketing Analytics
├── CV Outreach
├── Content Outreach
├── Service Outreach
├── Blog Posts
├── Feed Posts
└── Competitions

Career Abroad (3 items)  ← NEW focused group
├── Study Abroad Programs
├── IELTS Resources
└── Roadmap Leads        ← NEW - to track roadmap requests

AI & Monetization (5 items)  ← NEW focused group
├── AI Agents
├── Company Agents
├── Agent Sessions
├── Credits Manager
└── Notifications

Platform Config (4 items)  ← Slimmed down
├── Access Codes
├── Banners
├── Professions
└── Team Members
```

---

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/dashboard/AdminSidebar.tsx` | Reorganize `navGroups` array with new structure |
| `src/pages/Dashboard.tsx` | Add new tab for "roadmap-leads", update `tabAccessMap` |
| `src/components/dashboard/StudyAbroadRoadmapLeadsManager.tsx` | **CREATE** - New component to view roadmap requests |

### New Component: StudyAbroadRoadmapLeadsManager
A new admin component to view and manage study abroad roadmap requests:
- List all roadmap submissions with status
- View user preferences (countries, budget, intake)
- See AI-generated results
- Filter by status (pending, processing, completed, failed)
- Export functionality

### Sidebar Group Changes (AdminSidebar.tsx)

```typescript
const navGroups: NavGroup[] = [
  {
    title: "Talent & Leads",
    icon: Users,
    roles: ["admin", "talent_exec"],
    items: [
      { title: "Talent Pool", icon: DatabaseIcon, value: "talent" },
      { title: "Lead Hunter", icon: Target, value: "lead-hunter" },
      { title: "Assessment Leads", icon: ClipboardList, value: "leads" },
      { title: "Mock Interview Leads", icon: MessageSquare, value: "interviews" },
      { title: "Salary Analysis Leads", icon: TrendingUp, value: "salary" },
      { title: "Portfolio Requests", icon: Briefcase, value: "portfolios" },
    ],
  },
  {
    title: "Recruitment",
    icon: Briefcase,
    roles: ["admin", "talent_exec"],
    items: [
      { title: "Jobs KPIs", icon: TrendingUp, value: "jobs-kpis" },
      { title: "Manage Jobs", icon: Building2, value: "jobs" },
      { title: "Applications", icon: FileCheck, value: "applications" },
      { title: "Companies", icon: Building2, value: "companies" },
      { title: "Contacts", icon: Users, value: "contacts" },
    ],
  },
  {
    title: "Learning",
    icon: BookOpen,
    roles: ["admin"],
    items: [
      { title: "All Content", icon: BookOpen, value: "all" },
      { title: "Enrollments", icon: Users, value: "enrollments" },
      { title: "Learner Progress", icon: BarChart, value: "learner-progress" },
      { title: "Free Videos", icon: Video, value: "videos" },
      { title: "Recorded Courses", icon: Tv, value: "courses" },
      { title: "Live Sessions", icon: Calendar, value: "webinars" },
    ],
  },
  {
    title: "Marketing & Outreach",
    icon: Megaphone,
    roles: ["admin", "talent_exec"],
    items: [
      { title: "Marketing Analytics", icon: PieChart, value: "analytics" },
      { title: "CV Outreach", icon: Send, value: "outreach" },
      { title: "Content Outreach", icon: BookOpen, value: "content-outreach" },
      { title: "Service Outreach", icon: Sparkles, value: "service-outreach" },
      { title: "Blog Posts", icon: FileText, value: "blog" },
      { title: "Feed Posts", icon: MessageSquare, value: "feed-posts" },
      { title: "Competitions", icon: Trophy, value: "competitions" },
    ],
  },
  {
    title: "Career Abroad",
    icon: Globe,
    roles: ["admin"],
    items: [
      { title: "Study Abroad Programs", icon: GraduationCap, value: "study-abroad" },
      { title: "IELTS Resources", icon: BookOpen, value: "ielts" },
      { title: "Roadmap Leads", icon: Map, value: "roadmap-leads" },
    ],
  },
  {
    title: "AI & Monetization",
    icon: Bot,
    roles: ["admin"],
    items: [
      { title: "AI Agents", icon: Bot, value: "ai-agents" },
      { title: "Company Agents", icon: Building2, value: "company-agents" },
      { title: "Agent Sessions", icon: MessageSquare, value: "agent-sessions" },
      { title: "Credits Manager", icon: Coins, value: "credits" },
      { title: "Notifications", icon: Bell, value: "notifications" },
    ],
  },
  {
    title: "Platform Config",
    icon: Settings,
    roles: ["admin"],
    items: [
      { title: "Access Codes", icon: Key, value: "codes" },
      { title: "Banners", icon: ImageIcon, value: "banners" },
      { title: "Professions", icon: GraduationCap, value: "professions" },
      { title: "Team Members", icon: UserCog, value: "team" },
    ],
  },
];
```

---

## Benefits of Reorganization

| Aspect | Before | After |
|--------|--------|-------|
| Content Management items | 15 | 6 (Learning only) |
| Marketing tools location | Scattered across 3 groups | Unified in 1 group |
| Career Abroad visibility | Hidden in Content | Dedicated section |
| Finding outreach tools | 3 different places | 1 place |
| AI/monetization grouping | Mixed with unrelated items | Focused section |

---

## Additional Improvements

### Rename Confusing Labels
- "Mock Interviews" → "Mock Interview Leads" (clarity)
- "Salary Analysis" → "Salary Analysis Leads" (clarity)
- "Webinars" → "Live Sessions" (covers webinars, batches, seminars)

### Add Missing Counts to Overview
- Study Abroad Roadmap requests count
- Pending roadmaps needing review

### Role Access Updates
- Marketing & Outreach should be accessible to `talent_exec` role
- Career Abroad admin-only (contains program management)

---

## Summary

This reorganization:
1. **Reduces cognitive load** - Content Management drops from 15 to 6 items
2. **Groups related tools** - All outreach in one place, all AI in one place
3. **Creates logical hierarchy** - Career Abroad gets dedicated section
4. **Adds missing functionality** - Roadmap leads tracking
5. **Improves navigation** - Clearer labels, better grouping
