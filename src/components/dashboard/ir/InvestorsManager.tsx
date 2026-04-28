import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Mail,
  Users,
  FileJson2,
  Zap,
  ShieldCheck,
  Search,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { LinkedInJsonUpload } from "../LinkedInJsonUpload";
import { IR_CONFIG } from "@/lib/irConfig";
import { InvestorDetailSheet } from "./InvestorDetailSheet";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Stakeholder Capital Registry (InvestorsManager)
 * CTO Reference: High-fidelity orchestrator for investor contact lifecycle and IR telemetry.
 */

interface Investor {
  id: string;
  vc_firm_id: string | null;
  full_name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  twitter_handle: string | null;
  investor_interests: string[] | null;
  investment_stage_pref: string | null;
  relationship_summary: string | null;
  last_feedback_summary: string | null;
  subscription_status: string;
  last_contacted_at: string | null;
  notes: string | null;
  created_at: string;
  vc_firm?: { id: string; name: string } | null;
}

export function InvestorsManager() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedInvestorId, setSelectedInvestorId] = useState<string | null>(null);
  const [linkedinImportOpen, setLinkedinImportOpen] = useState(false);
  const [filterFirmId, setFilterFirmId] = useState<string>("all");

  const [formData, setFormData] = useState({
    vc_firm_id: "",
    full_name: "",
    title: "",
    email: "",
    phone: "",
    linkedin_url: "",
    twitter_handle: "",
    investor_interests: [] as string[],
    investment_stage_pref: "",
    relationship_summary: "",
    subscription_status: "pending",
    notes: "",
  });

  const {
    data: investors,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["ir-investors", filterFirmId],
    queryFn: async () => {
      let query = supabase
        .from("ir_investors")
        .select("*, vc_firm:ir_vc_firms(id, name)")
        .order("created_at", { ascending: false });

      if (filterFirmId && filterFirmId !== "all") {
        query = query.eq("vc_firm_id", filterFirmId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Investor[];
    },
  });

  const { data: vcFirms } = useQuery({
    queryKey: ["ir-vc-firms-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ir_vc_firms").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        vc_firm_id: formData.vc_firm_id || null,
        full_name: formData.full_name,
        title: formData.title || null,
        email: formData.email || null,
        phone: formData.phone || null,
        linkedin_url: formData.linkedin_url || null,
        twitter_handle: formData.twitter_handle || null,
        investor_interests: formData.investor_interests.length > 0 ? formData.investor_interests : null,
        investment_stage_pref: formData.investment_stage_pref || null,
        relationship_summary: formData.relationship_summary || null,
        subscription_status: formData.subscription_status,
        notes: formData.notes || null,
      };

      if (editingInvestor) {
        const { error } = await supabase.from("ir_investors").update(payload).eq("id", editingInvestor.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ir_investors").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingInvestor ? "Stakeholder Node Optimized" : "Investor Identity Deployed");
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
    },
    onError: (error: any) => toast.error("Transmission Fault: " + error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ir_investors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Identity Node Terminated");
      setDeleteConfirmId(null);
      queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
    },
    onError: (error: any) => toast.error("Termination Fault: " + error.message),
  });

  const resetForm = () => {
    setFormData({
      vc_firm_id: "",
      full_name: "",
      title: "",
      email: "",
      phone: "",
      linkedin_url: "",
      twitter_handle: "",
      investor_interests: [],
      investment_stage_pref: "",
      relationship_summary: "",
      subscription_status: "pending",
      notes: "",
    });
    setEditingInvestor(null);
  };

  const openEditDialog = (investor: Investor) => {
    setEditingInvestor(investor);
    setFormData({
      vc_firm_id: investor.vc_firm_id || "",
      full_name: investor.full_name,
      title: investor.title || "",
      email: investor.email || "",
      phone: investor.phone || "",
      linkedin_url: investor.linkedin_url || "",
      twitter_handle: investor.twitter_handle || "",
      investor_interests: investor.investor_interests || [],
      investment_stage_pref: investor.investment_stage_pref || "",
      relationship_summary: investor.relationship_summary || "",
      subscription_status: investor.subscription_status,
      notes: investor.notes || "",
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* EXECUTIVE COMMAND HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Zap className="h-8 w-8 fill-current" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Capital Pulse</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Stakeholder Registry & Strategic IR Management
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setLinkedinImportOpen(true)}
            className="h-14 px-6 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-md bg-background/50"
          >
            <FileJson2 className="h-4 w-4 text-blue-500" /> Import Neural Data
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="h-14 px-8 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest gap-3 shadow-lg"
          >
            <Plus className="h-4 w-4" /> Deploy Investor
          </Button>
        </div>
      </div>

      {/* REGISTRY FILTER BAR */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
          <Input
            placeholder="SEARCH STAKEHOLDER REGISTRY..."
            className="h-14 rounded-2xl border-2 pl-12 font-bold uppercase text-[11px] tracking-widest bg-card/30"
          />
        </div>
        <Select value={filterFirmId} onValueChange={setFilterFirmId}>
          <SelectTrigger className="w-full md:w-[260px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-background">
            <SelectValue placeholder="GLOBAL FIRMS" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-2">
            <SelectItem value="all" className="font-bold text-[10px]">
              🌍 ALL AUTHORITIES
            </SelectItem>
            {vcFirms?.map((firm) => (
              <SelectItem key={firm.id} value={firm.id} className="font-bold text-[10px] uppercase">
                {firm.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-14 w-14 rounded-2xl border-2">
          <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* CORE REGISTRY TABLE */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-b-2">
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                  Investor Identity
                </TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Firm Authority</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Neural Interests</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest">Status</TableHead>
                <TableHead className="text-right py-6 pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 italic font-bold opacity-50">
                    Synchronizing registry nodes...
                  </TableCell>
                </TableRow>
              ) : (
                investors?.map((investor) => (
                  <TableRow
                    key={investor.id}
                    className="group border-b border-border/5 hover:bg-primary/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedInvestorId(investor.id)}
                  >
                    <TableCell className="py-6 pl-8 text-left">
                      <p className="font-black text-sm uppercase italic tracking-tight">{investor.full_name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                        {investor.title || "STRATEGIC_NODE"}
                      </p>
                    </TableCell>
                    <TableCell className="text-left">
                      <Badge
                        variant="outline"
                        className="font-black text-[9px] uppercase italic border-2 border-primary/20 bg-primary/5"
                      >
                        {investor.vc_firm?.name || "INDEPENDENT_CAPITAL"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {investor.investor_interests?.slice(0, 2).map((interest) => (
                          <Badge
                            key={interest}
                            className="font-black text-[8px] px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-tighter"
                          >
                            {interest}
                          </Badge>
                        ))}
                        {(investor.investor_interests?.length || 0) > 2 && (
                          <span className="text-[9px] font-black text-primary italic">
                            +{investor.investor_interests!.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-black text-[9px] uppercase italic rounded-full px-4 border-2",
                          investor.subscription_status === "active"
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {investor.subscription_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div
                        className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(investor)}
                          className="h-10 w-10 hover:bg-primary/10 transition-all"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirmId(investor.id)}
                          className="h-10 w-10 hover:bg-destructive/10 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <InvestorDetailSheet
        investorId={selectedInvestorId}
        open={!!selectedInvestorId}
        onOpenChange={(open) => !open && setSelectedInvestorId(null)}
      />

      {/* DEPLOYMENT DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl rounded-[40px] border-4 p-0 overflow-hidden bg-background">
          <div className="h-2 w-full bg-primary" />
          <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar text-left">
            <DialogHeader>
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">
                Identity Deployment
              </DialogTitle>
              <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
                Synchronize stakeholder parameters and authority levels
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-2">
                    Stakeholder Name *
                  </Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="h-14 rounded-2xl border-2 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Authority Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-14 rounded-2xl border-2 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Firm Authority</Label>
                <Select value={formData.vc_firm_id} onValueChange={(v) => setFormData({ ...formData, vc_firm_id: v })}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold uppercase text-xs">
                    <SelectValue placeholder="SELECT VC FIRM" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2">
                    <SelectItem value="" className="font-bold text-xs uppercase">
                      NO FIRM AUTHORITY
                    </SelectItem>
                    {vcFirms?.map((firm) => (
                      <SelectItem key={firm.id} value={firm.id} className="font-bold text-xs uppercase">
                        {firm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-2">
                    Transmission Email
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-14 rounded-2xl border-2 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary italic ml-2">Investment Stage</Label>
                  <Select
                    value={formData.investment_stage_pref}
                    onValueChange={(v) => setFormData({ ...formData, investment_stage_pref: v })}
                  >
                    <SelectTrigger className="h-14 rounded-2xl border-2 font-bold uppercase text-xs">
                      <SelectValue placeholder="SELECT STAGE" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {IR_CONFIG.STAGE_FOCUS_OPTIONS.map((stage) => (
                        <SelectItem key={stage} value={stage} className="font-bold text-xs uppercase">
                          {stage}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-4 flex-col sm:flex-row border-t border-border/10 pt-8">
              <Button
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                className="font-black uppercase text-[10px] tracking-widest italic opacity-50"
              >
                Abort Protocol
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!formData.full_name || saveMutation.isPending}
                className="flex-1 h-16 rounded-[24px] font-black uppercase italic tracking-tighter text-xl gap-3 shadow-xl"
              >
                {saveMutation.isPending ? (
                  <RefreshCw className="animate-spin" />
                ) : (
                  <ShieldCheck className="fill-current" />
                )}
                Authorize Deployment
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* NEURAL IMPORT DIALOG */}
      <Dialog open={linkedinImportOpen} onOpenChange={setLinkedinImportOpen}>
        <DialogContent className="max-w-xl rounded-[40px] border-4 p-10 bg-background text-left">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-4">
              <FileJson2 className="h-10 w-10 text-blue-500" /> Neural Import
            </DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest italic">
              Upload LinkedIn scraper artifacts to bulk-provision investor nodes
            </DialogDescription>
          </DialogHeader>
          <div className="pt-6">
            <LinkedInJsonUpload
              mode="investor"
              onComplete={() => {
                setLinkedinImportOpen(false);
                queryClient.invalidateQueries({ queryKey: ["ir-investors"] });
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
