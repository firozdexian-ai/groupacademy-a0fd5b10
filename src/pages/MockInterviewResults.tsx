import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Download, Share2, AlertCircle, Loader2, CheckCircle2, 
  XCircle, TrendingUp, TrendingDown, Lightbulb, 
  MessageSquare, ArrowRight, RefreshCw, Briefcase, Sparkles 
} from "lucide-react";
import { toast } from "sonner";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { MockInterviewPDFTemplate } from "@/components/mock-interview/MockInterviewPDFTemplate";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { RetryErrorCard, getErrorType } from "@/components/ui/retry-error-card";
import { cn } from "@/lib/utils";

interface Question { id: string; question: string; category: string; expected_points: string[]; }
interface Answer { question_id: string; answer: string; time_taken_seconds: number; }
interface QuestionFeedback { question_id: string; score: number; feedback: string; missed_points: string[]; improvement_tips: string; }
interface AIFeedback { overall_feedback: string; question_feedback: QuestionFeedback[]; interview_tips: string; }

interface Interview {
  id: string; email: string; full_name: string; phone: string | null;
  job_title: string | null; company_name: string | null; job_description: string;
  questions: Question[]; answers: Answer[]; ai_feedback: AIFeedback | null;
  selection_percentage: number | null; performance_level: string | null;
  strengths: string[] | null; improvement_areas: string[] | null;
  difficulty: string; question_count: number; status: string;
}

const performanceLevelMap: Record<string, { color: string; label: string }> = {
  needs_work: { color: "text-rose-500 bg-rose-500/10", label: "Baseline" },
  developing: { color: "text-orange-500 bg-orange-500/10", label: "Progressing" },
  competent: { color: "text-blue-500 bg-blue-500/10", label: "Qualified" },
  strong: { color: "text-emerald-500 bg-emerald-500/10", label: "Advanced" },
  excellent: { color: "text-green-500 bg-green-500/10", label: "Exceptional" }
};

export default function MockInterviewResults() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => { if (id) loadInterview(); }, [id]);

  const loadInterview = async () => {
    try {
      const { data, error } = await supabase.from("mock_interviews").select("*").eq("id", id).single();
      if (error) throw error;
      if (data.status !== "completed") {
        toast.error("Analysis pending. Please wait.");
        navigate("/mock-interview");
        return;
      }

      setInterview({
        ...data,
        questions: (data.questions as any) || [],
        answers: (data.answers as any) || [],
        ai_feedback: data.ai_feedback as any,
      });

      if (data.profession_category_id) loadRecommendedCourses(data.profession_category_id);
    } catch (err: any) {
      setLoadError("Intel fetch failure. Node unreachable.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedCourses = async (pId: string) => {
    setLoadingCourses(true);
    const { data } = await supabase.from('content').select('id, title, slug, estimated_hours, thumbnail_url').eq('profession_line_id', pId).limit(3);
    if (data) setRecommendedCourses(data);
    setLoadingCourses(false);
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById("mock-interview-pdf-content");
      if (!element) throw new Error("Template Not Found");
      element.style.display = "block";
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      element.style.display = "none";
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      pdf.addImage(imgData, "PNG", 0, 0, 210, (canvas.height * 210) / canvas.width);
      pdf.save(`Intel-Report-${interview?.full_name?.split(' ')[0]}.pdf`);
      toast.success("Intelligence Report Exported");
    } catch (e) { toast.error("PDF Serialization Failed"); } finally { setIsGeneratingPDF(false); }
  };

  const handleShare = (platform: string) => {
    const text = `I just scored ${interview?.selection_percentage}% on my AI Mock Interview! Verify your readiness at GroUp Academy.`;
    const url = window.location.href;
    const targets: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
    };
    window.open(targets[platform], "_blank");
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Decoding Performance Data</p>
    </div>
  );

  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center p-6"><RetryErrorCard type="server" description={loadError} onRetry={() => { setLoading(true); loadInterview(); }} /></div>
  );

  const perf = performanceLevelMap[interview?.performance_level || "needs_work"];
  const score = interview?.selection_percentage || 0;

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col selection:bg-primary/10">
      <Navbar />
      
      <main className="flex-1 container max-w-5xl mx-auto px-6 py-12 space-y-8 animate-in fade-in duration-700">
        {/* Header Architecture */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest px-3 py-1">Session Protocol Complete</Badge>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{new Date(interview!.created_at).toLocaleDateString()}</span>
            </div>
            <h1 className="text-4xl font-black tracking-tighter">Performance Audit</h1>
            <p className="text-sm font-medium text-muted-foreground">{interview?.job_title} at {interview?.company_name || 'Target Organization'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl h-12 font-black uppercase text-[10px] tracking-widest border-border/40" onClick={handleDownloadPDF} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Download className="h-4 w-4 mr-2" />} Export PDF
            </Button>
            <Button className="rounded-xl h-12 px-6 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20" onClick={() => navigate("/mock-interview/setup")}>
              <RefreshCw className="h-4 w-4 mr-2" /> New Simulation
            </Button>
          </div>
        </header>

        {/* Executive Score Card */}
        <Card className="rounded-[40px] border-border/40 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
             <div className={cn("h-full transition-all duration-1000 ease-out", perf.color.split(' ')[1].replace('/10', ''))} style={{ width: `${score}%` }} />
          </div>
          <CardContent className="p-10 flex flex-col lg:flex-row items-center gap-12">
            {/* Neural Gauge */}
            <div className="relative w-48 h-48 shrink-0">
               <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                 <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
                 <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="276" strokeDashoffset={276 - (276 * score) / 100} className={cn("transition-all duration-1000", perf.color.split(' ')[0])} strokeLinecap="round" />
               </svg>
               <div className="absolute inset-0 flex flex-col items-center justify-center space-y-0">
                  <span className="text-5xl font-black tracking-tighter tabular-nums">{score}%</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Match Index</span>
               </div>
            </div>

            <div className="flex-1 space-y-6 text-center lg:text-left">
               <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  <Badge className={cn("border-none px-4 py-1.5 font-black uppercase text-[10px] tracking-widest", perf.color)}>{perf.label}</Badge>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground font-bold uppercase text-[9px] px-3">{interview?.difficulty} Difficulty</Badge>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground font-bold uppercase text-[9px] px-3">{interview?.question_count} Node Audit</Badge>
               </div>
               <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2 justify-center lg:justify-start">
                    <Sparkles className="h-4 w-4" /> AI Strategic Assessment
                  </h3>
                  <p className="text-base font-medium leading-relaxed text-foreground/80 italic">"{interview?.ai_feedback?.overall_feedback}"</p>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Analytical Breakdown */}
        <div className="grid md:grid-cols-2 gap-8">
           <Card className="rounded-[32px] border-emerald-500/10 bg-emerald-500/[0.02]">
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Competitive Edge</CardTitle></header>
              <CardContent className="space-y-3">
                 {interview?.strengths?.map((s, i) => (
                   <div key={i} className="flex gap-3 text-sm font-medium p-3 bg-background/50 rounded-2xl border border-emerald-500/5">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> {s}
                   </div>
                 ))}
              </CardContent>
           </Card>
           <Card className="rounded-[32px] border-rose-500/10 bg-rose-500/[0.02]">
              <CardHeader><CardTitle className="text-sm font-black uppercase tracking-widest text-rose-600 flex items-center gap-2"><TrendingDown className="h-4 w-4" /> Logic Vulnerabilities</CardTitle></header>
              <CardContent className="space-y-3">
                 {interview?.improvement_areas?.map((s, i) => (
                   <div key={i} className="flex gap-3 text-sm font-medium p-3 bg-background/50 rounded-2xl border border-rose-500/5">
                      <XCircle className="h-5 w-5 text-rose-500 shrink-0" /> {s}
                   </div>
                 ))}
              </CardContent>
           </Card>
        </div>

        {/* Detailed Response Trace */}
        <section className="space-y-6">
           <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground ml-2">Neural Node Breakdown</h2>
           <div className="space-y-4">
              {interview?.ai_feedback?.question_feedback.map((f, i) => {
                const q = interview.questions.find(x => x.id === f.question_id);
                const a = interview.answers.find(x => x.question_id === f.question_id);
                return (
                  <Card key={i} className="rounded-[32px] border-border/40 overflow-hidden group">
                    <div className="p-8 space-y-6">
                      <div className="flex justify-between items-start gap-4">
                         <div className="space-y-1">
                            <Badge variant="secondary" className="text-[8px] font-black uppercase mb-2">Module 0{i+1} • {q?.category}</Badge>
                            <h4 className="text-lg font-black tracking-tight">{q?.question}</h4>
                         </div>
                         <div className="h-14 w-14 rounded-2xl bg-muted/50 flex flex-col items-center justify-center shrink-0 border border-border/40">
                            <span className="text-lg font-black">{f.score}</span>
                            <span className="text-[8px] font-black uppercase opacity-40">Score</span>
                         </div>
                      </div>
                      
                      <div className="grid gap-6 md:grid-cols-2">
                         <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Your Input Artifact</p>
                            <p className="text-xs font-medium leading-relaxed bg-muted/30 p-4 rounded-2xl italic">"{a?.answer || 'No valid input detected.'}"</p>
                         </div>
                         <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-widest text-primary">AI Logic Audit</p>
                            <p className="text-xs font-medium leading-relaxed">{f.feedback}</p>
                            {f.missed_points?.length > 0 && (
                               <div className="pt-2">
                                  <p className="text-[8px] font-black uppercase text-orange-600 mb-1">Missed Logic Points</p>
                                  <div className="flex flex-wrap gap-2">
                                     {f.missed_points.map((p, pi) => <Badge key={pi} variant="outline" className="text-[9px] border-orange-500/20 text-orange-700 bg-orange-500/5">{p}</Badge>)}
                                  </div>
                               </div>
                            )}
                         </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
           </div>
        </section>

        {/* High Conversion Upsell Vertical */}
        <Card className="rounded-[40px] border-primary/20 bg-primary/5 overflow-hidden shadow-2xl">
           <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center md:text-left">
                 <h3 className="text-2xl font-black tracking-tighter">Skill Deficit Detected?</h3>
                 <p className="text-sm font-medium text-muted-foreground">AI has analyzed your gaps. These curated courses will bridge your selection score to 90%+.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                 {loadingCourses ? <Loader2 className="animate-spin text-primary" /> : recommendedCourses.map(c => (
                   <Button key={c.id} variant="secondary" className="h-14 rounded-2xl border border-border/40 px-6 font-black uppercase text-[10px] tracking-widest" onClick={() => navigate(`/courses/${c.slug}`)}>
                      {c.title.split(' ')[0]} Masterclass <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                 ))}
              </div>
           </CardContent>
        </Card>

        {/* Global Distribution */}
        <footer className="flex flex-col items-center gap-6 pt-12">
           <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Broadcast Achievement</p>
           <div className="flex gap-4">
              {['whatsapp', 'linkedin', 'twitter'].map(p => (
                <Button key={p} variant="ghost" className="h-14 w-14 rounded-2xl bg-card border border-border/40 hover:text-primary transition-all capitalize" onClick={() => handleShare(p)}>
                   <Share2 className="h-5 w-5" />
                </Button>
              ))}
           </div>
        </footer>
      </main>

      <Footer />
      {/* Ghost Template for Serialization */}
      <div id="mock-interview-pdf-content" className="hidden"><MockInterviewPDFTemplate interview={interview} /></div>
    </div>
  );
}