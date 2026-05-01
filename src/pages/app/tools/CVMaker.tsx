import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Loader2, Download, Sparkles, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { CREDIT_CONFIG } from "@/lib/creditPricing";
import { toast } from "sonner";

/**
 * ATS-Friendly CV Maker — generates a clean text-extractable CV PDF
 * using the talent's profile data. No AI re-write; safe for ATS parsers.
 */
export default function CVMaker() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { canAfford, deductCredits } = useCredits();
  const [generating, setGenerating] = useState(false);

  const cost = CREDIT_CONFIG.SERVICES.CV_GENERATION.cost;

  async function handleGenerate() {
    if (!talent) return toast.error("Profile not loaded.");
    if (!canAfford("CV_GENERATION")) return toast.error(`Need ${cost} credits.`);

    setGenerating(true);
    try {
      // Lazy-load PDF generator to keep bundle small
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 48;
      let y = margin;

      const writeHeading = (text: string) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(40);
        doc.text(text.toUpperCase(), margin, y);
        y += 6;
        doc.setDrawColor(180);
        doc.line(margin, y, pageW - margin, y);
        y += 14;
      };
      const writeLine = (text: string, opts: { bold?: boolean; size?: number; color?: number } = {}) => {
        doc.setFont("helvetica", opts.bold ? "bold" : "normal");
        doc.setFontSize(opts.size ?? 10);
        doc.setTextColor(opts.color ?? 60);
        const lines = doc.splitTextToSize(text, pageW - margin * 2);
        lines.forEach((l: string) => {
          if (y > 780) { doc.addPage(); y = margin; }
          doc.text(l, margin, y);
          y += (opts.size ?? 10) + 3;
        });
      };

      // Header
      writeLine(talent.fullName || "Your Name", { bold: true, size: 18, color: 20 });
      const contact = [talent.email, talent.phone, talent.country].filter(Boolean).join(" · ");
      writeLine(contact, { size: 10, color: 100 });
      if (talent.linkedinUrl) writeLine(talent.linkedinUrl, { size: 10, color: 100 });
      y += 8;

      // Summary
      if (talent.customProfession) {
        writeHeading("Profile");
        writeLine(talent.customProfession);
        y += 8;
      }

      // Experience
      if (talent.experience?.length) {
        writeHeading("Experience");
        talent.experience.forEach((exp: any) => {
          writeLine(`${exp.title || ""}${exp.company ? " — " + exp.company : ""}`, { bold: true });
          const period = [exp.startDate, exp.endDate || (exp.current ? "Present" : "")].filter(Boolean).join(" – ");
          if (period) writeLine(period, { size: 9, color: 110 });
          if (exp.description) writeLine(exp.description);
          y += 6;
        });
      }

      // Education
      if (talent.education?.length) {
        writeHeading("Education");
        talent.education.forEach((ed: any) => {
          writeLine(`${ed.degree || ""}${ed.field ? ", " + ed.field : ""}`, { bold: true });
          if (ed.institution) writeLine(ed.institution);
          if (ed.startDate || ed.endDate) writeLine([ed.startDate, ed.endDate].filter(Boolean).join(" – "), { size: 9, color: 110 });
          y += 6;
        });
      }

      // Skills
      if (talent.skills?.length) {
        writeHeading("Skills");
        const skillNames = talent.skills.map((s: any) => s.name || s).filter(Boolean).join(" · ");
        writeLine(skillNames);
      }

      await deductCredits("CV_GENERATION", undefined, "ATS-friendly CV generated");
      doc.save(`${(talent.fullName || "cv").replace(/\s+/g, "_")}_ATS_CV.pdf`);
      toast.success("CV downloaded.");
    } catch (e) {
      console.error(e);
      toast.error("Couldn't generate CV. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-3 py-3 pb-28 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">ATS-friendly CV</h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Clean, text-based PDF that recruiter scanners can parse without errors.
        </p>
      </header>

      <Card className="rounded-2xl border border-border/40">
        <CardContent className="p-4 space-y-3">
          <p className="text-sm">
            We'll build a single-column ATS-safe CV from your profile data — no images, no fancy fonts, no columns.
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
            <li>Uses your name, contact, summary, experience, education and skills</li>
            <li>Standard headings recruiters' systems expect</li>
            <li>Downloads instantly to your device</li>
          </ul>

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <Badge variant="outline" className="gap-1 text-[10px]">
              <Coins className="h-3 w-3 text-amber-500" /> {cost} credits
            </Badge>
            <Button onClick={handleGenerate} disabled={generating} size="sm" className="h-9 rounded-lg">
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              {generating ? "Building..." : "Generate CV"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-dashed border-border/40 bg-muted/10">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Make sure your profile is up to date for the best result. Update it from{" "}
            <button onClick={() => navigate("/app/profile/edit")} className="text-primary font-medium underline">
              Profile · Edit
            </button>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
