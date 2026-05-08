// Mirrors the logic of the auto_set_talent_public_visibility() Postgres trigger.
// Source of truth: supabase/migrations/20260508054712_*.sql
import type { TalentProfile } from "@/contexts/TalentContext";

export interface ReadinessCheck {
  key: "full_name" | "skills" | "contact";
  label: string;
  ok: boolean;
}

export interface ReadinessResult {
  isLive: boolean;
  percent: number;
  checks: ReadinessCheck[];
  missing: ReadinessCheck[];
}

export function computeReadiness(t: Partial<TalentProfile> | null | undefined): ReadinessResult {
  const hasName = !!(t?.fullName && t.fullName.trim().length > 1);
  const hasSkill = Array.isArray(t?.skills) && t!.skills.length > 0;
  const hasContact =
    !!(t?.email && t.email.trim().length > 3) || !!(t?.phone && String(t.phone).trim().length > 3);

  const checks: ReadinessCheck[] = [
    { key: "full_name", label: "Full name", ok: hasName },
    { key: "skills", label: "At least one skill", ok: hasSkill },
    { key: "contact", label: "Email or phone", ok: hasContact },
  ];
  const passed = checks.filter((c) => c.ok).length;
  return {
    isLive: passed === checks.length,
    percent: Math.round((passed / checks.length) * 100),
    checks,
    missing: checks.filter((c) => !c.ok),
  };
}
