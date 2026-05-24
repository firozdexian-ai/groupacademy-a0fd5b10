import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Check, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * v0.5 ComingSoonGate — B4 wired to `join_feature_waitlist` RPC.
 *
 * Wraps a route/section that is not ready for launch. Shows a polished
 * "Coming soon" panel + waitlist form, persisting to `public.feature_waitlist`.
 *
 * Contract: see .lovable/v05/defer-matrix.md §5.
 */
export interface ComingSoonGateProps {
  /** Stable slug used by `feature_waitlist.feature_key`. */
  featureKey: string;
  title?: string;
  description?: string;
  /** When true (or predicate returns true), render `children` instead of the gate. */
  showWhen?: boolean | (() => boolean);
  /** Optional secondary CTA, defaults to "Explore Jobs" → `/app/jobs`. */
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  children?: ReactNode;
}

const LOCAL_KEY_PREFIX = "v05_waitlist_joined:";

export function ComingSoonGate({
  featureKey,
  title = "Coming soon",
  description = "We're putting the finishing touches on this. Join the waitlist and we'll email you the moment it opens.",
  showWhen,
  secondaryCtaLabel = "Explore Jobs",
  secondaryCtaHref = "/app/jobs",
  children,
}: ComingSoonGateProps) {
  const open = typeof showWhen === "function" ? showWhen() : showWhen;
  if (open) return <>{children}</>;

  return (
    <ComingSoonPanel
      featureKey={featureKey}
      title={title}
      description={description}
      secondaryCtaLabel={secondaryCtaLabel}
      secondaryCtaHref={secondaryCtaHref}
    />
  );
}

function ComingSoonPanel({
  featureKey,
  title,
  description,
  secondaryCtaLabel,
  secondaryCtaHref,
}: {
  featureKey: string;
  title: string;
  description: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [joined, setJoined] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LOCAL_KEY_PREFIX + featureKey) === "1";
  });

  // Resolve auth + cross-device dedup once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      const authed = !!data.session?.user;
      setIsAuthed(authed);
      setSessionReady(true);

      // Cross-device dedup for logged-in users only.
      if (authed && !joined) {
        const { data: rows } = await supabase
          .from("feature_waitlist")
          .select("id")
          .eq("feature_key", featureKey)
          .limit(1);
        if (!cancelled && rows && rows.length > 0) {
          setJoined(true);
          try {
            localStorage.setItem(LOCAL_KEY_PREFIX + featureKey, "1");
          } catch {
            /* ignore */
          }
        }
      }

      // Focus email input for anon path.
      if (!authed) emailRef.current?.focus();
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureKey]);

  const markJoined = () => {
    setJoined(true);
    try {
      localStorage.setItem(LOCAL_KEY_PREFIX + featureKey, "1");
    } catch {
      /* ignore */
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !sessionReady) return;

    let normEmail: string | null = null;
    if (!isAuthed) {
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        toast.error("Please enter a valid email");
        return;
      }
      normEmail = email.trim();
    }

    setSubmitting(true);
    try {
      const sourcePath =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : null;
      const metadata = {
        ua:
          typeof navigator !== "undefined"
            ? navigator.userAgent.slice(0, 500)
            : null,
        referrer:
          typeof document !== "undefined" ? document.referrer || null : null,
      };

      const { data, error } = await supabase.rpc("join_feature_waitlist", {
        _feature_key: featureKey,
        _email: normEmail,
        _source_path: sourcePath,
        _metadata: metadata,
      });

      if (error) throw error;

      const status = (data as { status?: string } | null)?.status;
      if (status === "already_joined") {
        toast("You're already on the list.");
      } else {
        toast.success("You're on the list — we'll email you when it opens.");
      }
      markJoined();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not join the waitlist.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const authHref = `/auth?redirect=${encodeURIComponent(
    typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : "/",
  )}`;

  return (
    <div className="w-full px-3 py-6 sm:py-10">
      <Card className="mx-auto max-w-xl overflow-hidden border-border/60 bg-gradient-to-b from-card to-card/60 shadow-sm">
        <CardContent className="space-y-4 p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Coming soon
            </Badge>
            <span className="text-xs text-muted-foreground">{featureKey}</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold leading-tight sm:text-2xl">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {joined ? (
            <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                You're on the waitlist. We'll be in touch — meanwhile, keep
                exploring.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              {!isAuthed && (
                <>
                  <label
                    htmlFor={`waitlist-${featureKey}`}
                    className="sr-only"
                  >
                    Email address
                  </label>
                  <Input
                    id={`waitlist-${featureKey}`}
                    ref={emailRef}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting || !sessionReady}
                  />
                </>
              )}
              <Button
                type="submit"
                disabled={submitting || !sessionReady}
                className="w-full sm:w-auto"
              >
                {submitting ? "Joining…" : "Notify me"}
              </Button>
              <p className="text-xs text-muted-foreground">
                No spam. One email when it opens.
              </p>
              {!isAuthed && sessionReady && (
                <p className="text-xs text-muted-foreground">
                  <Link
                    to={authHref}
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    Sign up
                  </Link>{" "}
                  for full updates and early access.
                </p>
              )}
            </form>
          )}

          <div className="pt-1">
            <Button asChild variant="ghost" size="sm" className="gap-1 px-2">
              <Link to={secondaryCtaHref}>
                {secondaryCtaLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ComingSoonGate;
