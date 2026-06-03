import { useMemo } from "react";
import { Coins, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getServiceCost, ServiceType } from "@/lib/creditPricing";
import { cn } from "@/lib/utils";

interface ServiceUsageBadgeProps {
  serviceType: ServiceType;
  className?: string;
  showIcon?: boolean;
}

/**
 * GroUp Academy: Service Usage Credit Cost Badge
 * Displays the specific micro-credit consumption rate required for executing platform tools.
 */
export function ServiceUsageBadge({ serviceType, className, showIcon = true }: ServiceUsageBadgeProps) {
  
  // Resolves the credit amount bound to a particular feature type cleanly from core pricing configuration rules
  const computedServiceCostValue = useMemo((): number => {
    if (!serviceType) return 0;

    try {
      const rawCostValue = getServiceCost(serviceType);
      return Math.max(0, Number(rawCostValue ?? 0));
    } catch (err) {
      console.error("[Wallet Operations] Failed to retrieve system credit pricing parameter details:", {
        serviceType,
        err,
      });
      return 0; // Absolute safety fallback ensures view list layout stays unified during temporary data slips
    }
  }, [serviceType]);

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 select-none cursor-default font-sans",
        "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40 shadow-inner group",
        className,
      )}
    >
      {/* ICON SECTOR BLOCK WITH MICRO-INTERACTION PATHS */}
      {showIcon && (
        <div className="relative h-3 w-3 flex items-center justify-center shrink-0">
          <Coins className="h-3 w-3 text-amber-500 fill-current group-hover:scale-105 transition-transform duration-200" />
          <Zap className="absolute -top-1 -right-1 h-1.5 w-1.5 text-primary fill-current opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        </div>
      )}

      {/* RENDER CELL TYPOGRAPHY TIMESTAMPS */}
      <span className="font-semibold text-xs text-amber-600 leading-none tabular-nums tracking-tight">
        {computedServiceCostValue}
        <span className="ml-0.5 text-[10px] font-medium opacity-80 text-amber-700/80 lowercase"> credits</span>
      </span>
    </Badge>
  );
}