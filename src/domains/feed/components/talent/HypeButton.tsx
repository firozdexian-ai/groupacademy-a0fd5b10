import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContentHype, type HypeContentType } from "@/domains/feed/hooks/useContentHype";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface HypeButtonProps {
  postId?: string; // Legacy anchor mapping for backwards compatibility
  contentType?: HypeContentType;
  contentId?: string;
  initialCount?: number;
  variant?: "default" | "compact";
  contextData?: {
    creatorTalentId?: string;
    senderTalentId?: string;
  };
}

/**
 * Universal interaction button to support content across the platform.
 * Deducts 1 credit per click, distributing an 80/20 split to the creator's wallet.
 */
export function HypeButton({
  postId,
  contentType,
  contentId,
  initialCount = 0,
  variant = "default",
  contextData,
}: HypeButtonProps) {
  const queryClient = useQueryClient();
  const finalType: HypeContentType = contentType ?? "post";
  const finalId = contentId ?? postId ?? "";

  // Establish connection with content metadata state
  const { count, hype, isHyping } = useContentHype(finalType, finalId, initialCount);

  // Monitor interaction milestones to log notable engagement patterns
  useEffect(() => {
    if (count > 0 && count % 50 === 0 && finalId) {
      trackEvent("hype_milestone_reached", {
        contentId: finalId,
        contentType: finalType,
        totalHypes: count,
      });
    }
  }, [count, finalId, finalType]);

  if (!finalId) {
    trackError("HypeButton component rendered without a valid content identifier.", {
      component: "HypeButton",
      action: "validation_assertion_failure",
    });
    return null;
  }

  const handleHypeClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (isHyping) return;

    trackEvent("hype_button_clicked", {
      contentId: finalId,
      contentType: finalType,
      senderId: contextData?.senderTalentId,
    });

    try {
      // Execute the database credit conversion transaction
      await hype();

      // Synchronize client balance states instantly across available viewports
      queryClient.invalidateQueries({ queryKey: ["credits-balance"] });
    } catch (err: unknown) {
      const parsedMessage = err instanceof Error ? err.message : String(err);

      trackError(parsedMessage, {
        component: "HypeButton",
        action: "execute_hype_deduction",
        contentId: finalId,
        contentType: finalType,
        ...contextData,
      });

      // Catch credit shortages and forward cleanly to internal metrics logs
      if (parsedMessage.toLowerCase().includes("balance") || parsedMessage.toLowerCase().includes("credit")) {
        trackEvent("insufficient_credits_encountered", {
          context: parsedMessage,
          ...contextData,
        });
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isHyping}
      onClick={handleHypeClick}
      className={cn(
        "h-8 gap-1.5 rounded-lg px-2.5 text-[11px] font-bold tracking-tight select-none cursor-pointer transition-all duration-200",
        "text-orange-600 dark:text-orange-500 hover:text-orange-700 hover:bg-orange-500/10 active:scale-95",
        variant === "compact" && "px-2",
      )}
      title="Support this content (Costs 1 credit)"
    >
      <Flame
        className={cn(
          "h-4 w-4 transition-transform duration-300",
          isHyping ? "animate-bounce fill-current text-orange-500" : "fill-none stroke-[2.2]",
        )}
      />
      <span className="tabular-nums font-semibold">
        {count > 0 ? count.toLocaleString() : "Hype"}
      </span>
    </Button>
  );
}

