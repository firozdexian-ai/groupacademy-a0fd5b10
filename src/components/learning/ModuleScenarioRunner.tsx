import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MessageSquare, Send, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Scenario { id: string; title: string; scenario_prompt: string; rubric: any[] }
type Msg = { role: "user" | "assistant"; content: string };

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learner-scenario-pool`;

export function ModuleScenarioRunner({ moduleId, onComplete }: { moduleId: string; onComplete?: () => void }) {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [conv, setConv] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [evalResult, setEvalResult] = useState<any | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("learner-scenario-pool", { body: { mode: "draw", module_id: moduleId } });
      setLoading(false);
      if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || "Failed"); return; }
      setScenario((data as any).scenario);
    })();
  }, [moduleId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [conv]);

  const send = async () => {
    if (!input.trim() || !scenario || streaming) return;
    const userMsg: Msg = { role: "user", content: input };
    const newConv = [...conv, userMsg];
    setConv(newConv);
    setInput(""); setStreaming(true);

    const { data: sess } = await supabase.auth.getSession();
    const resp = await fetch(STREAM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${sess.session?.access_token}` },
      body: JSON.stringify({ mode: "turn", module_id: moduleId, scenario_prompt: scenario.scenario_prompt, conversation: conv, user_message: input }),
    });
    if (!resp.ok || !resp.body) { setStreaming(false); toast.error("Stream failed"); return; }

    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let buf = ""; let assistant = "";
    setConv((c) => [...c, { role: "assistant", content: "" }]);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, nl); buf = buf.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const j = line.slice(6).trim();
        if (j === "[DONE]") { buf = ""; break; }
        try {
          const p = JSON.parse(j);
          const c = p.choices?.[0]?.delta?.content;
          if (c) {
            assistant += c;
            setConv((cur) => { const cp = [...cur]; cp[cp.length - 1] = { role: "assistant", content: assistant }; return cp; });
          }
        } catch { buf = line + "\n" + buf; break; }
      }
    }
    setStreaming(false);
  };

  const finishAndEvaluate = async () => {
    if (!scenario) return;
    setEvaluating(true);
    const { data, error } = await supabase.functions.invoke("learner-scenario-pool", {
      body: { mode: "evaluate", module_id: moduleId, scenario_id: scenario.id, conversation: conv, rubric: scenario.rubric },
    });
    setEvaluating(false);
    if (error || (data as any)?.error) { toast.error((data as any)?.error || error?.message || "Eval failed"); return; }
    setEvalResult((data as any).evaluation);
    onComplete?.();
  };

  if (loading) return (
    <Card className="rounded-3xl"><CardContent className="py-12 flex flex-col items-center gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground">Loading scenario…</p>
    </CardContent></Card>
  );
  if (!scenario) return null;

  if (evalResult) {
    return (
      <Card className="rounded-3xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Score: {Math.round(evalResult.overall_score)}%</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm">{evalResult.summary}</p>
          {evalResult.criteria?.map((c: any, i: number) => (
            <div key={i} className="border rounded-xl p-3">
              <div className="flex justify-between text-sm font-semibold"><span>{c.criterion}</span><span>{Math.round(c.score)}%</span></div>
              <p className="text-xs text-muted-foreground mt-1">{c.feedback}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> {scenario.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-xl bg-muted/50 p-3 text-sm">{scenario.scenario_prompt}</div>
        <div ref={scrollRef} className="border rounded-xl p-3 max-h-80 overflow-y-auto space-y-2">
          {conv.length === 0 && <p className="text-xs text-muted-foreground italic">Begin the conversation…</p>}
          {conv.map((m, i) => (
            <div key={i} className={cn("text-sm rounded-lg px-3 py-2", m.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8")}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{m.role}</p>
              {m.content || (streaming && i === conv.length - 1 ? <Loader2 className="h-3 w-3 animate-spin inline" /> : null)}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Your response…" disabled={streaming} />
          <Button onClick={send} disabled={streaming || !input.trim()} size="icon"><Send className="h-4 w-4" /></Button>
        </div>
        {conv.length >= 4 && (
          <Button onClick={finishAndEvaluate} disabled={evaluating} variant="outline" className="w-full">
            {evaluating && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Finish & evaluate
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
