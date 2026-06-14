import { useHype } from "@/domains/feed/hooks/useHype";

export type HypeContentType = "post" | "course" | "video" | "blog";

/**
 * Backward compatibility hook wrapping the updated useHype state engine.
 * Maps legacy parameter positions cleanly to prevent broken interaction triggers.
 */
export function useContentHype(contentType: HypeContentType, contentId: string, initialCount: number = 0) {
  return useHype(contentId, contentType, initialCount);
}
