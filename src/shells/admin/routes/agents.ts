import React from "react";

/**
 * AI Agents Domain Routing Registry â€” Agent OS Command Center
 * Version: Launch Candidate Â· Phase Z0 Hardened (Code Freeze)
 * Infrastructure: Digital Workforce Connected Telemetry Shell Map
 * 
 * Rules: This configuration unifies all 15 specialized system subsections,
 * routing legacy layout tabs natively into the core Workforce Command Center.
 * Existing keys, route designations, and title mappings are strictly immutable.
 */

export const ROUTES: Record<string, React.LazyExoticComponent<unknown>> = {
  // --- CORE SYSTEM COMMAND INTERFACE (Keep) ---
  "agents-command-center": React.lazy(() =>
    import("@/pages/dashboard/WorkforceCommandCenter").then((m) => ({ default: m.WorkforceCommandCenter })),
  ),

  // --- WIRING OF REAL DASHBOARD CHROME PANELS ---
  "agent-outreach": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentOutreachTab").then((m) => ({ default: m.AgentOutreachManager })),
  ),
  "agents-overview": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentsOverviewTab").then((m) => ({ default: m.AgentsOverviewTab })),
  ),
  "agents-channels": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentTriggers").then((m) => ({ default: m.AgentTriggers })),
  ),
  "agents-multichannel": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentMultichannelTab").then((m) => ({ default: m.AgentMultichannelTab })),
  ),
  "agents-tools": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentToolsTab").then((m) => ({ default: m.AgentToolsTab })),
  ),
  "agents-studio": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentStudioTab").then((m) => ({ default: m.AgentStudio })),
  ),
  "agents-b2c": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentTypeTabs").then((m) => ({ default: m.AgentsB2CTab })),
  ),
  "agents-platform": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentTypeTabs").then((m) => ({ default: m.AgentsPlatformTab })),
  ),
  "agents-b2b": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentTypeTabs").then((m) => ({ default: m.AgentsB2BTab })),
  ),
  "agents-ugc": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentTypeTabs").then((m) => ({ default: m.AgentsUGCTab })),
  ),
  "agents-marketplace": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentMarketplaceTab").then((m) => ({ default: m.AgentMarketplaceReview })),
  ),
  "agents-payouts": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentPayoutsTab").then((m) => ({ default: m.AgentPayoutsManager })),
  ),
  "agents-sessions": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentSessionsTab").then((m) => ({ default: m.AgentSessionsManager })),
  ),
  "agents-insights": React.lazy(() =>
    import("@/domains/agents/components/dashboard/AgentInsightsTab").then((m) => ({ default: m.AgentInsights })),
  ),
};

export const TITLES: Record<string, string> = {
  "agent-outreach": "Agent Outreach",
  "agents-overview": "Agents Overview",
  "agents-channels": "Channels & Triggers",
  "agents-multichannel": "Routing",
  "agents-command-center": "Workforce Command Center",
  "agents-tools": "Tools & Connectors",
  "agents-studio": "Agent Studio",
  "agents-b2c": "B2C Agents",
  "agents-platform": "Platform Agents",
  "agents-b2b": "B2B Agents",
  "agents-ugc": "Community Agents",
  "agents-marketplace": "Marketplace Review",
  "agents-payouts": "Payout Management",
  "agents-sessions": "Chat Logs",
  "agents-insights": "Agent Metrics",
};

