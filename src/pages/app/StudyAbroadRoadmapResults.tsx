import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getStudyAbroadRoadmapById } from "@/domains/abroad/repo/abroadRepo";
import { adminSupportAssistant } from "@/domains/agents/api/agentsApi";
import {
 ArrowLeft,
 Map,
 AlertCircle,
 Loader2,
 TrendingUp,
 Wallet,
 Globe,
 FileText,
 Award,
 MessageCircle,
 Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { RoadmapTimeline } from "@/domains/abroad/components/talent/RoadmapTimeline";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT, SECTION_TITLE } from "@/lib/uiTokens";

// Production Data Contracts[cite: 8]
interface RecommendedUniversity {
 name: string;
 country: string;
 program: string;
 ranking?: string;
 tuitionRange: string;
 fitReason: string;
 deadline: string;
 tier: "reach" | "target" | "safety";
}

interface RoadmapResult {
 profileSummary: { strengths: string[]; gaps: string[]; overallReadiness: "high" | "medium" | "low" };
 recommendedUniversities: RecommendedUniversity[];
 timeline: unknown[];
 documents: Array<{ name: string; required: boolean; tips: string }>;
 budget: { tuitionRange: string; livingExpenses: string; totalEstimate: string };
 scholarships: Array<{ name: string; amount: string; eligibility: string }>;
}

interface RoadmapData {
 id: string;
 status: string;
 target_countries: string[];
 degree_level: string;
 field_of_study: string | null;
 target_intake: string;
 roadmap_result: RoadmapResult | null;
}

export default function StudyAbroadRoadmapResults() {
 const { id } = useParams<{ id: string }>();
 const navigate = useNavigate();
 const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
 const [loading, setLoading] = useState(true);
 const [pollCount, setPollCount] = useState(0);

 // Internal error logger
 const reportAnomaly = async (event: string, context: unknown) => {
 console.error(`[abroad] ${event}`, context);
 try {
 await adminSupportAssistant({ type: "roadmap_result_error", event, context });
 } catch {
 // fire-and-forget telemetry
 }
 };

 useEffect(() => {
 if (!id) return;

 const fetchRoadmap = async () => {
 try {
 const data = await getStudyAbroadRoadmapById(id);
 if (!data) return;

 setRoadmap({
 id: data.id,
 status: data.status || "pending",
 target_countries: data.target_countries || [],
 degree_level: data.degree_level,
 field_of_study: data.field_of_study,
 target_intake: data.target_intake || "",
 roadmap_result: data.roadmap_result as unknown as RoadmapResult | null,
 });

 setLoading(false);

 if ((data.status === "pending" || data.status === "processing") && pollCount < 30) {
 setTimeout(() => setPollCount((p) => p + 1), 4000);
 }
 } catch (e) {
 await reportAnomaly("RoadmapFetchFailure", { id, error: e });
 setLoading(false);
 }
 };

 fetchRoadmap();
 }, [id, pollCount]);

  if (loading || (roadmap && (roadmap.status === "pending" || roadmap.status === "processing")))
  return (
  <div className="max-w-2xl mx-auto py-20 text-center space-y-4">
  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
  <h3 className="text-xl font-bold uppercase tracking-tighter italic">Building your custom roadmap...</h3>
  <p className="text-xs text-muted-foreground">This may take up to a minute. Please keep this page open.</p>
  </div>
  );

 if (!roadmap || roadmap.status === "failed")
 return (
 <div className="max-w-2xl mx-auto py-20 text-center">
 <AlertCircle className="h-16 w-16 text-destructive/40 mx-auto mb-8" />
 <h3 className="text-3xl font-black uppercase tracking-tighter italic">Roadmap generation failed</h3>
 <Button onClick={() => navigate("/app/abroad/roadmap")} className="mt-8 rounded-xl">
 Try again
 </Button>
 </div>
 );

 const res = roadmap.roadmap_result!;

 return (
 <div className={PAGE_SHELL}>
 <header className="flex items-center gap-6">
 <Button variant="ghost" size="icon" aria-label="Go back" className="rounded-xl h-12 w-12" onClick={() => navigate("/app/abroad")}>
 <ArrowLeft className="h-6 w-6 text-primary" />
 </Button>
 <div className="space-y-0.5">
 <h1 className={PAGE_TITLE}>Your roadmap</h1>
 <p className={PAGE_SUBTITLE}>
 {roadmap.degree_level} in {roadmap.field_of_study || "your chosen field"}
 </p>
 </div>
 </header>

 {/* Readiness summary */}
 <Card className={cn(CARD, "relative overflow-hidden")}>
 <CardHeader className="p-10 border-b bg-muted/20">
 <CardTitle className="text-3xl font-black uppercase italic">Your readiness</CardTitle>
 </CardHeader>
 <CardContent className="p-10 grid md:grid-cols-2 gap-12">
 <div className="space-y-6">
 <h4 className={SECTION_TITLE}>Your strengths</h4>
 {res.profileSummary.strengths.map((s, i) => (
 <div
 key={i}
 className="flex gap-4 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 italic text-sm"
 >
 {s}
 </div>
 ))}
 </div>
 <div className="space-y-6">
 <h4 className={SECTION_TITLE}>Gaps to close</h4>
 {res.profileSummary.gaps.map((g, i) => (
 <div
 key={i}
 className="flex gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 italic text-sm"
 >
 {g}
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 <Tabs defaultValue="universities" className="w-full space-y-8">
 <TabsList className="grid w-full grid-cols-4 h-16 bg-muted/30 rounded-2xl p-1.5 shadow-sm">
 <TabsTrigger value="universities" className="rounded-xl font-black text-[9px] uppercase tracking-widest">
 Universities
 </TabsTrigger>
 <TabsTrigger value="timeline" className="rounded-xl font-black text-[9px] uppercase tracking-widest">
 Timeline
 </TabsTrigger>
 <TabsTrigger value="documents" className="rounded-xl font-black text-[9px] uppercase tracking-widest">
 Documents
 </TabsTrigger>
 <TabsTrigger value="budget" className="rounded-xl font-black text-[9px] uppercase tracking-widest">
 Budget
 </TabsTrigger>
 </TabsList>

 <TabsContent value="universities" className="grid md:grid-cols-2 gap-6">
 {res.recommendedUniversities.map((uni, idx) => (
 <Card
 key={idx}
 className={cn(CARD, "cursor-pointer hover:border-primary/40 transition-all")}
 onClick={() => navigate(`/app/abroad/study`)}
 >
 <CardContent className="p-8 space-y-4">
 <Badge variant={uni.tier === "reach" ? "destructive" : "secondary"}>{uni.tier}</Badge>
 <h4 className="text-xl font-black uppercase italic">{uni.name}</h4>
 <p className="text-xs text-muted-foreground">{uni.fitReason}</p>
 </CardContent>
 </Card>
 ))}
  </TabsContent>

  <TabsContent value="timeline">
    <RoadmapTimeline timeline={res.timeline || []} />
  </TabsContent>

  <TabsContent value="documents" className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {(res.documents || []).map((doc, idx) => (
        <Card key={idx} className={CARD}>
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-sm text-foreground uppercase tracking-wide">{doc.name}</h4>
              <Badge variant={doc.required ? "destructive" : "secondary"} className="text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 border-none">
                {doc.required ? "Required" : "Optional"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">{doc.tips}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </TabsContent>

  <TabsContent value="budget" className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className={cn(CARD, "bg-muted/10")}>
        <CardContent className="p-6 space-y-1">
          <span className="font-mono text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Tuition Range</span>
          <p className="text-xl font-black text-foreground font-mono italic uppercase">{res.budget?.tuitionRange || "—"}</p>
        </CardContent>
      </Card>
      <Card className={cn(CARD, "bg-muted/10")}>
        <CardContent className="p-6 space-y-1">
          <span className="font-mono text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Living Expenses</span>
          <p className="text-xl font-black text-foreground font-mono italic uppercase">{res.budget?.livingExpenses || "—"}</p>
        </CardContent>
      </Card>
      <Card className={cn(CARD, "bg-primary/5 border-primary/20")}>
        <CardContent className="p-6 space-y-1">
          <span className="font-mono text-[9px] font-bold text-primary uppercase tracking-widest">Total Estimate</span>
          <p className="text-xl font-black text-primary font-mono italic uppercase">{res.budget?.totalEstimate || "—"}</p>
        </CardContent>
      </Card>
    </div>

    {Array.isArray(res.scholarships) && res.scholarships.length > 0 && (
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">Recommended Scholarships</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {res.scholarships.map((sch, idx) => (
            <Card key={idx} className={CARD}>
              <CardContent className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm text-foreground uppercase tracking-wide">{sch.name}</h4>
                  <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-none font-bold uppercase text-[9px] tracking-wider px-2.5 py-0.5 rounded-full">
                    {sch.amount}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-relaxed"><strong>Eligibility:</strong> {sch.eligibility}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )}
  </TabsContent>
  </Tabs>
 </div>
 );
}


