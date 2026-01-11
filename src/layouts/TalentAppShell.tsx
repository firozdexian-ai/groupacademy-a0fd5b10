import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Home, GraduationCap, Briefcase, Globe, Bot, Sparkles, User, LogOut, Menu, X, Bell } from "lucide-react";
import { useState } from "react";
import { useTalent } from "@/hooks/useTalent";
import { usePWADetect } from "@/hooks/usePWADetect";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import logoLight from "@/assets/logo-horizontal-light.png";
import logoDark from "@/assets/logo-horizontal-dark.png";
import logoIcon from "@/assets/logo-icon.png";
import { useTheme } from "next-themes";
import { CreditBalance } from "@/components/credits/CreditBalance";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

const NAV_ITEMS = [
  { path: "/app/feed", label: "Feed", icon: Home },
  { path: "/app/learning", label: "Learn", icon: GraduationCap },
  { path: "/app/services", label: "Services", icon: Sparkles },
  { path: "/app/jobs", label: "Jobs", icon: Briefcase },
  { path: "/app/abroad", label: "Abroad", icon: Globe },
  { path: "/app/agents", label: "AI", icon: Bot },
];

export function TalentAppShell() {
  const { talent, signOut, isLoading } = useTalent();
  const { isPWA } = usePWADetect();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // 1. Loading State (PWA Branded)
  if (isLoading) {
    if (isPWA) {
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
          <img src={logoIcon} alt="GroUp Academy" className="w-16 h-16 mb-4 animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // 2. Auth Guard
  if (!talent) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    navigate(`/auth?returnTo=${returnUrl}`, { replace: true });
    return null;
  }

  const logoSrc = theme === "dark" ? logoDark : logoLight;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex w-64 flex-col border-r h-screen sticky top-0 bg-card/50 backdrop-blur-sm z-40">
        {/* Sidebar Header */}
        <div className="p-6 h-16 flex items-center border-b">
          <NavLink to="/app/feed">
            <img src={logoSrc} alt="GroUp Academy" className="h-8" />
          </NavLink>
        </div>

        {/* Sidebar Navigation */}
        <ScrollArea className="flex-1 px-4 py-6">
          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer (Profile & Logout) */}
        <div className="p-4 border-t space-y-4 bg-background/50">
          <div className="flex items-center gap-3 px-2">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src={talent?.profilePhotoUrl || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {talent?.fullName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{talent.fullName}</p>
              <p className="text-xs text-muted-foreground truncate">{talent.email}</p>
            </div>
          </div>

          <div className="px-2">
            <CreditBalance variant="compact" />
          </div>

          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-sm h-14 px-4 flex items-center justify-between">
          <NavLink to="/app/feed">
            <img src={logoIcon} alt="GroUp" className="h-8 w-8" />
          </NavLink>

          <div className="flex items-center gap-2">
            <NotificationDropdown />

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-x-0 top-14 bg-background/95 backdrop-blur-md border-b z-40 animate-in slide-in-from-top-5">
            <div className="p-4 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={talent?.profilePhotoUrl || undefined} />
                  <AvatarFallback>{talent?.fullName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{talent.fullName}</p>
                  <CreditBalance variant="compact" />
                </div>
              </div>
              <Button variant="ghost" className="w-full justify-start text-destructive" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          {/* On Desktop, add a top bar for Notifications if desired, or keep it clean */}
          <div className="hidden md:flex justify-end p-4">
            <div className="flex items-center gap-4">
              <NotificationDropdown />
            </div>
          </div>

          <Outlet />
        </main>
      </div>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md nav-float safe-bottom border-t">
        <div className="flex items-center justify-around h-[72px] px-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 min-w-[56px] py-2 px-3 rounded-2xl transition-all press-scale",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {/* Active pill indicator */}
                <div className={cn("p-2 rounded-xl transition-all", isActive && "bg-primary/15")}>
                  <item.icon className={cn("h-5 w-5 transition-all", isActive && "scale-110")} />
                </div>
                <span className={cn("text-[10px] font-semibold transition-all", isActive && "text-primary")}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
