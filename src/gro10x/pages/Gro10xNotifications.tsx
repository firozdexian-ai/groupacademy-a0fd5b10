/**
 * Gro10x notifications — reuses the talent-side notifications hook (every
 * Gro10x user is also a talent under the hood).
 */
import { Link } from "react-router-dom";
import { ArrowLeft, Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { GRO10X_PANEL } from "../lib/tokens";

export default function Gro10xNotifications() {
  const { notifications, isLoading } = useNotifications();

  return (
    <div className="max-w-md mx-auto pb-8">
      <div className="px-4 pt-4 flex items-center gap-3">
        <Link to="/gro10x/inbox" className="text-slate-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Notifications</h1>
      </div>

      <div className="px-4 mt-3 space-y-2">
        {isLoading ? (
          <p className="text-xs text-slate-500">Loading…</p>
        ) : notifications.length === 0 ? (
          <div className={`${GRO10X_PANEL} border border-white/10 rounded-2xl p-6 text-center`}>
            <Bell className="h-8 w-8 mx-auto text-slate-500 mb-2" />
            <p className="text-sm text-slate-300">You're all caught up.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              We'll ping you here when applicants, drafts, or leads need you.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`${GRO10X_PANEL} border border-white/10 rounded-xl p-3`}>
              <p className="text-sm font-medium">{n.title}</p>
              {n.message && <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>}
              <p className="text-[10px] text-slate-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
