import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import {
  Search,
  Eye,
  Globe,
  DollarSign,
  Calendar,
  GraduationCap,
  FileText,
  Download,
  User,
  Smartphone,
  Mail,
  Info,
  RefreshCcw,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

interface RoadmapLead {
  id: string;
  talent_id: string;
  email: string;
  full_name: string;
  status: string;
  target_countries: string[];
  target_intake: string;
  budget_level: string;
  degree_level: string;
  field_of_study: string;
  ielts_score: number | null;
  has_taken_ielts: boolean;
  gpa: string | null;
  years_experience: number | null;
  cv_text: string | null;
  roadmap_result: any | null;
  created_at: string;
  updated_at: string;
  talents?: {
    full_name: string;
    email: string;
    phone: string | null;
  };
}

export function StudyAbroadRoadmapLeadsManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<RoadmapLead | null>(null);

  const {
    data: leads,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["roadmap-leads", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("study_abroad_roadmaps")
        .select(`*, talents (full_name, email, phone)`)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") query = query.eq("status", statusFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data as RoadmapLead[];
    },
  });

  const filteredLeads = leads?.filter((l) => {
    const search = searchTerm.toLowerCase();
    return (
      l.full_name?.toLowerCase().includes(search) ||
      l.talents?.full_name?.toLowerCase().includes(search) ||
      l.email?.toLowerCase().includes(search) ||
      l.field_of_study?.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      pending: { label: "Pending", className: "bg-amber-100 text-amber-700 border-amber-200" },
      processing: { label: "AI Generating", className: "bg-blue-100 text-blue-700 border-blue-200 animate-pulse" },
      completed: { label: "Roadmap Ready", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      failed: { label: "System Error", className: "bg-rose-100 text-rose-700 border-rose-200" },
    };
    const config = configs[status] || configs.pending;
    return (
      <Badge variant="outline" className={cn("font-bold text-[10px] uppercase px-2", config.className)}>
        {config.label}
      </Badge>
    );
  };

  const handleExport = () => {
    if (!filteredLeads?.length) return toast.error("No data to export");
    const data = filteredLeads.map((l) => ({
      Student: l.full_name || l.talents?.full_name,
      Email: l.email || l.talents?.email,
      Phone: l.talents?.phone || "N/A",
      Status: l.status.toUpperCase(),
      Countries: l.target_countries?.join(", "),
      Intake: l.target_intake,
      Budget: l.budget_level,
      GPA: l.gpa || "N/A",
      IELTS: l.has_taken_ielts ? l.ielts_score : "Not Taken",
      Created: format(new Date(l.created_at), "yyyy-MM-dd"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "RoadmapLeads");
    XLSX.writeFile(wb, `Abroad_Roadmaps_${format(new Date(), "MMM_dd")}.xlsx`);
    toast.success("Export Downloaded");
  };

  if (isLoading)
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Dynamic Filter Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Admissions Pipeline</h2>
          <p className="text-sm text-muted-foreground">
            Monitor AI roadmap requests and high-intent study abroad leads.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export XLSX
          </Button>
        </div>
      </div>

      {/* Leads Table Card */}
      <Card className="border-muted shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, email, or study field..."
                className="pl-10 h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px] h-10">
                <SelectValue placeholder="Status Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="completed">Completed (Ready)</SelectItem>
                <SelectItem value="processing">Processing (AI)</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-muted overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold">Student Profile</TableHead>
                  <TableHead className="font-bold text-center">Countries</TableHead>
                  <TableHead className="font-bold">Preferences</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No leads found matching criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads?.map((l) => (
                    <TableRow key={l.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{l.full_name || l.talents?.full_name}</span>
                          <span className="text-xs text-muted-foreground">{l.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          {l.target_countries?.slice(0, 2).map((c) => (
                            <Badge key={c} variant="secondary" className="text-[9px] px-1 h-5">
                              {c}
                            </Badge>
                          ))}
                          {l.target_countries.length > 2 && (
                            <span className="text-[9px] text-muted-foreground">+{l.target_countries.length - 2}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-[11px] leading-tight">
                          <p className="font-medium">{l.degree_level}</p>
                          <p className="text-muted-foreground">{l.target_intake}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(l.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-primary"
                          onClick={() => setSelectedLead(l)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="p-6 border-b bg-muted/20">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Lead Application Detail
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 p-6">
            {selectedLead && (
              <div className="space-y-8">
                {/* Section: Core Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl border bg-card space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Mail className="h-3 w-3" /> Email
                    </p>
                    <p className="text-sm font-medium truncate">{selectedLead.email}</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-card space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Smartphone className="h-3 w-3" /> Phone
                    </p>
                    <p className="text-sm font-medium">{selectedLead.talents?.phone || "Not Provided"}</p>
                  </div>
                  <div className="p-4 rounded-xl border bg-card space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" /> Requested On
                    </p>
                    <p className="text-sm font-medium">{format(new Date(selectedLead.created_at), "MMM d, yyyy")}</p>
                  </div>
                </div>

                {/* Section: Academic Context */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" /> Academic & Language Profile
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted/40 p-3 rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase">GPA</p>
                      <p className="font-bold">{selectedLead.gpa || "N/A"}</p>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase">IELTS/TOEFL</p>
                      <p className="font-bold">
                        {selectedLead.has_taken_ielts ? selectedLead.ielts_score : "No Score"}
                      </p>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase">Work Exp</p>
                      <p className="font-bold">
                        {selectedLead.years_experience ? `${selectedLead.years_experience} Yrs` : "None"}
                      </p>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase">Budget</p>
                      <p className="font-bold capitalize">{selectedLead.budget_level}</p>
                    </div>
                  </div>
                </div>

                {/* Section: Preferences */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Globe className="h-4 w-4" /> Study Preferences
                  </h4>
                  <div className="p-4 rounded-xl border bg-muted/10 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Degree Level</p>
                        <p className="text-sm font-bold capitalize">{selectedLead.degree_level}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Field of Study</p>
                        <p className="text-sm font-bold">{selectedLead.field_of_study}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Target Intake</p>
                        <p className="text-sm font-bold">{selectedLead.target_intake}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Destinations</p>
                        <p className="text-sm font-bold">{selectedLead.target_countries.join(", ")}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section: AI Result Preview */}
                {selectedLead.roadmap_result && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                      <Info className="h-4 w-4" /> AI Evaluation Insight
                    </h4>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
                      <p className="text-sm text-emerald-900 leading-relaxed italic">
                        "The AI roadmap has been successfully delivered to the student's dashboard. Coordinator action:
                        Verify financial readiness and confirm university tier selections."
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          <div className="p-6 border-t bg-muted/10 flex justify-end">
            <Button variant="outline" onClick={() => setSelectedLead(null)}>
              Close Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
