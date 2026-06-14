import { NavLink } from "react-router-dom";
import { MessageSquare, Newspaper, Building2, Activity, GraduationCap } from "lucide-react";
import { useGro10xThreads } from "../hooks/useGro10xThreads";

const items = [
  { to: "/gro10x/inbox", label: "Inbox",      Icon: MessageSquare },
  { to: "/gro10x/work",  label: "Activities", Icon: Activity },
  { to: "/gro10x/learn", label: "Learn",      Icon: GraduationCap },
  { to: "/gro10x/feed",  label: "Feed",       Icon: Newspaper },
  { to: "/gro10x/page",  label: "Company",    Icon: Building2 },
];

export function Gro10xBottomNav() {
  const { threads = [] } = useGro10xThreads();
  const unreadCount = threads.reduce((acc, t) => acc + (t.unread_count || 0), 0);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-white/5 bg-[#0B1220]/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5 max-w-md mx-auto">
        {items.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              aria-label={label}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] transition-colors ${
                  isActive ? "text-[#33E1E4]" : "text-slate-400 hover:text-slate-200"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      aria-hidden
                      className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-[#33E1E4]"
                    />
                  )}
                  <div className="relative">
                    <Icon className="h-5 w-5" aria-hidden />
                    {label === "Inbox" && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-[#0B1220]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="truncate max-w-full px-1">{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
