/**
 * Curated B2B agent catalog for Gro10x. Mirrors the agent_key values seeded
 * into ai_agents by the Phase 2 migration. Used by Inbox + Marketplace UI.
 */
export interface Gro10xAgent {
  key: string;
  name: string;
  desc: string;
  emoji: string;
  goals: string[]; // which PRO_GOALS this agent serves
}

export const GRO10X_AGENTS: Gro10xAgent[] = [
  { key: "concierge",   name: "Concierge",       desc: "Routes you to the right agent",         emoji: "🧭", goals: ["explore"] },
  { key: "recruiter",   name: "Recruiter",       desc: "Job drafts, postings, screening",       emoji: "👥", goals: ["hire"] },
  { key: "sourcer",     name: "Sourcer",         desc: "Find candidates from talent network",   emoji: "🔍", goals: ["hire"] },
  { key: "outreach",    name: "Outreach Writer", desc: "Personalized candidate / lead emails",  emoji: "✉️", goals: ["hire", "sell_b2b"] },
  { key: "growth",      name: "Growth Agent",    desc: "Post on company feed, draft campaigns", emoji: "📈", goals: ["sell_b2b"] },
  { key: "lead_hunter", name: "Lead Hunter",     desc: "Find B2B prospects matching ICP",       emoji: "🎯", goals: ["sell_b2b"] },
  { key: "crm",         name: "CRM Agent",       desc: "Track conversations, follow-ups",       emoji: "🗂", goals: ["sell_b2b"] },
  { key: "gig_finder",  name: "Gig Finder",      desc: "Source freelancers fast",               emoji: "🛠", goals: ["freelance"] },
  { key: "briefing",    name: "Briefing Agent",  desc: "Turn ideas into clear gig briefs",      emoji: "📋", goals: ["freelance"] },
  { key: "billing",     name: "Billing Agent",   desc: "Credits, invoices, top-ups",            emoji: "💳", goals: ["ops"] },
  { key: "ops",         name: "Ops Agent",       desc: "Update company page, hours, logo",      emoji: "⚙️", goals: ["ops"] },
  { key: "calendar",    name: "Calendar Agent",  desc: "Schedule calls, syncs",                 emoji: "📅", goals: ["ops"] },
];

export const AGENT_BY_KEY: Record<string, Gro10xAgent> = Object.fromEntries(
  GRO10X_AGENTS.map((a) => [a.key, a])
);
