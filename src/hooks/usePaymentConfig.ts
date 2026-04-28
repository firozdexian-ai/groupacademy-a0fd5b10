import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * GroUp Academy: Fiscal Gateway Orchestrator
 * CTO Reference: Authoritative controller for platform-wide payment infrastructure.
 * Logic: Implements bimodal gateway toggling and Stripe environment hydration.
 */

export type PaymentGateway = "whatsapp" | "stripe" | "both";

interface PaymentConfig {
  gateway: PaymentGateway;
  stripePublishableKey: string | null;
  stripeMode: "test" | "live";
  currency: string;
  whatsappEnabled: boolean;
  isStripeConfigured: boolean;
}

export function usePaymentConfig() {
  const { data, isLoading } = useQuery({
    queryKey: ["payment-config"],
    queryFn: async (): Promise<PaymentConfig> => {
      // HUD: Fetch institutional platform settings artifacts
      const { data: settings, error } = await supabase
        .from("platform_settings")
        .select("key, value")
        .in("key", [
          "payment_gateway",
          "stripe_publishable_key",
          "stripe_mode",
          "currency",
          "whatsapp_purchase_enabled",
        ]);

      if (error) throw error;

      // SYNC: Map generic key-value artifacts into institutional configuration
      const registry = new Map(settings?.map((s) => [s.key, s.value]) || []);
      const stripeKey = registry.get("stripe_publishable_key") || null;

      return {
        gateway: (registry.get("payment_gateway") as PaymentGateway) || "whatsapp",
        stripePublishableKey: stripeKey,
        stripeMode: (registry.get("stripe_mode") as "test" | "live") || "test",
        currency: registry.get("currency") || "USD",
        whatsappEnabled: registry.get("whatsapp_purchase_enabled") !== "false",
        isStripeConfigured: !!stripeKey,
      };
    },
    staleTime: 5 * 60 * 1000, // 5m Cache Residency
  });

  // PHASE: Viewport_Diagnostic_API
  return {
    config: data,
    isLoading,
    gateway: data?.gateway || "whatsapp",
    isStripeConfigured: data?.isStripeConfigured || false,
    showWhatsApp: !data || data.gateway === "whatsapp" || data.gateway === "both",
    showStripe: data?.gateway === "stripe" || data?.gateway === "both",
    currency: data?.currency || "USD",
  };
}
