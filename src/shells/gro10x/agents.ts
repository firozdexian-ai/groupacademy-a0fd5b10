/**
 * Gro10x (B2B) shell â€” Agents entry points.
 */
import { lazy } from "react";

export const Gro10xAgentChat = lazy(() => import("@/gro10x/pages/Gro10xChat"));
export const Gro10xAgentMarketplace = lazy(() => import("@/gro10x/pages/Gro10xAgentMarketplace"));

export { AGENT_REGISTRY } from "@/domains/agents";

