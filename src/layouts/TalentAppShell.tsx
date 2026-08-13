import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTalent } from "@/hooks/useTalent";
import { useAuth } from "@/hooks/useAuth";
import { getCountryFlag, getCountryName } from "@/lib/constants/countries";
import {
  GraduationCap,
  Bot,
  User,
  LogOut,
  Sun,
  Moon,
  HelpCircle,
  ArrowLeft,
  Edit2,
  BookOpen,
  Share2,
  Globe,
  ChevronRight,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";
import { getWhatsAppLink } from "@/lib/constants/support";
import { toast } from "sonner";
import logoIcon from "@/assets/logo-icon.png";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

/**
 * TalentAppShell — v1.0.0
 * Lean navigation: Learning, AI Career Coach, Profile only.
 * Removed: Jobs, Gigs, Feed/Community, Messages, Credits, Transactions,
 *           Study Abroad, Applications, Saved Jobs, Withdraw earnings.
 */

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

// v1.0.0 nav — only what exists and works
const NAV_ITEMS: NavItem[] = [
  { label: "Home",     icon: Home,          path: "/app/learning" },
  { label: "Learning", icon: GraduationCap, path: "/app/learning/courses" },
  { label: "AI Coach", icon: Bot,           path: "/app/career-coach" },
];

export function TalentAppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { talent } = useTalent();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/app/learning"
      ? location.pathname === "/app/learning" || location.pathname === "/app"
      : location.pathname.startsWith(path);

  const go = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleShare = async () => {
    const data = { title: "GroUp Academy", url: window.location.origin };
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(data.url);
      toast.success("Link copied to clipboard.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F2EF] dark:bg-background font-sans text-foreground transition-colors duration-300">

      {/* ── TOP HEADER ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white dark:bg-background/95 dark:backdrop-blur-sm border-b border-border h-14 px-3 md:px-4 shadow-sm">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-3">

          {/* Logo */}
          <button
            onClick={() => navigate("/app/learning")}
            className="flex items-center gap-2 shrink-0"
            aria-label="Go to home"
          >
            <img src={logoIcon} alt="GroUp Academy" className="h-8 w-8 rounded" />
            <span className="hidden md:block font-bold text-sm tracking-tight">GroUp Academy</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-4 h-full">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center w-16 lg:w-20 h-full border-b-2 transition-all active:scale-95 duration-200 ${
                  isActive(item.path)
                    ? "border-black dark:border-white text-black dark:text-white"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5 mb-0.5" />
                <span className="text-[10px] lg:text-xs font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Right side — desktop */}
          <div className="hidden md:flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex flex-col items-center outline-none text-muted-foreground hover:text-foreground">
                  <Avatar className="h-7 w-7 border border-border">
                    <AvatarImage src={talent?.profilePhotoUrl || ""} />
                    <AvatarFallback className="text-[10px]">ME</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-medium mt-0.5">Me ▼</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                {/* Profile card */}
                <div
                  onClick={() => navigate("/app/profile")}
                  className="flex items-center gap-3 p-2 mb-2 bg-muted/50 rounded-md cursor-pointer hover:bg-muted/80 transition-colors"
                >
                  <Avatar className="h-10 w-10 border shrink-0">
                    <AvatarImage src={talent?.profilePhotoUrl || ""} />
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden text-left">
                    <p className="font-semibold text-sm truncate">{talent?.fullName || "User"}</p>
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {talent?.email || ""}
                    </p>
                  </div>
                </div>

                <DropdownMenuItem onClick={() => navigate("/app/profile")} className="text-primary font-medium border border-primary justify-center rounded-full mb-2 cursor-pointer">
                  View Profile
                </DropdownMenuItem>

                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Account</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/app/profile/edit")} className="cursor-pointer">
                  <Edit2 className="h-4 w-4 mr-2" /> Settings &amp; Privacy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/app/learning/my-courses")} className="cursor-pointer">
                  <BookOpen className="h-4 w-4 mr-2" /> My Learning
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
                  <Share2 className="h-4 w-4 mr-2" /> Share GroUp Academy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(getWhatsAppLink("Hi, I need help!"), "_blank")} className="cursor-pointer">
                  <HelpCircle className="h-4 w-4 mr-2" /> Help &amp; Support
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="cursor-pointer">
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  {theme === "dark" ? "Light mode" : "Dark mode"}
                </DropdownMenuItem>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile — avatar (opens sidebar) */}
          <div className="flex md:hidden items-center gap-2">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <button aria-label="Open menu">
                  <Avatar className="h-8 w-8 border border-border cursor-pointer">
                    <AvatarImage src={talent?.profilePhotoUrl || ""} />
                    <AvatarFallback className="text-[10px]">ME</AvatarFallback>
                  </Avatar>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <div className="flex flex-col h-full bg-muted/30 dark:bg-background">
                  {/* Sidebar header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-card border-b">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSidebarOpen(false)}><ArrowLeft className="h-5 w-5" /></button>
                      <span className="font-semibold text-base">Menu</span>
                    </div>
                    <img src={logoIcon} alt="Logo" className="h-7 w-7 rounded" />
                  </div>

                  {/* Profile */}
                  <div
                    onClick={() => go("/app/profile")}
                    className="px-4 py-4 bg-card border-b flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                      <AvatarImage src={talent?.profilePhotoUrl || ""} />
                      <AvatarFallback className="text-sm"><User className="h-6 w-6" /></AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-base truncate">{talent?.fullName || "My Profile"}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                        {talent?.country ? (
                          <><span>{getCountryFlag(talent.countryCode || talent.country)}</span><span>{getCountryName(talent.country || talent.countryCode || "") || talent.country}</span></>
                        ) : (
                          <><Globe className="h-3 w-3" /><span>Worldwide</span></>
                        )}
                      </p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); go("/app/profile/edit"); }} className="p-1.5 rounded-full hover:bg-muted">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Sidebar links — v1.0.0 only */}
                  <ScrollArea className="flex-1">
                    <div className="py-2 space-y-0.5">
                      {([
                        { icon: Home,          label: "Home",         path: "/app/learning" },
                        { icon: GraduationCap, label: "Browse Courses", path: "/app/learning/courses" },
                        { icon: BookOpen,      label: "My Learning",  path: "/app/learning/my-courses" },
                        { icon: Bot,           label: "AI Career Coach", path: "/app/career-coach" },
                        { icon: User,          label: "My Profile",   path: "/app/profile" },
                        { icon: Edit2,         label: "Settings",     path: "/app/profile/edit" },
                      ] as { icon: React.ElementType; label: string; path: string }[]).map(({ icon: Icon, label, path }) => (
                        <button
                          key={path + label}
                          onClick={() => go(path)}
                          className={`w-full flex items-center gap-3 px-5 py-3 text-sm font-medium hover:bg-muted/60 ${location.pathname === path ? "text-primary" : ""}`}
                        >
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="flex-1 text-left">{label}</span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                        </button>
                      ))}

                      {/* Support & Share */}
                      <button onClick={handleShare} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium hover:bg-muted/60">
                        <Share2 className="h-5 w-5 text-muted-foreground" />
                        <span className="flex-1 text-left">Share GroUp Academy</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                      </button>
                      <button onClick={() => window.open(getWhatsAppLink("Hi, I need help!"), "_blank")} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-medium hover:bg-muted/60">
                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                        <span className="flex-1 text-left">Help &amp; Support</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                      </button>

                      {/* Dark mode */}
                      <div className="flex items-center gap-3 px-5 py-3">
                        {theme === "dark" ? <Moon className="h-5 w-5 text-muted-foreground" /> : <Sun className="h-5 w-5 text-muted-foreground" />}
                        <span className="flex-1 text-sm font-medium">Dark Mode</span>
                        <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
                      </div>
                    </div>
                  </ScrollArea>

                  <div className="p-4 border-t bg-card">
                    <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10" onClick={() => { signOut(); setSidebarOpen(false); }}>
                      <LogOut className="h-4 w-4 mr-2" /> Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto py-2 md:py-6 px-0 md:px-4 pb-24 md:pb-6">
        <RouteErrorBoundary fallbackPath="/app/learning" fallbackLabel="Back to home">
          <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-2 duration-300 transform-gpu">
            <Outlet />
          </div>
        </RouteErrorBoundary>
      </main>

      {/* ── MOBILE BOTTOM TAB BAR ─────────────────────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-background border-t border-border px-2 flex items-center justify-around z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]"
        style={{ height: "calc(60px + env(safe-area-inset-bottom, 0px))", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 duration-200 ${isActive(item.path) ? "text-primary" : "text-gray-500"}`}
          >
            <item.icon className="h-5 w-5 mb-0.5" />
            <span className="text-[10px] font-medium">{item.label}</span>
            {isActive(item.path) && <span className="w-1 h-1 rounded-full bg-primary mt-0.5 animate-in zoom-in duration-200" />}
          </button>
        ))}
        {/* Profile tab */}
        <button
          onClick={() => navigate("/app/profile")}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-all active:scale-95 duration-200 ${location.pathname.startsWith("/app/profile") ? "text-primary" : "text-gray-500"}`}
        >
          <User className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] font-medium">Profile</span>
          {location.pathname.startsWith("/app/profile") && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
        </button>
      </nav>
    </div>
  );
}
