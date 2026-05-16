import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type { TooltipProps } from "recharts";
import { cn } from "@/lib/utils";

const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<keyof typeof THEMES, string> });
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error(
      "Validation Fault: useChart analytics nodes must execute within an active <ChartContainer /> wrapper context.",
    );
  }
  return context;
}

/**
 * GroUp Academy: Data Intelligence Visualization & Theme Sync Engine (ChartContainer)
 * Authoritative operational shell mapping dynamic chart colors across HSL layers and neutralizing layout shift jitters.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueGeneratedReactIdStr = React.useId();
  // Sanitize the raw generated string key defensively to eliminate token collision risks down document rows
  const sanitizedChartHashIdStr = `chart-${id || uniqueGeneratedReactIdStr.replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={sanitizedChartHashIdStr}
        ref={ref}
        className={cn(
          "flex aspect-video w-full justify-center text-[10px] font-mono font-bold uppercase tracking-wider select-none antialiased transform-gpu",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground/50 [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/20",
          "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-primary/40 [&_.recharts-dot[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border/30",
          "[&_.recharts-radial-bar-background-sector]:fill-muted/20 [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/10",
          "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-primary/30 [&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none block",
          className,
        )}
        {...props}
      >
        <ChartStyle id={sanitizedChartHashIdStr} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart_Core_Container_Node";

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const synchronizedColorConfigRowsArray = Object.entries(config).filter(
    ([_, optionConfigNode]) => optionConfigNode.theme || optionConfigNode.color,
  );

  if (!synchronizedColorConfigRowsArray.length) return null;

  // Phase 1: Clean, format, and sanitize CSS hex strings variables defensively to block cross-site scripting gaps
  const compiledCleanStyleStringBlockCSS = Object.entries(THEMES)
    .map(([themeKeyStr, globalSelectorPrefixStr]) => {
      const compiledInnerStyleDefinitionsStr = synchronizedColorConfigRowsArray
        .map(([dataKeyLabelStr, itemConfigBlock]) => {
          const targetedHexColorStr =
            itemConfigBlock.theme?.[themeKeyStr as keyof typeof itemConfigBlock.theme] || itemConfigBlock.color;
          const sanitizedHexColorValueStr = targetedHexColorStr
            ? String(targetedHexColorStr).replace(/[^a-zA-Z0-9#(),.\s]/g, "")
            : "";
          return sanitizedHexColorValueStr
            ? `  --color-${dataKeyLabelStr.replace(/[^a-zA-Z0-9-]/g, "")}: ${sanitizedHexColorValueStr};`
            : "";
        })
        .filter(Boolean)
        .join("\n");

      return `${globalSelectorPrefixStr} [data-chart=${id}] {\n${compiledInnerStyleDefinitionsStr}\n}`;
    })
    .join("\n");

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: compiledCleanStyleStringBlockCSS,
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  Omit<TooltipProps<any, any>, "content"> &
    React.ComponentProps<"div"> & {
      active?: boolean;
      payload?: Array<any>;
      label?: any;
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart();

    const computedTooltipHeaderLabelNode = React.useMemo(() => {
      if (hideLabel || !payload?.length) return null;

      const primaryPayloadLeadItem = payload[0];
      const fallbackTargetKeyStr = `${labelKey || primaryPayloadLeadItem.dataKey || primaryPayloadLeadItem.name || "value"}`;
      const identifiedPayloadConfigObj = getPayloadConfigFromPayload(
        config,
        primaryPayloadLeadItem,
        fallbackTargetKeyStr,
      );

      const resolvedValueOutputMixed =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : breweryFallbackLabelSelector(identifiedPayloadConfigObj, label);

      return (
        <div
          className={cn(
            "font-mono font-extrabold uppercase tracking-wider text-[9px] mb-1.5 text-muted-foreground/60 select-none block leading-none",
            labelClassName,
          )}
        >
          {labelFormatter ? labelFormatter(resolvedValueOutputMixed, payload) : resolvedValueOutputMixed}
        </div>
      );
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

    if (!active || !payload?.length) return null;

    const shouldNestSingleLabelInlineBool = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[9.5rem] items-start gap-2 rounded-xl border border-border/40 bg-card/95 backdrop-blur-md px-3 py-2.5 shadow-md text-left select-none sm:select-text tracking-normal font-bold text-xs text-foreground/90 animate-in fade-in duration-100",
          className,
        )}
      >
        {!shouldNestSingleLabelInlineBool ? computedTooltipHeaderLabelNode : null}

        <div className="grid gap-2 w-full block">
          {payload.map((itemRow, indexNum) => {
            const calculatedTargetKeyStr = `${nameKey || itemRow.name || itemRow.dataKey || "value"}`;
            const targetPayloadConfigObj = getPayloadConfigFromPayload(config, itemRow, calculatedTargetKeyStr);
            const calculatedIndicatorColorValueCSSStr = color || itemRow.payload?.fill || itemRow.color;

            return (
              <div
                key={`${itemRow.dataKey || itemRow.name || indexNum}`}
                className={cn(
                  "flex w-full flex-wrap items-center gap-2 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-primary leading-none text-left font-bold text-xs min-w-0 w-full block",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && itemRow?.value !== undefined && itemRow.name ? (
                  formatter(itemRow.value, itemRow.name, itemRow, indexNum, itemRow.payload)
                ) : (
                  <>
                    {targetPayloadConfigObj?.icon && !hideIndicator ? (
                      <targetPayloadConfigObj.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-full border-[--color-border] bg-[--color-bg] shadow-xs select-none block pointer-events-none",
                            {
                              "h-2 w-2": indicator === "dot",
                              "w-1 h-3 rounded-full": indicator === "line",
                              "w-0 border border-dashed bg-transparent h-3": indicator === "dashed",
                            },
                          )}
                          style={
                            {
                              "--color-bg": calculatedIndicatorColorValueCSSStr,
                              "--color-border": calculatedIndicatorColorValueCSSStr,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}

                    <div
                      className={cn(
                        "flex flex-1 justify-between gap-4 items-center leading-none min-w-0",
                        shouldNestSingleLabelInlineBool ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-0.5 min-w-0">
                        {shouldNestSingleLabelInlineBool ? computedTooltipHeaderLabelNode : null}
                        <span className="text-[10px] font-bold text-muted-foreground/80 tracking-tight truncate block pr-1 leading-none uppercase">
                          {targetPayloadConfigObj?.label || itemRow.name}
                        </span>
                      </div>

                      {itemRow.value !== undefined && (
                        <span className="font-mono text-xs font-black tabular-nums text-foreground/90 leading-none block select-text">
                          {Number(itemRow.value).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltip_Core_Content_Node";

const ChartLegend = RechartsPrimitive.Legend;

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: Array<{ value: string; type?: string; id?: string; dataKey?: string; color?: string }>;
    verticalAlign?: "top" | "bottom" | "middle";
    hideIcon?: boolean;
    nameKey?: string;
  }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full leading-none",
        verticalAlign === "top" ? "pb-3.5" : "pt-3.5",
        className,
      )}
    >
      {payload.map((legendItem, indexNum) => {
        const uniqueLookupKeyStr = `${nameKey || legendItem.dataKey || "value"}`;
        const associatedPayloadConfigObj = getPayloadConfigFromPayload(config, legendItem, uniqueLookupKeyStr);

        return (
          <div
            key={`${legendItem.value || indexNum}`}
            className="flex items-center gap-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:text-primary transition-opacity hover:opacity-80 cursor-default select-none max-w-xs leading-none shrink-0"
          >
            {associatedPayloadConfigObj?.icon && !hideIcon ? (
              <associatedPayloadConfigObj.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-full border-none shadow-xs pointer-events-none block"
                style={{ backgroundColor: legendItem.color }}
              />
            )}
            <span className="text-[10px] font-mono font-extrabold uppercase tracking-wide text-muted-foreground/70 block pt-0.5 leading-none">
              {associatedPayloadConfigObj?.label || legendItem.value}
            </span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend_Core_Content_Node";

// =========================================================================
// ARCHITECTURAL HARDENED INTERNAL ENGINE PLUG CONTEXT HOOK HELPERS
// =========================================================================

function breweryFallbackLabelSelector(resolvedItemConfigNode: any, defaultStaticFallbackLabelStr: any): string {
  if (resolvedItemConfigNode?.label) return String(resolvedItemConfigNode.label);
  if (defaultStaticFallbackLabelStr !== undefined && defaultStaticFallbackLabelStr !== null)
    return String(defaultStaticFallbackLabelStr);
  return "";
}

/**
 * Authoritative Payload Evaluator Tracking Mapper
 * Resolves configuration key mappings across fluid multi-series dataset payload entries.
 */
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, targetLookupKeyStr: string): any {
  if (typeof payload !== "object" || payload === null) return undefined;

  const nestedSubPayloadRowBlock =
    "payload" in payload && typeof (payload as any).payload === "object" && (payload as any).payload !== null
      ? (payload as any).payload
      : undefined;

  let computedActiveConfigLabelKeyStr: string = targetLookupKeyStr;

  if (targetLookupKeyStr in payload && typeof (payload as any)[targetLookupKeyStr] === "string") {
    computedActiveConfigLabelKeyStr = (payload as any)[targetLookupKeyStr] as string;
  } else if (
    nestedSubPayloadRowBlock &&
    targetLookupKeyStr in nestedSubPayloadRowBlock &&
    typeof nestedSubPayloadRowBlock[targetLookupKeyStr] === "string"
  ) {
    computedActiveConfigLabelKeyStr = nestedSubPayloadRowBlock[targetLookupKeyStr] as string;
  }

  return computedActiveConfigLabelKeyStr in config
    ? config[computedActiveConfigLabelKeyStr]
    : config[targetLookupKeyStr as keyof typeof config];
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartStyle };
