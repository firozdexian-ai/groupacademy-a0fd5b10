import { useState, useEffect } from "react";
import { useMarketingGraph } from "./hooks/useMarketingGraph";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { parseCv } from "@/domains/jobs/api/jobsApi";
import { generateOutreachMessage } from "@/domains/talent/api/talentApi";
import { uploadPortfolioFile } from "@/domains/profile/repo/profileRepo";
import {
  Upload,
  Link,
  Loader2,
  MessageSquare,
  Copy,
  ExternalLink,
  User,
  Briefcase,
  CheckCircle,
  Phone,
  BarChart2,
  TrendingUp,
  PieChart,
  ShieldCheck,
  Zap,
  Globe,
  Send,
  Bot,
  FileText,
} from "lucide-react";

/**
 * Platform Logic: CV Intelligence Terminal & Outreach Ledger
 * 2026 Standard: Blended Phase 6 UI (Banners + AI Parsing Engine)
 */

export function TalentOutreachTab() {
  const { marketingGraphQuery } = useMarketingGraph();
  const { data: graphData, isLoading: isGraphLoading } = marketingGraphQuery;

  const [activeTab, setActiveTab] = useState<"ledger" | "generator" | "analytics">("ledger");

  // Legacy Generator State
  const [inputMode, setInputMode] = useState<"upload" | "url" | "text">("url");
  const [cvUrl, setCvUrl] = useState("");
  const [cvText, setCvText] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [selectedProduct, setSelectedProduct] = useState("digital-portfolio");
  const [selectedLanguage, setSelectedLanguage] = useState("auto");
  const [selectedSender, setSelectedSender] = useState("firoz");
  const [customSenderName, setCustomSenderName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [analyticsData, setAnalyticsData] = useState<unknown>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const loadAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const { data, error } = await supabase
        .from("outreach_messages")
        .select("product");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      let total = 0;
      (data || []).forEach((row: unknown) => {
        if (row.product) {
          counts[row.product] = (counts[row.product] || 0) + 1;
          total++;
        }
      });
      
      setAnalyticsData({
        productCounts: counts,
        totalMessages: total,
      });
    } catch (err: unknown) {
      toast.error("Telemetry failed to load");
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const processCV = async () => {
    setIsProcessing(true);
    setResult(null);
    try {
      let parsedCVData: unknown = null;

      if (inputMode === "upload") {
        if (!cvFile) throw new Error("Please select a CV file first.");
        const fileExt = cvFile.name.split(".").pop() || "pdf";
        const filePath = `cv-outreach/CV_${Date.now()}.${fileExt}`;
        
        toast.loading("Uploading CV...", { id: "cv-processing" });
        const { publicUrl } = await uploadPortfolioFile(filePath, cvFile, { upsert: true });
        
        toast.loading("Analyzing CV structure...", { id: "cv-processing" });
        const parseRes = await parseCv({ cvUrl: publicUrl, serviceType: "cv_outreach" } as unknown);
        if (!parseRes?.success || !parseRes?.parsed) {
          throw new Error("Could not parse the CV content. Please try again with a different format.");
        }
        parsedCVData = parseRes.parsed;
      } else if (inputMode === "url") {
        if (!cvUrl.trim()) throw new Error("Please enter a CV URL first.");
        toast.loading("Analyzing remote CV...", { id: "cv-processing" });
        const parseRes = await parseCv({ cvUrl: cvUrl.trim(), serviceType: "cv_outreach" } as unknown);
        if (!parseRes?.success || !parseRes?.parsed) {
          throw new Error("Could not parse CV at the specified URL.");
        }
        parsedCVData = parseRes.parsed;
      } else {
        if (!cvText.trim()) throw new Error("Please paste CV text first.");
        toast.loading("Parsing CV text...", { id: "cv-processing" });
        const parseRes = await parseCv({ cvText: cvText.trim(), serviceType: "cv_outreach" } as unknown);
        if (!parseRes?.success || !parseRes?.parsed) {
          throw new Error("Could not parse the pasted CV text.");
        }
        parsedCVData = parseRes.parsed;
      }

      toast.loading("Generating outreach pitch...", { id: "cv-processing" });
      const finalSender = selectedSender === "custom" ? customSenderName : selectedSender;
      const msgRes = await generateOutreachMessage({
        parsedCV: parsedCVData,
        product: selectedProduct,
        professionCategory: parsedCVData?.profession_category || "Executive",
        senderName: finalSender || "Academy_Systems",
        language: selectedLanguage,
      } as unknown);

      if (!msgRes?.success || !msgRes?.message) {
        throw new Error("Failed to synthesize message pitch.");
      }

      setResult({
        message: msgRes.message,
        name: msgRes.name || parsedCVData?.full_name || "Talent",
        phone: msgRes.phone || parsedCVData?.phone || "",
        professionCategory: msgRes.professionCategory || parsedCVData?.profession_category || "",
        whatsappLink: msgRes.whatsappLink || "",
      });

      toast.success("Outreach strategy generated successfully!", { id: "cv-processing" });
    } catch (err: unknown) {
      toast.error(err.message || "CV Processing Failed", { id: "cv-processing" });
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (activeTab === "analytics") {
      loadAnalytics();
    }
  }, [activeTab]);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Phase 6 Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Send className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Talent Outreach
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            AI-Driven Talent Acquisition Engine
          </p>
        </div>
        <Button
          onClick={() => setActiveTab("generator")}
          className="h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary text-primary-foreground"
        >
          <Bot className="h-4 w-4" /> Trigger Campaign
        </Button>
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as unknown)} className="w-full">
        <TabsList className="bg-muted/30 rounded-xl border border-border/60 p-1.5 mb-8 w-full max-w-2xl mx-auto flex">
          <TabsTrigger
            value="ledger"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg py-3"
          >
            <Send className="w-4 h-4" /> Active Ledger
          </TabsTrigger>
          <TabsTrigger
            value="generator"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg py-3"
          >
            <Zap className="w-4 h-4" /> CV Processor
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg py-3"
          >
            <BarChart2 className="w-4 h-4" /> Telemetry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ledger" className="mt-0">
          <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary" />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/10 border-b border-border/20">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-black uppercase text-[10px] tracking-widest py-5 pl-8">
                        Talent Node
                      </TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest">
                        Delivery Channel
                      </TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8">
                        Timestamp
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border/5">
                    {isGraphLoading ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-20 text-center">
                          <Skeleton className="h-8 w-32 mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : graphData?.talentOutreach?.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="py-20 text-center font-black uppercase text-[10px] tracking-widest text-muted-foreground/50 italic"
                        >
                          Zero outreach signals detected.
                        </TableCell>
                      </TableRow>
                    ) : (
                      graphData?.talentOutreach?.map((row) => (
                        <TableRow key={row.id} className="group hover:bg-primary/[0.02]">
                          <TableCell className="py-6 pl-8">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-background border border-border/40 flex items-center justify-center shrink-0">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <span className="font-mono text-xs uppercase tracking-tight text-muted-foreground">
                                {row.talent_id?.substring(0, 8)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono text-[9px] border-2 text-primary border-primary/20 bg-primary/10"
                            >
                              {row.channel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8 font-mono text-[10px] text-muted-foreground">
                            {new Date(row.sent_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generator" className="mt-0 space-y-10">
          <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden text-left">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary to-primary" />
            <CardHeader className="p-10 border-b border-border/10 bg-muted/10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-3xl font-black uppercase tracking-tighter italic">
                    Outreach Generator
                  </CardTitle>
                  <CardDescription className="text-[10px] font-black text-muted-foreground/60 italic">
                    Personalized CV Artifact summary
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-6">
              {/* Input Mode Selector */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-primary uppercase tracking-widest">CV Source Type</Label>
                <div className="flex gap-4">
                  {(["upload", "url", "text"] as const).map((mode) => (
                    <Button
                      key={mode}
                      type="button"
                      variant={inputMode === mode ? "default" : "outline"}
                      onClick={() => setInputMode(mode)}
                      className="rounded-xl font-bold uppercase text-[10px] tracking-widest px-6 h-10"
                    >
                      {mode === "upload" && <Upload className="w-3.5 h-3.5 mr-2" />}
                      {mode === "url" && <Link className="w-3.5 h-3.5 mr-2" />}
                      {mode === "text" && <FileText className="w-3.5 h-3.5 mr-2" />}
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mode-specific Fields */}
              {inputMode === "upload" && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Upload CV (PDF/Word)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setCvFile(file);
                      }}
                      className="h-12 rounded-xl bg-muted/20 border-2 font-semibold"
                    />
                  </div>
                </div>
              )}

              {inputMode === "url" && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">CV Document URL</Label>
                  <Input
                    placeholder="https://..."
                    value={cvUrl}
                    onChange={(e) => setCvUrl(e.target.value)}
                    className="h-12 rounded-xl bg-muted/20 border-2 font-semibold"
                  />
                </div>
              )}

              {inputMode === "text" && (
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">CV Raw Text Content</Label>
                  <Textarea
                    placeholder="Paste full text contents of the resume here..."
                    rows={8}
                    value={cvText}
                    onChange={(e) => setCvText(e.target.value)}
                    className="rounded-xl bg-muted/20 border-2 font-semibold resize-none"
                  />
                </div>
              )}

              {/* Product and Language Options */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Target Pitch Product</Label>
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-semibold bg-background/50">
                      <SelectValue placeholder="Select pitch product..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="digital-portfolio">Digital Portfolio</SelectItem>
                      <SelectItem value="welcome-ai">Welcome AI</SelectItem>
                      <SelectItem value="career-scorecard">Career Scorecard</SelectItem>
                      <SelectItem value="mock-interview">Mock Interview</SelectItem>
                      <SelectItem value="salary-analysis">Salary Analysis</SelectItem>
                      <SelectItem value="ai-efficiency">AI Efficiency Accelerator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Pitch Language</Label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-semibold bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="auto">Auto-Detect</SelectItem>
                      <SelectItem value="en">English Only</SelectItem>
                      <SelectItem value="bn">Bengali / Bangla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Sender Configuration */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Sender Signature</Label>
                  <Select value={selectedSender} onValueChange={setSelectedSender}>
                    <SelectTrigger className="h-12 rounded-xl border-2 font-semibold bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      <SelectItem value="firoz">Firoz</SelectItem>
                      <SelectItem value="Academy_Systems">Academy Systems</SelectItem>
                      <SelectItem value="custom">Custom Name...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedSender === "custom" && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-primary uppercase tracking-widest">Custom Sender Name</Label>
                    <Input
                      placeholder="Enter custom signature..."
                      value={customSenderName}
                      onChange={(e) => setCustomSenderName(e.target.value)}
                      className="h-12 rounded-xl bg-muted/20 border-2 font-semibold"
                    />
                  </div>
                )}
              </div>

              {/* Trigger Button */}
              <Button
                onClick={processCV}
                disabled={isProcessing}
                className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Analyzing & summary in Progress...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" /> Analyze Resume & Generate Pitch
                  </>
                )}
              </Button>

              {/* Pitch Result Block */}
              {result && (
                <div className="mt-8 space-y-4 border-2 border-primary/20 bg-primary/[0.01] p-6 rounded-2xl animate-in fade-in duration-500 text-left">
                  <div className="flex justify-between items-center pb-4 border-b border-border/60">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wide text-foreground">
                        Synthesized Pitch Strategy
                      </h4>
                      <div className="flex gap-2 mt-1">
                        {result.name && (
                          <Badge variant="outline" className="font-mono text-[9px] uppercase">
                            Talent: {result.name}
                          </Badge>
                        )}
                        {result.professionCategory && (
                          <Badge variant="outline" className="font-mono text-[9px] uppercase">
                            Role: {result.professionCategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-[9px] font-black uppercase tracking-wider h-8"
                        onClick={() => {
                          navigator.clipboard.writeText(result.message);
                          toast.success("Pitch copied to clipboard!");
                        }}
                      >
                        <Copy className="w-3.5 h-3.5 mr-1" /> Copy Message
                      </Button>
                      {result.whatsappLink && (
                        <a
                          href={result.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center bg-success hover:bg-success/90 text-success-foreground text-[9px] font-black uppercase tracking-wider h-8 px-3 rounded-lg"
                        >
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Send WhatsApp
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="bg-background/60 p-4 rounded-xl border border-border/40">
                    <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-foreground select-all">
                      {result.message}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-0 space-y-8">
          {isLoadingAnalytics ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : (
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="rounded-2xl border border-border/60 bg-card p-8">
                <p className="text-[10px] font-black text-muted-foreground/40 mb-6 italic text-left">
                  Distribution Breakdown
                </p>
                <div className="space-y-6 text-left">
                  {Object.entries(analyticsData?.productCounts || {}).map(([prod, count]: unknown) => (
                    <div key={prod} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                        <span className="text-muted-foreground">{prod.replace(/-/g, " ")}</span>
                        <span className="text-primary">{count} NODES</span>
                      </div>
                      <Progress value={(count / (analyticsData?.totalMessages || 1)) * 100} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TalentOutreachTab;


