import { Users, Sparkles, Building2, UserPlus } from "lucide-react";
import { AgentListTab } from "./AgentListTab";

/**
 * Group Academy AI Agents Command Center Sub-tabs
 * 2024 SaaS Design Standard: High-fidelity layout matching core audience taxonomies.
 * Prioritizes high legibility and precise field binding with backend schema scopes.
 */

export const AgentsB2CTab = () => (
  <AgentListTab
    title="Talent Facing Agents (B2C)"
    description="Platform-built conversational systems serving candidate career advancement tracks, tutoring, and automated counseling."
    icon={Users}
    agentTypeFilter={["talent"]}
    emptyHint="No active talent-facing profiles discovered in the system directory."
  />
);

export const AgentsPlatformTab = () => (
  <AgentListTab
    title="Platform Core Utility Tools"
    description="Non-conversational processing modules executing micro-transactions, automated matching, CV parsing, and matching scores."
    icon={Sparkles}
    agentTypeFilter={["internal"]}
  />
);

export const AgentsB2BTab = () => (
  <AgentListTab
    title="Corporate Workspace Agents (B2B)"
    description="Gro10x business operation assistants deployed for recruitment screening, company outreach logs, sourcing workflows, and sales CRM pipelines."
    icon={Building2}
    agentTypeFilter={["company"]}
  />
);

export const AgentsUGCTab = () => (
  <AgentListTab
    title="User-Generated Custom Agents"
    description="Independent automation profiles constructed by individual talents or external company accounts awaiting moderator review."
    icon={UserPlus}
    agentTypeFilter={["ugc"]}
    emptyHint="No user-generated agent entries submitted yet. Creator sandbox suite schedules deployment in v2."
  />
);

