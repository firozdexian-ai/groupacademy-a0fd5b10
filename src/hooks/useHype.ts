import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Unified Hype hook — paid 1-credit reaction.
 * Works for posts, courses, videos, blogs (calls hype_content RPC).
 * - Tap-lock + in-flight queue to coalesce rapid taps
 * - Debounced wallet refresh + single aggregated toast (no spam during Boost)
 * - Optimistic counter; rolls back on error
 * Repeat taps are ALLOWED (creator-economy model: 1cr per tap).
 */

export type HypeContentType = "post" | "course" | "video" | "blog";

const TAP_LOCK_MS = 120;
const TOAST_DEBOUNCE_MS = 900;

export function useHype(
  contentIdOrPostId: string,
  initialCountOrType: number | HypeContentType = 0,
  maybeInitialCount: number = 0,
) {
  // Back-compat: useHype(postId, initialCount) OR useHype(id, type, initialCount)
  const contentType: HypeContentType =
    typeof initialCountOrType === "string" ? initialCountOrType : "post";
  const initialCount: number =
    typeof initialCountOrType === "number" ? initialCountOrType : maybeInitialCount;
  const contentId = contentIdOrPostId;

  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [count, setCount] = useState<number>(initialCount);
  const [isHyping, setIsHyping] = useState(false);

  const lastTap = useRef(0);
  const inFlight = useRef(0);
  const pendingDelta = useRef(0);
  const errorCount = useRef(0);
  const toastTimer = useRef<number | null>(null);

  useEffect(() => setCount(initialCount), [initialCount]);

  const flushToast = useCallback(() => {
    const sent = pendingDelta.current;
    const errs = errorCount.current;
    pendingDelta.current = 0;
    errorCount.current = 0;
    if (sent > 0) {
      toast({
        title: sent === 1 ? "🔥 Hype sent · -1 credit" : `🔥 +${sent} Hype · -${sent} credits`,
      });
    }
    if (errs > 0) {
      toast({
        title: errs === 1 ? "Hype failed" : `${errs} hypes failed`,
        description: "Please try again.",
        variant: "destructive",
      });
    }
    // Refresh wallet caches once
    queryClient.invalidateQueries({ queryKey: ["talent-credits", talent?.id] });
    queryClient.invalidateQueries({ queryKey: ["credits-summary"] });
  }, [toast, queryClient, talent?.id]);

  const scheduleToast = useCallback(() => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(flushToast, TOAST_DEBOUNCE_MS);
  }, [flushToast]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        window.clearTimeout(toastTimer.current);
        flushToast();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hype = useCallback(async () => {
    if (!talent?.id) {
      toast({ title: "Sign in to Hype", variant: "destructive" });
      return;
    }
    const now = Date.now();
    if (now - lastTap.current < TAP_LOCK_MS) return;
    lastTap.current = now;

    setCount((c) => c + 1); // optimistic
    inFlight.current += 1;
    setIsHyping(true);

    const { error } = await supabase.rpc("hype_content" as any, {
      _content_type: contentType,
      _content_id: contentId,
    });

    inFlight.current -= 1;
    if (inFlight.current === 0) setIsHyping(false);

    if (error) {
      setCount((c) => Math.max(0, c - 1));
      const msg = error.message || "";
      if (msg.includes("INSUFFICIENT_CREDITS")) {
        if (toastTimer.current) {
          window.clearTimeout(toastTimer.current);
          toastTimer.current = null;
        }
        flushToast();
        toast({
          title: "Not enough credits",
          description: "Top up to keep hyping creators.",
          variant: "destructive",
        });
        return;
      }
      if (msg.includes("CANNOT_HYPE_SELF")) {
        toast({ title: "You can't hype your own content", variant: "destructive" });
        return;
      }
      errorCount.current += 1;
      console.error("[useHype] failed:", { contentType, contentId, msg, code: (error as any).code });
      scheduleToast();
      return;
    }

    pendingDelta.current += 1;
    scheduleToast();
  }, [talent?.id, contentType, contentId, toast, scheduleToast, flushToast]);

  return { count, hype, isHyping };
}
