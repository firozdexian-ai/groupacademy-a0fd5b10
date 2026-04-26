import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";

const JOB_TYPES = ["full_time", "part_time", "contract", "internship", "freelance"] as const;
const EXPERIENCE_LEVELS = ["entry", "junior", "mid", "senior", "lead", "executive"] as const;
const APPLICATION_TYPES = ["internal", "email", "link"] as const;
const SOURCE_PLATFORMS = ["linkedin", "facebook", "indeed", "company_website", "other"] as const;
const CURRENCIES = ["BDT", "USD", "EUR", "GBP", "AED", "SAR", "INR", "SGD"];

export type JobFormState = {
  title: string;
  company_name: string;
  company_logo_url: string;
  location: string;
  job_type: typeof JOB_TYPES[number];
  experience_level: typeof EXPERIENCE_LEVELS[number];
  salary_range_min: string;
  salary_range_max: string;
  salary_currency: string;
  description: string;
  application_type: typeof APPLICATION_TYPES[number];
  application_email: string;
  application_url: string;
  source_platform: typeof SOURCE_PLATFORMS[number];
  source_image_url: string;
  is_active: boolean;
  is_featured: boolean;
  ai_assessment_enabled: boolean;
  vacancies: string;
  deadline: string;
};

export const EMPTY_JOB_FORM: JobFormState = {
  title: "",
  company_name: "",
  company_logo_url: "",
  location: "",
  job_type: "full_time",
  experience_level: "entry",
  salary_range_min: "",
  salary_range_max: "",
  salary_currency: "BDT",
  description: "",
  application_type: "internal",
  application_email: "",
  application_url: "",
  source_platform: "other",
  source_image_url: "",
  is_active: true,
  is_featured: false,
  ai_assessment_enabled: false,
  vacancies: "1",
  deadline: "",
};

interface JobFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId?: string | null;
  initialForm?: Partial<JobFormState>;
  onSaved?: () => void;
}

export function JobFormDialog({ open, onOpenChange, jobId, initialForm, onSaved }: JobFormDialogProps) {
  const [form, setForm] = useState<JobFormState>(EMPTY_JOB_FORM);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const updateField = <K extends keyof JobFormState>(key: K, value: JobFormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Load when opened
  useEffect(() => {
    if (!open) return;
    if (jobId) {
      setLoading(true);
      supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single()
        .then(({ data, error }) => {
          if (error || !data) {
            toast.error("Failed to load job");
            return;
          }
          setForm({
            title: data.title || "",
            company_name: data.company_name || "",
            company_logo_url: data.company_logo_url || "",
            location: data.location || "",
            job_type: (data.job_type as any) || "full_time",
            experience_level: (data.experience_level as any) || "entry",
            salary_range_min: data.salary_range_min?.toString() || "",
            salary_range_max: data.salary_range_max?.toString() || "",
            salary_currency: data.salary_currency || "BDT",
            description: data.description || "",
            application_type: (data.application_type as any) || "internal",
            application_email: data.application_email || "",
            application_url: data.application_url || "",
            source_platform: (data.source_platform as any) || "other",
            source_image_url: data.source_image_url || "",
            is_active: data.is_active ?? true,
            is_featured: data.is_featured ?? false,
            ai_assessment_enabled: data.ai_assessment_enabled ?? false,
            vacancies: data.vacancies?.toString() || "1",
            deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 10) : "",
          });
        })
        .then(() => setLoading(false));
    } else {
      setForm({ ...EMPTY_JOB_FORM, ...(initialForm || {}) });
    }
  }, [open, jobId, initialForm]);

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true);
    try {
      const fileName = `job-logos/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("job-assets").upload(fileName, file);
      if (error) throw error;
      const {
        data: { publicUrl },
      } = supabase.storage.from("job-assets").getPublicUrl(fileName);
      updateField("company_logo_url", publicUrl);
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleEnhanceDescription = async () => {
    if (form.description.length < 30) {
      toast.error("Add at least 30 characters before enhancing");
      return;
    }
    setIsEnhancing(true);
    try {
      const { data, error } = await supabase.functions.invoke("enhance-job-description", {
        body: { title: form.title, company: form.company_name, description: form.description },
      });
      if (error) throw error;
      const enhanced = data?.enhanced || data?.description;
      if (enhanced) {
        updateField("description", enhanced);
        toast.success("Description enhanced");
      } else {
        toast.info("No enhancement returned");
      }
    } catch (err: any) {
      toast.error("AI enhance failed: " + err.message);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.company_name.trim()) {
      toast.error("Title and company are required");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (form.application_type === "email" && !form.application_email) {
      toast.error("Email is required for email applications");
      return;
    }
    if (form.application_type === "link" && !form.application_url) {
      toast.error("URL is required for link applications");
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        title: form.title.trim(),
        company_name: form.company_name.trim(),
        company_logo_url: form.company_logo_url || null,
        location: form.location || null,
        job_type: form.job_type,
        experience_level: form.experience_level,
        salary_range_min: form.salary_range_min ? parseInt(form.salary_range_min) : null,
        salary_range_max: form.salary_range_max ? parseInt(form.salary_range_max) : null,
        salary_currency: form.salary_currency,
        description: form.description,
        application_type: form.application_type,
        application_email: form.application_type === "email" ? form.application_email : null,
        application_url: form.application_type === "link" ? form.application_url : null,
        source_platform: form.source_platform,
        source_image_url: form.source_image_url || null,
        is_active: form.is_active,
        is_featured: form.is_featured,
        ai_assessment_enabled: form.ai_assessment_enabled,
        vacancies: parseInt(form.vacancies) || 1,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      };

      if (jobId) {
        const { error } = await supabase.from("jobs").update(payload).eq("id", jobId);
        if (error) throw error;
        toast.success("Job updated");
      } else {
        const { error } = await supabase.from("jobs").insert(payload);
        if (error) throw error;
        toast.success("Job created");
      }

      onOpenChange(false);
      onSaved?.();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{jobId ? "Edit Job Posting" : "New Job Posting"}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="space-y-5 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => updateField("title", e.target.value)} placeholder="Senior Frontend Developer" />
              </div>
              <div className="space-y-1.5">
                <Label>Company Name *</Label>
                <Input value={form.company_name} onChange={(e) => updateField("company_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => updateField("location", e.target.value)} placeholder="Dhaka, Bangladesh" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-3">
                {form.company_logo_url ? (
                  <div className="relative">
                    <img src={form.company_logo_url} alt="Logo" className="h-14 w-14 rounded-lg object-cover border" />
                    <button
                      onClick={() => updateField("company_logo_url", "")}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="h-14 w-14 border-2 border-dashed border-border rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                    {isUploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])} />
                  </label>
                )}
                <Input
                  value={form.company_logo_url}
                  onChange={(e) => updateField("company_logo_url", e.target.value)}
                  placeholder="…or paste logo URL"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Job Type</Label>
                <Select value={form.job_type} onValueChange={(v) => updateField("job_type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Experience</Label>
                <Select value={form.experience_level} onValueChange={(v) => updateField("experience_level", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPERIENCE_LEVELS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Source Platform</Label>
                <Select value={form.source_platform} onValueChange={(v) => updateField("source_platform", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SOURCE_PLATFORMS.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Salary Min</Label>
                <Input type="number" value={form.salary_range_min} onChange={(e) => updateField("salary_range_min", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Salary Max</Label>
                <Input type="number" value={form.salary_range_max} onChange={(e) => updateField("salary_range_max", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={form.salary_currency} onValueChange={(v) => updateField("salary_currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Description *</Label>
                <Button type="button" variant="ghost" size="sm" onClick={handleEnhanceDescription} disabled={isEnhancing}>
                  {isEnhancing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                  AI Enhance
                </Button>
              </div>
              <Textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={8}
                placeholder="Role responsibilities, requirements, benefits…"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Application Type</Label>
                <Select value={form.application_type} onValueChange={(v) => updateField("application_type", v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{APPLICATION_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {form.application_type === "email" && (
                <div className="space-y-1.5">
                  <Label>Application Email *</Label>
                  <Input type="email" value={form.application_email} onChange={(e) => updateField("application_email", e.target.value)} />
                </div>
              )}
              {form.application_type === "link" && (
                <div className="space-y-1.5">
                  <Label>Application URL *</Label>
                  <Input type="url" placeholder="https://…" value={form.application_url} onChange={(e) => updateField("application_url", e.target.value)} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Vacancies</Label>
                <Input type="number" min="1" value={form.vacancies} onChange={(e) => updateField("vacancies", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={form.deadline} onChange={(e) => updateField("deadline", e.target.value)} />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.is_active} onCheckedChange={(v) => updateField("is_active", v)} />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.is_featured} onCheckedChange={(v) => updateField("is_featured", v)} />
                <span className="text-sm">Featured</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch checked={form.ai_assessment_enabled} onCheckedChange={(v) => updateField("ai_assessment_enabled", v)} />
                <span className="text-sm">AI Assessment</span>
              </label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || loading}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {jobId ? "Save Changes" : "Create Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
