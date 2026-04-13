import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { emailNotifications } from "@/lib/emailNotifications";
import {
  Mail,
  UserPlus,
  Phone,
  Globe,
  Briefcase,
  Calendar,
  CheckCircle2,
  FileText,
  ExternalLink,
  Coins,
  TrendingUp,
  Target,
  GraduationCap,
} from "lucide-react";
import { getCountryFlag } from "@/lib/constants/countries";
import { supabase } from "@/integrations/supabase/client";

interface TalentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  talent?: any;
  talentEmail?: string;
  talentName?: string;
}

export const TalentDetailDialog = ({
  open,
  onOpenChange,
  talent,
  talentEmail,
  talentName,
}: TalentDetailDialogProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  const displayTalent = talent || {
    email: talentEmail,
    full_name: talentName,
    id: null,
  };

  if (!displayTalent.email && !displayTalent.full_name) return null;

  const handlePlatformInvite = async () => {
    if (!displayTalent.id) {
      toast.error("Missing Talent ID for invite.");
      return;
    }
    const toastId = toast.loading("Sending global invite...");
    const success = await emailNotifications.talentInvite(
      displayTalent.id,
      "Join GroUp Academy to access AI career tools and exclusive global job matches.",
    );
    toast.dismiss(toastId);
    if (success) toast.success("Invite sent successfully!");
    else toast.error("Failed to send invite.");
  };

  const handleAwardCredits = async () => {
    // This connects to our Credits Management logic for engagement
    toast.info("Opening credit adjustment console...");
    // Future: Direct RPC call to add_credits()
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 bg-muted/20 border-b">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-2xl font-bold text-foreground">
                  {displayTalent.full_name || "Talent Profile"}
                </DialogTitle>
                {displayTalent.user_id ? (
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3">Registered</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 px-3 font-bold">
                    Pipeline Lead
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Added {displayTalent.created_at ? new Date(displayTalent.created_at).toLocaleDateString() : "N/A"}
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  ID: {displayTalent.id?.slice(0, 8) || "N/A"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full border-primary/30 text-primary hover:bg-primary/5"
                onClick={handleAwardCredits}
              >
                <Coins className="h-3.5 w-3.5 mr-1.5" /> Award Credits
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-background">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handlePlatformInvite}
              disabled={!displayTalent.id || !!displayTalent.user_id}
              className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6 shadow-md shadow-primary/20"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {displayTalent.user_id ? "Activation Complete" : "Send Activation Invite"}
            </Button>

            <Button
              variant="secondary"
              className="h-10 px-4 font-semibold border"
              onClick={() => window.open(`mailto:${displayTalent.email}`)}
            >
              <Mail className="h-4 w-4 mr-2" /> Direct Email
            </Button>

            {displayTalent.phone && (
              <Button
                variant="outline"
                className="h-10 px-4 border-green-500/30 text-green-600 font-semibold hover:bg-green-50"
                onClick={() => window.open(`https://wa.me/${displayTalent.phone.replace(/\D/g, "")}`, "_blank")}
              >
                <Phone className="h-4 w-4 mr-2" /> Open WhatsApp
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 mb-4 h-12">
              <TabsTrigger value="overview" className="font-bold">
                Account Overview
              </TabsTrigger>
              <TabsTrigger value="cv" className="font-bold">
                CV Analysis
              </TabsTrigger>
              <TabsTrigger value="activity" className="font-bold">
                Activity Tracking
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Globe className="h-4 w-4 text-primary" /> Core Information
                  </h3>
                  <div className="grid gap-3">
                    <InfoCard label="Full Email" value={displayTalent.email || "Missing"} />
                    <InfoCard label="Contact Number" value={displayTalent.phone || "Missing"} />
                    <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Geography</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xl">{getCountryFlag(displayTalent.country)}</span>
                        <p className="text-sm font-bold text-foreground">
                          {displayTalent.country || "Unnormalized Market"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" /> Professional Mapping
                  </h3>
                  <div className="grid gap-3">
                    <InfoCard label="Mapped Profession" value={displayTalent.custom_profession || "Unclassified"} />
                    <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Verified Assets</p>
                      <div className="flex gap-2 mt-2">
                        {displayTalent.cv_url ? (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer gap-1.5 bg-blue-500/10 text-blue-600 border-blue-500/20 py-1"
                            onClick={() => window.open(displayTalent.cv_url)}
                          >
                            <FileText className="h-3.5 w-3.5" /> View Original CV
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground italic border-dashed py-1">
                            Missing CV
                          </Badge>
                        )}
                        {displayTalent.linkedin_url && (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer gap-1.5 bg-indigo-500/10 text-indigo-600 border-indigo-500/20 py-1"
                            onClick={() => window.open(displayTalent.linkedin_url)}
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> LinkedIn URL
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cv" className="animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
                    AI Parsed CV Content
                  </h3>
                  {displayTalent.cv_text && <Badge className="bg-blue-500 text-white font-bold">Read-Only View</Badge>}
                </div>
                <div className="bg-muted/40 border rounded-xl p-5 min-h-[300px] max-h-[400px] overflow-y-auto">
                  {displayTalent.cv_text ? (
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {displayTalent.cv_text}
                    </p>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50 py-20">
                      <FileText className="h-12 w-12" />
                      <p className="text-sm font-bold">
                        No parsed text available.
                        <br />
                        Please trigger 'Batch Parse' from Talent Pool.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatMetric label="Services Used" value={displayTalent.services_used?.length || 0} icon={Briefcase} />
                <StatMetric label="Credit Balance" value={displayTalent.credit_balance || 250} icon={Coins} />
                <StatMetric label="Enrollments" value={displayTalent.enrollment_count || 0} icon={GraduationCap} />
                <StatMetric
                  label="Onboarded"
                  value={displayTalent.onboarding_completed_at ? "YES" : "NO"}
                  icon={CheckCircle2}
                />
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Executive Commission Potential
                </h4>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground max-w-[70%]">
                    This talent is currently classified as a{" "}
                    <strong>{displayTalent.onboarding_completed_at ? "Free Learner" : "Lead"}</strong>. Activation could
                    yield up to 10% commission on all future tool usage.
                  </p>
                  <div className="text-right">
                    <p className="text-2xl font-black text-primary">10%</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Commission Rate</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="p-4 bg-muted/10 border-t flex justify-end gap-3">
          <Button variant="ghost" className="font-bold text-muted-foreground" onClick={() => onOpenChange(false)}>
            Close Inspector
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 p-3 rounded-lg border border-muted/50">
      <p className="text-[10px] text-muted-foreground uppercase font-black">{label}</p>
      <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
    </div>
  );
}

function StatMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
  return (
    <div className="bg-background border rounded-xl p-4 text-center space-y-1 shadow-sm">
      <div className="mx-auto w-fit p-1.5 bg-muted rounded-lg text-primary mb-1">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-black text-foreground">{value}</p>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{label}</p>
    </div>
  );
}
