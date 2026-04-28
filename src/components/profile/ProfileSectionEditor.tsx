import { useState, useCallback, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExperienceEditor, ExperienceEntry } from "@/components/profile/ExperienceEditor";
import { EducationEditor, EducationEntry } from "@/components/profile/EducationEditor";
import { SkillsEditor } from "@/components/profile/SkillsEditor";
import { Save, Loader2, Plus, X, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Profile Section Orchestrator
 * CTO Reference: Unified ingress node for targeted section synchronization.
 */

type SectionType = "about" | "experience" | "education" | "skills" | "achievements" | "languages" | null;

interface LanguageEntry {
  language: string;
  proficiency: string;
}

interface AchievementEntry {
  title: string;
  issuer: string;
  date: string;
}

interface ProfileSectionEditorProps {
  section: SectionType;
  onClose: () => void;
  onSave: (section: SectionType, data: any) => Promise<void>;
  talent: any;
}

export function ProfileSectionEditor({ section, onClose, onSave, talent }: ProfileSectionEditorProps) {
  const [saving, setSaving] = useState(false);

  // SECTION_REGISTRY: About Protocol
  const [about, setAbout] = useState(talent?.currentStatus || "");

  // SECTION_REGISTRY: Professional Experience Sync
  const safeExp = useMemo(
    () =>
      (talent?.experience || []).map((exp: any) => ({
        company: exp.company || "",
        position: exp.position || exp.title || "",
        startDate: exp.startDate || exp.start_date || "",
        endDate: exp.endDate || exp.end_date || "",
        description: exp.description || "",
      })),
    [talent],
  );
  const [experience, setExperience] = useState<ExperienceEntry[]>(safeExp);

  // SECTION_REGISTRY: Academic Registry Sync
  const safeEdu = useMemo(
    () =>
      (talent?.education || []).map((edu: any) => ({
        institution: edu.institution || "",
        degree: edu.degree || "",
        fieldOfStudy: edu.fieldOfStudy || edu.field || "",
        startYear: edu.startYear || edu.start_year || "",
        endYear: edu.endYear || edu.end_year || "",
      })),
    [talent],
  );
  const [education, setEducation] = useState<EducationEntry[]>(safeEdu);

  // SECTION_REGISTRY: Skill Matrix Sync
  const safeSkills = useMemo(
    () =>
      Array.isArray(talent?.skills)
        ? talent.skills.map((s: any) => (typeof s === "string" ? s : s?.name || String(s)))
        : [],
    [talent],
  );
  const [skills, setSkills] = useState<string[]>(safeSkills);

  // SECTION_REGISTRY: Achievement Artifacts
  const safeAchievements = useMemo(
    () =>
      (talent?.achievements || []).map((a: any) => ({
        title: a.title || a.name || "",
        issuer: a.issuer || "",
        date: a.date || "",
      })),
    [talent],
  );
  const [achievements, setAchievements] = useState<AchievementEntry[]>(safeAchievements);

  // SECTION_REGISTRY: Language Nodes
  const safeLangs = useMemo(
    () =>
      (talent?.languages || []).map((l: any) => ({
        language: l.language || "",
        proficiency: l.proficiency || "Intermediate",
      })),
    [talent],
  );
  const [languages, setLanguages] = useState<LanguageEntry[]>(safeLangs);

  const handleExecutiveSave = useCallback(async () => {
    setSaving(true);
    try {
      let syncPayload: any;
      switch (section) {
        case "about":
          syncPayload = { currentStatus: about };
          break;
        case "experience":
          syncPayload = { experience };
          break;
        case "education":
          syncPayload = { education };
          break;
        case "skills":
          syncPayload = { skills };
          break;
        case "achievements":
          syncPayload = { achievements };
          break;
        case "languages":
          syncPayload = { languages };
          break;
      }
      await onSave(section, syncPayload);
      onClose();
    } catch (err) {
      console.error("[Registry Sync Fault]:", err);
    } finally {
      setSaving(false);
    }
  }, [section, about, experience, education, skills, achievements, languages, onSave, onClose]);

  const sectionMeta: Record<string, { title: string; icon: any }> = {
    about: { title: "ABOUT_SYNC", icon: ShieldCheck },
    experience: { title: "EXPERIENCE_REGISTRY", icon: Zap },
    education: { title: "ACADEMIC_LEDGER", icon: Zap },
    skills: { title: "SKILL_MATRIX", icon: Zap },
    achievements: { title: "ACHIEVEMENT_ARTIFACTS", icon: ShieldCheck },
    languages: { title: "COMMUNICATION_NODES", icon: ShieldCheck },
  };

  return (
    <Sheet open={!!section} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[90vh] rounded-t-[32px] border-t-4 border-primary/20 bg-background/95 backdrop-blur-xl flex flex-col p-8"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
            {section && sectionMeta[section]?.icon && (
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                {/* Dynamically rendered icon node */}
                {(() => {
                  const IconNode = sectionMeta[section].icon;
                  return <IconNode className="h-5 w-5" />;
                })()}
              </div>
            )}
            {section ? sectionMeta[section]?.title : "INITIALIZING_NODE"}
          </SheetTitle>
          <SheetDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground italic">
            Synchronizing identity node with global talent registry
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide space-y-6">
          {section === "about" && (
            <div className="space-y-3 animate-in fade-in duration-500">
              <Label className="text-[10px] font-black uppercase italic text-primary ml-1">Professional_Bio</Label>
              <Textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="Synchronize your professional narrative..."
                className="min-h-[200px] rounded-2xl border-2 font-medium italic bg-muted/5 resize-none p-5"
              />
            </div>
          )}

          {section === "experience" && <ExperienceEditor experience={experience} onChange={setExperience} />}
          {section === "education" && <EducationEditor education={education} onChange={setEducation} />}
          {section === "skills" && <SkillsEditor skills={skills} onChange={setSkills} />}

          {section === "achievements" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase italic text-primary">Honors_&_Certificates</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAchievements((p) => [...p, { title: "", issuer: "", date: "" }])}
                  className="rounded-xl border-2 font-black italic text-[9px] gap-2"
                >
                  <Plus className="h-3 w-3" /> ADD_NODE
                </Button>
              </div>
              {achievements.map((award, i) => (
                <div
                  key={i}
                  className="group relative border-2 border-border/40 bg-card/30 rounded-[24px] p-6 space-y-4 hover:border-primary/20 transition-all"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                    onClick={() => setAchievements((p) => p.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase opacity-40">Artifact_Title</Label>
                    <Input
                      value={award.title}
                      onChange={(e) =>
                        setAchievements((p) => p.map((a, idx) => (idx === i ? { ...a, title: e.target.value } : a)))
                      }
                      className="h-11 rounded-xl border-2 font-bold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase opacity-40">Issuer</Label>
                      <Input
                        value={award.issuer}
                        onChange={(e) =>
                          setAchievements((p) => p.map((a, idx) => (idx === i ? { ...a, issuer: e.target.value } : a)))
                        }
                        className="h-11 rounded-xl border-2 font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase opacity-40">Sync_Date</Label>
                      <Input
                        value={award.date}
                        onChange={(e) =>
                          setAchievements((p) => p.map((a, idx) => (idx === i ? { ...a, date: e.target.value } : a)))
                        }
                        className="h-11 rounded-xl border-2 font-bold"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {section === "languages" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase italic text-primary">Communication_Protocols</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLanguages((p) => [...p, { language: "", proficiency: "Intermediate" }])}
                  className="rounded-xl border-2 font-black italic text-[9px] gap-2"
                >
                  <Plus className="h-3 w-3" /> ADD_PROTO
                </Button>
              </div>
              {languages.map((lang, i) => (
                <div key={i} className="flex items-center gap-3 animate-in slide-in-from-left-2">
                  <Input
                    className="h-12 rounded-xl border-2 font-bold flex-1"
                    value={lang.language}
                    onChange={(e) =>
                      setLanguages((p) => p.map((l, idx) => (idx === i ? { ...l, language: e.target.value } : l)))
                    }
                    placeholder="Protocol Type (e.g. English)"
                  />
                  <Select
                    value={lang.proficiency}
                    onValueChange={(val) =>
                      setLanguages((p) => p.map((l, idx) => (idx === i ? { ...l, proficiency: val } : l)))
                    }
                  >
                    <SelectTrigger className="h-12 w-40 rounded-xl border-2 font-black text-[10px] uppercase">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl font-black text-[10px] uppercase">
                      <SelectItem value="Native">Native</SelectItem>
                      <SelectItem value="Fluent">Fluent</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-xl text-destructive"
                    onClick={() => setLanguages((p) => p.filter((_, idx) => idx !== i))}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EXECUTIVE_SAVE_BAR */}
        <div className="shrink-0 pt-6 mt-4 border-t-2 border-border/10 flex gap-4">
          <Button
            variant="ghost"
            className="flex-1 h-14 rounded-2xl font-black uppercase italic text-[11px] tracking-widest text-muted-foreground hover:bg-muted/10"
            onClick={onClose}
            disabled={saving}
          >
            Abort_Changes
          </Button>
          <Button
            className={cn(
              "flex-[2] h-14 rounded-2xl font-black uppercase italic text-[11px] tracking-widest gap-3 shadow-2xl transition-all active:scale-95",
            )}
            onClick={handleExecutiveSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {saving ? "SYNCING_LEDGER..." : "AUTHORIZE_SYNC"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
