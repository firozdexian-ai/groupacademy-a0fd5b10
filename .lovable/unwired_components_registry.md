# Unwired & Legacy Components Registry

This registry lists all files that are currently in the codebase but are not actively imported or wired to the router (`src/App.tsx`) as of June 2026. These represent draft features, placeholder stubs, or legacy components. **Do not delete these files**, as they contain valuable reference code for future domains.

---

## Unwired / Draft Pages

These page components exist under `src/pages/` but are not currently imported or linked to active routes in `src/App.tsx`:

* **Public Page Stubs:**
  * `src/pages/PublicServiceLanding.tsx` (Draft public landing page)
* **Talent/Student Auth Page Stubs:**
  * `src/pages/app/CareerAbroad.tsx` (Draft study abroad stub)
  * `src/pages/app/Marketplace.tsx` (Draft gig marketplace/bidding stub)
  * `src/pages/app/MyGigs.tsx` (Draft my-gigs tab stub; currently handled via URL tab redirect)
  * `src/pages/app/Notifications.tsx` (Draft notifications stub; currently redirected to messages)
  * `src/pages/app/ServicesHub.tsx` (Draft services hub stub; currently redirected to jobs tab)
  * `src/pages/app/StudyAbroadRoadmap.tsx` (Draft roadmap setup stub; currently redirected to abroad home)

---

## Unwired / Draft Components & Utilities

These components and hooks are not currently imported or used by any active page:

### AI & Agents Domain
* `src/components/ai/GlobalAIBubble.tsx`
* `src/domains/agents/components/chat/AgentListItem.tsx`
* `src/domains/agents/components/chat/RecentConversations.tsx`
* `src/domains/agents/components/dashboard/AgentChannelsTab.tsx`
* `src/domains/agents/components/dashboard/AgentInsightsTab.tsx`
* `src/domains/agents/components/dashboard/AgentMarketplaceTab.tsx`
* `src/domains/agents/components/dashboard/AgentMultichannelTab.tsx`
* `src/domains/agents/components/dashboard/AgentOutreachTab.tsx`
* `src/domains/agents/components/dashboard/AgentPayoutsTab.tsx`
* `src/domains/agents/components/dashboard/AgentSessionsTab.tsx`
* `src/domains/agents/components/dashboard/AgentsOverviewTab.tsx`
* `src/domains/agents/components/dashboard/AgentsRegistryTab.tsx`
* `src/domains/agents/components/dashboard/AgentStudioTab.tsx`
* `src/domains/agents/components/dashboard/AgentToolsTab.tsx`
* `src/domains/agents/components/dashboard/AgentTriggers.tsx`
* `src/domains/agents/components/dashboard/AgentTypeTabs.tsx`

### Feed & Community Domain
* `src/domains/feed/components/talent/CareerInsightsStack.tsx`
* `src/domains/feed/components/talent/HypeEarningsCard.tsx`
* `src/domains/feed/components/talent/NewPostsPill.tsx`
* `src/domains/feed/components/talent/PersonalizedPromptCard.tsx`
* `src/domains/feed/components/talent/SkillTagBadge.tsx`
* `src/domains/feed/components/talent/TopHypedWidget.tsx`
* `src/domains/feed/components/talent/WeeklyLeaderboardWidget.tsx`

### Jobs & Gigs Domain
* `src/components/job-application/InlineCVUpload.tsx`
* `src/components/sourcing/InviteToApplyDialog.tsx`
* `src/domains/jobs/components/admin/JobsManagerLegacyTab.tsx`
* `src/lib/constants/gigCategories.ts`

### Onboarding & Profile Domain
* `src/components/talent/RecentLearnerChip.tsx`
* `src/components/talent/TrackCompletionBadge.tsx`
* `src/components/talents/InboxUnlockCard.tsx`
* `src/components/talents/StreakBadge.tsx`
* `src/lib/onboarding/cvFingerprint.ts`

### Gro10x (B2B) Shell
* `src/gro10x/components/Gro10xPageGate.tsx`
* `src/gro10x/components/layout/ThreePaneLayout.tsx`

### Miscellaneous UI & Utilities
* `src/components/NavLink.tsx`
* `src/components/notifications/NotificationDropdown.tsx`
* `src/components/player/ModuleList.tsx`
* `src/components/player/VideoPlayer.tsx`
* `src/components/projects/ProjectPublicToggle.tsx`
* `src/components/qna/QuestionPanel.tsx`
* `src/hooks/useSupabaseQuery.ts`
* `src/lib/irEmailTemplates.ts`
* `src/lib/retryWithBackoff.ts`
