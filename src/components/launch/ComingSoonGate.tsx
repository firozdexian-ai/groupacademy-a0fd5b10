import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Check, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

/**
 * v0.5 ComingSoonGate — visual shell (B2).
 *
 * Wraps a route/section that is not ready for launch. Shows a polished
 * "Coming soon" panel + waitlist form. Waitlist submission is wired in B4
 * (currently logs + toasts locally).
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
  const [joined, setJoined] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LOCAL_KEY_PREFIX + featureKey) === "1";
  });

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Please enter a valid email");
      return;
    }
    setSubmitting(true);
    try {
      // B4 wires real `join_feature_waitlist` RPC; for now stub.
      await new Promise((r) => setTimeout(r, 300));
      localStorage.setItem(LOCAL_KEY_PREFIX + featureKey, "1");
      setJoined(true);
      toast.success("You're on the list — we'll email you when it opens.");
    } catch (err) {
      toast.error("Could not join the waitlist. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

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
              <label htmlFor={`waitlist-${featureKey}`} className="sr-only">
                Email address
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id={`waitlist-${featureKey}`}
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  className="flex-1"
                />
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Joining…" : "Notify me"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                No spam. One email when it opens.
              </p>
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
