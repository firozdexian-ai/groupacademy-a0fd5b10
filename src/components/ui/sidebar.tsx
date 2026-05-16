import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { PanelLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const SIDEBAR_COOKIE_NAME = "sidebar:state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3.5rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContext = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context)
    throw new Error(
      "Validation Fault: useSidebar analytics hooks must execute natively within an active <SidebarProvider> envelope.",
    );
  return context;
}

/**
 * GroUp Academy: Authoritative Application Layout Provider (SidebarProvider)
 * Hardened responsive provider context handling structural keystroke binds and insulating SSR cookie injection.
 */
const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
>(({ defaultOpen = true, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;

  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }

      // Phase 1: Defensively gate document singletons to shield layout threads against SSR compilation drops
      if (typeof document !== "undefined") {
        document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}; SameSite=Lax`;
      }
    },
    [setOpenProp, open],
  );

  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((prev) => !prev) : setOpen((prev) => !prev);
  }, [isMobile, setOpen, setOpenMobile]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === SIDEBAR_KEYBOARD_SHORTCUT && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  const state = open ? "expanded" : "collapsed";
  const contextValue = React.useMemo<SidebarContext>(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={100}>
        <div
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper flex min-h-screen w-full has-[[data-variant=inset]]:bg-background/40 font-sans text-foreground antialiased",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
});
SidebarProvider.displayName = "SidebarProvider_Core_Shell_Node";

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    side?: "left" | "right";
    variant?: "sidebar" | "floating" | "inset";
    collapsible?: "offcanvas" | "icon" | "none";
  }
>(({ side = "left", variant = "sidebar", collapsible = "offcanvas", className, children, ...props }, ref) => {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  if (collapsible === "none") {
    return (
      <aside
        ref={ref}
        className={cn(
          "flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground border-r border-border/40 select-none text-left shrink-0 transform-gpu",
          side === "right" && "border-l border-r-0",
          className,
        )}
        {...props}
      >
        {children}
      </aside>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-mobile="true"
          className="w-[--sidebar-width] bg-sidebar p-0 text-sidebar-foreground border-none backdrop-blur-md [&>button]:hidden flex flex-col h-full overflow-hidden"
          style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE } as React.CSSProperties}
          side={side}
        >
          <div className="flex h-full w-full flex-col bg-sidebar">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      ref={ref}
      className="group peer hidden text-sidebar-foreground md:block shrink-0 select-none pointer-events-auto"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
    >
      <div
        className={cn(
          "relative h-screen w-[--sidebar-width] bg-transparent transition-[width] duration-200 ease-out transform-gpu shrink-0 block",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+theme(spacing.4))]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon]",
        )}
      />
      <div
        className={cn(
          "fixed inset-y-0 z-20 hidden h-screen w-[--sidebar-width] transition-[left,right,width] duration-200 ease-out md:flex flex-col transform-gpu min-h-0",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+theme(spacing.4)+2px)]"
            : "group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l border-border/40",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          className={cn(
            "flex h-full w-full flex-col bg-sidebar transition-all duration-200 ease-out min-h-0",
            "group-data-[variant=floating]:rounded-xl group-data-[variant=floating]:border group-data-[variant=floating]:border-border/40 group-data-[variant=floating]:shadow-sm group-data-[variant=floating]:bg-card/95 group-data-[variant=floating]:backdrop-blur-md",
          )}
        >
          {children}
        </div>
      </div>
    </aside>
  );
});
Sidebar.displayName = "Sidebar_Core_Enclosure_Node";

const SidebarTrigger = React.forwardRef<React.ElementRef<typeof Button>, React.ComponentProps<typeof Button>>(
  ({ className, onClick, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (
      <Button
        ref={ref}
        data-sidebar="trigger"
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 rounded-lg hover:bg-accent hover:text-foreground text-muted-foreground transition-colors cursor-pointer shrink-0 flex items-center justify-center p-0 m-0",
          className,
        )}
        onClick={(event) => {
          onClick?.(event);
          toggleSidebar();
        }}
        {...props}
      >
        <PanelLeft className="h-4 w-4 stroke-[2.2]" />
        <span className="sr-only">Toggle structural navigation side column panel</span>
      </Button>
    );
  },
);
SidebarTrigger.displayName = "Sidebar_Trigger_Action_Node";

const SidebarRail = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button">>(
  ({ className, ...props }, ref) => {
    const { toggleSidebar } = useSidebar();
    return (
      <button
        ref={ref}
        type="button"
        data-sidebar="rail"
        aria-label="Toggle navigation side rails"
        tabIndex={-1}
        onClick={toggleSidebar}
        className={cn(
          "absolute inset-y-0 z-20 hidden w-3 -translate-x-1/2 transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[1px] group-data-[side=left]:-right-3 group-data-[side=right]:left-0 hover:after:bg-primary/40 sm:flex cursor-col-resize outline-none focus:outline-none border-none bg-transparent p-0 m-0",
          "[[data-side=left]_&]:cursor-w-resize [[data-side=right]_&]:cursor-e-resize",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarRail.displayName = "Sidebar_Tactile_Rail_Node";

const SidebarInset = React.forwardRef<HTMLDivElement, React.ComponentProps<"main">>(({ className, ...props }, ref) => (
  <main
    ref={ref}
    className={cn(
      "relative flex min-h-screen flex-1 flex-col bg-background transition-all duration-200 text-left min-w-0 w-full block",
      "peer-data-[variant=inset]:min-h-[calc(100vh-theme(spacing.2))] md:peer-data-[variant=inset]:m-2 md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-none md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-border/40",
      className,
    )}
    {...props}
  />
));
SidebarInset.displayName = "Sidebar_Canvas_Inset_Node";

const SidebarInput = React.forwardRef<React.ElementRef<typeof Input>, React.ComponentProps<typeof Input>>(
  ({ className, ...props }, ref) => (
    <Input
      ref={ref}
      data-sidebar="input"
      className={cn(
        "h-9 w-full bg-background/50 rounded-lg border border-border/40 text-xs shadow-none focus-visible:ring-1 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  ),
);
SidebarInput.displayName = "Sidebar_Input_Primitive_Node";

const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="header"
    className={cn(
      "flex flex-col gap-2 p-3 sm:p-4 shrink-0 select-none leading-none w-full block border-b border-border/5",
      className,
    )}
    {...props}
  />
));
SidebarHeader.displayName = "Sidebar_Header_Enclosure_Node";

const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="footer"
    className={cn(
      "flex flex-col gap-2 p-3 sm:p-4 mt-auto shrink-0 select-none leading-none w-full block border-t border-border/5",
      className,
    )}
    {...props}
  />
));
SidebarFooter.displayName = "Sidebar_Footer_Enclosure_Node";

const SidebarSeparator = React.forwardRef<React.ElementRef<typeof Separator>, React.ComponentProps<typeof Separator>>(
  ({ className, ...props }, ref) => (
    <Separator
      ref={ref}
      data-sidebar="separator"
      className={cn("mx-3 w-auto bg-border/10 h-px block shrink-0 my-1", className)}
      {...props}
    />
  ),
);
SidebarSeparator.displayName = "Sidebar_Separator_Delineator_Node";

const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="content"
    className={cn(
      "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-3 py-1.5 group-data-[collapsible=icon]:overflow-hidden scrollbar-thin block w-full",
      className,
    )}
    {...props}
  />
));
SidebarContent.displayName = "Sidebar_Content_Canvas_Node";

const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-sidebar="group"
    className={cn("relative flex w-full min-w-0 flex-col p-1.5 block shrink-0 gap-1.5", className)}
    {...props}
  />
));
SidebarGroup.displayName = "Sidebar_Group_Section_Node";

const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { asChild?: boolean }>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        ref={ref}
        data-sidebar="group-label"
        className={cn(
          "flex h-7 shrink-0 items-center rounded-lg px-2.5 font-mono text-[9px] font-extrabold uppercase tracking-wide text-muted-foreground/40 outline-none transition-all duration-150 leading-none select-none block text-left pt-0.5",
          "group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:-translate-x-3 group-data-[collapsible=icon]:pointer-events-none",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarGroupLabel.displayName = "Sidebar_Group_Label_Node";

const SidebarGroupAction = React.forwardRef<HTMLButtonElement, React.ComponentProps<"button"> & { asChild?: boolean }>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type="button"
        data-sidebar="group-action"
        className={cn(
          "absolute right-2 top-2 flex aspect-square w-5 items-center justify-center rounded-md text-muted-foreground/40 transition-colors duration-150 hover:bg-accent hover:text-foreground group-data-[collapsible=icon]:hidden cursor-pointer p-0 m-0 border-none outline-none",
          className,
        )}
        {...props}
      />
    );
  },
);
SidebarGroupAction.displayName = "Sidebar_Group_Action_Trigger_Node";

const SidebarGroupContent = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="group-content"
      className={cn("w-full block text-xs font-bold text-foreground/80", className)}
      {...props}
    />
  ),
);
SidebarGroupContent.displayName = "Sidebar_Group_Content_Slot_Node";

const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    data-sidebar="menu"
    className={cn("flex w-full min-w-0 flex-col gap-1 p-0 m-0 list-none block", className)}
    {...props}
  />
));
SidebarMenu.displayName = "Sidebar_Menu_List_Node";

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-sidebar="menu-item"
    className={cn("group/menu-item relative list-none p-0 m-0 shrink-0 block leading-none w-full", className)}
    {...props}
  />
));
SidebarMenuItem.displayName = "Sidebar_Menu_Item_Node";

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2.5 overflow-hidden rounded-lg px-2.5 text-left text-xs sm:text-sm font-bold outline-none transition-colors duration-150 border border-transparent cursor-pointer select-none leading-none pt-0.5 transform-gpu",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-foreground/80 hover:bg-accent hover:text-foreground focus-visible:bg-accent focus-visible:text-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground",
        outline:
          "border border-border/40 bg-background/50 text-foreground/80 hover:border-primary/40 hover:bg-accent focus-visible:bg-accent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:border-primary",
      },
      size: {
        default: "h-9",
        sm: "h-8 text-xs px-2 gap-2",
        lg: "h-10 text-sm px-3 gap-3",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
  } & VariantProps<typeof sidebarMenuButtonVariants>
>(({ asChild = false, isActive = false, variant = "default", size = "default", tooltip, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();

  const buttonElementNode = (
    <Comp
      ref={ref}
      type="button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        sidebarMenuButtonVariants({ variant, size }),
        "group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center [&>span:last-child]:truncate [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0 [&>svg]:stroke-[2.2]",
        className,
      )}
      {...props}
    />
  );

  if (!tooltip) return buttonElementNode;
  const preProcessedTooltipPropsMapObj = typeof tooltip === "string" ? { children: tooltip } : tooltip;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{buttonElementNode}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        className="bg-popover/95 backdrop-blur-md border border-border/40 font-mono font-extrabold uppercase text-[9px] tracking-wide py-1.5 px-2.5 shadow-sm text-popover-foreground leading-none pointer-events-none select-none pt-1 block transform-gpu"
        {...preProcessedTooltipPropsMapObj}
      />
    </Tooltip>
  );
});
SidebarMenuButton.displayName = "Sidebar_Menu_Button_Node";

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { asChild?: boolean; showOnHover?: boolean }
>(({ className, asChild = false, showOnHover = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      type="button"
      data-sidebar="menu-action"
      className={cn(
        "absolute right-1 top-1 flex aspect-square w-7 items-center justify-center rounded-md text-muted-foreground/40 transition-colors duration-150 hover:bg-accent hover:text-foreground group-data-[collapsible=icon]:hidden border-none outline-none p-0 m-0 cursor-pointer [&>svg]:h-3.5 [&>svg]:w-3.5 [&>svg]:stroke-[2.2]",
        showOnHover && "md:opacity-0 group-hover/menu-item:opacity-100 focus-visible:opacity-100",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = "Sidebar_Menu_Action_Trigger_Node";

const SidebarMenuBadge = React.forwardRef<HTMLDivElement, React.ComponentProps<"div">>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-2 flex h-4.5 min-w-[18px] select-none items-center justify-center rounded bg-primary/10 px-1 font-mono text-[9px] font-extrabold tabular-nums text-primary group-data-[collapsible=icon]:hidden leading-none pt-0.5 shrink-0 shadow-2xs border border-transparent",
        className,
      )}
      {...props}
    />
  ),
);
SidebarMenuBadge.displayName = "Sidebar_Menu_Badge_Counter_Node";

const SidebarMenuSkeleton = React.forwardRef<HTMLDivElement, React.ComponentProps<"div"> & { showIcon?: boolean }>(
  ({ className, showIcon = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-sidebar="menu-skeleton"
        className={cn(
          "flex h-9 items-center gap-2.5 rounded-lg px-2.5 w-full block shrink-0 select-none pointer-events-none transform-gpu leading-none",
          className,
        )}
        {...props}
      >
        {showIcon && <Skeleton className="h-4 w-4 rounded-md shrink-0" />}
        {/* Phase 2: Apply a deterministic layout metric row layout string to neutralize dynamic client CLS errors */}
        <Skeleton className="h-3.5 w-3/4 max-w-[160px] rounded-xs flex-1" />
      </div>
    );
  },
);
SidebarMenuSkeleton.displayName = "Sidebar_Menu_Skeleton_Node";

const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentProps<"ul">>(
  ({ className, ...props }, ref) => (
    <ul
      ref={ref}
      data-sidebar="menu-sub"
      className={cn(
        "ml-4.5 mr-0 flex flex-col gap-1 border-l border-border/20 pl-3.5 pr-0 py-0.5 group-data-[collapsible=icon]:hidden p-0 m-0 list-none block w-full shrink-0",
        className,
      )}
      {...props}
    />
  ),
);
SidebarMenuSub.displayName = "Sidebar_Menu_Sub_List_Node";

const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentProps<"li">>(({ ...props }, ref) => (
  <li ref={ref} className="list-none p-0 m-0 shrink-0 block w-full leading-none" {...props} />
));
SidebarMenuSubItem.displayName = "Sidebar_Menu_Sub_Item_Node";

const SidebarMenuSubButton = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentProps<"a"> & { asChild?: boolean; size?: "sm" | "md"; isActive?: boolean }
>(({ asChild = false, size = "md", isActive, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      ref={ref}
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "flex min-w-0 items-center gap-2.5 overflow-hidden rounded-md px-3 text-xs font-bold text-muted-foreground/70 transition-colors duration-150 hover:bg-accent hover:text-foreground cursor-pointer select-none leading-none pt-0.5 transform-gpu w-full block border border-transparent",
        size === "sm" ? "h-7 text-[11px]" : "h-8 text-xs",
        "data-[active=true]:text-primary data-[active=true]:bg-primary/5 data-[active=true]:font-extrabold",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = "Sidebar_Menu_Sub_Button_Node";

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
