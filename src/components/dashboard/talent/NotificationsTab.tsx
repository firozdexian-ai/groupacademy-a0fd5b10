import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Bell,
  Send,
  Users,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Activity,
  BellRing,
} from "lucide-react";
import { format } from "date-fns";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Global CRM Broadcast Engine (Notifications)
 * 2026 Standard: Blended Phase 6 UI (Push Orchestration)
 */

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface Notification {
  id: string;
  talent_id: string;
  title: string;
  message: string;
  type: string;
  icon: string | null;
  link: string | null;
  is_read: boolean | null;
  created_at: string;
  talent?: { full_name: string; email: string };
}

interface Talent {
  id: string;
  full_name: string;
  email: string;
  profession_category_id?: string;
}

interface ProfessionCategory {
  id: string;
  name: string;
}

const NOTIFICATION_TYPES = [
  { value: "announcement", label: "Announcement" },
  { value: "promotion", label: "Promotion" },
  { value: "reminder", label: "Reminder" },
  { value: "update", label: "Update" },
  { value: "achievement", label: "Achievement" },
];

const ITEMS_PER_PAGE = 10;

export function NotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [talents, setTalents] = useState<Talent[]>([]);
  const [categories, setCategories] = useState<ProfessionCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [sendDialog, setSendDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, read: 0, unread: 0, today: 0 });

  // New notification form
  const [newNotification, setNewNotification] = useState({
    targetType: "all" as "all" | "single" | "category",
    targetTalentId: "",
    targetCategoryId: "",
    title: "",
    message: "",
    type: "announcement",
    link: "",
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("notifications")
        .select(`*, talent:talents(full_name, email)`, { count: "exact" })
        .order("created_at", { ascending: false });

      if (debouncedSearch) {
        const safe = sanitizeIlike(debouncedSearch);
        if (safe) query = query.ilike("title", `%${safe}%`);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const {
        data: notificationsData,
        count,
        error: notificationsError,
      } = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Notifications load timed out");
      if (notificationsError) throw notificationsError;

      setNotifications(notificationsData || []);
      setTotalCount(count || 0);

      if (talents.length === 0) {
        const { data: talentsData } = await supabase
          .from("talents")
          .select("id, full_name, email, profession_category_id")
          .order("full_name");
        setTalents(talentsData || []);
      }

      if (categories.length === 0) {
        const { data: catData } = await supabase.from("profession_categories").select("id, name").eq("is_active", true);
        setCategories(catData || []);
      }

      if (page === 1) {
        const { count: unreadCount } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("is_read", false);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { count: todayCount } = await supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .gte("created_at", todayStart.toISOString());

        setStats({
          total: count || 0,
          read: (count || 0) - (unreadCount || 0),
          unread: unreadCount || 0,
          today: todayCount || 0,
        });
      }
    } catch (err: any) {
      toast.error("Failed to load global notifications");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, talents.length, categories.length]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleSendNotification = async () => {
    if (!newNotification.title || !newNotification.message) return toast.error("Please fill in title and message");
    if (newNotification.targetType === "single" && !newNotification.targetTalentId)
      return toast.error("Please select a talent node");
    if (newNotification.targetType === "category" && !newNotification.targetCategoryId)
      return toast.error("Please select a taxonomy category");

    setIsSending(true);
    try {
      let targetTalents: Talent[] = [];
      if (newNotification.targetType === "all") targetTalents = talents;
      else if (newNotification.targetType === "category")
        targetTalents = talents.filter((t) => t.profession_category_id === newNotification.targetCategoryId);
      else {
        const single = talents.find((t) => t.id === newNotification.targetTalentId);
        if (single) targetTalents = [single];
      }

      if (targetTalents.length === 0) {
        toast.warning("No nodes found for selected target parameters");
        setIsSending(false);
        return;
      }

      const CHUNK_SIZE = 500;
      const chunks = [];
      for (let i = 0; i < targetTalents.length; i += CHUNK_SIZE) chunks.push(targetTalents.slice(i, i + CHUNK_SIZE));

      for (const chunk of chunks) {
        const notificationsToInsert = chunk.map((talent) => ({
          talent_id: talent.id,
          title: newNotification.title,
          message: newNotification.message,
          type: newNotification.type,
          link: newNotification.link || null,
          icon: "bell",
        }));
        const { error: insertError } = await supabase.from("notifications").insert(notificationsToInsert);
        if (insertError) throw insertError;
      }

      toast.success(`Broadcast deployed to ${targetTalents.length} global nodes`);
      setSendDialog(false);
      setNewNotification({
        targetType: "all",
        targetTalentId: "",
        targetCategoryId: "",
        title: "",
        message: "",
        type: "announcement",
        link: "",
      });
      loadData();
    } catch (err: any) {
      toast.error("Execution Fault: Failed to send broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Phase 6 Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-violet-500">
            <BellRing className="h-8 w-8 text-violet-500 fill-violet-500/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Global Broadcasts
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Platform Notification Orchestrator
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={loadData}
            className="h-14 w-14 rounded-2xl border-2 text-violet-500 border-violet-500/20 bg-violet-500/10 hover:bg-violet-500 hover:text-white transition-all shadow-sm"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => setSendDialog(true)}
            className="h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest gap-3 shadow-xl bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Send className="h-4 w-4" /> Deploy Broadcast
          </Button>
        </div>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <MetricTile
          label="Total Dispatched"
          value={stats.total}
          icon={Bell}
          color="text-violet-500"
          bg="bg-violet-500/10"
        />
        <MetricTile
          label="Acknowledged"
          value={stats.read}
          icon={CheckCircle}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
        <MetricTile
          label="Pending Review"
          value={stats.unread}
          icon={Clock}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <MetricTile label="Deployed (24H)" value={stats.today} icon={Send} color="text-blue-500" bg="bg-blue-500/10" />
      </div>

      {/* Master Ledger */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-violet-500 to-fuchsia-600" />
        <CardHeader className="p-8 border-b border-border/10 text-left">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Transmission Log</CardTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-1">
                Historical Broadcast Records
              </p>
            </div>
            <div className="relative w-72 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-violet-500 transition-colors" />
              <Input
                placeholder="Search broadcast history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 rounded-xl border-2 pl-12 font-bold uppercase text-[10px] tracking-widest bg-muted/20"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading && page === 1 && notifications.length === 0 ? (
            <div className="p-12 space-y-6">
              <Skeleton className="h-12 w-full rounded-2xl bg-muted/40" />
              <Skeleton className="h-12 w-full rounded-2xl bg-muted/40" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                  <TableRow className="hover:bg-transparent text-left">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                      Temporal Index
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Target Node</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Payload</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Protocol</TableHead>
                    <TableHead className="text-right font-black uppercase text-[10px] tracking-widest pr-8">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/5">
                  {notifications.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic"
                      >
                        No transmissions found
                      </TableCell>
                    </TableRow>
                  ) : (
                    notifications.map((notification) => (
                      <TableRow
                        key={notification.id}
                        className="group hover:bg-violet-500/[0.02] transition-colors text-left"
                      >
                        <TableCell className="pl-8 py-6 text-[10px] font-mono text-muted-foreground/60 italic">
                          {format(new Date(notification.created_at), "MMM d, HH:mm:ss")}
                        </TableCell>
                        <TableCell>
                          <p className="font-black text-sm uppercase italic tracking-tight">
                            {notification.talent?.full_name || "Unknown Node"}
                          </p>
                          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                            {notification.talent?.email}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-bold text-sm tracking-tight">{notification.title}</p>
                          <p className="text-[10px] font-medium text-muted-foreground line-clamp-1 mt-0.5 max-w-md">
                            {notification.message}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="font-black text-[9px] uppercase tracking-widest px-2 border-2"
                          >
                            {notification.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Badge
                            className={cn(
                              "font-black text-[9px] uppercase tracking-widest px-3 py-1 border-none",
                              notification.is_read
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-amber-500/10 text-amber-600",
                            )}
                          >
                            {notification.is_read ? "Acknowledged" : "Pending"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-6 border-t border-border/10 bg-muted/5">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 italic ml-4">
                Sector <span className="text-foreground">{page}</span> of {totalPages}
              </p>
              <div className="flex gap-2 mr-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-10 w-10 rounded-xl border-2 hover:bg-violet-600 hover:text-white transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-10 w-10 rounded-xl border-2 hover:bg-violet-600 hover:text-white transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Broadcast Composer Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent className="max-w-xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl text-left">
          <div className="h-2 w-full bg-gradient-to-r from-violet-500 to-fuchsia-600" />
          <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-foreground flex items-center gap-3">
                <Send className="h-8 w-8 text-violet-500" /> Deploy Broadcast
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">
                  Target Audience
                </Label>
                <Select
                  value={newNotification.targetType}
                  onValueChange={(v: "all" | "single" | "category") =>
                    setNewNotification({ ...newNotification, targetType: v })
                  }
                >
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2 font-bold">
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Global Network ({talents.length} Nodes)
                      </div>
                    </SelectItem>
                    <SelectItem value="category">Specific Taxonomy Segment</SelectItem>
                    <SelectItem value="single">Isolated Talent Node</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newNotification.targetType === "category" && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">
                    Select Taxonomy
                  </Label>
                  <Select
                    value={newNotification.targetCategoryId}
                    onValueChange={(v) => setNewNotification({ ...newNotification, targetCategoryId: v })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 font-bold">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newNotification.targetType === "single" && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">
                    Select Identity
                  </Label>
                  <Select
                    value={newNotification.targetTalentId}
                    onValueChange={(v) => setNewNotification({ ...newNotification, targetTalentId: v })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                      <SelectValue placeholder="Choose a node" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 rounded-2xl border-2 font-bold">
                      {talents.map((talent) => (
                        <SelectItem key={talent.id} value={talent.id}>
                          {talent.full_name} ({talent.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">
                    Protocol Type
                  </Label>
                  <Select
                    value={newNotification.type}
                    onValueChange={(v) => setNewNotification({ ...newNotification, type: v })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-2 font-bold">
                      {NOTIFICATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">
                    Hyperlink (Optional)
                  </Label>
                  <Input
                    value={newNotification.link}
                    onChange={(e) => setNewNotification({ ...newNotification, link: e.target.value })}
                    placeholder="/app/..."
                    className="h-14 rounded-2xl border-2 font-mono text-xs bg-muted/20"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t border-border/10 pt-4">
                <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">
                  Payload Title
                </Label>
                <Input
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                  placeholder="Enter broadcast header..."
                  className="h-14 rounded-2xl border-2 font-bold text-lg bg-muted/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="font-black uppercase text-[10px] tracking-widest text-primary ml-1">
                  Payload Content
                </Label>
                <Textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                  placeholder="Enter transmission body..."
                  rows={4}
                  className="rounded-2xl border-2 font-medium p-4 bg-muted/20 resize-none"
                />
              </div>
            </div>

            <DialogFooter className="pt-6 border-t border-border/10">
              <Button
                variant="ghost"
                onClick={() => setSendDialog(false)}
                className="h-14 px-8 font-black uppercase text-[10px] tracking-widest"
              >
                Abort
              </Button>
              <Button
                onClick={handleSendNotification}
                disabled={isSending}
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isSending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
                {isSending ? "Transmitting..." : "Execute Broadcast"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl overflow-hidden hover:border-primary/30 transition-all group text-left">
      <CardContent className="p-6 flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border-2 border-white/5 transition-transform group-hover:rotate-6 shadow-inner shrink-0",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic mb-1 truncate">
            {label}
          </p>
          <p className="text-4xl font-black italic tracking-tighter leading-none text-foreground/90">
            {value?.toLocaleString() || "0"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default NotificationsTab;
