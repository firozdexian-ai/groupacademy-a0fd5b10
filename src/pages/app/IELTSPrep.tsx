import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Headphones, BookOpen, PenTool, Mic, ArrowLeft, Play, FileText,
  CheckCircle, Clock, Lock, Coins, Sparkles, Trophy, ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditGateModal } from "@/components/credits/CreditGateModal";
import { CreditPurchaseSheet } from "@/components/credits/CreditPurchaseSheet";
import { useCredits } from "@/hooks/useCredits";
import { useTalent } from "@/hooks/useTalent";
import { getServiceCost } from "@/lib/creditPricing";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/common/EmptyState";
import { PAGE_SHELL_WIDE, PAGE_TITLE, PAGE_SUBTITLE, CARD, META_TEXT } from "@/lib/uiTokens";

const SECTIONS = [
  { id: "listening", name: "Listening", icon: Headphones },
  { id: "reading", name: "Reading", icon: BookOpen },
  { id: "writing", name: "Writing", icon: PenTool },
  { id: "speaking", name: "Speaking", icon: Mic },
];

const CONTENT_TYPE_ICONS: Record<string, any> = {
  video: Play, article: FileText, practice: CheckCircle, mock_test: Clock, tips: BookOpen,
};

interface IELTSResource {
  id: string;
  title: string;
  description: string | null;
  section: string;
  content_type: string;
  content_url: string | null;
  is_free: boolean;
  duration_mins: number | null;
  difficulty_level: string | null;
}

export default function IELTSPrep() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const { balance, refreshBalance } = useCredits();

  const [activeSection, setActiveSection] = useState("listening");
  const [selectedResource, setSelectedResource] = useState<IELTSResource | null>(null);
  const [showCreditGate, setShowCreditGate] = useState(false);
  const [showPurchaseSheet, setShowPurchaseSheet] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const ieltsCost = getServiceCost("IELTS_MOCK");

  const { data: unlockedResources, refetch: refetchAccess } = useQuery({
    queryKey: ["ielts-access", talent?.id],
    queryFn: async () => {
      if (!talent?.id) return [];
      const { data } = await supabase.from("ielts_resource_access").select("resource_id").eq("talent_id", talent.id);
      return data?.map((r) => r.resource_id) || [];
    },
    enabled: !!talent?.id,
  });

  const { data: resources, isLoading } = useQuery({
    queryKey: ["ielts-resources", activeSection],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ielts_resources")
        .select("*")
        .eq("section", activeSection)
        .eq("is_active", true)
        .order("display_order");
      if (error) throw error;
      return data || [];
    },
  });

  const handleResourceClick = (resource: IELTSResource) => {
    const isUnlocked = resource.is_free || unlockedResources?.includes(resource.id);
    if (isUnlocked) {
      if (resource.content_url) window.open(resource.content_url, "_blank");
      else toast.error("This resource isn't ready yet.");
    } else {
      setSelectedResource(resource);
      setShowCreditGate(true);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedResource || !talent?.id) return;
    setIsUnlocking(true);
    try {
      const { error: accessError } = await supabase
        .from("ielts_resource_access")
        .insert([{ talent_id: talent.id, resource_id: selectedResource.id }]);
      if (accessError) throw accessError;

      await supabase.from("contacts").insert([{
        full_name: talent.fullName,
        email: talent.email,
        subject: `IELTS unlock: ${selectedResource.title}`,
        message: `Talent unlocked a premium ${selectedResource.section} resource.`,
      }]);

      await refetchAccess();
      await refreshBalance();
      toast.success("Unlocked.");
      setShowCreditGate(false);
      if (selectedResource.content_url) window.open(selectedResource.content_url, "_blank");
    } catch {
      toast.error("Couldn't unlock. Try again.");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className={PAGE_SHELL_WIDE}>
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/learning")} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className={PAGE_TITLE}>IELTS Prep</h1>
        </div>
        <p className={PAGE_SUBTITLE}>
          Listening, reading, writing & speaking — with AI examiner feedback.
        </p>
      </header>

      <Card
        className={cn(CARD, "cursor-pointer hover:border-primary/40 transition-colors")}
        onClick={() => navigate("/app/agents/ielts-tutor")}
      >
        <CardContent className="p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Take a full mock test</p>
            <p className={cn(META_TEXT, "flex items-center gap-1 mt-0.5")}>
              <Coins className="h-3 w-3 text-amber-500" /> 100 credits
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>

      {/* Section pills */}
      <div className="grid grid-cols-4 gap-2">
        {SECTIONS.map((s) => {
          const isActive = activeSection === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl border transition-colors",
                isActive ? "border-primary bg-primary/5 text-primary" : "border-border/40 hover:border-border",
              )}
            >
              <s.icon className="h-4 w-4" />
              <span className="text-[11px] font-medium">{s.name}</span>
            </button>
          );
        })}
      </div>

      {/* Resources */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : resources?.length ? (
        <div className="space-y-2">
          {resources.map((r) => {
            const Icon = CONTENT_TYPE_ICONS[r.content_type] || FileText;
            const isUnlocked = r.is_free || unlockedResources?.includes(r.id);
            return (
              <Card
                key={r.id}
                className={cn(CARD, "cursor-pointer hover:border-primary/40 transition-colors")}
                onClick={() => handleResourceClick(r)}
              >
                <CardContent className="p-3 flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold line-clamp-1">{r.title}</h3>
                      {r.is_free ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/20 shrink-0">Free</Badge>
                      ) : isUnlocked ? (
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/20 shrink-0">Unlocked</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                          <Lock className="h-3 w-3" /> {ieltsCost} cr
                        </Badge>
                      )}
                    </div>
                    {r.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {r.duration_mins && (
                        <span className={cn(META_TEXT, "flex items-center gap-1")}>
                          <Clock className="h-3 w-3" /> {r.duration_mins}m
                        </span>
                      )}
                      {r.difficulty_level && (
                        <span className={META_TEXT}>{r.difficulty_level}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="More resources coming soon"
          description={`We're adding new ${activeSection} resources regularly.`}
        />
      )}

      <CreditGateModal
        isOpen={showCreditGate}
        onClose={() => setShowCreditGate(false)}
        onConfirm={handleConfirmPurchase}
        onBuyCredits={() => { setShowCreditGate(false); setShowPurchaseSheet(true); }}
        serviceName={selectedResource?.title || "IELTS Module"}
        cost={ieltsCost}
        currentBalance={balance}
        isLoading={isUnlocking}
      />
      <CreditPurchaseSheet
        isOpen={showPurchaseSheet}
        onClose={() => setShowPurchaseSheet(false)}
        currentBalance={balance}
      />
    </div>
  );
}
