import { useState, KeyboardEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Sparkles, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Skill Matrix Ingress
 * CTO Reference: Authoritative node for technical skill registry and AI vectoring.
 */

interface SkillsEditorProps {
  skills: string[];
  onChange: (skills: string[]) => void;
}

export function SkillsEditor({ skills, onChange }: SkillsEditorProps) {
  const [skillList, setSkillList] = useState<string[]>(skills || []);
  const [inputValue, setInputValue] = useState("");

  // HYDRATION: Sync local state with incoming registry updates
  useEffect(() => {
    setSkillList(skills || []);
  }, [skills]);

  const addSkillNode = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed && !skillList.includes(trimmed)) {
      const updated = [...skillList, trimmed];
      setSkillList(updated);
      onChange(updated);
      setInputValue("");
    }
  };

  const removeSkillNode = (skillToRemove: string) => {
    const updated = skillList.filter((skill) => skill !== skillToRemove);
    setSkillList(updated);
    onChange(updated);
  };

  const handleTerminalInput = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkillNode();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      {/* HEADER SECTION */}
      <div className="space-y-1">
        <Label className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-3">
          <Target className="h-6 w-6 text-primary" />
          Skill_Matrix
        </Label>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
          Initialize match-vectors for neural job matching
        </p>
      </div>

      {/* INPUT NODE */}
      <div className="flex gap-3">
        <div className="relative flex-1 group">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleTerminalInput}
            placeholder="INPUT_SKILL_ID (E.G. REACT, PYTHON...)"
            className="h-12 rounded-xl border-2 font-bold bg-background/50 pl-11 placeholder:text-muted-foreground/20 focus-visible:ring-primary/20"
          />
          <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={addSkillNode}
          className="h-12 w-12 rounded-xl border-2 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-lg active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* TAG REGISTRY */}
      <div className="min-h-[100px] p-5 rounded-[24px] border-2 border-dashed border-border/40 bg-muted/5">
        {skillList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-40">
            <Sparkles className="h-6 w-6" />
            <p className="text-[10px] font-black uppercase tracking-widest italic text-center">Matrix_Awaiting_Data</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {skillList.map((skill, index) => (
              <Badge
                key={`${skill}-${index}`}
                variant="secondary"
                className={cn(
                  "pl-4 pr-1.5 py-1.5 flex items-center gap-2 rounded-xl border-2 transition-all duration-300",
                  "bg-primary/5 border-primary/10 text-primary font-black italic text-[10px] uppercase tracking-tighter",
                  "hover:border-primary/40 hover:scale-105",
                )}
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkillNode(skill)}
                  className="ml-1 h-6 w-6 flex items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-destructive hover:text-white transition-all active:scale-90"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER INTELLIGENCE */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-wide">
          <span className="text-primary italic">Executive Guidance:</span> Add technical proficiencies and soft skills
          to optimize your neural visibility to potential institutional partners.
        </p>
      </div>
    </div>
  );
}
