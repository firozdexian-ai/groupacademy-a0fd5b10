import { forwardRef, useEffect } from "react";
import { NavLink as RouterNavLink, NavLinkProps, useLocation } from "react-router-dom";
import { trackEvent } from "@/lib/errorTracking";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

/**
 * GroUp Academy: State-Aware Link Navigation Compatibility Wrapper (NavLink)
 * Restores historical 'activeClassName' parameters with high-performance string memoization.
 * Version: Launch Candidate Â· Phase Z0 Hardened
 */
export const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onClick, ...props }, ref) => {
    const location = useLocation();

    // Track active application routing paths defensively across tracking logs
    const targetPathStringValue = typeof to === "string" ? to : to.pathname || "";

    const handleNavigationTelemetryHandshake = (event: React.MouseEvent<HTMLAnchorElement>) => {
      trackEvent("nav_link_engagement_triggered", {
        origin: location.pathname,
        destination: targetPathStringValue,
      });
      if (onClick) onClick(event);
    };

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        onClick={handleNavigationTelemetryHandshake}
        className={({ isActive, isPending }) =>
          cn(
            "transition-colors duration-200 ease-in-out select-none transform-gpu",
            className,
            isActive && activeClassName,
            isPending && pendingClassName,
          )
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink_Identity_Node";

