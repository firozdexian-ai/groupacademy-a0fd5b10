/**
 * Corporate Contacts Directory — Phase Z0 Hardened
 * Version: 2024 Highly Professional SAAS UI
 * Fixes: S1 (Ownership Move), PII Masking Standardized
 */
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  listCompaniesNameSorted,
  listContactsPaged,
  upsertContact,
} from "@/domains/companies/repo/companiesRepo";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Mail,
  Loader2,
  RefreshCw,
  Building2,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Star,
  ShieldCheck,
  Database,
  Activity,
} from "lucide-react";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton } from "@/platform/admin/chrome/DashboardSkeleton";
import { getDexianWhatsAppLink } from "@/lib/companyOutreachTemplates";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/components/ProtectedRoute";
import { InlineSpinner } from "@/components/common/InlineSpinner";

const ITEMS_PER_PAGE = 10;

export function ContactsTab() {
  const { role } = useUserRole();
  const isAdmin = role === "admin" || role === "super_admin";

  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<any>({ full_name: "", is_primary: false });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [comps, contactsRes] = await Promise.all([
        listCompaniesNameSorted(),
        listContactsPaged({ from: (page - 1) * ITEMS_PER_PAGE, to: page * ITEMS_PER_PAGE - 1 }),
      ]);
      setCompanies(comps);
      setContacts(contactsRes.rows);
      setTotalCount(contactsRes.count);
    } catch (error) {
      toast.error("Could not load contacts summary. Please try refreshing your session.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    if (!formData.full_name) return toast.error("Contact name is required");
    setSaving(true);
    try {
      await upsertContact(formData);
      toast.success("Contact successfully synchronized");
      setIsDialogOpen(false);
      loadData();
    } catch (err) {
      toast.error("Could not save updates. Please check details and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Action Row */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-2xl border border-border/60">
        <div className="text-left">
          <h2 className="text-2xl font-semibold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-6 w-6 text-primary" /> Corporate Contacts
          </h2>
          <p className="text-[10px] font-semibold text-muted-foreground/60 italic uppercase tracking-wider">
            Manage primary company points of contact and communication streams
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" aria-label="Refresh contacts directory" onClick={loadData} className="rounded-xl h-12 w-12 border">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button
            onClick={() => {
              setFormData({ full_name: "", is_primary: false });
              setIsDialogOpen(true);
            }}
            className="rounded-xl h-12 px-6 font-semibold uppercase text-xs gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add New Contact
          </Button>
        </div>
      </div>

      {/* KPI Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricTile label="Total Directory Contacts" value={totalCount} icon={Users} color="text-blue-500" bg="bg-blue-500/10" />
        <MetricTile
          label="Primary Account Contacts"
          value={contacts.filter((c) => c.is_primary).length}
          icon={Star}
          color="text-amber-500"
          bg="bg-amber-500/10"
        />
        <MetricTile
          label="Directory Access Level"
          value="Secure (PII Masked)"
          icon={Activity}
          color="text-emerald-500"
          bg="bg-emerald-500/10"
        />
      </div>

      <Card className="rounded-2xl border overflow-hidden shadow-sm bg-card">
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="pl-8 text-[10px] font-semibold uppercase py-6 text-left">Contact Details</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase text-left">Associated Company</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase text-left">Communication Channels</TableHead>
              <th className="text-right pr-8 text-[10px] font-semibold uppercase">Actions</th>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-20 text-center">
                  <Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20 text-primary" />
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id} className="group hover:bg-primary/[0.02] transition-colors border-b last:border-0">
                  <TableCell className="pl-8 py-6 text-left">
                    <p className="font-semibold text-sm uppercase italic group-hover:text-primary transition-colors flex items-center gap-2 text-foreground">
                      {contact.full_name}
                      {contact.is_primary && <Star className="h-3 w-3 fill-amber-500 text-amber-500" />}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wide mt-0.5">
                      {contact.designation || "General Representative"}
                    </p>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground/40" />
                      <span className="font-semibold text-[11px] uppercase text-foreground">{contact.company?.name || "Independent Partner"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-left">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                        <Mail className="h-3 w-3 opacity-40 text-primary" /> {isAdmin ? contact.email : "hidden_for_privacy@groupacademy"}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Phone className="h-3 w-3 opacity-40 text-primary" /> {isAdmin ? contact.phone : "••••••••"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-2 opacity-30 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon" aria-label="Open WhatsApp conversation"
                        className="h-9 w-9 rounded-lg hover:bg-emerald-500 hover:text-white transition-all border bg-transparent"
                        onClick={() =>
                          window.open(
                            getDexianWhatsAppLink(contact.phone, "intro", contact.full_name, contact.company?.name),
                            "_blank",
                          )
                        }
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon" aria-label="Edit contact information"
                        className="h-9 w-9 rounded-lg hover:bg-primary hover:text-white transition-all border bg-transparent"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="p-4 border-t flex justify-center gap-4 bg-muted/5">
          <Button
            variant="ghost"
            size="sm" aria-label="Go to previous page"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-xl border h-9 w-12"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm" aria-label="Go to next page"
            onClick={() => setPage((p) => p + 1)}
            disabled={contacts.length < ITEMS_PER_PAGE}
            className="rounded-xl border h-9 w-12"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Modify Contact Profiles Dialog Container */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-4 bg-background text-left">
          <div className="p-2 space-y-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold tracking-tight uppercase">
                Modify Contact Profile
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground italic uppercase font-semibold">
                Update details for this associated business account representative
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-semibold uppercase ml-1">Contact Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="rounded-xl border font-bold"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label className="text-[10px] font-semibold uppercase ml-1">Professional Designation</Label>
                <Input
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="rounded-xl border"
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full h-12 rounded-xl font-semibold uppercase text-[10px] gap-2 shadow-md"
              >
                {saving ? <InlineSpinner size="sm" /> : <ShieldCheck className="h-4 w-4" />} Save Changes
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricTile({ label, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="rounded-2xl border border-border/60 bg-card p-6 text-left group transition-all hover:border-primary/30 shadow-sm relative overflow-hidden">
      <div className="flex items-center gap-5">
        <div
          className={cn(
            "h-14 w-14 rounded-2xl flex items-center justify-center border border-white/5 transition-transform group-hover:rotate-3 shadow-inner",
            bg,
            color,
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground italic mb-1">{label}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
      </div>
    </Card>
  );
}