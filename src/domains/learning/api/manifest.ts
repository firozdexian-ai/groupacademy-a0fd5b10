/**
 * Typed edge-function client surface for the Learning domain.
 * Wraps `supabase.functions.invoke` so UI never references function names directly.
 */
import { supabase } from "@/integrations/supabase/client";

type InvokeBody = Record<string, unknown> | undefined;

async function invoke<T = unknown>(name: string, body?: InvokeBody): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw error;
  return data as T;
}

export const learningApi = {
  // Tutor / mastery
  tutorChat: (body: InvokeBody) => invoke("ai-instructor-chat", body),
  tutorMastery: (body: InvokeBody) => invoke("get_tutor_mastery_context", body),

  // Authoring & item bank
  itemRewrite: (body: InvokeBody) => invoke("ai-item-rewrite", body),
  itemRewriteApply: (body: InvokeBody) => invoke("ai-item-apply", body),
  itemTranslate: (body: InvokeBody) => invoke("ai-item-translate", body),
  itemAnalytics: (body: InvokeBody) => invoke("instructor-item-analytics", body),
  authoringDigest: (body: InvokeBody) => invoke("authoring-review-digest", body),

  // Learner-facing
  nextActions: (body: InvokeBody) => invoke("learner-next-actions", body),
  talentMirror: (body: InvokeBody) => invoke("learner-talent-mirror", body),

  // Tracks / cohorts / orgs
  trackProgress: (body: InvokeBody) => invoke("get_track_progress", body),
  orgLearningHealth: (body: InvokeBody) => invoke("org_learning_health", body),
};

export type LearningApi = typeof learningApi;
