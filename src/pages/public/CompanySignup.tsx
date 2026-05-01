import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { COUNTRIES } from "@/lib/constants/countries";
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Loader2, Sparkles } from "lucide-react";

const FREE_PROVIDERS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com", "proton.me", "protonmail.com", "live.com", "aol.com", "msn.com"];
const INDUSTRIES = ["Technology", "Finance", "Healthcare", "Education", "Manufacturing", "Retail", "Consulting", "Media", "Logistics", "Other"];
const SIZES = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

const step1Schema = z.object({
  full_name: z.string().trim().min(2, "Required").max(120),
  email: z.string().trim().email("Valid work email required").max(160).refine(
    (v) => !FREE_PROVIDERS.includes(v.split("@")[1]?.toLowerCase() ?? ""),
    "Please use your work email (no gmail/yahoo/etc.)"
  ),
  password: z.string().min(8, "Min 8 characters").max(72),
  phone: z.string().trim().min(7, "Include country code, e.g. +1 555 0123").max(20),
});

const step2Schema = z.object({
  company_name: z.string().trim().min(2, "Required").max(120),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  industry: z.string().trim().min(1, "Select industry").max(80),
  company_size: z.string().trim().min(1, "Select size"),
  country: z.string().trim().min(2, "Select country").max(80),
});

interface CompanyMatch {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  logo_url: string | null;
}

export default function CompanySignup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [s1, setS1] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [s2, setS2] = useState({ company_name: "", website: "", industry: "", company_size: "", country: "" });
  const [pickedCompany, setPickedCompany] = useState<CompanyMatch | null>(null);

  const [matches, setMatches] = useState<CompanyMatch[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    document.title = "Create your company workspace | Group Academy";
  }, []);

  // Live company search (debounced)
  useEffect(() => {
    if (pickedCompany) return; // don't search after a pick
    const q = s2.company_name.trim();
    if (q.length < 2) { setMatches([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("companies")
        .select("id, name, website, industry, logo_url")
        .ilike("name", `%${q}%`)
        .limit(5);
      setMatches((data ?? []) as CompanyMatch[]);
      setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [s2.company_name, pickedCompany]);

  const handlePick = (c: CompanyMatch) => {
    setPickedCompany(c);
    setS2((s) => ({
      ...s,
      company_name: c.name,
      website: c.website ?? s.website,
      industry: c.industry ?? s.industry,
    }));
    setMatches([]);
  };

  const clearPick = () => {
    setPickedCompany(null);
    setS2((s) => ({ ...s, company_name: "" }));
  };

  const goStep2 = () => {
    setErrors({});
    const r = step1Schema.safeParse(s1);
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    setStep(2);
  };

  const submit = async () => {
    setErrors({});
    const r = step2Schema.safeParse(s2);
    if (!r.success) {
      const e: Record<string, string> = {};
      r.error.issues.forEach((i) => (e[i.path[0] as string] = i.message));
      setErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("signup-company", {
        body: {
          ...s1,
          email: s1.email.toLowerCase(),
          company_id: pickedCompany?.id ?? null,
          ...s2,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      // Sign the user in with the password they just set
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: s1.email.toLowerCase(),
        password: s1.password,
      });
      if (signErr) {
        toast({
          title: "Account created",
          description: "Sign in with your new credentials to continue.",
        });
        navigate("/auth");
        return;
      }
      toast({
        title: "Welcome aboard!",
        description: "Your workspace is ready with 250 free credits.",
      });
      navigate("/company");
    } catch (e: any) {
      const msg = e?.message ?? "Could not create account";
      toast({ title: "Signup failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const Header = (
    <header className="border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/for-companies" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <Link to="/" className="font-semibold">Group Academy</Link>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-background">
      {Header}
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Create your company workspace</h1>
          <p className="text-sm text-muted-foreground">
            Instant access · 250 free credits · No approval needed
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-4 text-xs">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>

        <Card>
          <CardContent className="p-5 space-y-4">
            {step === 1 && (
              <>
                <h2 className="font-semibold">Step 1 · About you</h2>
                <div>
                  <Label htmlFor="full_name">Full name *</Label>
                  <Input id="full_name" value={s1.full_name} onChange={(e) => setS1({ ...s1, full_name: e.target.value })} />
                  {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Work email *</Label>
                  <Input id="email" type="email" placeholder="you@company.com" value={s1.email} onChange={(e) => setS1({ ...s1, email: e.target.value })} />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input id="password" type="password" placeholder="At least 8 characters" value={s1.password} onChange={(e) => setS1({ ...s1, password: e.target.value })} />
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>
                <div>
                  <Label htmlFor="phone">Phone (with country code) *</Label>
                  <Input id="phone" placeholder="+1 555 0123" value={s1.phone} onChange={(e) => setS1({ ...s1, phone: e.target.value })} />
                  {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
                </div>
                <Button className="w-full" size="lg" onClick={goStep2}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-semibold">Step 2 · About your company</h2>

                {/* Company name + live search */}
                <div className="relative">
                  <Label htmlFor="company_name">Company name *</Label>
                  {pickedCompany ? (
                    <div className="flex items-center justify-between gap-2 p-2 border border-primary/40 bg-primary/5 rounded-md">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium truncate">{pickedCompany.name}</span>
                        <Badge variant="secondary" className="text-[9px]">From our records</Badge>
                      </div>
                      <Button size="sm" variant="ghost" onClick={clearPick}>Change</Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        id="company_name"
                        autoComplete="off"
                        placeholder="Start typing your company name…"
                        value={s2.company_name}
                        onChange={(e) => setS2({ ...s2, company_name: e.target.value })}
                      />
                      {(matches.length > 0 || searching) && (
                        <div className="absolute z-10 left-0 right-0 mt-1 border bg-popover rounded-md shadow-md overflow-hidden">
                          {searching && <div className="px-3 py-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin inline mr-1" /> Searching…</div>}
                          {matches.map((m) => (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => handlePick(m)}
                              className="w-full text-left px-3 py-2 hover:bg-muted flex items-center gap-2 text-sm"
                            >
                              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate">{m.name}</div>
                                {m.website && <div className="text-[11px] text-muted-foreground truncate">{m.website}</div>}
                              </div>
                            </button>
                          ))}
                          {!searching && s2.company_name.trim().length >= 2 && matches.length === 0 && (
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                              No matches — we'll create <strong>{s2.company_name}</strong> as a new company.
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {errors.company_name && <p className="text-xs text-destructive mt-1">{errors.company_name}</p>}
                </div>

                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" placeholder="https://" value={s2.website} onChange={(e) => setS2({ ...s2, website: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="industry">Industry *</Label>
                    <Select value={s2.industry} onValueChange={(v) => setS2({ ...s2, industry: v })}>
                      <SelectTrigger id="industry"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.industry && <p className="text-xs text-destructive mt-1">{errors.industry}</p>}
                  </div>
                  <div>
                    <Label htmlFor="company_size">Size *</Label>
                    <Select value={s2.company_size} onValueChange={(v) => setS2({ ...s2, company_size: v })}>
                      <SelectTrigger id="company_size"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                    {errors.company_size && <p className="text-xs text-destructive mt-1">{errors.company_size}</p>}
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Country *</Label>
                  <Select value={s2.country} onValueChange={(v) => setS2({ ...s2, country: v })}>
                    <SelectTrigger id="country"><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {COUNTRIES.filter((c) => c.code !== "GB").map((c) => (
                        <SelectItem key={c.code} value={c.name}>{c.flag} {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.country && <p className="text-xs text-destructive mt-1">{errors.country}</p>}
                </div>

                <div className="flex items-center gap-2 p-3 rounded-md bg-success/5 border border-success/20 text-xs text-foreground">
                  <Sparkles className="w-4 h-4 text-success shrink-0" />
                  <span>You'll get <strong>250 free credits</strong> + 2 starter AI agents (Recruiter & Growth).</span>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} disabled={submitting}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button className="flex-1" size="lg" onClick={submit} disabled={submitting}>
                    {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating workspace…</> : <>Create workspace <CheckCircle2 className="w-4 h-4 ml-2" /></>}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Already have an account? <Link to="/auth" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
