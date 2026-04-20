import * as React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, AlertCircle, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Kinetic Synthesis Protocol
 * High-fidelity feedback node for heavy asynchronous data handshakes and AI generation.
 */
export interface ProcessingStage {
  progress: number;
  message: string;
}

interface ProcessingCardProps {
  title: string;
  stages: ProcessingStage[];
  /** Duration in ms to complete all stages (default: 30000) */
  duration?: number;
  /** Show error state with retry */
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function ProcessingCard({ title, stages, duration = 30000, error, onRetry, className }: ProcessingCardProps) {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(stages[0]?.message || "Initializing Logic...");

  useEffect(() => {
    if (error) return;

    const sortedStages = [...stages].sort((a, b) => a.progress - b.progress);
    const intervalTime = duration / 100;

    const interval = setInterval(() => {
      setCurrentProgress((prev) => {
        const next = Math.min(prev + 1, 99);

        const currentStage = sortedStages.filter((s) => s.progress <= next).pop();

        if (currentStage) {
          setCurrentMessage(currentStage.message);
        }

        return next;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [stages, duration, error]);

  // Fault Recovery State
  if (error) {
    return (
      <Card
        className={cn(
          "max-w-md mx-auto rounded-[40px] border-2 border-dashed border-destructive/20 bg-destructive/[0.02] animate-in fade-in zoom-in-95 duration-500",
          className,
        )}
      >
        <CardContent className="py-16 text-center space-y-6">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 bg-destructive/10 rounded-[28px] rotate-6 animate-pulse" />
            <div className="absolute inset-0 bg-background border border-destructive/20 rounded-[28px] flex items-center justify-center shadow-xl">
              <AlertCircle className="w-10 h-10 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tighter uppercase">Synthesis Failed</h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 italic px-4">
              {error}
            </p>
          </div>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-destructive hover:bg-destructive/90 text-white shadow-lg shadow-destructive/20 transition-all active:scale-[0.97]"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Re-initialize Sequence
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "max-w-md mx-auto rounded-[40px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700",
        className,
      )}
    >
      <CardContent className="py-16 text-center">
        {/* Kinetic Telemetry Hub */}
        <div className="relative w-24 h-24 mx-auto mb-10">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-primary/10"
            />
            <circle
              cx="48"
              cy="48"
              r="44"
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray={276}
              strokeDashoffset={276 - (276 * currentProgress) / 100}
              strokeLinecap="round"
              className="text-primary transition-all duration-500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-black tracking-tighter text-primary">{currentProgress}%</span>
            <span className="text-[7px] font-black uppercase tracking-widest opacity-40">Sync</span>
          </div>
        </div>

        <div className="space-y-3 mb-10">
          <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">{title}</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 italic">
            {currentMessage}
          </p>
        </div>

        <div className="px-6 space-y-6">
          <Progress value={currentProgress} className="h-1.5 bg-primary/10" />

          <div className="bg-muted/30 rounded-2xl p-4 flex items-center justify-center gap-3 border border-border/10">
            <div className="relative">
              <Sparkles className="h-4 w-4 text-primary animate-pulse" />
              <div className="absolute inset-0 bg-primary/20 blur-lg animate-pulse" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Logic Engine: <span className="text-primary">Active Synthesis</span>
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
