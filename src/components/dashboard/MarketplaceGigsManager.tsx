import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Coins, Eye } from "lucide-react";
import { MARKETPLACE_SCHOOLS } from "@/lib/constants/marketplaceCategories";
import { format } from "date-fns";

interface GigForm {
  title: string;
  description: string;
  skill_category: string;
  skill_subcategory: string;
  pricing_type: string;
  budget_amount: number | null;
  deadline: string;
  requirements: string;
  employer_name: string;
  employer_email: string;
  status: string;
  is_featured: boolean;
}

const defaultForm: GigForm = {
  title: "",
  description: "",
  skill_category: "digital_freelancing",
  skill_subcategory: "",
  pricing_type: "fixed",
  budget_amount: null,
  deadline: "",
  requirements: "",
  employer_name: "",
  employer_email: "",
  status: "approved",
  is_featured: false,
};

export function MarketplaceGigsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<GigForm>(defaultForm);
  const [viewBidsId, setViewBidsId] = useState<string | null>(null);

  const { data: gigs, isLoading } = useQuery({
    queryKey: ["admin-marketplace-gigs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_gigs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bids } = useQuery({
    queryKey: ["admin-marketplace-bids", viewBidsId],
    queryFn: async () => {
      if (!viewBidsId) return [];
      const { data, error } = await supabase
        .from("marketplace_bids")
        .select("*, talents(full_name, email, profile_photo_url)")
        .eq("gig_id", viewBidsId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!viewBidsId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        budget_amount: form.budget_amount || null,
        deadline: form.deadline || null,
      };
      if (editingId) {
        const { error } = await supabase.from("marketplace_gigs").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("marketplace_gigs").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Gig updated" : "Gig created");
      queryClient.invalidateQueries({ queryKey: ["admin-marketplace-gigs"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm(defaultForm);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (gig: any) => {
    setEditingId(gig.id);
    setForm({
      title: gig.title,
      description: gig.description,
      skill_category: gig.skill_category,
      skill_subcategory: gig.skill_subcategory || "",
      pricing_type: gig.pricing_type,
      budget_amount: gig.budget_amount,
      deadline: gig.deadline ? gig.deadline.split("T")[0] : "",
      requirements: gig.requirements || "",
      employer_name: gig.employer_name || "",
      employer_email: gig.employer_email || "",
      status: gig.status,
      is_featured: gig.is_featured || false,
    });
    setDialogOpen(true);
  };

  const selectedSchool = MARKETPLACE_SCHOOLS.find((s) => s.value === form.skill_category);

  const statusColor = (s: string) => {
    if (s === "active" || s === "approved") return "default";
    if (s === "completed") return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Marketplace Gigs</h2>
        <Button onClick={() => { setEditingId(null); setForm(defaultForm); setDialogOpen(true); }} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> New Gig
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Bids</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : !gigs?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No marketplace gigs yet</TableCell>
              </TableRow>
            ) : (
              gigs.map((gig: any) => (
                <TableRow key={gig.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{gig.title}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{gig.skill_category}</Badge></TableCell>
                  <TableCell className="text-xs">{gig.pricing_type}</TableCell>
                  <TableCell>
                    {gig.budget_amount ? (
                      <span className="flex items-center gap-1"><Coins className="h-3.5 w-3.5 text-amber-500" />{gig.budget_amount}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{gig.total_bids}</TableCell>
                  <TableCell><Badge variant={statusColor(gig.status)}>{gig.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setViewBidsId(gig.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(gig)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Marketplace Gig" : "Create Marketplace Gig"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Skill Category (School)</Label>
                <Select value={form.skill_category} onValueChange={(v) => setForm({ ...form, skill_category: v, skill_subcategory: "" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MARKETPLACE_SCHOOLS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subcategory (Program)</Label>
                <Select value={form.skill_subcategory} onValueChange={(v) => setForm({ ...form, skill_subcategory: v })}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {selectedSchool?.programs.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pricing Type</Label>
                <Select value={form.pricing_type} onValueChange={(v) => setForm({ ...form, pricing_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed Price</SelectItem>
                    <SelectItem value="bidding">Open to Bids</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Budget (credits)</Label>
                <Input type="number" value={form.budget_amount || ""} onChange={(e) => setForm({ ...form, budget_amount: parseInt(e.target.value) || null })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employer Name</Label>
                <Input value={form.employer_name} onChange={(e) => setForm({ ...form, employer_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Employer Email</Label>
                <Input value={form.employer_email} onChange={(e) => setForm({ ...form, employer_email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Requirements</Label>
              <Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
                <Label>Featured</Label>
              </div>
            </div>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={!form.title || !form.description || saveMutation.isPending}>
              {editingId ? "Update Gig" : "Create Gig"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Bids Dialog */}
      <Dialog open={!!viewBidsId} onOpenChange={(o) => !o && setViewBidsId(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bids ({bids?.length || 0})</DialogTitle>
          </DialogHeader>
          {!bids?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">No bids yet</p>
          ) : (
            <div className="space-y-3">
              {bids.map((bid: any) => (
                <div key={bid.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{bid.talents?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{bid.talents?.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="flex items-center gap-1 font-semibold text-sm">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />{bid.bid_amount}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{bid.status}</Badge>
                    </div>
                  </div>
                  <p className="text-xs">{bid.cover_letter}</p>
                  {bid.estimated_days && (
                    <p className="text-xs text-muted-foreground">Est. delivery: {bid.estimated_days} days</p>
                  )}
                  <p className="text-xs text-muted-foreground">{format(new Date(bid.created_at), "MMM d, yyyy")}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
