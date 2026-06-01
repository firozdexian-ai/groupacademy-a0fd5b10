/**
 * GroUp Academy: Job Preferences Configuration Sheet
 * CTO Reference: Authoritative constraint configuration sheet mapping profile parameters.
 * Version: Launch Candidate · Phase Z0 Hardened
 * Enhancements: Performance optimization, jargon sweep, uniform telemetry signatures.
 */

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { toast } from "sonner";
import { listActiveJobLocations } from "@/domains/jobs/repo/jobsRepo";
import { getTalentJobPreferences, updateTalentJobPreferences } from "@/domains/talent/repo/talentRepo";
import { useTalent } from "@/hooks/useTalent";
import type { Json } from "@/integrations/supabase/types";
import { JOB_TYPES } from "@/lib/constants/jobTypes";
import { Badge } from "@/components/ui/badge";
import { Zap, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface JobPreferences {
  preferred_job_types: string[];
  preferred_locations: string[];
  salary_min: number | null;
  salary_max: number | null;
  industries: string[];
}

const JOB_TYPE_REGISTRY = Object.entries(JOB_TYPES).map(([value, config]) => ({
  value,
  label: config.label,
}));

export function JobPreferencesSheet({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const queryClient = useQueryClient();
  const { talent } = useTalent();
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<JobPreferences>({
    preferred_job_types: [],
    preferred_locations: [],
    salary_min: null,
    salary_max: null,
    industries: [],
  });

  // Monitor layout lifecycle parameters over active analytical telemetry paths safely
  useEffect(() => {
    if (open && talent?.id) {
      trackEvent("job_preferences_sheet_opened", { talentId: talent.id });
    }
  }, [open, talent?.id]);

  // Load active, canonical locations dynamically via core repository infrastructure
  const { data: activeLocations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ["active-job-locations"],
    staleTime: 1000 * 60 * 15,
    enabled: open,
    queryFn: async () => {
      return await listActiveJobLocations();
    },
  });

  useEffect(() => {
    if (open && talent?.id) {
      loadUserPreferences();
    }
  }, [open, talent?.id]);

  const loadUserPreferences = async () => {
    if (!talent?.id) return;
    try {
      const prefs = await getTalentJobPreferences(talent.id);
      if (prefs) {
        setPreferences(prefs as unknown as JobPreferences);
        trackEvent("job_preferences_load_success", { talentId: talent.id });
      }
    } catch (err: any) {
      trackError(err, {
        component: "JobPreferencesSheet",
        action: "load_user_preferences",
        talentId: talent.id,
      });
    }
  };

  const handleSavePreferences = async () => {
    if (!talent?.id) return;

    setSaving(true);
    const toastId = toast.loading("Saving your preferences…");

    trackEvent("job_preferences_save_requested", { talentId: talent.id });

    try {
      await updateTalentJobPreferences(talent.id, preferences as unknown as Json);

      trackEvent("job_preferences_save_success", { talentId: talent.id });

      // Synchronize data cache pools instantly across adjacent views to guarantee Automated Efficiency
      queryClient.invalidateQueries({ queryKey: ["gig-matches-for-you", talent.id] });
      queryClient.invalidateQueries({ queryKey: ["ranked-jobs", talent.id] });
      queryClient.invalidateQueries({ queryKey: ["talent-profile", talent.id] });

      toast.success("Preferences saved", { id: toastId });

      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      trackError(errorMsg, {
        component: "JobPreferencesSheet",
        action: "save_preferences_submit",
        talentId: talent.id,
      });

      toast.error("Couldn't save your preferences. Please try again.", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePreferenceOption = (key: keyof JobPreferences, valueStr: string) => {
    if (!valueStr) return;
    setPreferences((prev) => {
      const list = (prev[key] as string[]) || [];
      const updatedList = list.includes(valueStr) ? list.filter((v) => v !== valueStr) : [...list, valueStr];

      return {
        ...prev,
        [key]: updatedList,
      };
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!saving) {
          onOpenChange(v);
          if (!v) trackEvent("job_preferences_sheet_dismissed", { talentId: talent?.id });
        }
      }}
    >
      <SheetContent
        side="right"
        className="overflow-y-auto w-full sm:max-w-md rounded-t-3xl sm:rounded-t-none sm:rounded-l-2xl border-l border-border/40 bg-background/98 backdrop-blur-xl p-0 flex flex-col h-full max-h-[100vh] max-h-[100svh] transform-gpu shadow-2xl transition-all duration-300 antialiased select-none sm:select-text"
        style={{ contentVisibility: "auto" }}
      >
        <div className="p-5 sm:p-6 border-b border-border/20 bg-primary/5 shrink-0 w-full text-left">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3.5 w-full min-w-0">
              <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/5 flex items-center justify-center shrink-0 shadow-sm">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <SheetTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  Job preferences
                </SheetTitle>
                <SheetDescription className="text-xs font-medium text-muted-foreground/80 mt-0.5 truncate">
                  Tell us what kinds of roles you want.
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-left w-full min-w-0 pb-32">
          {/* Job type configuration section */}
          <div className="space-y-2 w-full min-w-0">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Job type
            </Label>
            <div className="grid grid-cols-1 gap-2 w-full select-none">
              {JOB_TYPE_REGISTRY.map((typeItem) => {
                const isChecked = (preferences.preferred_job_types || []).includes(typeItem.value);
                return (
                  <label
                    key={typeItem.value}
                    className={cn(
                      "flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all duration-200 transform-gpu bg-background/40 hover:bg-background/80 shadow-sm",
                      isChecked
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-border/40 hover:border-border/60",
                    )}
                  >
                    <span className="text-xs font-bold text-foreground/90 tracking-tight uppercase select-none">
                      {typeItem.label}
                    </span>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => handleTogglePreferenceOption("preferred_job_types", typeItem.value)}
                      disabled={saving}
                      className="h-4.5 w-4.5 rounded-md border-border/60 transition-transform active:scale-90 shadow-sm shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Preferred Locations option section */}
          <div className="space-y-2 w-full min-w-0">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Preferred locations
            </Label>
            {loadingLocations ? (
              <div className="space-y-2 p-1 w-full select-none animate-pulse">
                <Skeleton className="h-10 w-full rounded-xl opacity-60" />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5 w-full select-none pt-0.5">
                {activeLocations.map((locationStringItem) => {
                  if (!locationStringItem) return null;
                  const isLocSelected = (preferences.preferred_locations || []).includes(locationStringItem);
                  return (
                    <Badge
                      key={locationStringItem}
                      variant={isLocSelected ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer px-3 h-7 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all border shadow-sm select-none shrink-0",
                        isLocSelected
                          ? "bg-primary border-transparent text-primary-foreground font-extrabold"
                          : "border-border/40 text-muted-foreground bg-background/50 hover:border-primary/20",
                      )}
                      onClick={() => {
                        if (!saving) handleTogglePreferenceOption("preferred_locations", locationStringItem);
                      }}
                    >
                      <span>{locationStringItem}</span>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Target Salary Bounds Section */}
          <div className="space-y-3.5 pt-3 border-t border-border/10 w-full min-w-0">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Salary range
            </Label>

            <div className="grid grid-cols-2 gap-4 w-full tabular-nums text-left font-semibold">
              <div className="space-y-1 w-full min-w-0 text-left">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 block">
                  Minimum
                </span>
                <Input
                  type="number"
                  placeholder="E.g. 50000"
                  min={0}
                  step={5000}
                  value={preferences.salary_min || ""}
                  disabled={saving}
                  className="h-10 bg-background/40 border border-border/40 rounded-xl font-bold text-xs sm:text-sm tracking-tight focus-visible:ring-1 focus-visible:ring-ring text-foreground/90 tabular-nums p-3 shadow-sm select-text w-full"
                  onChange={(e) => setPreferences((p) => ({ ...p, salary_min: parseInt(e.target.value) || null }))}
                />
              </div>
              <div className="space-y-1 w-full min-w-0 text-left">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 block">
                  Maximum
                </span>
                <Input
                  type="number"
                  placeholder="E.g. 120000"
                  min={0}
                  step={5000}
                  value={preferences.salary_max || ""}
                  disabled={saving}
                  className="h-10 bg-background/40 border border-border/40 rounded-xl font-bold text-xs sm:text-sm tracking-tight focus-visible:ring-1 focus-visible:ring-ring text-foreground/90 tabular-nums p-3 shadow-sm select-text w-full"
                  onChange={(e) => setPreferences((p) => ({ ...p, salary_max: parseInt(e.target.value) || null }))}
                />
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 bg-muted/20 border border-border/10 rounded-xl shadow-inner w-full">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0 opacity-70 mt-0.5" />
              <p className="text-xs font-medium leading-normal text-muted-foreground/80 flex-1 pr-1">
                Salaries are auto-converted between BDT and USD when matching jobs.
              </p>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 border-t border-border/20 bg-background/70 backdrop-blur-xl shrink-0 w-full pb-safe-bottom">
          <Button
            size="default"
            onClick={handleSavePreferences}
            className="w-full h-11 rounded-xl font-bold text-sm shadow-md gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Save preferences</span>
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
