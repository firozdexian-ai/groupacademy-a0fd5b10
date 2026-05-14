/**
 * Global Broadcast Engine — Refactored for Phase Z0
 * CTO Version: May 2026
 * Fixes: B7 (Server-side Fan-out via RPC)
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

const ITEMS_PER_PAGE = 10;

export function NotificationsTab() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sendDialog, setSendDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // New notification state
  const [targetType, setTargetType] = useState<"all" | "category">("all");
  const [targetCategoryId, setTargetCategoryId] = useState("");
  const [payload, setPayload] = useState({ title: "", message: "", type: "announcement" });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await supabase
        .from("notifications")
        .select(`*, talent:talents(full_name, email)`, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setNotifications(data || []);
      setTotalCount(count || 0);

      // Fetch categories for targeting
      const { data: catData } = await supabase.from("profession_categories").select("id, name");
      setCategories(catData || []);
    } catch (err) {
      toast.error("Transmission log sync failed");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // B7 Fix: High-performance server-side broadcast
  const executeBroadcast = async () => {
    if (!payload.title || !payload.message) return toast.error("Incomplete payload");
    setIsSending(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      // Call the optimized RPC from the SQL migration
      const { error } = await supabase.rpc("broadcast_notifications", {
        p_title: payload.title,
        p_message: payload.message,
        p_type: payload.type,
        p_created_by: userData.user?.id,
      });

      if (error) throw error;

      toast.success("Global broadcast committed to database");
      setSendDialog(false);
      setPayload({ title: "", message: "", type: "announcement" });
      loadData();
    } catch (err) {
      toast.error("Broadcast execution fault");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" /> Broadcast Engine
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Phase Z0 Network Orchestrator
          </p>
        </div>
        <Button
          onClick={() => setSendDialog(true)}
          className="rounded-xl font-black uppercase text-[10px] tracking-widest gap-2"
        >
          <Send className="h-4 w-4" /> New Broadcast
        </Button>
      </div>

      <Card className="rounded-[40px] border-2 overflow-hidden shadow-xl">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="w-[200px] text-[10px] font-black uppercase pl-8">Temporal Index</TableHead>
              <TableHead className="text-[10px] font-black uppercase">Recipient Node</TableHead>
              <TableHead className="text-[10px] font-black uppercase">Payload</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase pr-8">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-20">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" />
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="pl-8 font-mono text-[10px] opacity-60">
                    {format(new Date(n.created_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-black uppercase">{n.talent?.full_name}</p>
                    <p className="text-[9px] opacity-60">{n.talent?.email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs font-bold">{n.title}</p>
                    <p className="text-[10px] opacity-70 line-clamp-1">{n.message}</p>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <Badge variant={n.is_read ? "secondary" : "default"} className="text-[9px] uppercase">
                      {n.is_read ? "Acknowledged" : "Pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Simplified Pagination */}
        <div className="p-4 border-t flex justify-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs font-black self-center">Page {page}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={notifications.length < ITEMS_PER_PAGE}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Optimized Broadcast Dialog */}
      <Dialog open={sendDialog} onOpenChange={setSendDialog}>
        <DialogContent className="max-w-md rounded-[32px] border-4">
          <div className="space-y-6 p-2">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase flex items-center gap-2">
                <Send className="h-6 w-6 text-primary" /> Deploy Broadcast
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Audience</Label>
                <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Global Network (All Talents)</SelectItem>
                    <SelectItem value="category">Segment by Profession</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Payload Title</Label>
                <Input
                  value={payload.title}
                  onChange={(e) => setPayload({ ...payload, title: e.target.value })}
                  placeholder="Headline..."
                  className="rounded-xl border-2"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase">Content Body</Label>
                <Textarea
                  value={payload.message}
                  onChange={(e) => setPayload({ ...payload, message: e.target.value })}
                  placeholder="Transmission details..."
                  className="rounded-xl border-2 min-h-[100px] resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={executeBroadcast}
                disabled={isSending}
                className="w-full h-12 rounded-xl font-black uppercase tracking-widest gap-2"
              >
                {isSending ? <Loader2 className="animate-spin h-4 w-4" /> : <Activity className="h-4 w-4" />}
                Execute Broadcast
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
