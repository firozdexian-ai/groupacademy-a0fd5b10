import React from "react";

interface BootGateProps {
  children: React.ReactNode;
}

/**
 * v1.0.0 — BootGate simplified.
 * The database warmup (databaseWarmup.ts) has been removed.
 * It was firing an extra Supabase query on every cold page load and waiting
 * up to 8 seconds before resolving, adding significant latency for no benefit
 * at this stage. If cold-start latency becomes a problem at scale, this can
 * be re-introduced with a lighter ping query.
 */
export function BootGate({ children }: BootGateProps) {
  return <>{children}</>;
}

export default BootGate;
