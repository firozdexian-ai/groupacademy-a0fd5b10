

# Reorganize Admin Sidebar — Move Service Leads to AI & Monetization, Add Professions to Talent & Leads

## What You're Asking

Move the 4 service lead tabs (Assessment Leads, Mock Interview Leads, Salary Analysis Leads, Portfolio Requests) out of "Talent & Leads" into "AI & Monetization" — since those are AI-powered services. Then move "Professions" from "Platform Config" into "Talent & Leads" since profession categories are core to how talents are organized.

## Proposed New Structure

**Talent & Leads** (was 6 items → stays at 3 + 1 new = 3 items)
- Talent Pool
- Lead Hunter
- Professions ← moved from Platform Config

**AI & Monetization** (gains the 4 service leads)
- AI Agents
- Company Agents
- Agent Sessions
- Assessment Leads ← moved from Talent & Leads
- Mock Interview Leads ← moved from Talent & Leads
- Salary Analysis Leads ← moved from Talent & Leads
- Portfolio Requests ← moved from Talent & Leads
- Manage Gigs
- Marketplace Gigs
- Gig Submissions
- Credits Manager
- Notifications

**Platform Config** (loses Professions)
- Access Codes
- Banners
- Team Members
- Payments

## Other Observations

- "Notifications" could arguably move to "Platform Config" but it's fine under AI & Monetization since notifications are often credit/service-related.
- Everything else looks well-placed. No other moves needed.

## Files to Change

| File | Change |
|------|--------|
| `src/components/dashboard/AdminSidebar.tsx` | Move items between nav groups |
| `src/pages/Dashboard.tsx` | Update `tabAccessMap` for moved tabs (professions needs `talent_exec` access added) |

