import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listCompaniesPaged,
  insertCompany,
  upsertCompany,
  deleteCompany,
  getIndustryRollup,
  countCompaniesWithNullIndustry,
  getCompaniesOverview,
  CompanyRow,
} from "@/domains/companies/repo/companiesRepo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  Plus,
  Building2,
  Trash2,
  Edit,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Activity,
  Globe,
  ExternalLink,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { DashboardTableSkeleton } from "@/platform/admin/chrome/DashboardSkeleton";
import StatsCard from "@/platform/admin/ui/StatsCard";
import { cn } from "@/lib/utils";
import { BatchCompanyUpload } from "./BatchCompanyUpload";

const ITEMS_PER_PAGE = 10;

interface CompanyFormValues {
  name: string;
  slug: string;
  tagline: string;
  about: string;
  logo_url: string;
  banner_url: string;
  website: string;
  industry: string;
  primary_email: string;
  country: string;
  profile_completion: number;
  verification_tier: string;
}

const DEFAULT_FORM_VALUES: CompanyFormValues = {
  name: "",
  slug: "",
  tagline: "",
  about: "",
  logo_url: "",
  banner_url: "",
  website: "",
  industry: "",
  primary_email: "",
  country: "",
  profile_completion: 50,
  verification_tier: "none",
};

export function CompaniesTab() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");

  // Dialog & Slideover States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<CompanyRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyRow | null>(null);

  // Form Fields State
  const [formValues, setFormValues] = useState<CompanyFormValues>(DEFAULT_FORM_VALUES);
  const [autoSlug, setAutoSlug] = useState(true);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  // Query: Paginated Companies List
  const {
    data: companyData,
    isLoading: loadingList,
    refetch: refetchList,
    isFetching: fetchingList,
  } = useQuery({
    queryKey: ["companies-list", search, industryFilter, page],
    queryFn: () =>
      listCompaniesPaged({
        search,
        industry: industryFilter,
        from,
        to,
      }),
  });

  // Query: Overview Stats
  const { data: overviewStats, refetch: refetchOverview } = useQuery({
    queryKey: ["companies-overview-stats-crm"],
    queryFn: getCompaniesOverview,
  });

  // Query: Industry Rollup
  const { data: industryRollup = [], refetch: refetchRollup } = useQuery({
    queryKey: ["industry-rollup-crm"],
    queryFn: getIndustryRollup,
  });

  // Query: Unassigned count
  const { data: unassignedCount = 0, refetch: refetchUnassigned } = useQuery({
    queryKey: ["unassigned-companies-count-crm"],
    queryFn: countCompaniesWithNullIndustry,
  });

  const refetchAll = useCallback(() => {
    refetchList();
    refetchOverview();
    refetchRollup();
    refetchUnassigned();
  }, [refetchList, refetchOverview, refetchRollup, refetchUnassigned]);

  // Mutation: Upsert / Save
  const saveMutation = useMutation({
    mutationFn: async (values: CompanyFormValues) => {
      const payload: Record<string, any> = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        tagline: values.tagline.trim() || null,
        about: values.about.trim() || null,
        logo_url: values.logo_url.trim() || null,
        banner_url: values.banner_url.trim() || null,
        website: values.website.trim() || null,
        industry: values.industry || null,
        primary_email: values.primary_email.trim() || null,
        country: values.country.trim() || null,
        profile_completion: Number(values.profile_completion),
        verification_tier: values.verification_tier,
      };

      if (editingCompany) {
        payload.id = editingCompany.id;
        await upsertCompany(payload as any);
      } else {
        await insertCompany(payload as any);
      }
    },
    onSuccess: () => {
      toast.success(editingCompany ? "Company profile updated successfully." : "New company registered successfully.");
      setIsFormOpen(false);
      refetchAll();
    },
    onError: (error: any) => {
      toast.error(`Operation failed: ${error.message}`);
    },
  });

  // Mutation: Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteCompany(id);
    },
    onSuccess: () => {
      toast.success("Company profile deleted successfully.");
      setDeleteTarget(null);
      refetchAll();
    },
    onError: (error: any) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  // Slug generator helper
  const handleNameChange = (name: string) => {
    setFormValues((prev) => {
      const updated = { ...prev, name };
      if (autoSlug) {
        updated.slug = name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim();
      }
      return updated;
    });
  };

  const openCreateDialog = () => {
    setEditingCompany(null);
    setFormValues(DEFAULT_FORM_VALUES);
    setAutoSlug(true);
    setIsFormOpen(true);
  };

  const openEditDialog = (company: CompanyRow) => {
    setEditingCompany(company);
    setFormValues({
      name: company.name || "",
      slug: company.slug || "",
      tagline: company.tagline || "",
      about: company.about || "",
      logo_url: company.logo_url || "",
      banner_url: company.banner_url || "",
      website: company.website || "",
      industry: company.industry || "",
      primary_email: company.primary_email || "",
      country: company.country || "",
      profile_completion: company.profile_completion ?? 50,
      verification_tier: company.verification_tier || "none",
    });
    setAutoSlug(false);
    setIsFormOpen(true);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const totalPages = Math.ceil((companyData?.count || 0) / ITEMS_PER_PAGE) || 1;

  const topSectorName = industryRollup[0]?.industry || "None";
  const topSectorCount = industryRollup[0]?.company_count || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/10 p-6 rounded-2xl border border-border/60 gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-semibold uppercase italic tracking-tight flex items-center gap-2 text-primary">
            <Building2 className="h-6 w-6" /> Employer CRM
          </h2>
          <p className="text-[10px] font-semibold text-muted-foreground/60 italic">
            Manage corporate partners, upload employer registries, and monitor profile completeness
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setIsImportOpen(true)}
            className="rounded-xl border-2 h-10 px-4 font-semibold uppercase text-[10px] gap-2 flex items-center bg-background"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
            Bulk Import
          </Button>
          <Button
            onClick={openCreateDialog}
            className="rounded-xl h-10 px-4 font-semibold uppercase text-[10px] gap-2 flex items-center bg-primary text-primary-foreground shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={refetchAll}
            className="rounded-xl border-2 h-10 w-10 bg-background"
            aria-label="Refresh data"
          >
            <RefreshCw className={cn("h-4 w-4", (fetchingList || saveMutation.isPending) && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* KPI Cards Hud */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard title="Total Employers" value={overviewStats?.totals || 0} icon={Building2} />
        <StatsCard title="Verified Employers" value={overviewStats?.verified || 0} icon={UserCheck} />
        <StatsCard title="Unassigned Industries" value={unassignedCount} icon={AlertCircle} />
        <StatsCard title={`Top Sector: ${topSectorName}`} value={topSectorCount} icon={TrendingUp} />
      </div>

      {/* Filter and Search controls */}
      <Card className="rounded-2xl border shadow-sm bg-card">
        <div className="p-6 border-b border-border/10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative group w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search by company name, industry, or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-12 h-12 bg-muted/10 border rounded-xl font-medium"
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={industryFilter} onValueChange={(val) => { setIndustryFilter(val); setPage(1); }}>
              <SelectTrigger className="h-12 rounded-xl bg-muted/10 border font-semibold text-xs">
                <SelectValue placeholder="Filter by Industry" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border">
                <SelectItem value="all" className="font-semibold text-xs">All Industries</SelectItem>
                <SelectItem value="none" className="font-semibold text-xs">Unassigned (None)</SelectItem>
                {industryRollup.map((ind: any) => (
                  <SelectItem key={ind.industry} value={ind.industry} className="font-semibold text-xs">
                    {ind.industry} ({ind.company_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        {loadingList ? (
          <div className="p-8">
            <DashboardTableSkeleton rows={8} />
          </div>
        ) : !companyData || companyData.rows.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto border">
              <Building2 className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold uppercase tracking-tight italic">No companies found</p>
              <p className="text-xs text-muted-foreground font-medium">
                Try modifying your search queries or register a new company profile.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="border-b text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
                  <TableHead className="py-6 px-6 text-left">Company Details</TableHead>
                  <TableHead className="text-left">Industry Sector</TableHead>
                  <TableHead className="text-left">Primary Contact</TableHead>
                  <TableHead className="text-left">Website</TableHead>
                  <TableHead className="text-center">Verification Tier</TableHead>
                  <TableHead className="text-center w-36">Profile Health</TableHead>
                  <TableHead className="text-right pr-6 w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companyData.rows.map((company) => (
                  <TableRow
                    key={company.id}
                    className="group hover:bg-primary/[0.02] border-b border-border/5 transition-colors"
                  >
                    <TableCell className="py-5 px-6 text-left">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border rounded-lg bg-muted flex items-center justify-center">
                          <AvatarImage src={company.logo_url || undefined} alt={company.name} />
                          <AvatarFallback className="rounded-lg font-bold text-xs bg-primary/10 text-primary">
                            {getInitials(company.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm group-hover:text-primary transition-colors text-foreground">
                            {company.name}
                          </p>
                          <p className="text-[10px] font-mono opacity-50 italic mt-0.5">{company.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-left">
                      {company.industry ? (
                        <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 bg-primary/5">
                          {company.industry}
                        </Badge>
                      ) : (
                        <span className="text-[10px] font-semibold text-muted-foreground/40 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-left text-xs font-semibold text-muted-foreground">
                      {company.primary_email || "—"}
                    </TableCell>
                    <TableCell className="text-left">
                      {company.website ? (
                        <a
                          href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-500 hover:underline"
                        >
                          Visit <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {company.verification_tier === "gold" && (
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[9px] font-bold">
                          GOLD
                        </Badge>
                      )}
                      {company.verification_tier === "silver" && (
                        <Badge className="bg-slate-400/10 text-slate-500 border-slate-400/20 text-[9px] font-bold">
                          SILVER
                        </Badge>
                      )}
                      {company.verification_tier === "bronze" && (
                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-bold">
                          BRONZE
                        </Badge>
                      )}
                      {(!company.verification_tier || company.verification_tier === "none") && (
                        <Badge variant="secondary" className="text-[9px] font-bold opacity-40">
                          NONE
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="space-y-1 px-3">
                        <div className="flex justify-between text-[9px] font-semibold opacity-60">
                          <span>Progress</span>
                          <span>{company.profile_completion || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/10">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all bg-gradient-to-r",
                              (company.profile_completion || 0) >= 80
                                ? "from-emerald-500 to-emerald-600"
                                : (company.profile_completion || 0) >= 40
                                ? "from-blue-500 to-indigo-600"
                                : "from-orange-400 to-red-500"
                            )}
                            style={{ width: `${company.profile_completion || 0}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(company)}
                          className="h-8 w-8 hover:text-primary rounded-lg"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget(company)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination HUD */}
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-5 border-t gap-4">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Showing {from + 1} to {Math.min(from + ITEMS_PER_PAGE, companyData.count)} of {companyData.count} entries
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1 || loadingList}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-10 w-10 rounded-xl"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold px-4">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === totalPages || loadingList}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-10 w-10 rounded-xl"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] rounded-2xl border-4 border-border/40 bg-background/95 p-0 overflow-hidden shadow-lg flex flex-col">
          <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-semibold uppercase tracking-tight italic flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              {editingCompany ? "Edit Employer Profile" : "Register New Employer"}
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-muted-foreground/60 italic mt-1">
              {editingCompany ? "Update corporate metrics and details." : "Create a clean profile record."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formValues.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="h-11 rounded-xl bg-muted/10 font-medium"
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-xs font-semibold uppercase tracking-wider flex justify-between">
                  <span>Slug Identifier</span>
                  <button
                    type="button"
                    onClick={() => setAutoSlug(!autoSlug)}
                    className="text-[10px] text-blue-500 font-bold hover:underline lowercase"
                  >
                    {autoSlug ? "disable auto" : "enable auto"}
                  </button>
                </Label>
                <Input
                  id="slug"
                  value={formValues.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setFormValues((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                  placeholder="e.g. acme-corp"
                  className="h-11 rounded-xl bg-muted/10 font-mono text-xs"
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry" className="text-xs font-semibold uppercase tracking-wider">
                  Industry / Sector
                </Label>
                <Input
                  id="industry"
                  value={formValues.industry}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g. FinTech, Healthcare"
                  className="h-11 rounded-xl bg-muted/10 font-medium"
                />
              </div>

              {/* Primary Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider">
                  Primary Contact Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formValues.primary_email}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, primary_email: e.target.value }))}
                  placeholder="e.g. hr@acme.com"
                  className="h-11 rounded-xl bg-muted/10 font-medium"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website" className="text-xs font-semibold uppercase tracking-wider">
                  Website URL
                </Label>
                <Input
                  id="website"
                  value={formValues.website}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, website: e.target.value }))}
                  placeholder="e.g. acme.com"
                  className="h-11 rounded-xl bg-muted/10 font-medium"
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label htmlFor="country" className="text-xs font-semibold uppercase tracking-wider">
                  Country
                </Label>
                <Input
                  id="country"
                  value={formValues.country}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, country: e.target.value }))}
                  placeholder="e.g. Bangladesh, United States"
                  className="h-11 rounded-xl bg-muted/10 font-medium"
                />
              </div>

              {/* Verification Tier */}
              <div className="space-y-2">
                <Label htmlFor="tier" className="text-xs font-semibold uppercase tracking-wider">
                  Verification Tier
                </Label>
                <Select
                  value={formValues.verification_tier}
                  onValueChange={(val) => setFormValues((prev) => ({ ...prev, verification_tier: val }))}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/10 font-medium">
                    <SelectValue placeholder="Select Tier" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border">
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Profile Completion */}
              <div className="space-y-2">
                <Label htmlFor="completion" className="text-xs font-semibold uppercase tracking-wider">
                  Profile Health ({formValues.profile_completion}%)
                </Label>
                <Input
                  id="completion"
                  type="number"
                  min="0"
                  max="100"
                  value={formValues.profile_completion}
                  onChange={(e) =>
                    setFormValues((prev) => ({
                      ...prev,
                      profile_completion: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    }))
                  }
                  className="h-11 rounded-xl bg-muted/10 font-semibold"
                />
              </div>

              {/* Logo URL */}
              <div className="col-span-full space-y-2">
                <Label htmlFor="logo" className="text-xs font-semibold uppercase tracking-wider">
                  Logo Image URL
                </Label>
                <Input
                  id="logo"
                  value={formValues.logo_url}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="e.g. https://images.unsplash.com/photo-..."
                  className="h-11 rounded-xl bg-muted/10 font-medium"
                />
              </div>

              {/* Tagline */}
              <div className="col-span-full space-y-2">
                <Label htmlFor="tagline" className="text-xs font-semibold uppercase tracking-wider">
                  Corporate Tagline
                </Label>
                <Input
                  id="tagline"
                  value={formValues.tagline}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, tagline: e.target.value }))}
                  placeholder="e.g. Automating global logistics at scale"
                  className="h-11 rounded-xl bg-muted/10 font-medium"
                />
              </div>

              {/* About Text */}
              <div className="col-span-full space-y-2">
                <Label htmlFor="about" className="text-xs font-semibold uppercase tracking-wider">
                  Detailed Company Bio
                </Label>
                <Textarea
                  id="about"
                  rows={4}
                  value={formValues.about}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, about: e.target.value }))}
                  placeholder="Describe company operations, goals, services..."
                  className="rounded-xl bg-muted/10 font-medium p-4"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 border-t border-border/10 bg-muted/5">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={saveMutation.isPending}
              className="rounded-xl h-12 px-6 font-semibold uppercase text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!formValues.name.trim()) return toast.error("Company name is required.");
                if (!formValues.slug.trim()) return toast.error("Slug identifier is required.");
                saveMutation.mutate(formValues);
              }}
              disabled={saveMutation.isPending}
              className="rounded-xl h-12 px-8 font-semibold uppercase text-xs"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-4 border-destructive/20 bg-background/98 p-8 shadow-lg">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-2xl font-semibold uppercase tracking-tight italic flex items-center gap-2 text-destructive">
              <AlertCircle className="h-6 w-6" /> Confirm Profile Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium leading-relaxed">
              You are about to delete <span className="font-bold text-foreground italic">"{deleteTarget?.name}"</span>.
              This will permanently remove the corporate record and break active associations with company members,
              lead pipelines, and sponsored AI swarm configurations.
              <br />
              <br />
              This database modification is non-reversible. Are you sure you wish to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-xl h-12 font-semibold uppercase text-xs border bg-background">
              Abort Action
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
              className="rounded-xl h-12 font-semibold uppercase text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
            >
              {deleteMutation.isPending ? "Purging Record..." : "Confirm Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Import sheet dialog */}
      <BatchCompanyUpload
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onComplete={() => {
          refetchAll();
        }}
      />
    </div>
  );
}

export default CompaniesTab;