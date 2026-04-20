import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Map, ShieldCheck, Zap, Compass, Target } from "lucide-react";
import { RoadmapIntakeForm } from "@/components/abroad/RoadmapIntakeForm";
import { Badge } from "@/components/ui/badge";

/**
 * Platform Logic: Global Roadmap Initiator
 * High-fidelity orchestrator for generating 12-month academic trajectory artifacts.
 * 2026 Standard: Executive Logic geometry with reinforced intake telemetry.
 */

export default function StudyAbroadRoadmap() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pb-40 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Executive Header: Protocol Initiation */}
      <header className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/abroad")}
            className="group rounded-xl h-11 pl-3 pr-5 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-primary/5 -ml-3 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-3 transition-transform group-hover:-translate-x-1" />
            Back to Abroad Hub
          </Button>

          <Badge
            variant="outline"
            className="rounded-lg border-primary/20 text-primary font-black uppercase text-[9px] tracking-widest italic px-3 py-1"
          >
            Logic Path v2.6 Active
          </Badge>
        </div>

        <div className="flex items-center gap-6">
          <div className="h-16 w-16 rounded-[28px] bg-primary/10 flex items-center justify-center border-2 border-primary/20 rotate-3 shadow-2xl transition-transform hover:rotate-0 duration-500">
            <Compass className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">Strategic Roadmap</h1>
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.3em] italic">
                12-Month Trajectory Synthesis
              </p>
              <span className="h-1 w-1 rounded-full bg-primary/30" />
              <div className="flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-amber-500 fill-current" />
                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">AI Engine Ready</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Ingestion Node */}
      <div className="relative">
        {/* Visual Decoration: Grid Trace */}
        <div className="absolute -inset-4 bg-muted/5 rounded-[40px] border border-border/40 -z-10" />

        <div className="space-y-8">
          <div className="flex items-center gap-4 px-2">
            <Target className="h-5 w-5 text-primary opacity-40" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Parameter Input Registry</h2>
          </div>

          <div className="bg-card/30 backdrop-blur-sm rounded-[32px] border-2 border-border/40 p-8 shadow-xl">
            <RoadmapIntakeForm />
          </div>
        </div>
      </div>

      {/* Operational Trace Footer */}
      <footer className="pt-10 border-t border-border/10 flex items-center justify-between opacity-30">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] italic">
            Roadmap Logic: Secured Data Ingestion
          </p>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
            Encryption Status: Verified Node
          </p>
        </div>
        <ShieldCheck className="h-6 w-6 text-primary" />
      </footer>
    </div>
  );
}
