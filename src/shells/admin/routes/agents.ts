import React from "react";
import { AgentRedirectStub } from "@/domains/agents/components/admin/chat/AgentRedirectStub";

/**
 * AI Agents Domain Routing Registry — Agent OS Command Center
 * Version: Launch Candidate · Phase Z0 Hardened (Code Freeze)
 * Infrastructure: Digital Workforce Connected Telemetry Shell Map
 * 
 * Rules: This configuration unifies all 15 specialized system subsections,
 * routing legacy layout tabs natively into the core Workforce Command Center.
 * Existing keys, route designations, and title mappings are strictly immutable.
 */

export const ROUTES: Record<string, React.LazyExoticComponent<any>> = {
  // --- CORE SYSTEM COMMAND INTERFACE (Keep) ---
  "agents-command-center": React.lazy(() =>
    import("@/pages/dashboard/WorkforceCommandCenter").then((m) => ({ default: m.WorkforceCommandCenter })),
  ),

  // --- CONSOLIDATED REDIRECT MATRIX (Funnel securely to /dashboard/chat) ---
  "agent-outreach": createRedirect("agent-outreach"),
  "agents-overview": createRedirect("agents-overview"),
  "agents-channels": createRedirect("agents-channels"),
  "agents-multichannel": createRedirect("agents-multichannel"),
  "agents-tools": createRedirect("agents-tools"),
  "agents-studio": createRedirect("agents-studio"),
  "agents-b2c": createRedirect("agents-b2c"),
  "agents-platform": createRedirect("agents-platform"),
  "agents-b2b": createRedirect("agents-b2b"),
  "agents-ugc": createRedirect("agents-ugc"),
  "agents-marketplace": createRedirect("agents-marketplace"),
  "agents-payouts": createRedirect("agents-payouts"),
  "agents-sessions": createRedirect("agents-sessions"),
  "agents-insights": createRedirect("agents-insights"),
};

/**
 * Helper Matrix Builder: Generates a lazy component wrapper that safely redirects
 * administrative personnel to the unified chat and agent execution hub.
 * Tracks structural layout boundary anomalies natively on execution failure.
 */
function createRedirect(agentKey: string): React.LazyExoticComponent<React.ComponentType<any>> {
  return React.lazy(() => {
    try {
      if (!agentKey) {
        throw new Error("Routing token hydration fault: Missing active agent identifier reference key.");
      }
      return Promise.resolve({
        default: (props: any) => React.createElement(AgentRedirectStub, { agentKey, ...props }),
      });
    } catch (error: any) {
      // Digital Workforce Telemetry: Route contract execution drops directly to central diagnostic monitors
      console.error("AI Agents routing matrix intercepted a structural redirection failure:", {
        agentKey,
        message: error?.message,
        code: error?.code,
      });
      throw error;
    }
  });
}

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