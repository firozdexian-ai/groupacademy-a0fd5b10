import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GigCard } from "@/components/gigs/GigCard";
import { MySubmissions } from "@/components/gigs/MySubmissions";
import { Skeleton } from "@/components/ui/skeleton";
import { MARKETPLACE_SCHOOLS, MARKETPLACE_SCHOOL_MAP } from "@/lib/constants/marketplaceCategories";
import {
  Gift,
  Upload,
  Briefcase,
  Share2,
  FileText,
  BookOpen,
  Search,
  Clock,
  Coins,
  ChevronRight,
  Sparkles,
  Send,
  Star,
  Loader2,
  CheckCircle,
  BadgeCheck,
  ClipboardList,
  FolderKanban,
  Activity,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const TASK_CATEGORIES = [
  { key: "all", label: "All Missions", icon: Gift },
  { key: "cv_upload", label: "CV Intake", icon: Upload },
  { key: "job_posting", label: "Job Sourcing", icon: Briefcase },
  { key: "job_sharing", label: "Viral Share", icon: Share2 },
  { key: "content_creation", label: "Content", icon: FileText },
  { key: "course_resell", label: "Resell", icon: BookOpen },
];

export default function Gigs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  const activeTab = searchParams.get("tab") || "tasks";
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [projectSearch, setProjectSearch] = useState("");
  const [selectedProjectCategory, setSelectedProjectCategory] = useState<string | null>(null);

  // ── Intelligence Layer: Project Visualizer ──
  //

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  // ── Quick Tasks (Micro-Gigs) ──
  const { data: gigs, isLoading: gigsLoading } = useQuery({
    queryKey: ["gigs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gigs").select("*").eq("is_active", true).order("display_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: submissionCounts } = useQuery({
    queryKey: ["gig-submission-counts", talent?.id],
    enabled: !!talent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gig_submissions")
        .select("gig_id, status")
        .eq("talent_id", talent!.id);
      if (error) throw error;
      const counts: Record<string, { total: number; pending: number }> = {};
      data?.forEach((s) => {
        if (!counts[s.gig_id]) counts[s.gig_id] = { total: 0, pending: 0 };
        counts[s.gig_id].total++;
        if (s.status === "pending") counts[s.gig_id].pending++;
      });
      return counts;
    },
  });

  // ── Professional Projects (Marketplace) ──
  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ["marketplace-gigs", selectedProjectCategory],
    queryFn: async () => {
      let query = supabase
        .from("marketplace_gigs")
        .select("*")
        .in("status", ["approved", "active"])
        .order("is_featured", { ascending: false });
      if (selectedProjectCategory) query = query.eq("skill_category", selectedProjectCategory);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // ── Activity Data ──
  const { data: myBids } = useQuery({
    queryKey: ["my-marketplace-bids", talent?.id],
    enabled: !!talent?.id && activeTab === "activity",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_bids")
        .select("*, marketplace_gigs(title, skill_category, employer_name)")
        .eq("talent_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: myContracts } = useQuery({
    queryKey: ["my-marketplace-contracts", talent?.id],
    enabled: !!talent?.id && activeTab === "activity",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_contracts")
        .select("*, marketplace_gigs:gig_id(title, skill_category)")
        .eq("freelancer_id", talent!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ── Deliverable Submission Flow ──
  const [deliverableDialog, setDeliverableDialog] = useState<string | null>(null);
  const [delivTitle, setDelivTitle] = useState("");
  const [delivDesc, setDelivDesc] = useState("");
  const [delivFile, setDelivFile] = useState<File | null>(null);

  const submitDeliverable = useMutation({
    mutationFn: async () => {
      if (!deliverableDialog) throw new Error("Contract Context Lost");
      let fileUrl = null;
      if (delivFile) {
        const path = `deliv/${talent!.id}/${deliverableDialog}/${Date.now()}-${delivFile.name}`;
        const { error: uploadErr } = await supabase.storage.from("marketplace-deliverables").upload(path, delivFile);
        if (uploadErr) throw uploadErr;
        fileUrl = supabase.storage.from("marketplace-deliverables").getPublicUrl(path).data.publicUrl;
      }
      const { error } = await supabase.from("marketplace_deliverables").insert({
        contract_id: deliverableDialog,
        title: delivTitle,
        description: delivDesc || null,
        file_url: fileUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setDeliverableDialog(null);
      setDelivTitle("");
      queryClient.invalidateQueries({ queryKey: ["my-marketplace-contracts"] });
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 pb-32 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Gig Ecosystem</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Monetize your skills & influence
          </p>
        </div>
        <div className="bg-primary/5 rounded-2xl p-3 flex items-center gap-3 border border-primary/10">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">Active Wallet</p>
            <p className="text-sm font-black text-primary">Pending Verification</p>
          </div>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full h-14 bg-muted/50 p-1.5 rounded-3xl border border-border/40">
          <TabsTrigger
            value="tasks"
            className="flex-1 rounded-[20px] font-black uppercase text-[10px] tracking-widest gap-2"
          >
            <ClipboardList className="h-4 w-4" /> Missions
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            className="flex-1 rounded-[20px] font-black uppercase text-[10px] tracking-widest gap-2"
          >
            <Target className="h-4 w-4" /> Projects
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            className="flex-1 rounded-[20px] font-black uppercase text-[10px] tracking-widest gap-2"
          >
            <Activity className="h-4 w-4" /> Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-8 space-y-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {TASK_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                  selectedCategory === cat.key
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                <cat.icon className="h-3.5 w-3.5" /> {cat.label}
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {gigsLoading
              ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-[24px]" />)
              : gigs
                  ?.filter((g) => selectedCategory === "all" || g.category === selectedCategory)
                  .map((gig) => <GigCard key={gig.id} gig={gig} userSubmissions={submissionCounts?.[gig.id]} />)}
          </div>
        </TabsContent>

        <TabsContent value="projects" className="mt-8 space-y-6">
          <div className="grid md:grid-cols-[250px,1fr] gap-8">
            <aside className="space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Find projects..."
                  className="pl-10 h-10 rounded-xl"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Academy Schools
                </p>
                <div className="flex flex-col gap-1">
                  <Button
                    variant={!selectedProjectCategory ? "secondary" : "ghost"}
                    size="sm"
                    className="justify-start font-bold rounded-lg"
                    onClick={() => setSelectedProjectCategory(null)}
                  >
                    All Faculties
                  </Button>
                  {MARKETPLACE_SCHOOLS.map((s) => (
                    <Button
                      key={s.value}
                      variant={selectedProjectCategory === s.value ? "secondary" : "ghost"}
                      size="sm"
                      className="justify-start font-bold rounded-lg"
                      onClick={() => setSelectedProjectCategory(s.value)}
                    >
                      {s.label}
                    </Button>
                  ))}
                </div>
              </div>
            </aside>
            <main className="space-y-4">
              {projectsLoading ? (
                <Skeleton className="h-64 rounded-[32px]" />
              ) : (
                projects
                  ?.filter((p) => !projectSearch || p.title.toLowerCase().includes(projectSearch.toLowerCase()))
                  .map((gig) => (
                    <Card
                      key={gig.id}
                      className="rounded-[32px] border-border/40 hover:shadow-xl transition-all cursor-pointer overflow-hidden group"
                      onClick={() => navigate(`/app/marketplace/${gig.id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-3">
                            <div className="flex gap-2 items-center">
                              <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">
                                {MARKETPLACE_SCHOOL_MAP[gig.skill_category]?.label}
                              </Badge>
                              <div className="h-1 w-1 rounded-full bg-border" />
                              <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground">
                                {gig.pricing_type}
                              </span>
                            </div>
                            <h3 className="text-lg font-black tracking-tight group-hover:text-primary transition-colors">
                              {gig.title}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{gig.description}</p>
                            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              <span className="flex items-center gap-1.5">
                                <Coins className="h-3 w-3 text-amber-500" /> {gig.budget_amount} Credits
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Send className="h-3 w-3" /> {gig.total_bids} Bids
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </main>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-8 space-y-12">
          <section className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" /> Live Mission Queue
            </h3>
            <MySubmissions talentId={talent?.id} />
          </section>

          <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-border/40">
            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-blue-500">
                <Send className="h-4 w-4" /> Active Proposals
              </h3>
              <div className="space-y-3">
                {myBids?.map((bid) => (
                  <div key={bid.id} className="p-4 rounded-2xl bg-card border border-border/40 space-y-2">
                    <div className="flex justify-between">
                      <h4 className="text-xs font-black tracking-tight">{bid.marketplace_gigs?.title}</h4>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter">
                        {bid.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground">{bid.marketplace_gigs?.employer_name}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 text-emerald-500">
                <Briefcase className="h-4 w-4" /> Active Contracts
              </h3>
              <div className="space-y-3">
                {myContracts
                  ?.filter((c) => c.status === "active")
                  .map((contract) => (
                    <div
                      key={contract.id}
                      className="p-4 rounded-2xl bg-card border border-border/40 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="text-xs font-black tracking-tight">{contract.marketplace_gigs?.title}</h4>
                        <p className="text-[10px] font-bold text-primary">{contract.agreed_amount} Credits</p>
                      </div>
                      <Button
                        size="sm"
                        className="h-8 rounded-xl text-[10px] font-black uppercase tracking-widest"
                        onClick={() => setDeliverableDialog(contract.id)}
                      >
                        Deliver
                      </Button>
                    </div>
                  ))}
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>

      {/* Deliverable Logic Modal */}
      <Dialog open={!!deliverableDialog} onOpenChange={(o) => !o && setDeliverableDialog(null)}>
        <DialogContent className="rounded-[32px] border-border/40">
          <DialogHeader>
            <DialogTitle className="text-xl font-black tracking-tighter">Deliver Performance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Submission Title</Label>
              <Input
                value={delivTitle}
                onChange={(e) => setDelivTitle(e.target.value)}
                placeholder="Final Delivery V1"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Documentation</Label>
              <Textarea
                value={delivDesc}
                onChange={(e) => setDelivDesc(e.target.value)}
                placeholder="Brief description of the work performed..."
                className="rounded-xl min-h-[120px]"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">File Evidence</Label>
              <Input type="file" onChange={(e) => setDelivFile(e.target.files?.[0] || null)} className="rounded-xl" />
            </div>
            <Button
              className="w-full h-12 rounded-2xl font-black uppercase tracking-widest"
              onClick={() => submitDeliverable.mutate()}
              disabled={submitDeliverable.isPending}
            >
              {submitDeliverable.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : "Finalize Submission"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
