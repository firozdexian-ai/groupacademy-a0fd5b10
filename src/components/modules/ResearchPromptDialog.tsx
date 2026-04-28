import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Check, Zap, ShieldCheck, Cpu } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Curriculum Intelligence Bridge
 * CTO Reference: Authoritative node for exporting module data into neural research environments.
 */

interface ResearchPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleTitle: string;
  moduleDescription: string;
  moduleIndex: number;
  totalModules: number;
  courseTitle: string;
  courseIndex: number;
  totalCourses: number;
  levelName: string;
  programName: string;
  schoolName: string;
  academyName: string;
}

function buildResearchProtocol(props: Omit<ResearchPromptDialogProps, "open" | "onOpenChange">): string {
  const {
    moduleTitle,
    moduleDescription,
    moduleIndex,
    totalModules,
    courseTitle,
    courseIndex,
    totalCourses,
    levelName,
    programName,
    schoolName,
    academyName,
  } = props;

  const talkingPoints = moduleDescription?.trim()
    ? `\n[PROTOCOL_TALKING_POINTS]:\n${moduleDescription
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `• ${l}`)
        .join("\n")}\n`
    : "\n[PROTOCOL_TALKING_POINTS]: (System_Idle — Initialize comprehensive discovery)\n";

  return `SYSTEM_ROLE: Curriculum_Research_Specialist
INSTITUTIONAL_TARGET: ${academyName} // ${schoolName}

[PEDAGOGICAL_CONTEXT]:
- Program: ${programName}
- Level: ${levelName}
- Course: ${courseTitle} (${courseIndex}/${totalCourses})
- Module: ${moduleTitle} (${moduleIndex}/${totalModules})

${talkingPoints}

[RESEARCH_INSTRUCTIONS]:
Execute deep-sync discovery for this educational node. Provide actionable artifacts covering:
1. THEORETICAL_FRAMEWORKS: Key definitions and industry-standard models.
2. OPS_BEST_PRACTICES: Current global standards and elite implementation strategies.
3. CASE_STUDY_REPOSITORY: Global real-world deployments and outcome analysis.
4. DEFICIT_AUDIT: Common professional failures and conceptual misconceptions.
5. TOOLKIT_SYNC: Industry-standard software, templates, and essential resources.
6. ASSESSMENT_VECTORS: High-yield discussion nodes and quiz-worthy concepts.
7. EXTERNAL_UPLINKS: Verified citations, technical reading, and high-fidelity video references.

FORMAT: Output must be structured with high-intensity headers. Content must be deployment-ready for video lectures, slide decks, and simulation exercises.`;
}

export default function ResearchPromptDialog(props: ResearchPromptDialogProps) {
  const { open, onOpenChange, ...promptProps } = props;
  const [isCopied, setIsCopied] = useState(false);

  const promptPayload = buildResearchProtocol(promptProps);

  const executeCopyHandshake = async () => {
    try {
      await navigator.clipboard.writeText(promptPayload);
      setIsCopied(true);
      toast.success("NEURAL_PROMPT_SYNCED");
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      toast.error("SYNC_FAULT: Manual copy required.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] rounded-[32px] border-2 border-border/40 bg-card/60 backdrop-blur-3xl shadow-2xl p-0 overflow-hidden flex flex-col">
        {/* HUD: HEADER */}
        <div className="p-8 border-b-2 border-border/10 bg-primary/5">
          <DialogHeader className="text-left">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg">
                <Cpu className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
                  Deep_Research_Bridge
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
                  Neural_Uplink: Synchronizing Module Artifacts
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* VIEWPORT: PROMPT_PAYLOAD */}
        <div className="flex-1 p-8 overflow-hidden flex flex-col space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 italic">
              System_Prompt_Output
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-500 opacity-40" />
          </div>
          <Textarea
            value={promptPayload}
            readOnly
            className="flex-1 min-h-[300px] rounded-2xl border-2 bg-muted/20 p-6 font-mono text-xs leading-relaxed italic text-foreground/80 resize-none focus-visible:ring-primary/20"
          />
          <p className="text-[9px] font-medium text-muted-foreground/40 italic text-center">
            Paste this protocol into GPT-4, Gemini Ultra, or Claude 3 for optimal curriculum yield.
          </p>
        </div>

        {/* HUD: FOOTER_ACTIONS */}
        <DialogFooter className="p-8 bg-muted/5 border-t-2 border-border/10 flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-14 px-8 rounded-2xl border-2 font-black uppercase italic text-[10px] tracking-widest"
          >
            DISMISS
          </Button>
          <Button
            onClick={executeCopyHandshake}
            className="h-14 flex-1 rounded-2xl font-black uppercase italic text-[10px] tracking-[0.2em] shadow-[0_20px_50px_rgba(var(--primary),0.3)] hover:shadow-primary/40 transition-all active:scale-95 gap-3"
          >
            {isCopied ? (
              <>
                <Check className="h-5 w-5" /> SYNC_COMPLETE
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" /> COPY_RESEARCH_PROTOCOL
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
