/**
 * Public surface of the profile domain (named exports only).
 */

// Hooks
export { usePublicProfileSettings, type PublicProfileSettings } from "./hooks/usePublicProfileSettings";
export { useTalentPitches, type TalentPitch } from "./hooks/useTalentPitches";
export {
  useTalentMirror,
  type TalentMirror,
  type TalentMirrorCourse,
  type TalentMirrorTopic,
} from "./hooks/useTalentMirror";
export {
  useTalentOutcomeSignal,
  type TalentOutcomeSignal,
  type VerifiedSkillSignal,
  type TrackCompletedSignal,
} from "./hooks/useTalentOutcomeSignal";
export {
  useTalentLists,
  useListMembers,
  useCreateTalentList,
  useAddToList,
  type TalentList,
  type ListMember,
} from "./hooks/useTalentLists";
export {
  useTalentRelationships,
  useUpsertRelationship,
  useMoveRelationshipStage,
  TALENT_REL_STAGES,
  type TalentRelStage,
  type TalentRelationship,
} from "./hooks/useTalentRelationships";
export {
  useTalentSearch,
  type TalentSearchFilters,
  type TalentSearchRow,
  type TalentSearchResponse,
} from "./hooks/useTalentSearch";

// API
export { claimPublicHandle } from "./api/manifest";
export type { ClaimPublicHandleRequest, ClaimPublicHandleResponse } from "./api/manifest";

// Talent UI
export { ProfileCompletionMeter } from "./components/talent/ProfileCompletionMeter";
export { ProfileCompletionPrompt } from "./components/talent/ProfileCompletionPrompt";
export { ProfileSectionEditor } from "./components/talent/ProfileSectionEditor";
export { ProfileEditDialog } from "./components/talent/ProfileEditDialog";
export { PublicProfileSettings as PublicProfileSettingsPanel } from "./components/talent/PublicProfileSettings";
export { ExperienceEditor } from "./components/talent/ExperienceEditor";
export { EducationEditor } from "./components/talent/EducationEditor";
export { SkillsEditor } from "./components/talent/SkillsEditor";
export { CVUploadSection } from "./components/talent/CVUploadSection";
export { CoverImageUpload } from "./components/talent/CoverImageUpload";
export { ProfilePhotoUpload } from "./components/talent/ProfilePhotoUpload";
export { ApplicationHistoryCard } from "./components/talent/ApplicationHistoryCard";
export { ServiceHistoryCard } from "./components/talent/ServiceHistoryCard";

