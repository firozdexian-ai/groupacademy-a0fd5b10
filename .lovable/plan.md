

# Two Major Features: AI Agent Personas + Gigs Marketplace

## My Honest Assessment

**Feature 1 (AI Agent Personas + Services Merge):** This is a strong, natural evolution. Moving career services into conversational agents creates a more engaging, modern experience. Instead of filling forms for assessments/interviews, users talk to a specialized agent who guides them through it. This reduces friction and increases engagement.

**Feature 2 (Gigs/Projects for Credit Earning):** This is genuinely exciting and strategically brilliant. It creates a **circular economy** -- users earn credits by doing work that directly grows YOUR platform (uploading CVs = talent database, posting jobs = job leads, sharing = distribution). This is not just gamification; it's crowdsourced growth. The key insight: separating "earned" from "free" credits for withdrawal prevents abuse while keeping the utility of credits universal.

**Recommendation:** Both features are worth pursuing. I suggest we implement them in two phases -- Gigs first (it's more self-contained and immediately impactful), then the Agent Persona upgrade (which touches more existing systems).

---

## Phase 1: Gigs Marketplace (Build First)

### Database Schema

**New table: `gigs`** (Admin-created tasks)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| title | text | "Upload a Friend's CV" |
| description | text | Detailed instructions |
| category | text | cv_upload, job_posting, job_sharing, content_creation, course_resell |
| credit_reward | integer | Credits earned on approval |
| icon | text | Lucide icon name |
| is_active | boolean | Admin toggle |
| max_completions_per_user | integer | Rate limit (e.g., 5 CVs/month) |
| total_budget | integer | Optional cap on total payouts |
| total_completed | integer | Counter |
| requirements | text | What the user needs to submit |
| display_order | integer | Sorting |
| created_at / updated_at | timestamps | |

**New table: `gig_submissions`** (User work)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| gig_id | uuid FK -> gigs | |
| talent_id | uuid FK -> talents | |
| status | text | pending, approved, rejected |
| submission_data | jsonb | Flexible: CV URL, job text, post link, etc. |
| admin_notes | text | Rejection reason |
| credits_awarded | integer | Filled on approval |
| created_at / reviewed_at | timestamps | |

**New column on `talent_credits`:**
- `earned_balance` (integer, default 0) -- tracks withdrawable credits separately

**New column on `credit_transactions`:**
- `is_earned` (boolean, default false) -- marks gig-earned transactions

**New RPC: `award_gig_credits`** -- Admin approves a submission, atomically adds credits to both `balance` and `earned_balance`, records transaction with `is_earned = true`.

### Frontend Pages

**For Seekers:**
- `/app/gigs` -- Gigs listing page with category tabs (CV Upload, Job Posting, Job Sharing, Content, Resell)
- Each gig card shows: title, reward credits, description, "Start" button
- Submission form varies by category (CV upload field, job text paste, URL input, etc.)
- "My Submissions" tab showing status (pending/approved/rejected)

**For Admins:**
- `GigsManager` component in Dashboard -- CRUD for gigs
- `GigSubmissionsManager` -- Review queue with approve/reject actions

### Navigation Update

Bottom tab bar changes from 6 items to 5 core:
```
Home | Jobs | Learning | Abroad | Gigs
```

"AI Agents" and "Services" move into the feed Quick Actions grid and remain accessible from there. The Gigs tab replaces the current Services tab position in the bottom nav.

### Initial Gig Templates (Seeded Data)

1. **"Help a Friend Get Discovered"** (CV Upload) -- 15 credits
2. **"Share a Job Lead"** (Job Posting) -- 20 credits  
3. **"Spread the Word"** (Job Sharing) -- 5 credits
4. **"Create a Post"** (Content Creation) -- 10 credits
5. **"Recommend a Course"** (Course Resell) -- 25 credits per enrollment

### Wallet Enhancement

Profile/wallet view shows:
- Total Balance (usable for all services)
- Earned Credits (withdrawable portion)
- Free Credits (non-withdrawable)

---

## Phase 2: AI Agent Personas + Services Merge (Build Second)

### Agent Avatar System

Update the `ai_agents` table -- it already has `avatar_url`, `personality_traits`, `sample_conversations`. We just need to:

1. **Upload agent photos** via admin (already have `avatar_url` column)
2. **Update AgentCard and AgentAvatar** to prioritize photo over icon
3. **Add two tabs** to the AI Agents page: "Agent Network" (grid of personas) and "Chats" (conversation history)

### Services to Agents Migration

Each career service becomes a specialized agent mode:
- Career Assessment -> "Assessment Agent" (guides you conversationally, then generates scorecard)
- Mock Interview -> "Interview Coach" (already exists as agent, add interview simulation mode)
- Salary Analysis -> "Salary Advisor" (already exists, add analysis generation)
- Portfolio -> Remains as a form (too complex for chat)

The `/app/services` page transforms into the AI Agents hub, merging both. The existing standalone service pages remain as direct-access routes for users who come via Quick Actions.

### Updated Navigation

```
Home | Jobs | Learning | Abroad | Gigs
```

AI Agents accessible via:
- Quick Actions grid on Feed
- Direct URL `/app/agents`
- Profile menu

---

## Implementation Order (Phase 1 -- Gigs)

### Step 1: Database
- Create `gigs` table with RLS (public read for active, admin write)
- Create `gig_submissions` table with RLS (user can create/read own, admin can read/update all)
- Add `earned_balance` to `talent_credits`
- Add `is_earned` to `credit_transactions`
- Create `award_gig_credits` RPC

### Step 2: Admin Interface
- `GigsManager` -- Create/edit/deactivate gigs
- `GigSubmissionsManager` -- Review queue with approve/reject
- Seed initial 5 gig templates

### Step 3: Seeker Interface
- `/app/gigs` page with category tabs
- Gig detail + submission forms (varies by category)
- "My Submissions" history

### Step 4: Navigation
- Update bottom tab bar: replace Services/AI Agents with Gigs
- Update Quick Actions grid to include AI Agents and Services shortcuts
- Update routes

### Step 5: Wallet
- Show earned vs free credit breakdown in profile
- Update CreditBalance component

---

## Files to Create/Modify

### New Files
- `src/pages/app/Gigs.tsx` -- Main gigs listing
- `src/pages/app/GigSubmission.tsx` -- Submit work for a gig
- `src/components/gigs/GigCard.tsx` -- Gig display card
- `src/components/gigs/GigSubmissionForm.tsx` -- Category-specific forms
- `src/components/gigs/MySubmissions.tsx` -- User's submission history
- `src/components/dashboard/GigsManager.tsx` -- Admin CRUD
- `src/components/dashboard/GigSubmissionsManager.tsx` -- Admin review queue

### Modified Files
- `src/layouts/TalentAppShell.tsx` -- Update nav items
- `src/components/feed/QuickActionsGrid.tsx` -- Add AI Agents shortcut
- `src/lib/routes.ts` -- Add gig routes
- `src/lib/creditPricing.ts` -- Add gig reward configs
- `src/App.tsx` -- Add gig routes
- `src/components/credits/CreditBalance.tsx` -- Show earned vs free
- `src/components/dashboard/AdminSidebar.tsx` -- Add Gigs management

### Database Migrations
- Create `gigs` and `gig_submissions` tables
- Alter `talent_credits` and `credit_transactions`
- Create `award_gig_credits` RPC
- RLS policies

---

## What This Unlocks

- **Viral growth loop**: Users earn credits by bringing in more users (CV uploads) and content (job posts, shares)
- **Self-sustaining economy**: Earned credits fund service usage, reducing need for direct purchases
- **Platform stickiness**: Users have a reason to return daily (new gigs, pending approvals)
- **Talent database growth**: Every CV upload gig directly grows your core asset

