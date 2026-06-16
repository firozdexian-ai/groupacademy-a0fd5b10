import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import { ADMIN_AGENTS, ADMIN_AGENTS_BY_KEY, type AdminAgent } from "@/lib/adminAgents";
import {
  GRO10X_AGENTS,
  getAgentMeta as getGro10xAgentMeta,
  type Gro10xAgent,
} from "@/gro10x/hooks/useGro10xAgents";

const GRO10X_AGENT_BY_KEY: Record<string, Gro10xAgent> = Object.fromEntries(
  GRO10X_AGENTS.map((a) => [a.key, a])
);



/**
 * Agents Domain Registry
 * Description: A central declarative directory for matching application profiles
 * across talent-facing, platform admin, and corporate business (Gro10x) workspaces.
 */

export type AgentScope = "talent" | "admin" | "gro10x";

export interface AgentRegistryEntry {
  /** Stable agent identifier key matching the database backend matrix rows. */
  id: string;
  /** Target UI route destination layout mapping context. */
  scope: AgentScope;
  /** Human-readable display label text. */
  label: string;
  /** Primary database runtime or background edge function handling execution. */
  edge: string;
  /** Optional lazy-loaded component block for handling custom dedicated screens. */
  ui?: LazyExoticComponent<ComponentType<unknown>>;
}

/**
 * Shared screen viewport invoked natively whenever a user initializes
 * or resumes an individual message interaction thread.
 */
export const AgentChatScreen = lazy(() => import("@/pages/app/AgentChat"));

export const AGENT_REGISTRY: AgentRegistryEntry[] = [
  ...ADMIN_AGENTS.map<AgentRegistryEntry>((a) => ({
    id: a.key,
    scope: "admin",
    label: a.name,
    edge: a.functionName ?? "agent-runtime",
  })),
  ...GRO10X_AGENTS.map<AgentRegistryEntry>((a) => ({
    id: a.key,
    scope: "gro10x",
    label: a.name,
    edge: "agent-runtime",
  })),
];

export const AGENT_BY_ID: Record<string, AgentRegistryEntry> = Object.fromEntries(
  AGENT_REGISTRY.map((a) => [`${a.scope}:${a.id}`, a]),
);

export function getAgent(scope: AgentScope, id: string): AgentRegistryEntry | undefined {
  return AGENT_BY_ID[`${scope}:${id}`];
}

// Historical workspace compatibility layer preserved for legacy component entry points.
export {
  ADMIN_AGENTS,
  ADMIN_AGENTS_BY_KEY,
  GRO10X_AGENTS,
  GRO10X_AGENT_BY_KEY,
  getGro10xAgentMeta,
};
export type { AdminAgent, Gro10xAgent };


