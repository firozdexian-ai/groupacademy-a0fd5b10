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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Bot, Send, Loader2, ShieldCheck, Coins, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Agent Creator Studio (Onboarding)
 * CTO Audit: Upgraded to Premium SaaS aesthetic. Hardened slug generation.
 */
export function CreatorOnboardingDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}) {
  const { talent } = useTalent();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [blueprint, setBlueprint] = useState<{
    system_prompt?: string;
    allowed_tools?: string[];
    description?: string;
  } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [credits, setCredits] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  const STEPS = ["Logic_Brief", "AI_Brain", "Deployment"];
  const progress = ((step + 1) / STEPS.length) * 100;

  function reset() {
    setStep(0);
    setName("");
    setBrief("");
    setBlueprint(null);
    setCredits(2);
  }

  async function generateBlueprint() {
    if (!brief.trim() || brief.length < 20) {
      return toast.error("Insufficient Context: Add a longer brief (20+ chars) for neural synthesis.");
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("agent-blueprint", {
        body: { brief, name: name || "New Agent Entity" },
      });
      if (error) throw error;
      setBlueprint(data?.blueprint ?? data ?? null);
      setStep(1);
    } catch (e) {
      console.error(e);
      toast.warning("Neural link unstable. Bypassing to manual logic mode.");
      setBlueprint({ system_prompt: brief, allowed_tools: [], description: brief.slice(0, 140) });
      setStep(1);
    } finally {
      setGenerating(false);
    }
  }

  async function submit() {
    if (!talent?.id) return toast.error("Identity Sync Required.");
    if (!name.trim()) return toast.error("Entity requires a designation (name).");
    setSubmitting(true);

    // CTO FIX: Hardened slug generation to prevent URL routing errors
    const safeSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);
    const uniqueSlug = `${safeSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const { error } = await supabase.from("ai_agents").insert({
      agent_key: uniqueSlug,
      name,
      description: blueprint?.description ?? brief.slice(0, 200),
      system_prompt: blueprint?.system_prompt ?? brief,
      allowed_tools: blueprint?.allowed_tools ?? [],
      owner_kind: "talent",
      owner_id: talent.id,
      visibility: "private",
      marketplace_status: "pending",
      message_credit_cost: credits,
      is_active: true,
    });
    setSubmitting(false);

    if (error) return toast.error(`Ingress Failed: ${error.message}`);

    toast.success("Agent Artifact Submitted", { description: "Marketplace validation is currently pending." });
    onCreated?.();
    onOpenChange(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-2xl rounded-[40px] border-4 border-border/40 bg-background/95 backdrop-blur-2xl p-0 overflow-hidden shadow-2xl">
        <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />

        <div className="p-8 max-h-[85vh] overflow-y-auto no-scrollbar">
          <DialogHeader className="mb-6 text-left">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                  Creator Studio
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 italic">
                  Initialize Custom AI Entity
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 mb-8">
            <Progress value={progress} className="h-2 bg-primary/10" />
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
              {STEPS.map((s, i) => (
                <span key={s} className={cn("transition-colors", i === step && "text-primary")}>
                  PHASE_0{i + 1}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            {step === 0 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Entity Designation
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Resume Polisher"
                    maxLength={50}
                    className="h-14 rounded-2xl border-2 bg-muted/20 font-bold text-lg px-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                    Logic Parameters
                  </Label>
                  <Textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    placeholder="Describe your agent's purpose, audience, and what makes it special. The more detail, the better the AI blueprint."
                    rows={6}
                    className="rounded-2xl border-2 bg-muted/20 font-medium italic p-4 resize-none"
                  />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 text-right mt-1">
                    {brief.length} / 1000 Bytes
                  </p>
                </div>
                <Card className="bg-primary/5 border-2 border-primary/20 rounded-2xl">
                  <CardContent className="p-4 flex items-start gap-3">
                    <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-xs font-medium text-foreground/80 leading-relaxed italic">
                      You earn <strong className="text-primary font-black">50% of the credits</strong> spent on every
                      conversation with your agent. Payouts initiate upon marketplace verification.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 italic text-center mb-6">
                  Neural Blueprint Synthesized. Refinement available post-deployment.
                </p>
                <Card className="rounded-[24px] border-2 border-border/40 bg-card/40 backdrop-blur-sm shadow-inner">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="font-black uppercase tracking-widest text-[9px] text-primary mb-2 flex items-center gap-2">
                        <Bot className="h-3 w-3" /> Core Logic Prompt
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/20 text-xs font-mono text-foreground/70 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                        {blueprint?.system_prompt ?? brief}
                      </div>
                    </div>
                    {blueprint?.allowed_tools && blueprint.allowed_tools.length > 0 && (
                      <div className="pt-4 border-t border-border/10">
                        <div className="font-black uppercase tracking-widest text-[9px] text-primary mb-2 flex items-center gap-2">
                          <Zap className="h-3 w-3" /> Authorized Tooling
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {blueprint.allowed_tools.map((t) => (
                            <Badge
                              key={t}
                              variant="secondary"
                              className="text-[9px] font-black uppercase tracking-widest bg-background border-2"
                            >
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-4 bg-muted/20 p-6 rounded-[24px] border-2 border-border/40">
                  <Label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Coins className="h-4 w-4" /> Message Cost Yield (Credits)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="h-16 rounded-2xl border-2 bg-background font-black text-2xl px-6"
                  />
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-muted-foreground/60">Creator Yield Rate:</span>
                    <span className="text-emerald-500">~{(credits * 0.5).toFixed(1)} TKN / Msg</span>
                  </div>
                </div>

                <Card className="bg-amber-500/5 border-2 border-amber-500/20 rounded-[24px]">
                  <CardContent className="p-6 text-sm text-center italic font-medium text-foreground/80">
                    <p className="mb-1 text-amber-600 font-black not-italic uppercase tracking-widest text-[10px]">
                      Verification Protocol
                    </p>
                    <p>
                      Submitted artifacts undergo security review within 24 hours. You will receive telemetry once the
                      entity is active on the marketplace.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="mt-10 gap-3 sm:gap-0 border-t border-border/10 pt-6 flex-col sm:flex-row">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest w-full sm:w-auto px-8"
              >
                Revert Phase
              </Button>
            )}

            {step === 0 && (
              <Button
                onClick={generateBlueprint}
                disabled={generating || !brief.trim()}
                className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest w-full shadow-xl shadow-primary/20"
              >
                {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
                Synthesize Blueprint
              </Button>
            )}

            {step === 1 && (
              <Button
                onClick={() => setStep(2)}
                className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest w-full sm:flex-1 shadow-xl shadow-primary/20"
              >
                Confirm Parameters
              </Button>
            )}

            {step === 2 && (
              <Button
                onClick={submit}
                disabled={submitting}
                className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest w-full sm:flex-1 shadow-xl shadow-primary/20"
              >
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Commit to Marketplace
              </Button>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
