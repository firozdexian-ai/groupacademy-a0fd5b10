import { useEffect, useRef, useMemo } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { RefreshCw, Zap, ShieldCheck, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const SENTINEL_UPDATE_INTERVAL_MS = 30 * 60 * 1000; // Authoritative 30-Minute Check Frequency

/**
 * GroUp Academy: PWA Service Worker Neural Versioning Sentinel (PWAUpdatePrompt)
 * High-performance background worker lifecycle sync engine handling firmware lookups, state refreshes, and hot reloads.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function PWAUpdatePrompt() {
  const isMountedRef = useRef<boolean>(true);
  const backgroundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize component lifecycles to insulate background operations from state drops
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current);
        backgroundIntervalRef.current = null;
      }
    };
  }, []);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(serviceWorkerUrlStr, registrationWorkerNode) {
      if (!registrationWorkerNode) return;

      trackEvent("pwa_sentinel_sw_registration_verified", { url: serviceWorkerUrlStr });

      // Clean out existing dangling timer contexts defensively prior to spinning up fresh intervals
      if (backgroundIntervalRef.current) {
        clearInterval(backgroundIntervalRef.current);
      }

      // Phase 1: Allocate self-clearing high-frequency update check pings cleanly tied to component memory lifetimes
      backgroundIntervalRef.current = setInterval(() => {
        if (isMountedRef.current && registrationWorkerNode) {
          trackEvent("pwa_sentinel_checking_firmware_registry");
          registrationWorkerNode.update().catch((updateExceptionErr) => {
            trackError(updateExceptionErr, {
              component: "PWAUpdatePrompt",
              action: "background_service_worker_update_poll",
              severity: "low",
            });
          });
        }
      }, SENTINEL_UPDATE_INTERVAL_MS);
    },
    onRegisterError(caughtRegistrationExceptionErr) {
      trackError(caughtRegistrationExceptionErr, { component: "PWAUpdatePrompt", action: "register_service_worker" });
    },
  });

  // Track event logging passes automatically on positive firmware update discoveries
  useEffect(() => {
    if (needRefresh) {
      trackEvent("pwa_sentinel_new_firmware_detected");
    }
  }, [needRefresh]);

  const handleFirmwareSynchronizationProtocol = async () => {
    if (!needRefresh) return;
    trackEvent("pwa_firmware_hot_reload_triggered");

    try {
      // Phase 2: Transmit direct skipWaiting and reloading directives down current worker client threads
      await updateServiceWorker(true);
    } catch (caughtUpdateExceptionErr) {
      trackError(caughtUpdateExceptionErr, { component: "PWAUpdatePrompt", action: "execute_sw_firmware_update" });

      // Fallback Mitigation Pass: Execute hard browser window revalidation if socket events block execution
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    }
  };

  if (!needRefresh) return null;

  return (
    <div
      className={cn(
        "fixed bottom-24 left-4 right-4 z-[110] font-bold text-xs select-none transform-gpu animate-in slide-in-from-bottom-5 fade-in duration-300",
        "sm:left-auto sm:right-6 sm:w-[380px]",
      )}
    >
      <div className="relative rounded-xl border border-border/40 bg-card/95 backdrop-blur-xl p-4 sm:p-5 shadow-xl overflow-hidden text-left flex flex-col justify-center">
        {/* HUD LEVEL 1: TOP PANEL TRACK HORIZON METRIC BEAM ACCENT LINE */}
        <div
          className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-40 pointer-events-none select-none"
          aria-hidden="true"
        />

        {/* HUD LEVEL 2: COMPOSITE METADATA IDENTIFICATION CONTAINER DATA WRAPPER */}
        <div className="flex items-center gap-3.5 w-full min-w-0">
          {/* COMPONENT: ROTATING STATE SYNC INDICATOR BADGE */}
          <div className="relative shrink-0 select-none pointer-events-none">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/5 text-primary flex items-center justify-center shadow-inner">
              <RefreshCw
                className="h-5 w-5 text-primary stroke-[2.2] animate-spin"
                style={{ animationDuration: "8s" }}
              />
            </div>
            <Zap className="absolute -top-1 -right-1 h-3.5 w-3.5 text-primary fill-primary/10 stroke-[2.2] animate-pulse" />
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-center leading-none pr-1">
            <h3 className="text-xs sm:text-sm font-black uppercase italic tracking-tight text-foreground/90 block leading-none">
              New Firmware Package Detected
            </h3>
            <span className="text-[10px] font-semibold text-muted-foreground/60 block leading-normal pt-1.5 italic select-text selection:bg-primary/10">
              Synchronize connection parameters now to flash the latest platform updates and feature patches.
            </span>
          </div>

          {/* HUD LEVEL 3: SYNC COMMIT DISPATCH TRIGGER ACTION BUTTON */}
          <Button
            size="sm"
            type="button"
            onClick={handleFirmwareSynchronizationProtocol}
            className="h-9 px-4 rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-md transform-gpu active:scale-[0.985] transition-transform flex items-center justify-center cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 shrink-0"
            title="Execute service worker cache flushing and immediate layout hot reload sequence"
          >
            <ArrowUpCircle className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Sync</span>
          </Button>
        </div>

        {/* HUD LEVEL 4: OVERLAY BOTTOM OMNIPRESENCE SHIELD RIBBON FOOTER */}
        <div className="flex items-center justify-center gap-1.5 py-1 opacity-25 select-none pointer-events-none tracking-normal font-bold text-[8px] text-muted-foreground/50 font-mono leading-none shrink-0 uppercase w-full mt-3.5 border-t border-border/10 pt-2.5">
          <ShieldCheck className="h-3 w-3 stroke-[2.5]" />
          <span>Platform Sentinel Ledger Update Matrix Sealed // Hot Reload Instantiated</span>
        </div>
      </div>
    </div>
  );
}
