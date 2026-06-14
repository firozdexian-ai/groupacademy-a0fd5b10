/**
 * Group Academy â€” Abroad Domain Export Engine (Barrel)
 * Version: Phase 10i.2 Hardened (Production Candidate)
 * Purpose: Single source of truth interface for public domain surfaces.
 * Constraints: Blocks implicit leaks, handles strict type barriers, strips internal metrics.
 */

// â”€â”€â”€ STAGE 1: EDGE NETWORK LAYER WRAPPERS (API) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export {
  aiDestinationAgent,
  aiIeltsEvaluate,
  aiLanguagePartner,
  bookLanguageSession,
  generateStudyRoadmap,
} from "./abroadApi";

// â”€â”€â”€ STAGE 2: HARDENED POSTGRES INFRASTRUCTURE (REPO) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export {
  upsertGraphRow,
  deleteGraphRow,
  getAbroadGraphMaster,
  insertRoadmapContactLead,
  insertStudyAbroadRoadmap,
  getActiveCounsellorByUser,
  listAbroadApplications,
  getStudyAbroadProgramById,
  getStudyAbroadRoadmapById,
  advanceAbroadStage,
  listActiveStudyAbroadPrograms,
  listActiveDestinationAgents,
  getDestinationAgentByCountry,
  listActiveProgramsForCountry,
  listDestinationAgentMessages,
  getIeltsStreakByUser,
  listRecentIeltsMockAttempts,
  getIeltsDailyChallenge,
  listIeltsResourceAccessByTalent,
  listActiveIeltsResourcesBySection,
  listActiveLanguageInstructorsByCode,
  listAbroadApplicationsForCurrentUser,
} from "../repo/abroadRepo";

// â”€â”€â”€ STAGE 3: BOUND INTEGRATION SCHEMA TYPE DEFINITIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

