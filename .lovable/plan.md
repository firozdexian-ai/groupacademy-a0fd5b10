

# Gig Marketplace — Aligned with Freelancing Academy

## Current State

**Existing Gigs system**: Admin-created tasks (upload CVs, share jobs, post content) that reward platform credits. One-directional — platform → users. No employer involvement.

**Freelancing Academy**: 6 schools with 24 programs covering the full freelance skillset:
- Digital Freelancing (Upwork, Fiverr, etc.)
- Creative Services (graphic design, writing, etc.)
- Technical Services (web dev, data, etc.)
- Media & Production (video, photo, etc.)
- AI & Automation (AI tools, chatbots, etc.)
- Consulting (business, management, etc.)

## What You're Proposing

A **two-sided freelance marketplace** where:
1. **Employers** post project gigs (e.g., "Need a logo designed", "Build a landing page")
2. **Freelancers** (platform users who've learned through the academy) browse by skill category and either accept a fixed price or submit a bid
3. Categories mirror the Freelancing Academy schools so learners can immediately apply what they've studied

## My Thoughts — Two Options

### Option A: Full Marketplace (Fiverr/Upwork-lite)
Build a complete two-sided marketplace with employer accounts, gig posting, bidding, milestone tracking, escrow/payment, reviews, and dispute resolution.

**Pros**: Very powerful, closes the learn-to-earn loop.
**Cons**: Massive build (6-8 weeks). Requires payment infrastructure, dispute handling, employer onboarding, and trust/safety systems. This is essentially building a second product.

### Option B: Gig Board with Bidding (Recommended)
Extend the existing gigs infrastructure to support **employer-posted project gigs** alongside the current credit-based gigs. Simpler, faster, and leverages what's already built.

**How it works**:
- New `marketplace_gigs` table for employer-posted projects (title, description, budget, pricing_type: fixed/bidding, skill_category aligned to Freelancing Academy schools, deadline, attachments)
- New `marketplace_bids` table for freelancer proposals (price, cover letter, estimated timeline)
- Employers post gigs → admin reviews/approves → appears on marketplace
- Freelancers browse by school/skill category, submit bids or accept fixed-price gigs
- Employer selects a freelancer → work begins → completion confirmed → credits or external payment
- The existing credits system can optionally be used as the payment rail (employer buys credits, pays freelancer in credits, freelancer withdraws)

**New pages**:
- `/app/marketplace` — Browse employer gigs (filtered by Freelancing Academy school categories)
- `/app/marketplace/:id` — Gig detail + bid form
- `/app/my-gigs` — Freelancer's active/completed gigs
- Employer dashboard section for posting and managing gigs

**Database tables**:
- `marketplace_gigs` — employer-posted projects
- `marketplace_bids` — freelancer proposals
- `marketplace_contracts` — accepted work agreements
- `marketplace_deliverables` — file submissions and milestones

## Recommendation

**Start with Option B** — a Gig Board with Bidding. It's achievable in 2-3 phases, reuses the credits system, and directly ties into the Freelancing Academy schools as skill categories. We can evolve it toward a full marketplace over time.

**Phase 1**: Database tables + employer gig posting (admin-assisted) + freelancer browsing/bidding
**Phase 2**: Freelancer selection, contract creation, deliverable submission
**Phase 3**: Reviews, ratings, and credit-based payments

Want me to proceed with Phase 1?

