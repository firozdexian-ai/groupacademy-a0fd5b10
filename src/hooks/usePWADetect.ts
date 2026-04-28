import { useState, useEffect } from "react";

/**
 * GroUp Academy: Environment Detection Sentinel
 * CTO Reference: Authoritative controller for PWA standalone status and ingress detection.
 * Logic: Synchronizes standalone flags across iOS, Android, and desktop environments.
 */

export const usePWADetect = () => {
  const [isPWA, setIsPWA] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    /**
     * PHASE: Registry_Audit
     * Verifies Standalone flags across multiple architectural standards.
     */
    const executeEnvironmentAudit = () => {
      // Standard: Display-mode media query (Desktop/Chrome/Android)
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;

      // iOS: Proprietary navigator property
      const isIOSStandalone = (window.navigator as any).standalone === true;

      // Android: TWA Referrer verification
      const isAndroidTWA = document.referrer.includes("android-app://");

      setIsPWA(isStandalone || isIOSStandalone || isAndroidTWA);
      setIsLoading(false);
    };

    executeEnvironmentAudit();

    // PHASE: Monotonic_Display_Listener
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleEnvironmentChange = (e: MediaQueryListEvent) => {
      setIsPWA(e.matches);
    };

    // HUD: Attach listener for mid-session mode transitions
    mediaQuery.addEventListener("change", handleEnvironmentChange);

    return () => mediaQuery.removeEventListener("change", handleEnvironmentChange);
  }, []);

  return { isPWA, isLoading };
};

export default usePWADetect;
