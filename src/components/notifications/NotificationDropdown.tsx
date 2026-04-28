import { Bell, CheckCheck, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NotificationItem } from "./NotificationItem";
import { useNotifications } from "@/hooks/useNotifications";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Institutional Alert Dispatcher
 * CTO Reference: Authoritative node for real-time talent telemetry and alert management.
 */

export function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const primaryIngress = notifications.slice(0, 10);
  const hasPendingAlerts = unreadCount > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 relative rounded-xl hover:bg-muted/20 transition-all active:scale-95 border border-transparent hover:border-border/40"
        >
          <Bell
            className={cn(
              "h-5 w-5 transition-transform duration-500",
              hasPendingAlerts && "animate-pulse text-primary",
            )}
          />

          {hasPendingAlerts && (
            <span className="absolute top-2 right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[10px] font-black italic tracking-tighter text-white shadow-lg shadow-rose-500/40 animate-in zoom-in duration-300">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[360px] p-0 rounded-[28px] border-2 border-border/40 bg-card/60 backdrop-blur-3xl shadow-2xl overflow-hidden"
        sideOffset={12}
      >
        {/* HUD: HEADER_SYNC */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-border/10 bg-muted/5">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary fill-current" />
            <h3 className="font-black uppercase italic tracking-widest text-xs">Registry_Alerts</h3>
          </div>

          {hasPendingAlerts && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg px-3 text-[9px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 transition-all gap-2"
              onClick={() => markAllAsRead()}
            >
              <CheckCheck className="h-3.5 w-3.5" /> MARK_VERIFIED
            </Button>
          )}
        </div>

        {/* HUD: ALERT_LEDGER */}
        <ScrollArea className="max-h-[440px]">
          {isLoading ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
                Syncing_Ledger...
              </p>
            </div>
          ) : primaryIngress.length === 0 ? (
            <div className="p-16 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="h-16 w-16 rounded-[22px] bg-muted/10 border-2 border-border/5 flex items-center justify-center mx-auto mb-6">
                <Bell className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Registry_Idle
              </p>
              <p className="text-[9px] font-medium text-muted-foreground/30 italic mt-2 uppercase tracking-widest leading-relaxed">
                Waiting for institutional sync events...
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/5">
              {primaryIngress.map((alert) => (
                <NotificationItem
                  key={alert.id}
                  notification={alert}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onClose={() => setOpen(false)}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {/* HUD: LEDGER_FOOTER */}
        {notifications.length > 0 && (
          <div className="p-4 bg-muted/5 border-t-2 border-border/10">
            <Button
              variant="outline"
              className="w-full h-11 rounded-xl border-2 font-black uppercase italic text-[10px] tracking-widest gap-2 hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/5 group"
              onClick={() => setOpen(false)}
            >
              AUDIT_FULL_REGISTRY
              <ShieldCheck className="h-4 w-4 opacity-40 group-hover:opacity-100 transition-opacity" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
