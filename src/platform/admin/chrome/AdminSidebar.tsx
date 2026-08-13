import { useNavigate, useLocation } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  Flag,
  Flame,
  LayoutDashboard,
  BookOpen,
  Video,
  Tv,
  Users,
  Calendar,
  ClipboardList,
  MessageSquare,
  MessageCircle,
  Briefcase,
  TrendingUp,
  Building2,
  FileCheck,
  ShieldCheck,
  Send,
  Database as DatabaseIcon,
  Key,
  Image as ImageIcon,
  GraduationCap,
  LogOut,
  UserCog,
  Bot,
  Coins,
  Bell,
  Trophy,
  FileText,
  BarChart2,
  Building,
  ChevronDown,
  BarChart,
  PieChart,
  Sparkles,
  Globe,
  Map,
  Settings,
  Megaphone,
  Target,
  Landmark,
  Mail,
  CreditCard,
  Factory,
  Network,
  Zap,
  Store,
  Layers,
  School,
  Share2,
  PhoneCall,
  Palette,
  Handshake,
  Upload,
  UserPlus,
  UserCheck,
  Wallet,
  Mic,
  Languages,
  Phone,
  Lock,
  CircleDollarSign,
  ArrowRightLeft,
  Receipt,
  Banknote,
  Activity,
  Radio,
  Radar,
  Inbox,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface NavItem {
  title: string;
  icon: React.ElementType;
  value: string;
}

interface NavGroup {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
  roles: AppRole[];
  companyScoped?: boolean;
}

// 1. CTO FIX: Unified all navigation items into a Single Source of Truth
const navGroups: NavGroup[] = [
  {
    title: "Executive Overview",
    icon: LayoutDashboard,
    roles: ["admin", "super_admin"],
    items: [
      { title: "Lifetime Metrics", value: "overview-lifetime", icon: LayoutDashboard },
      { title: "Monthly", value: "overview-month", icon: Calendar },
      { title: "Quarterly", value: "overview-quarter", icon: BarChart },
      { title: "Business Analyst", value: "overview-analyst", icon: Sparkles },
      { title: "Report Builder", value: "overview-reports", icon: FileText },
      { title: "Demand Signals", value: "signals-waitlist", icon: Flame },
    ],
  },
  {
    title: "Learning",
    icon: BookOpen,
    roles: ["admin"],
    items: [
      { title: "Dashboard",        icon: LayoutDashboard, value: "learning-overview" },
      { title: "Recorded Courses", icon: Tv,              value: "learning-courses" },
      { title: "Webinars",         icon: Calendar,        value: "learning-webinars" },
      { title: "Enrollments",      icon: Users,           value: "learning-enrollments" },
      { title: "Progress",         icon: BarChart2,       value: "learning-progress" },
      { title: "Graduates",        icon: Trophy,          value: "learning-graduates" },
      { title: "AI Career Tracks", icon: Sparkles,        value: "learning-career-tracks" },
      { title: "Academies",        icon: GraduationCap,   value: "learning-academies" },
      { title: "Schools",          icon: School,          value: "learning-schools" },
      { title: "Cohorts",          icon: Users,           value: "learning-cohorts" },
      { title: "JSON Importer",    icon: Upload,          value: "learning-json-importer" },
    ],
  },
  {
    title: "Global CRM",
    icon: Users,
    roles: ["admin", "super_admin", "talent_exec"],
    items: [
      { title: "Talent Pool",     icon: Users,         value: "crm-talent-pool" },
      { title: "CRM Overview",    icon: Activity,      value: "crm-overview" },
      { title: "Professions",     icon: Briefcase,     value: "crm-professions" },
      { title: "Upload Node",     icon: Upload,        value: "crm-upload" },
      { title: "Outreach Log",    icon: Send,          value: "crm-outreach" },
      { title: "Notifications",   icon: Bell,          value: "crm-notifications" },
      { title: "Support AI",      icon: Bot,           value: "crm-support-ai" },
    ],
  },
  {
    title: "AI Agents",
    icon: Bot,
    roles: ["admin"],
    items: [
      { title: "Agent OS Overview", icon: LayoutDashboard, value: "agents-overview" },
      { title: "Command Center", icon: Radar, value: "agents-command-center" },
      { title: "Agent Studio", icon: Sparkles, value: "agents-studio" },
      { title: "Sessions Log", icon: MessageSquare, value: "agents-sessions" },
      { title: "Agent Insights", icon: BarChart, value: "agents-insights" },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  userRole?: AppRole | null;
  adminScope?: "super" | "internal" | "company" | "none";
}

export function AdminSidebar({ activeTab, onTabChange, userRole = "admin", adminScope = "super" }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const filteredNavGroups = useMemo<NavGroup[]>(() => {
    return navGroups.filter((group) => {
      if (adminScope === "company") return group.companyScoped === true;
      if (!userRole) return false;
      return group.roles.includes(userRole);
    });
  }, [adminScope, userRole]);

  const activeGroupTitle = useMemo<string | undefined>(() => {
    const foundGroup = filteredNavGroups.find((g) =>
      g.items.some((i) => i.value === activeTab || (i.value === "overview-lifetime" && activeTab === "overview")),
    );
    if (foundGroup) return foundGroup.title;
    if (filteredNavGroups.length > 0) return filteredNavGroups[0].title;
    return undefined;
  }, [activeTab, filteredNavGroups]);

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    return new Set(activeGroupTitle ? [activeGroupTitle] : []);
  });

  // 2. CTO FIX: Force sidebar to auto-expand the correct folder when active tab changes externally
  useEffect(() => {
    if (activeGroupTitle) {
      setOpenGroups((prev) => new Set(prev).add(activeGroupTitle));
    }
  }, [activeGroupTitle]);

  const toggleGroup = (title: string, isOpen: boolean) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (isOpen) next.add(title);
      else next.delete(title);
      return next;
    });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40 bg-background/95 backdrop-blur-xl">
      <SidebarHeader className="border-b border-border/40 px-4 py-4 h-[72px] flex items-center bg-muted/10">
        <div className="flex items-center gap-4 w-full">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-lg">
            <BookOpen className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col overflow-hidden transition-all duration-300">
              <span className="font-semibold text-sm tracking-tight truncate">Gro10x Admin</span>
              <span className="text-[10px] text-muted-foreground tracking-tight truncate">
                {userRole === "talent_exec" ? "Talent operations" : "Executive console"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3 gap-2 overflow-y-auto no-scrollbar">
        {/* Agentic Dashboard (Chat) — Top Level Action */}
        {(userRole === "admin" || userRole === "super_admin") &&
          (() => {
            const isChat = location.pathname.startsWith("/dashboard/chat");
            const isInbox = location.pathname.startsWith("/admin/inbox");
            const isOutreachInbox = location.pathname.startsWith("/dashboard/messaging");
            return (
              <SidebarGroup className="p-0 mb-2">
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Agentic Dashboard"
                      onClick={() => navigate("/dashboard/chat")}
                      isActive={isChat}
                      className={cn(
                        "h-11 transition-all duration-200 rounded-xl",
                        isChat
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "hover:bg-primary/10 text-muted-foreground font-medium text-sm",
                      )}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">AI co-pilot</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Live Agent Inbox"
                      onClick={() => navigate("/admin/inbox")}
                      isActive={isInbox}
                      className={cn(
                        "h-11 transition-all duration-200 rounded-xl",
                        isInbox
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "hover:bg-primary/10 text-muted-foreground font-medium text-sm",
                      )}
                    >
                      <Inbox className="w-4 h-4" />
                      <span className="text-sm">Live inbox</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      tooltip="Outreach Inbox"
                      onClick={() => navigate("/dashboard/messaging")}
                      isActive={isOutreachInbox}
                      className={cn(
                        "h-11 transition-all duration-200 rounded-xl",
                        isOutreachInbox
                          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                          : "hover:bg-primary/10 text-muted-foreground font-medium text-sm",
                      )}
                    >
                      <Send className="w-4 h-4" />
                      <span className="text-sm">Outreach inbox</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            );
          })()}

        {/* Dynamic Nav Groups */}
        {filteredNavGroups.map((group) => (
          <Collapsible
            key={group.title}
            open={openGroups.has(group.title)}
            onOpenChange={(isOpen) => toggleGroup(group.title, isOpen)}
            className="group/collapsible mb-1"
          >
            <SidebarGroup className="p-0">
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  tooltip={group.title}
                  className={cn(
                    "uppercase tracking-wider text-[10px] font-semibold h-9 transition-colors rounded-lg",
                    openGroups.has(group.title)
                      ? "text-foreground/80"
                      : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  <group.icon className="w-4 h-4" />
                  <span>{group.title}</span>
                  <ChevronDown className="ml-auto w-4 h-4 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>

              <CollapsibleContent className="animate-in slide-in-from-top-2 duration-200">
                <SidebarMenu className="pl-2 mt-2 space-y-1 border-l-2 ml-4 border-border/30">
                  {group.items.map((item) => {
                    // Normalize overview active state logic
                    const isItemActive =
                      activeTab === item.value || (item.value === "overview-lifetime" && activeTab === "overview");

                    return (
                      <SidebarMenuItem key={item.value}>
                        <SidebarMenuButton
                          onClick={() => onTabChange(item.value)}
                          isActive={isItemActive}
                          className={cn(
                            "h-9 text-sm transition-all duration-200",
                            isItemActive
                              ? "bg-primary/10 text-primary font-semibold border-r-4 border-primary rounded-none"
                              : "text-muted-foreground font-medium hover:bg-muted/30 hover:text-foreground rounded-lg",
                          )}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}

        {/* External: Company Portal (B2B view) */}
        {userRole === "admin" && (
          <SidebarMenu className="mt-4 pt-4 border-t border-border/20">
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => window.open("/company", "_blank")}
                tooltip="Open Company Portal"
                className="hover:bg-blue-500/10 text-blue-500/80 hover:text-blue-600 font-medium text-sm h-9 rounded-lg transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>Company portal</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4 bg-muted/5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              tooltip="Sign out"
              className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive font-medium text-sm h-9 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

