/**
 * Analytics Period Mathematics Utility (Phase 10i.2 - Hardened).
 * Generates bounded calendar date matrices for the Monthly and Quarterly dashboard pickers.
 * Fixes temporal range overlap bugs by enforcing sharp sub-millisecond clipping bounds.
 */

export type PeriodMode = "month" | "quarter";

export interface Period {
  from: Date;
  to: Date;
  label: string;
  /** Stable lookup routing token: e.g., "2026-05" or "2026-Q2" */
  token: string;
}

/**
 * Compiles a localized, uniform month profile bounded cleanly to the exact millisecond before the next period.
 */
export function monthPeriod(year: number, monthIndex: number): Period {
  const from = new Date(year, monthIndex, 1, 0, 0, 0, 0);

  // Create upper bounding line precisely at 23:59:59.999 of the month's final day
  const to = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
  to.setTime(to.getTime() - 1);

  return {
    from,
    to,
    // Enforce explicit formatting locale to prevent platform cross-device hydration drift
    label: from.toLocaleString("en-US", { month: "long", year: "numeric" }),
    token: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
  };
}

/**
 * Compiles a quarterly period profile. Bounded strictly to the microsecond line.
 */
export function quarterPeriod(year: number, q: number /* 0..3 */): Period {
  const from = new Date(year, q * 3, 1, 0, 0, 0, 0);

  const to = new Date(year, q * 3 + 3, 1, 0, 0, 0, 0);
  to.setTime(to.getTime() - 1);

  return {
    from,
    to,
    label: `Q${q + 1} ${year}`,
    token: `${year}-Q${q + 1}`,
  };
}

/**
 * Shifts the input matrix backwards by exactly one period step dimension.
 */
export function previousPeriod(p: Period, mode: PeriodMode): Period {
  if (mode === "month") {
    const d = new Date(p.from);
    d.setMonth(d.getMonth() - 1);
    return monthPeriod(d.getFullYear(), d.getMonth());
  }
  const d = new Date(p.from);
  d.setMonth(d.getMonth() - 3);
  return quarterPeriod(d.getFullYear(), Math.floor(d.getMonth() / 3));
}

/**
 * Dynamically jumps dates forward or backward by an explicit multiplier factor.
 */
export function shiftPeriod(p: Period, mode: PeriodMode, delta: number): Period {
  if (mode === "month") {
    const d = new Date(p.from);
    d.setMonth(d.getMonth() + delta);
    return monthPeriod(d.getFullYear(), d.getMonth());
  }
  const d = new Date(p.from);
  d.setMonth(d.getMonth() + delta * 3);
  return quarterPeriod(d.getFullYear(), Math.floor(d.getMonth() / 3));
}

/**
 * Calculates the bounding coordinates for the current calendar frame (Evaluated in 2026).
 */
export function currentPeriod(mode: PeriodMode): Period {
  const now = new Date();
  if (mode === "month") return monthPeriod(now.getFullYear(), now.getMonth());
  return quarterPeriod(now.getFullYear(), Math.floor(now.getMonth() / 3));
}

/**
 * Builds an index of subsequent chronological period profiles descending back from the current date.
 */
export function listPeriods(mode: PeriodMode, count: number): Period[] {
  const out: Period[] = [];
  let p = currentPeriod(mode);
  for (let i = 0; i < count; i++) {
    out.push(p);
    p = previousPeriod(p, mode);
  }
  return out;
}

/**
 * Safely parses strict URL string parameter hashes into runtime date objects.
 * Returns null if the token structure does not match canonical layout standards.
 */
export function parseToken(mode: PeriodMode, token: string | null): Period | null {
  if (!token) return null;

  if (mode === "month") {
    const match = /^(\d{4})-(\d{2})$/.exec(token);
    if (!match) return null;
    return monthPeriod(Number(match[1]), Number(match[2]) - 1);
  }

  const match = /^(\d{4})-Q([1-4])$/.exec(token);
  if (!match) return null;
  return quarterPeriod(Number(match[1]), Number(match[2]) - 1);
}

