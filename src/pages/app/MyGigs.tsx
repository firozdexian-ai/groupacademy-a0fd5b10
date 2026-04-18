import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MARKETPLACE_SCHOOL_MAP } from "@/lib/constants/marketplaceCategories";
import { toast } from "sonner";
import {
  Coins,
  Clock,
  Briefcase,
  Upload,
  Send,
  Star,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function MyGigs() {
  const { talent } = useTalent();
  const queryClient = useQueryClient();
  const [deliverableDialog, setDeliverableDialog] = useState<string | null>(null);
  const [reviewDialog, setReviewDialog] = useState<string | null>(null);

  // State for forms
  const [delivTitle, setDelivTitle] = useState("");
  const [delivDesc, setDelivDesc] = useState("");
  const [delivFile, setDelivFile] = useState<File | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const { data: myBids, isLoading: bidsLoading } = useQuery({
    queryKey: ["my-marketplace-bids", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_bids")
        .select("*, marketplace_gigs(title, skill_category, employer_name)")
        .eq("talent_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!talent?.id,
  });

  const { data: myContracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["my-marketplace-contracts", talent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_contracts")
        .select("*, marketplace_gigs:gig_id(title, skill_category)")
        .eq("freelancer_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!talent?.id,
  });

  const { data: myDeliverables } = useQuery({
    queryKey: ["my-deliverables", deliverableDialog],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_deliverables")
        .select("*")
        .eq("contract_id", deliverableDialog!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!deliverableDialog,
  });

  const { data: myReviews } = useQuery({
    queryKey: ["my-reviews", talent?.id],
    queryFn: async () => {
      const contractIds = myContracts?.map((c) => c.id) || [];
      if (!contractIds.length) return [];
      const { data } = await supabase.from("marketplace_reviews").select("*").in("contract_id", contractIds);
      return data || [];
    },
    enabled: !!myContracts?.length,
  });

  const submitDeliverable = useMutation({
    mutationFn: async () => {
      if (!deliverableDialog) throw new Error("Contract Context Lost");
      let fileUrl = null;
      if (delivFile) {
        const path = `deliverables/${talent!.id}/${Date.now()}-${delivFile.name}`;
        const { error: uploadErr } = await supabase.storage.from("marketplace-deliverables").upload(path, delivFile);
        if (uploadErr) throw uploadErr;
        fileUrl = supabase.storage.from("marketplace-deliverables").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("marketplace_deliverables").insert({
        contract_id: deliverableDialog,
        title: delivTitle,
        description: delivDesc,
        file_url: fileUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Work evidence submitted!");
      setDeliverableDialog(null);
      setDelivTitle("");
      setDelivDesc("");
      setDelivFile(null);
      queryClient.invalidateQueries({ queryKey: ["my-deliverables"] });
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("marketplace_reviews").insert({
        contract_id: reviewDialog,
        reviewer_type: "freelancer",
        rating: reviewRating,
        comment: reviewComment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reputation updated!");
      setReviewDialog(null);
      queryClient.invalidateQueries({ queryKey: ["my-reviews"] });
    },
  });

  const activeContracts = myContracts?.filter((c) => c.status === "active") || [];
  const completedContracts = myContracts?.filter((c) => c.status === "completed") || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-700">
      <header className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
          Gig Dashboard <Briefcase className="h-6 w-6 text-primary/40" />
        </h1>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Manage your professional output & pipeline
        </p>
      </header>

      <Tabs defaultValue="bids" className="w-full">
        <TabsList className="bg-muted/50 p-1.5 rounded-2xl w-full h-12 border border-border/40">
          <TabsTrigger value="bids" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest">
            Proposals
          </TabsTrigger>
          <TabsTrigger value="active" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest">
            Active ({activeContracts.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex-1 rounded-xl font-bold text-xs uppercase tracking-widest">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bids" className="mt-6 space-y-4 outline-none">
          {bidsLoading ? (
            [...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)
          ) : !myBids?.length ? (
            <div className="py-20 text-center border-2 border-dashed rounded-[32px] border-border/40">
              <Send className="h-10 w-10 text-muted-foreground/10 mx-auto mb-4" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground/40">
                No active proposals found
              </p>
            </div>
          ) : (
            myBids.map((bid) => (
              <Card
                key={bid.id}
                className="rounded-[28px] border-border/40 hover:border-primary/20 transition-all bg-card/50 backdrop-blur-sm"
              >
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-black text-sm tracking-tight leading-tight truncate">
                      {bid.marketplace_gigs?.title}
                    </h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter mt-1">
                      {MARKETPLACE_SCHOOL_MAP[bid.marketplace_gigs?.skill_category]?.label} •{" "}
                      {bid.marketplace_gigs?.employer_name}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-600 uppercase">
                        <Coins className="h-3 w-3" /> {bid.bid_amount}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                        {format(new Date(bid.created_at), "MMM d")}
                      </span>
                    </div>
                  </div>
                  <Badge
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest h-6 px-2.5 border-none",
                      bid.status === "accepted" ? "bg-emerald-500/10 text-emerald-600" : "bg-primary/10 text-primary",
                    )}
                  >
                    {bid.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-6 space-y-4 outline-none">
          {activeContracts.map((contract) => (
            <Card key={contract.id} className="rounded-[32px] border-primary/20 bg-primary/[0.02] overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-black text-lg tracking-tight leading-tight">
                      {contract.marketplace_gigs?.title}
                    </h4>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">Execution Phase</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black tracking-tighter text-emerald-600">{contract.agreed_amount}</p>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">
                      Credits Agreed
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/10"
                  onClick={() => setDeliverableDialog(contract.id)}
                >
                  <Upload className="h-4 w-4 mr-2" /> Submit Deliverable
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="completed" className="mt-6 space-y-4 outline-none">
          {completedContracts.map((contract) => {
            const reviewed = myReviews?.some((r) => r.contract_id === contract.id);
            return (
              <Card key={contract.id} className="rounded-[28px] border-border/40 opacity-80">
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm truncate">{contract.marketplace_gigs?.title}</h4>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Completed {format(new Date(contract.completed_at), "MMM d")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-emerald-600 font-black text-sm">
                      <Coins className="h-4 w-4" />+{contract.agreed_amount}
                    </div>
                    {!reviewed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-xl font-black text-[9px] uppercase tracking-widest border-primary/30 text-primary"
                        onClick={() => setReviewDialog(contract.id)}
                      >
                        <Star className="h-3 w-3 mr-1.5" /> Review
                      </Button>
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500/40" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Deliverable Intelligence Modal */}
      <Dialog open={!!deliverableDialog} onOpenChange={(o) => !o && setDeliverableDialog(null)}>
        <DialogContent className="rounded-[40px] border-border/40 max-w-lg p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black tracking-tighter">Deliver Performance</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              Stage work for employer verification
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {myDeliverables?.length ? (
              <div className="space-y-3 p-4 bg-muted/30 rounded-3xl border border-border/40">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <History className="h-3 w-3" /> Submission Logs
                </p>
                {myDeliverables.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between text-xs bg-background/50 p-2.5 rounded-xl border border-border/20"
                  >
                    <span className="font-bold truncate max-w-[150px]">{d.title}</span>
                    <Badge variant="outline" className="text-[8px] font-black uppercase">
                      {d.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Asset Title</Label>
                <Input
                  value={delivTitle}
                  onChange={(e) => setDelivTitle(e.target.value)}
                  placeholder="e.g. Final Design Package"
                  className="rounded-xl border-border/40 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Process Documentation</Label>
                <Textarea
                  value={delivDesc}
                  onChange={(e) => setDelivDesc(e.target.value)}
                  placeholder="Summary of work performed..."
                  className="rounded-2xl border-border/40 min-h-[100px] resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest ml-1">Source Artifact</Label>
                <Input
                  type="file"
                  onChange={(e) => setDelivFile(e.target.files?.[0] || null)}
                  className="rounded-xl border-border/40 h-11"
                />
              </div>
            </div>

            <Button
              className="w-full h-14 rounded-[20px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20"
              onClick={() => submitDeliverable.mutate()}
              disabled={submitDeliverable.isPending || !delivTitle}
            >
              {submitDeliverable.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : "Verify & Finalize"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reputation Review Modal */}
      <Dialog open={!!reviewDialog} onOpenChange={(o) => !o && setReviewDialog(null)}>
        <DialogContent className="rounded-[40px] max-w-sm p-8">
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl font-black tracking-tighter">Mission Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-8 pt-4">
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setReviewRating(n)} className="transition-transform active:scale-90">
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      n <= reviewRating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20",
                    )}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Experience Summary</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Briefly describe the employer relationship..."
                className="rounded-2xl border-border/40 resize-none"
                rows={3}
              />
            </div>
            <Button
              className="w-full h-12 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20"
              onClick={() => submitReview.mutate()}
              disabled={submitReview.isPending}
            >
              {submitReview.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Publish Review"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
