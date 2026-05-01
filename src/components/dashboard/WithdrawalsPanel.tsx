import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Row {
  id: string;
  talent_id: string;
  amount_credits: number;
  method: string;
  payout_details: any;
  status: "pending" | "approved" | "paid" | "rejected";
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  talent?: { full_name: string | null; email: string | null };
}

const STATUSES: Row["status"][] = ["pending", "approved", "paid", "rejected"];

export function WithdrawalsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Row["status"]>("pending");
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("withdrawal_requests" as any)
      .select("*, talent:talents(full_name, email)")
      .order("created_at", { ascending: false });
    setRows((data as any) || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function update(id: string, status: Row["status"]) {
    const { error } = await supabase
      .from("withdrawal_requests" as any)
      .update({
        status,
        admin_notes: noteDraft[id] ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Marked as ${status}`);
    load();
  }

  const filtered = rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Wallet className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Withdrawal requests</h2>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as Row["status"])}>
        <TabsList>
          {STATUSES.map((s) => (
            <TabsTrigger key={s} value={s} className="capitalize">
              {s} ({rows.filter((r) => r.status === s).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No {filter} requests.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold truncate">
                      {r.talent?.full_name || "—"}
                      <span className="text-muted-foreground text-sm font-normal"> · {r.talent?.email}</span>
                    </p>
                    <p className="text-sm">
                      <b>{Number(r.amount_credits).toFixed(1)} credits</b> via <b>{r.method}</b>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), "PP p")} · {r.payout_details?.account_name} · {r.payout_details?.account_number}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">{r.status}</Badge>
                </div>
                {r.status === "pending" && (
                  <div className="space-y-2">
                    <Input
                      placeholder="Admin note (optional)"
                      value={noteDraft[r.id] ?? ""}
                      onChange={(e) => setNoteDraft((prev) => ({ ...prev, [r.id]: e.target.value }))}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button size="sm" onClick={() => update(r.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="default" onClick={() => update(r.id, "paid")}>Mark paid</Button>
                      <Button size="sm" variant="destructive" onClick={() => update(r.id, "rejected")}>Reject</Button>
                    </div>
                  </div>
                )}
                {r.status === "approved" && (
                  <Button size="sm" onClick={() => update(r.id, "paid")}>Mark as paid</Button>
                )}
                {r.admin_notes && <p className="text-xs text-muted-foreground">Note: {r.admin_notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
