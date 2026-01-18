import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Briefcase, Calendar } from "lucide-react";

export interface ExperienceEntry {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ExperienceEditorProps {
  experience: ExperienceEntry[];
  onChange: (experience: ExperienceEntry[]) => void;
}

export function ExperienceEditor({ experience, onChange }: ExperienceEditorProps) {
  const [entries, setEntries] = useState<ExperienceEntry[]>(experience.length > 0 ? experience : []);

  // Sync state with props (Critical fix for CV parsing)
  useEffect(() => {
    setEntries(experience);
  }, [experience]);

  const addEntry = () => {
    const newEntry: ExperienceEntry = {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    const updated = [newEntry, ...entries]; // Add to top
    setEntries(updated);
    onChange(updated);
  };

  const removeEntry = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    onChange(updated);
  };

  const updateEntry = (index: number, field: keyof ExperienceEntry, value: string) => {
    const updated = entries.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry));
    setEntries(updated);
    onChange(updated);
  };

  const toggleCurrentRole = (index: number, isCurrent: boolean) => {
    updateEntry(index, "endDate", isCurrent ? "Present" : "");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          Work Experience
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={addEntry} className="h-8">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Position
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/30">
          <Briefcase className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">No experience added yet.</p>
          <Button variant="link" onClick={addEntry} className="h-auto p-0 text-sm mt-1">
            Add your first role
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry, index) => {
            const isCurrent = entry.endDate?.toLowerCase() === "present";

            return (
              <Card key={index} className="relative group hover:border-primary/50 transition-colors">
                <CardContent className="pt-5 space-y-4">
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEntry(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`exp-position-${index}`} className="text-xs font-medium">
                          Job Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`exp-position-${index}`}
                          value={entry.position}
                          onChange={(e) => updateEntry(index, "position", e.target.value)}
                          placeholder="e.g. Senior Software Engineer"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`exp-company-${index}`} className="text-xs font-medium">
                          Company <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`exp-company-${index}`}
                          value={entry.company}
                          onChange={(e) => updateEntry(index, "company", e.target.value)}
                          placeholder="e.g. Acme Corp"
                          className="h-9"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`exp-start-${index}`} className="text-xs font-medium flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> Start Date
                        </Label>
                        <Input
                          id={`exp-start-${index}`}
                          value={entry.startDate}
                          onChange={(e) => updateEntry(index, "startDate", e.target.value)}
                          placeholder="e.g. Jan 2020"
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`exp-end-${index}`} className="text-xs font-medium flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> End Date
                          </Label>
                          <div className="flex items-center gap-1.5">
                            <Checkbox
                              id={`current-${index}`}
                              checked={isCurrent}
                              onCheckedChange={(checked) => toggleCurrentRole(index, checked as boolean)}
                              className="h-3.5 w-3.5"
                            />
                            <Label
                              htmlFor={`current-${index}`}
                              className="text-[10px] font-normal cursor-pointer text-muted-foreground"
                            >
                              Current Role
                            </Label>
                          </div>
                        </div>
                        <Input
                          id={`exp-end-${index}`}
                          value={entry.endDate}
                          onChange={(e) => updateEntry(index, "endDate", e.target.value)}
                          placeholder="e.g. Dec 2022"
                          className="h-9"
                          disabled={isCurrent}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`exp-desc-${index}`} className="text-xs font-medium">
                        Key Responsibilities & Achievements
                      </Label>
                      <Textarea
                        id={`exp-desc-${index}`}
                        value={entry.description}
                        onChange={(e) => updateEntry(index, "description", e.target.value)}
                        placeholder="• Led a team of 5 developers&#10;• Increased system performance by 20%"
                        className="min-h-[80px] text-sm resize-y"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
