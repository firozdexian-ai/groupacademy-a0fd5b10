/**
 * Compact circular ring + label showing a company's profile completion %
 * and verification tier badge. Lives on the Gro10x Company Page header.
 */
import { ShieldCheck, ShieldAlert, BadgeCheck } from "lucide-react";

interface Props {
  completion: number; // 0–100
  tier: "unverified" | "self_completed" | "verified";
}

export function CompletionRing({ completion, tier }: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(completion)));
  const color =
    tier === "verified" ? "#10D576" : tier === "self_completed" ? "#33E1E4" : "#94A3B8";
  const Icon = tier === "verified" ? BadgeCheck : tier === "self_completed" ? ShieldCheck : ShieldAlert;
  const label = tier === "verified" ? "Verified" : tier === "self_completed" ? "Self-completed" : "Incomplete";
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-11 w-11 shrink-0">
        <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
          <circle cx="22" cy="22" r={r} stroke="rgba(255,255,255,0.1)" strokeWidth="4" fill="none" />
          <circle
            cx="22"
            cy="22"
            r={r}
            stroke={color}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 400ms ease" }}
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center text-[10px] font-semibold text-slate-200">
          {pct}%
        </span>
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-1 text-[11px]" style={{ color }}>
          <Icon className="h-3 w-3" /> {label}
        </div>
        <p className="text-[10px] text-slate-500">
          {pct < 100 ? "Complete your profile to unlock the Verified badge" : "Looking great"}
        </p>
      </div>
    </div>
  );
}
