# GroUp Academy — Version 1.0 Release Documentation

This document compiles the core updates, design paradigms, and architectural enhancements built for **Version 1.0** of the GroUp Academy platform.

---

## 1. Public Pages & Funnel
Designed and unified the B2C/B2B acquisition pipeline inside a shared, cohesive, and premium portal layout.
* **Shared Glassmorphic Shell ([PublicLayout.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/layouts/PublicLayout.tsx))**:
  * Implemented sticky glassmorphism (`backdrop-blur-xl bg-background/80`) for global navigation and footers.
  * Resolved theme-based logo background masks dynamically using SVG css blend options (`mix-blend-screen` on dark mode, `mix-blend-multiply` on light mode).
* **Live Stats Counter Banner ([Index.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/pages/Index.tsx))**:
  * Integrated direct asynchronous database hooks querying live tallies of registered professionals (`talents`), hiring partners (`companies`), active listings (`jobs`), and AI specialists (`ai_agents`).
  * Hardened count filters with default local logic fallbacks (`1240+` professionals, `42+` partners, `180+` listings, `9+` coaches) to ensure premium display values if visitors encounter Row-Level Security (RLS) policies.
* **Pricing & Subscriptions ([Pricing.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/pages/public/Pricing.tsx))**:
  * Designed subscription tiers (Starter, Professional, Enterprise) detailing credit limits, coaching access, and a "+250 Welcome Credits" sign-on highlight.
* **AI Coach Gallery ([PublicAgentsIndex.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/pages/public/PublicAgentsIndex.tsx))**:
  * Added a public-facing coach directory to showcase available AI specialized mentors. Clicking any coach prompts login/signup and deep-links directly to the loaded chatbot environment.

---

## 2. Sign-Up, Authentication & Onboarding Flow
Hardened user acquisition and profile verification pathways to prevent friction and loop-traps.
* **Unified Wizard Entrypoint ([Start.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/pages/Start.tsx))**:
  * Channeled guest signups into the structured onboarding wizard (`/start`) instead of standard `/auth`, allowing users to enter details progressively before account binding.
* **Onboarding Step-Lock & Guard ([App.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/App.tsx))**:
  * Fixed redirection loops: configured `OnboardingGuard` to route users who have not completed the structural signup wizard back to `/start`.
  * Preserved pending status by holding off writing `onboarding_completed_at` until the subsequent conversational chat onboarding is fully finished.
* **Conversational University Representative Hub ([ProfileBuilder.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/pages/app/ProfileBuilder.tsx))**:
  * Customized the conversational onboarding agent (`talent-onboarding-chat` Edge Function) to dynamically adopt a "University Representative" persona if the user signs up with a connected academic institution (e.g. greeting them as their university ambassador).
  * Prompts automatic assignment of the Campus Ambassador agent and seeds initial credits before transferring the user to the main Career Coach agent.

---

## 3. Community Feed Section
Restored visual richness and fixed post rendering within the active community update streams.
* **Active Content Ingestion ([feedRepo.ts](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/domains/feed/repo/feedRepo.ts))**:
  * Re-pointed recommendation query systems to the master `content` table instead of legacy `courses`. This restored support for media content cards, dynamic YouTube players, category badges, and featured blog posts.
* **Native UGC Rendering ([Feed.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/pages/app/Feed.tsx))**:
  * Swapped visual cards for native [PostCard.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/domains/feed/components/talent/PostCard.tsx) items for all user-generated updates.
  * Restored complete interaction features (Hype reactions, comments, share overlays, dynamic tag lists) and resolved long text truncations on mobile viewports.

---

## 4. Top, Bottom & Sidebar Navigation Shell
Optimized layout space, added hardware acceleration, and integrated help desk features.
* **Shell Transitions & Tactile Feedback ([TalentAppShell.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/layouts/TalentAppShell.tsx))**:
  * Implemented hardware-accelerated transitions (`transform-gpu slide-in-from-bottom-2 duration-300`) between views.
  * Added subtle tactile micro-scaling (`active:scale-95 transition-all`) to navigation bars and buttons.
* **Responsive AI Search ([AIGeneral.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/pages/app/AIGeneral.tsx))**:
  * Set desktop header search inputs to scale responsively (`w-36 focus:w-48 lg:w-60 lg:focus:w-80`) and applied `whitespace-nowrap shrink-0` to the credits purchase badge to prevent layout breaking.
  * Configured active parameter observers so searching consecutively from the top header dispatches prompt queries to the AI chat interface even if the chat is already open.
* **Floating WhatsApp Support Widget**:
  * Replaced redundant AI chat bubbles with a global floating WhatsApp support button in `TalentAppShell.tsx`. Prompting support awards a `+10 credits` incentive upon account linkage.

---

## 5. Profile Hub (Talent, Public & Edit)
Built professional presentation sheets, settings locks, and AI support cost notifications.
* **LinkedIn-Style Profile Activity ([Profile.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/pages/app/Profile.tsx))**:
  * Integrated a live post history drawer querying the `feed_posts` database table by user ID, rendering the user's 3 most recent community updates inside their profile view.
* **Responsive Two-Column Layout**:
  * Styled desktop profiles with a two-column layout: left column contains professional records (Work Experience, Education, Recent Activity); right column holds a sticky profile strength meter and visibility settings.
* **Avatar & Cover Photo Overlay Fix**:
  * Configured `overflow-visible` on the cover photo `<Card>` container to permit the negative margin of the avatar overlay to display cleanly without clipping.
* **Visibility Eligibility Lock ([PublicProfileSettings.tsx](file:///c:/Users/LeNoVo/Documents/GRO10X%20Business/GroUp%20Academy/src/domains/profile/components/talent/PublicProfileSettings.tsx))**:
  * Evaluated database visibility trigger criteria (Full Name, contact info, and at least 1 skill) inside the settings panel. If criteria are unmet, the switch is disabled and an inline warning lists the incomplete fields.
* **AI Cost Transparencies**:
  * Tagged AI Rewrite dialogs and CV Upload Parser cards with explicit credit cost labels: `Cost: 0 credits (Free)`.

---

## 6. Build Status & Verification
* **Type-Safety**: Clean compilation running `npx tsc --noEmit` (**0 errors**).
* **Production Build**: Successful compilation running `npm run build` with minified, chunked assets.
