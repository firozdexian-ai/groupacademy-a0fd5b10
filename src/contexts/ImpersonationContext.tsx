/**
 * Impersonation context — lets super_admin / internal staff "act as" a company
 * inside `/admin`. The chosen company id is mirrored to localStorage so it
 * survives reloads. Edge functions read `x-acting-company` header (set by the
 * supabase client wrapper) before falling back to the user's own membership.
 *
 * Pure UI/session layer; server-side trust is enforced by `current_company_context()`
 * which re-checks the user's admin role before honoring the override.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "actingCompanyId";

interface ImpersonationCtx {
  actingCompanyId: string | null;
  actingCompanyName: string | null;
  startActing: (companyId: string, companyName: string) => void;
  stopActing: () => void;
}

const Ctx = createContext<ImpersonationCtx | null>(null);

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [actingCompanyId, setId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });
  const [actingCompanyName, setName] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY + ":name");
  });

  const startActing = useCallback((companyId: string, companyName: string) => {
    localStorage.setItem(STORAGE_KEY, companyId);
    localStorage.setItem(STORAGE_KEY + ":name", companyName);
    setId(companyId);
    setName(companyName);
  }, []);

  const stopActing = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY + ":name");
    setId(null);
    setName(null);
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setId(e.newValue);
      if (e.key === STORAGE_KEY + ":name") setName(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(
    () => ({ actingCompanyId, actingCompanyName, startActing, stopActing }),
    [actingCompanyId, actingCompanyName, startActing, stopActing],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useImpersonation() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useImpersonation must be used inside <ImpersonationProvider>");
  return v;
}

export function getActingCompanyIdSync(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}
