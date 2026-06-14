/**
 * Group Academy â€” Career Abroad Domain Interface Engine (Barrel Export)
 * Version: Phase 10i.2 Hardened (Production Candidate Edition)
 * Purpose: Unified public API boundary exposing UI panels, network proxies, and graph hooks.
 * Constraints: Enforces clean domain-isolation; eliminates deep import backtracking.
 */

// â”€â”€â”€ Front-Facing UI Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export { RoadmapBuilderSheet } from "./components/talent/RoadmapBuilderSheet";
export { RoadmapIntakeForm } from "./components/talent/RoadmapIntakeForm";
export { RoadmapTimeline } from "./components/talent/RoadmapTimeline";

// â”€â”€â”€ Administration & Operator Workspace Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export { AbroadOverviewTab } from "./components/admin/AbroadOverviewTab";
export { AbroadApplicationsTab } from "./components/admin/AbroadApplicationsTab";
export { AbroadProgramsTab } from "./components/admin/AbroadProgramsTab";
export { AbroadRoadmapLeadsTab } from "./components/admin/AbroadRoadmapLeadsTab";
export { AbroadDestinationsTab } from "./components/admin/AbroadDestinationsTab";
export { AbroadIELTSPromptsTab } from "./components/admin/AbroadIELTSPromptsTab";
export { AbroadIELTSResourcesTab } from "./components/admin/AbroadIELTSResourcesTab";
export { AbroadLanguageLabTab } from "./components/admin/AbroadLanguageLabTab";

// â”€â”€â”€ Graph Query Hooks & Synchronizer Contexts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export { useAbroadGraph } from "./components/admin/hooks/useAbroadGraph";
export type {
  AbroadApplication,
  AbroadProgram,
  RoadmapLead,
  DestinationAgent,
  IeltsAttempt,
  IeltsResource,
} from "./components/admin/hooks/useAbroadGraph";

// â”€â”€â”€ Typed Edge Network Invocation Engines (API) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export {
  aiDestinationAgent,
  aiIeltsEvaluate,
  aiLanguagePartner,
  bookLanguageSession,
  generateStudyRoadmap,
} from "./api/abroadApi";

// â”€â”€â”€ Bound Integration Contract Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type {
  AiDestinationAgentRequest,
  AiDestinationAgentResponse,
  AiIeltsEvaluateRequest,
  AiIeltsEvaluateResponse,
  AiLanguagePartnerRequest,
  AiLanguagePartnerResponse,
  BookLanguageSessionRequest,
  BookLanguageSessionResponse,
  GenerateStudyRoadmapRequest,
  GenerateStudyRoadmapResponse,
} from "@/edge/contracts/abroad";

