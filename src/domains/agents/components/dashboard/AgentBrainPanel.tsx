import { useMemo, useState } from "react";
import { updateAiAgent } from "@/domains/agents/repo/agentsRepo";
import { agentBlueprint } from "@/domains/agents/api/agentsApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { trackError } from "@/lib/errorTracking";
import { Loader2, Wand2, Plus, Trash2, BrainCircuit, SplitSquareHorizontal, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Group Academy — Career Guidance System: Agent Instruction Panel Component
 * Version: Phase 10j.5 Hardened (Production Candidate)
 * Surface: /dashboard/studio?panel=brain (Agent Performance Tuning Surface)
 * Operations Mode: Automated Efficiency plain-language instruction parser and multi-variant prompt engine.
 */

interface Proposal {
  name: string;
  agent_key: string;
  description: string;
  system_prompt: string;
  allowed_tools: string[];
  agent_level: number;
  connection_fee: number;
  message_credit_cost: number;
  category: string;
  rationale: string;
}

interface AgentBrainPanelProps {
  agent: {
    id: string;
    name: string;
    agent_key: string;
    description: string;
    system_prompt: string;
    allowed_tools: string[];
    agent_level: number;
    connection_fee: number;
    message_credit_cost: number;
    category: string;
    audience: string;
    active_prompt_variant: string;
    prompt_variants: Record<string, string>;
  };
  onSaved?: () => void;
}

export function AgentBrainPanel({ agent, onSaved }: AgentBrainPanelProps) {
  const { toast } = useToast();
  const [brief, setBrief] = useState("");
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [applying, setApplying] = useState(false);

  const variants = useMemo<Record<string, string>>(
    () => ({ A: agent.system_prompt, ...(agent.prompt_variants || {}) }),
    [agent],
  );
  const [activeVariant, setActiveVariant] = useState(agent.active_prompt_variant || "A");
  const [newVariantKey, setNewVariantKey] = useState("");
  const [newVariantPrompt, setNewVariantPrompt] = useState("");

  async function generate() {
    if (brief.trim().length < 10) {
      toast({
        title: "Incomplete description",
        description: "Please expand your requirements details before generating a configuration draft.",
      });
      return;
    }
    setGenerating(true);
    setProposal(null);
    try {
      const data = await agentBlueprint({ brief, audience: agent.audience });
      if (!data?.proposal) throw new Error("No optimization configuration models returned");
      setProposal(data.proposal as Proposal);
    } catch (e: any) {
      trackError("agent-brain-panel-generation-failure", { error: e.message, agentId: agent.id });
      toast({ title: "Configuration generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function applyProposal() {
    if (!proposal) return;
    setApplying(true);
    try {
      await updateAiAgent(agent.id, {
        name: proposal.name,
        description: proposal.description,
        system_prompt: proposal.system_prompt,
        allowed_tools: proposal.allowed_tools,
        agent_level: proposal.agent_level,
        connection_fee: proposal.connection_fee,
        message_credit_cost: proposal.message_credit_cost,
        category: proposal.category,
      });
      toast({ title: "Configuration profile applied successfully" });
      setProposal(null);
      setBrief("");
      onSaved?.();
    } catch (err: any) {
      trackError("agent-brain-panel-apply-blueprint-failure", { error: err.message, agentId: agent.id });
      toast({ title: "Application failed", description: err.message, variant: "destructive" });
    } finally {
      setApplying(false);
    }
  }

  async function setActive(key: string) {
    try {
      await updateAiAgent(agent.id, { active_prompt_variant: key });
      setActiveVariant(key);
      toast({ title: `Prompt variant ${key} is now live` });
      onSaved?.();
    } catch (error: any) {
      trackError("agent-brain-panel-set-active-variant-failure", { error: error.message, agentId: agent.id, key });
      toast({ title: "Activation failed", description: error.message, variant: "destructive" });
    }
  }

  async function addVariant() {
    const key = newVariantKey.trim().toUpperCase();
    if (!key || !/^[A-Z0-9]{1,4}$/.test(key)) {
      return toast({
        title: "Invalid identifier",
        description: "Use 1 to 4 alphanumeric uppercase characters (e.g., B, V2).",
      });
    }
    if (key === "A" || variants[key]) {
      return toast({ title: "Duplicate identifier", description: "This instruction option key already exists." });
    }
    if (newVariantPrompt.trim().length < 20) {
      return toast({ title: "Instructions description is too short" });
    }
    const next = { ...(agent.prompt_variants || {}), [key]: newVariantPrompt };
    try {
      await updateAiAgent(agent.id, { prompt_variants: next });
      setNewVariantKey("");
      setNewVariantPrompt("");
      toast({ title: `Experimental variant ${key} successfully added` });
      onSaved?.();
    } catch (error: any) {
      trackError("agent-brain-panel-add-variant-failure", { error: error.message, agentId: agent.id, key });
      toast({ title: "Saving instructions variant failed", description: error.message, variant: "destructive" });
    }
  }

  async function deleteVariant(key: string) {
    if (key === "A")
      return toast({ title: "Action prohibited", description: "Variant A is the base configuration prompt." });
    if (key === activeVariant) {
      return toast({
        title: "Variant is currently live",
        description: "Switch to an alternative instructions profile first.",
      });
    }
    const next = { ...(agent.prompt_variants || {}) };
    delete next[key];
    try {
      await updateAiAgent(agent.id, { prompt_variants: next });
      toast({ title: `Variant ${key} removed` });
      onSaved?.();
    } catch (error: any) {
      trackError("agent-brain-panel-delete-variant-failure", { error: error.message, agentId: agent.id, key });
      toast({ title: "Deletion failed", description: error.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
      {/* Strategy Blueprint Generation Block */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-600" />
        <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-primary">
            <BrainCircuit className="h-4 w-4" /> Configuration Strategy Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Instructional Parameters Brief</Label>
            <Textarea
              rows={4}
              placeholder="Describe the target behavior parameters in plain English. Example: 'A technical guidance advisor for modern engineer professionals. Assist with resume reviews and structured curriculum path planning. Keep tone direct and operational.'"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="rounded-xl border border-border text-sm font-medium p-4 focus-visible:ring-1 focus-visible:ring-primary bg-background/50 leading-relaxed"
            />
            <div className="flex justify-end pt-1">
              <Button
                onClick={generate}
                disabled={generating || brief.trim().length < 10}
                className="h-10 px-5 rounded-xl font-semibold text-xs tracking-wide gap-2 shadow-sm transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Generate System Proposal
              </Button>
            </div>
          </div>

          {proposal && (
            <div className="rounded-xl border border-primary/20 p-5 space-y-4 bg-primary/[0.01] animate-in slide-in-from-top-3 duration-300">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-primary text-primary-foreground font-bold tracking-wide px-2.5 py-0.5 rounded-full border-none">
                  {proposal.name}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[11px] font-mono border-border bg-background text-muted-foreground"
                >
                  {proposal.agent_key}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[11px] font-semibold bg-background border-border text-muted-foreground"
                >
                  Level {proposal.agent_level}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[11px] font-semibold bg-background border-border text-muted-foreground"
                >
                  {proposal.category}
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[11px] font-bold bg-emerald-500/10 text-emerald-700 border-none rounded-full px-2.5"
                >
                  {proposal.connection_fee} Credits Access / {proposal.message_credit_cost} Credits Msg
                </Badge>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground/90 italic border-l-2 border-primary/40 pl-3 py-0.5 leading-relaxed">
                  "{proposal.rationale}"
                </p>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Functional Summary Description
                  </Label>
                  <p className="text-sm text-foreground leading-relaxed font-medium">{proposal.description}</p>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    System Instructions Code
                  </Label>
                  <pre className="text-xs whitespace-pre-wrap font-mono bg-muted p-4 rounded-xl border border-border/40 max-h-48 overflow-y-auto leading-relaxed text-foreground/90">
                    {proposal.system_prompt}
                  </pre>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    Authorized Integration Tools
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {proposal.allowed_tools.map((t) => (
                      <Badge
                        key={t}
                        variant="secondary"
                        className="font-mono text-[10px] bg-muted text-muted-foreground border-none px-2 py-0.5 rounded"
                      >
                        {t}
                      </Badge>
                    ))}
                    {proposal.allowed_tools.length === 0 && (
                      <span className="text-xs text-muted-foreground/60 italic">
                        No tools required for this template package
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-border/40">
                <Button
                  onClick={applyProposal}
                  disabled={applying}
                  className="h-10 flex-1 rounded-xl font-semibold text-xs tracking-wide gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Apply Blueprint Framework Settings
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setProposal(null)}
                  className="h-10 px-5 rounded-xl font-semibold text-xs text-muted-foreground border-border hover:bg-muted"
                >
                  Discard Proposal
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Structured A/B Testing Profiles Framework */}
      <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card flex flex-col">
        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
        <CardHeader className="p-5 border-b border-border/40 bg-muted/20">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-emerald-700">
            <SplitSquareHorizontal className="h-4 w-4" /> Instructions Deployment Variants (A/B Routing)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-3">
            {Object.entries(variants).map(([key, prompt]) => (
              <div
                key={key}
                className={cn(
                  "rounded-xl border p-4 transition-all duration-200 bg-background/40",
                  key === activeVariant
                    ? "border-emerald-500/30 bg-emerald-500/[0.01] shadow-inner"
                    : "border-border hover:border-border/80",
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={key === activeVariant ? "default" : "outline"}
                      className={cn(
                        "font-bold text-[11px] px-2.5 py-0.5 rounded-full border-none",
                        key === activeVariant
                          ? "bg-emerald-600 text-white hover:bg-emerald-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      Variant {key}
                    </Badge>
                    {key === activeVariant && (
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Active Live Route
                      </span>
                    )}
                    {key === "A" && (
                      <span className="text-xs text-muted-foreground/50 font-medium">
                        (Baseline Instructions Framework)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {key !== activeVariant && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setActive(key)}
                        className="h-7 rounded-lg font-semibold text-[10px] tracking-wide px-3 bg-muted hover:bg-muted/80 text-foreground"
                      >
                        Activate Variant
                      </Button>
                    )}
                    {key !== "A" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label="Delete instruction variant"
                        onClick={() => deleteVariant(key)}
                        className="h-7 w-7 rounded-lg text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <pre className="text-xs whitespace-pre-wrap font-mono bg-muted/60 p-4 rounded-xl border border-border/40 max-h-40 overflow-y-auto text-muted-foreground leading-relaxed">
                  {prompt}
                </pre>
              </div>
            ))}
          </div>

          {/* Interactive Variant Creator Framework */}
          <div className="rounded-xl border border-dashed border-border p-4 space-y-4 bg-muted/10">
            <div className="flex items-center gap-2 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
              <Plus className="h-4 w-4 text-primary" /> Create Experimental Variant
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="space-y-1.5 md:w-24 shrink-0 text-left">
                <Label className="text-xs font-semibold text-foreground">Option Key</Label>
                <Input
                  className="h-10 rounded-xl border font-bold text-center uppercase font-mono text-sm tracking-wide"
                  placeholder="e.g. B"
                  value={newVariantKey}
                  onChange={(e) => setNewVariantKey(e.target.value)}
                  maxLength={4}
                />
              </div>
              <div className="space-y-1.5 md:flex-1 text-left">
                <Label className="text-xs font-semibold text-foreground">Instructions Code Prompt</Label>
                <Textarea
                  rows={3}
                  className="rounded-xl border text-sm font-medium p-3 resize-none leading-relaxed focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="Insert the variant setup text guidelines to deployment test..."
                  value={newVariantPrompt}
                  onChange={(e) => setNewVariantPrompt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
              <p className="text-xs text-muted-foreground/60 max-w-sm leading-relaxed">
                Instruction variants run split testing concurrently against production traffic allocations. Review
                performance loops inside Insights dashboards.
              </p>
              <Button
                onClick={addVariant}
                disabled={!newVariantKey.trim() || newVariantPrompt.trim().length < 20}
                className="h-10 px-5 rounded-xl font-semibold text-xs tracking-wide bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shrink-0"
              >
                Save Experimental Variant
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AgentBrainPanel;
