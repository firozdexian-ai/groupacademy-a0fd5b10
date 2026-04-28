import { useState } from "react";
import { MessageCircle, X, Gift, Loader2, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTalent } from "@/hooks/useTalent";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getWhatsAppLink, getWhatsAppConnectMessage } from "@/lib/constants/support";
import { CREDIT_CONFIG } from "@/lib/creditPricing";

/**
 * GroUp Academy: Community Handshake Node
 * CTO Reference: Incentivized WhatsApp integration with atomic credit rewards.
 */

interface FloatingWhatsAppButtonProps {
  showPrompt?: boolean;
}

export function FloatingWhatsAppButton({ showPrompt = true }: FloatingWhatsAppButtonProps) {
  const { talent, refreshTalent } = useTalent();
  const { addCredits } = useCredits();
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const bonusAmount = CREDIT_CONFIG.WHATSAPP_CONNECT_BONUS || 10;
  const hasClaimedBonus = !!talent?.whatsappBonusClaimedAt;

  const handleHandshake = async () => {
    if (isProcessing || !talent) return;

    const message = getWhatsAppConnectMessage(talent.fullName || "Academy Member");
    const whatsappUrl = getWhatsAppLink(message);

    if (hasClaimedBonus) {
      window.open(whatsappUrl, "_blank");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Processing hand-shake bonus...");

    try {
      // PROTOCOL: Atomic Credit Disbursement
      const success = await addCredits(bonusAmount, "welcome_bonus", `WhatsApp Connect Yield - ${bonusAmount} CR`);

      if (success) {
        const { error } = await supabase
          .from("talents")
          .update({ whatsapp_bonus_claimed_at: new Date().toISOString() })
          .eq("id", talent.id);

        if (error) throw error;

        await refreshTalent();
        toast.success(`Protocol Successful: +${bonusAmount} Credits Disbursed`, { id: toastId });
      }

      window.open(whatsappUrl, "_blank");
    } catch (error: any) {
      console.error("[HandshakeNode] Sync Fault:", error);
      window.open(whatsappUrl, "_blank");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!talent) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4 md:bottom-10 md:right-10 group animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* SECTION: INCENTIVE PROMPT */}
      {showPrompt && !isPromptDismissed && !hasClaimedBonus && (
        <div className="relative bg-background/80 backdrop-blur-xl border-2 border-primary/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] rounded-[24px] p-5 max-w-[240px] ring-4 ring-primary/5 animate-bounce-subtle">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPromptDismissed(true);
            }}
            className="absolute -top-3 -right-3 bg-background border-2 shadow-lg rounded-full p-1.5 hover:bg-muted transition-all active:scale-90"
          >
            <X className="h-3 w-3" />
          </button>

          <div className="flex gap-4 items-start text-left">
            <div className="bg-[#25D366]/10 p-3 rounded-2xl shrink-0 h-fit border border-[#25D366]/20">
              <Gift className="h-5 w-5 text-[#25D366] fill-[#25D366]/10" />
            </div>
            <div className="space-y-1.5">
              <p className="text-[12px] font-black uppercase tracking-widest text-primary italic leading-none">
                Instant Yield
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed font-bold">
                Sync on WhatsApp for{" "}
                <span className="text-[#25D366] underline decoration-2">{bonusAmount} FREE CREDITS</span>
              </p>
              <div
                className="flex items-center gap-1 text-[9px] font-black text-primary/60 pt-1 group-hover:text-primary transition-colors cursor-pointer"
                onClick={handleHandshake}
              >
                INITIALIZE SYNC <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: FLOATING ACTION TRIGGER */}
      <div className="relative">
        <Button
          onClick={handleHandshake}
          disabled={isProcessing}
          className={cn(
            "h-16 w-16 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.3)] transition-all duration-500",
            "bg-[#25D366] hover:bg-[#128C7E] text-white p-0 border-4 border-white/10",
            "hover:scale-110 active:scale-90 active:rotate-12",
            isProcessing && "opacity-80 cursor-wait",
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <div className="relative">
              <MessageCircle className="h-8 w-8 fill-current" />
              <Zap className="absolute -top-1 -right-1 h-3 w-3 text-white fill-white animate-pulse" />
            </div>
          )}
        </Button>

        {/* NOTIFICATION HUBBLE */}
        {!hasClaimedBonus && (
          <span className="absolute -top-1 -right-1 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-rose-500 border-4 border-background shadow-lg items-center justify-center">
              <span className="text-[8px] font-black text-white">!</span>
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
