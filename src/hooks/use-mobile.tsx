import * as React from "react";

/**
 * GroUp Academy: Viewport Intelligence Hook
 * CTO Reference: Corrected TS2339 by fixing the matchMedia typo.
 */

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // Initialize as undefined to prevent SSR hydration mismatches
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    // FIXED: matchMedia is the correct native method
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    setIsMobile(mql.matches);

    // Modern event listener logic with legacy fallbacks
    try {
      mql.addEventListener("change", onChange);
    } catch (e) {
      mql.addListener(onChange);
    }

    return () => {
      try {
        mql.removeEventListener("change", onChange);
      } catch (e) {
        mql.removeListener(onChange);
      }
    };
  }, []);

  // Ensure boolean return; defaults to false during hydration
  return !!isMobile;
}
