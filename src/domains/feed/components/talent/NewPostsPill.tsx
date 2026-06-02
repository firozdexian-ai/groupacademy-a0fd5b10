import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface NewPostsPillProps {
  onTap: () => void | Promise<void>;
}

/**
 * Real-time notification pill for new feed posts.
 * Positions safely below device notches and handles real-time cache updates on click.
 */
export function NewPostsPill({ onTap }: NewPostsPillProps) {
  const { talent } = useTalent();
  const [count, setCount] = useState(0);
  const mountedAt = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const channel = supabase
      .channel("feed_posts_realtime_pill")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "feed_posts" }, (payload) => {
        try {
          const row = payload.new as any;
          if (!row) return;

          // Do not show the notification pill if the post was authored by the current user
          if (talent?.id && row.talent_id === talent.id) return;

          // Ignore updates for drafts or unreleased elements
          if (row.status && row.status !== "published") return;

          // Prevent race conditions from displaying historical data indexes
          if (row.created_at && row.created_at < mountedAt.current) return;

          setCount((prevCount) => {
            const newCount = prevCount + 1;
            trackEvent("feed_realtime_post_intercepted", {
              currentCount: newCount,
              postId: row.id,
              contentType: row.content_type || "text",
            });
            return newCount;
          });
        } catch (err) {
          trackError(err instanceof Error ? err : String(err), {
            component: "NewPostsPill",
            action: "realtime_payload_handler_fault",
          });
        }
      })
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          trackError("Realtime channel subscription failure encountered over stream socket pipelines", {
            component: "NewPostsPill",
            action: "socket_connection",
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [talent?.id]);

  if (count === 0) return null;

  const handlePillClick = async () => {
    trackEvent("feed_realtime_pill_clicked", {
      clearedCount: count,
      talentId: talent?.id,
    });

    try {
      // Execute refresh update callback
      await onTap();

      setCount(0);
      mountedAt.current = new Date().toISOString();

      // Reset scroll position gracefully to let users view the latest post entries
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "NewPostsPill",
        action: "execute_onTap_callback_refresh",
      });
    }
  };

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-40 flex justify-center pointer-events-none w-full max-w-xs transition-all duration-300"
      style={{
        top: "calc(env(safe-area-inset-top, 0px) + 4.5rem)",
      }}
    >
      <button
        onClick={handlePillClick}
        type="button"
        className={cn(
          "pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wider select-none cursor-pointer",
          "bg-primary text-primary-foreground shadow-lg shadow-primary/20 border border-primary/10 transition-all duration-300 transform-gpu active:scale-95 hover:scale-102",
          "animate-in slide-in-from-top-6 fade-in duration-300 ease-out",
        )}
      >
        <ArrowUp className="h-3.5 w-3.5 stroke-[2.5] animate-bounce" />
        <span>
          {count} new {count === 1 ? "post" : "posts"}
        </span>
      </button>
    </div>
  );
}