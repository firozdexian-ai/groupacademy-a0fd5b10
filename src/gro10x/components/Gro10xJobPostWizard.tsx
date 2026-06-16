import * as React from "react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useGro10xCompanyId } from "../hooks/useGro10xCompanyId";
import { employerJobsQueryKey } from "../hooks/useEmployerJobsDashboard";
import { GRO10X_PANEL, GRO10X_MUTED } from "../lib/tokens";
import { X, Loader2, Plus, Briefcase } from "lucide-react";
import { toast } from "sonner";
import { getCompanyNameAndLogo } from "@/domains/companies/repo/companiesRepo";
import { insertJobReturningId, updateJob } from "@/domains/jobs/repo/jobsRepo";
import { supabase } from "@/lib/supabase";

interface Props {
  open: boolean;
  onClose: () => void;
  job?: any; // If provided, wizard is in Edit Mode
}

interface FormState {
  title: string;
  description: string;
  location: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  vacancies: string;
  requirements: string; // newline-separated
  job_type: "full_time" | "part_time" | "contract" | "internship" | "freelance";
  experience_level: "entry" | "mid" | "senior" | "lead";
  publish: boolean;
  application_deadline: string; // YYYY-MM-DD
  profession_category_id: string;
  skills: string; // comma-separated
  application_type: "email" | "external";
  application_email: string;
}

const EMPTY: FormState = {
  title: "",
  description: "",
  location: "",
  salary_min: "",
  salary_max: "",
  salary_currency: "BDT",
  vacancies: "1",
  requirements: "",
  job_type: "full_time",
  experience_level: "mid",
  publish: false,
  application_deadline: "",
  profession_category_id: "",
  skills: "",
  application_type: "email",
  application_email: "",
};

/**
 * Manual "Post / Edit a Job" wizard for employers — bypasses chat.
 */
export default function Gro10xJobPostWizard({ open, onClose, job }: Props) {
  const { user } = useAuth();
  const { data: companyId } = useGro10xCompanyId();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // Load profession categories
  React.useEffect(() => {
    if (!open) return;
    supabase
      .from("profession_categories")
      .select("id, name")
      .order("name", { ascending: true })
      .then(({ data }) => {
        if (data) setCategories(data);
      });
  }, [open]);

  // Load editing job details if present
  React.useEffect(() => {
    if (open && job) {
      setForm({
        title: job.title || "",
        description: job.description || "",
        location: job.location || "",
        salary_min: job.salary_range_min ? String(job.salary_range_min) : "",
        salary_max: job.salary_range_max ? String(job.salary_range_max) : "",
        salary_currency: job.salary_currency || "BDT",
        vacancies: String(job.vacancies || 1),
        requirements: Array.isArray(job.requirements) ? job.requirements.join("\n") : "",
        job_type: job.job_type || "full_time",
        experience_level: job.experience_level || "mid",
        publish: job.is_active || false,
        application_deadline: job.deadline ? job.deadline.split("T")[0] : "",
        profession_category_id: job.profession_category_id || "",
        skills: Array.isArray(job.skills) ? job.skills.join(", ") : "",
        application_type: job.application_type || "email",
        application_email: job.application_email || "",
      });
    } else if (open) {
      setForm(EMPTY);
    }
  }, [job, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("No active company workspace.");
      if (form.title.trim().length < 4) throw new Error("Title must be at least 4 characters.");
      if (form.description.trim().length < 80) throw new Error("Description must be at least 80 characters.");

      const salaryMin = form.salary_min ? parseFloat(form.salary_min.replace(/,/g, "")) : null;
      const salaryMax = form.salary_max ? parseFloat(form.salary_max.replace(/,/g, "")) : null;

      if (salaryMin !== null && isNaN(salaryMin)) throw new Error("Minimum salary must be a valid number.");
      if (salaryMax !== null && isNaN(salaryMax)) throw new Error("Maximum salary must be a valid number.");
      if (salaryMin !== null && salaryMax !== null && salaryMin > salaryMax) {
        throw new Error("Minimum salary cannot exceed maximum salary.");
      }

      if (form.application_deadline) {
        const deadlineDate = new Date(form.application_deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deadlineDate <= today) {
          throw new Error("Application deadline must be in the future.");
        }
      }

      if (form.application_type === "email" && form.application_email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(form.application_email.trim())) {
          throw new Error("Please enter a valid application email.");
        }
      }

      // Resolve company name
      const co = await getCompanyNameAndLogo(companyId);

      const reqs = form.requirements
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      const skillsArr = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: any = {
        company_id: companyId,
        company_name: co?.name ?? "Company",
        company_logo_url: co?.logo_url ?? null,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim() || null,
        requirements: reqs,
        skills: skillsArr,
        job_type: form.job_type,
        experience_level: form.experience_level,
        vacancies: Math.max(1, parseInt(form.vacancies || "1", 10)),
        salary_currency: form.salary_currency || "BDT",
        salary_range_min: salaryMin,
        salary_range_max: salaryMax,
        is_active: form.publish,
        posted_by: user?.id ?? null,
        job_kind: "employer",
        application_type: form.application_type,
        application_email: form.application_email.trim() || null,
        deadline: form.application_deadline ? new Date(form.application_deadline).toISOString() : null,
        profession_category_id: form.profession_category_id || null,
      };

      if (job?.id) {
        await updateJob(job.id, payload);
        return job.id;
      } else {
        return await insertJobReturningId(payload);
      }
    },
    onSuccess: () => {
      toast.success(job ? "Job updated" : (form.publish ? "Job published" : "Draft saved"));
      qc.invalidateQueries({ queryKey: employerJobsQueryKey(companyId) });
      setForm(EMPTY);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? "Failed to save job");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div
        className={`${GRO10X_PANEL} border border-white/10 w-full md:max-w-xl rounded-t-3xl md:rounded-3xl max-h-[92vh] overflow-y-auto`}
      >
        <header className="sticky top-0 z-10 bg-[#0B1220]/95 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-[#33E1E4]" />
            <h2 className="text-sm font-semibold">{job ? "Edit Job" : "Post a Job"}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 bg-white/5 hover:bg-white/10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form
          className="p-4 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <Field label="Title">
            <input
              required
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className={inputCls}
            />
          </Field>

          <Field label="Description">
            <textarea
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
              placeholder="Role overview, responsibilities, what you're looking for…"
              className={inputCls}
            />
          </Field>

          <Field
            label="Requirements"
            hint="One per line — stored as a JSON list"
          >
            <textarea
              value={form.requirements}
              onChange={(e) => set("requirements", e.target.value)}
              rows={3}
              placeholder={"5+ years React\nTypeScript fluency\nRemote-friendly"}
              className={inputCls}
            />
          </Field>

          <Field
            label="Skills"
            hint="Comma-separated tags — e.g. React, TypeScript, GraphQL"
          >
            <input
              value={form.skills}
              onChange={(e) => set("skills", e.target.value)}
              placeholder="React, TypeScript, Tailwind"
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Profession Category">
              <select
                value={form.profession_category_id}
                onChange={(e) => set("profession_category_id", e.target.value)}
                className={inputCls}
              >
                <option value="">Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Application Deadline">
              <input
                type="date"
                value={form.application_deadline}
                onChange={(e) => set("application_deadline", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Remote · Dhaka · …"
                className={inputCls}
              />
            </Field>
            <Field label="Vacancies">
              <input
                type="number"
                min={1}
                value={form.vacancies}
                onChange={(e) => set("vacancies", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Min salary">
              <input
                type="text"
                value={form.salary_min}
                onChange={(e) => set("salary_min", e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </Field>
            <Field label="Max salary">
              <input
                type="text"
                value={form.salary_max}
                onChange={(e) => set("salary_max", e.target.value)}
                placeholder="0"
                className={inputCls}
              />
            </Field>
            <Field label="Currency">
              <select
                value={form.salary_currency}
                onChange={(e) => set("salary_currency", e.target.value)}
                className={inputCls}
              >
                <option value="BDT">BDT</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={form.job_type}
                onChange={(e) => set("job_type", e.target.value as FormState["job_type"])}
                className={inputCls}
              >
                <option value="full_time">Full-time</option>
                <option value="part_time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
                <option value="freelance">Freelance</option>
              </select>
            </Field>
            <Field label="Experience">
              <select
                value={form.experience_level}
                onChange={(e) =>
                  set("experience_level", e.target.value as FormState["experience_level"])
                }
                className={inputCls}
              >
                <option value="entry">Entry</option>
                <option value="mid">Mid</option>
                <option value="senior">Senior</option>
                <option value="lead">Lead</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Application Type">
              <select
                value={form.application_type}
                onChange={(e) => set("application_type", e.target.value as FormState["application_type"])}
                className={inputCls}
              >
                <option value="email">Email</option>
                <option value="external">External Link</option>
              </select>
            </Field>
            <Field label={form.application_type === "email" ? "Application Email" : "Application Link"}>
              <input
                value={form.application_email}
                onChange={(e) => set("application_email", e.target.value)}
                placeholder={form.application_type === "email" ? "recruiter@company.com" : "https://company.com/apply"}
                className={inputCls}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.publish}
              onChange={(e) => set("publish", e.target.checked)}
              className="h-4 w-4 rounded accent-[#33E1E4]"
            />
            Publish immediately (otherwise saved as draft)
          </label>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs bg-white/5 border border-white/10 text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !companyId}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#33E1E4] text-[#06121A] px-5 py-2 text-xs font-semibold disabled:opacity-50 cursor-pointer"
            >
              {mutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : null}
              {job ? "Save changes" : (form.publish ? "Publish job" : "Save draft")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#33E1E4]/60";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-300 mb-1">{label}</label>
      {children}
      {hint && <p className={`text-[10px] mt-1 ${GRO10X_MUTED}`}>{hint}</p>}
    </div>
  );
}
