import * as React from "react";
import { type DialogProps } from "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Technical Command Node & Navigation Matrix Shell (Command)
 * Hardened operational search interface built on top of cmdk to handle rapid layout indexing.
 * Version: Launch Candidate · Phase Z0 Geometric Balance Lock
 */
const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover/95 backdrop-blur-md text-popover-foreground border border-border/40 text-left antialiased transform-gpu",
      className,
    )}
    {...props}
  />
));
Command.displayName = "Command_Core_Matrix_Node";

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg border-none max-w-xl rounded-xl bg-transparent">
        <Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:font-extrabold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[9px] [&_[cmdk-group-heading]]:text-primary/60 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-1.5 [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4 [&_[cmdk-input]]:h-11 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
};
CommandDialog.displayName = "Command_Dialog_Enclosure_Node";

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="flex items-center border-b border-border/10 px-3 w-full shrink-0 relative leading-none"
    cmdk-input-wrapper=""
  >
    <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground/50 stroke-[2.5]" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-11 w-full bg-transparent py-3 text-xs sm:text-sm font-bold text-foreground/90 outline-none placeholder:text-muted-foreground/40 placeholder:font-normal placeholder:not-italic disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
    <div className="ml-2 hidden sm:flex items-center gap-1 opacity-35 select-none pointer-events-none font-mono text-[8px] font-extrabold uppercase tracking-wider shrink-0">
      <Sparkles className="h-3 w-3 text-primary stroke-[2.2]" />
      <span>Link Locked</span>
    </div>
  </div>
));
CommandInput.displayName = "Command_Input_Node";

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "max-h-[320px] overflow-y-auto overflow-x-hidden p-1.5 scrollbar-thin scrollbar-thumb-border w-full block",
      className,
    )}
    {...props}
  />
));
CommandList.displayName = "Command_List_Node";

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-10 text-center font-mono text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground/40 select-none pointer-events-none w-full block"
    {...props}
  />
));
CommandEmpty.displayName = "Command_Empty_Node";

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground/90 w-full block [&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:block",
      className,
    )}
    {...props}
  />
));
CommandGroup.displayName = "Command_Group_Node";

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("h-px bg-border/10 my-1.5 w-full block shrink-0", className)}
    {...props}
  />
));
CommandSeparator.displayName = "Command_Separator_Node";

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-xs sm:text-sm font-bold outline-none transition-colors duration-150 transform-gpu w-full gap-2 text-foreground/80",
      "data-[selected='true']:bg-primary data-[selected='true']:text-primary-foreground",
      "data-[disabled='true']:pointer-events-none data-[disabled='true']:opacity-30",
      "selection:bg-transparent",
      className,
    )}
    {...props}
  />
));
CommandItem.displayName = "Command_Item_Node";

const CommandShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <kbd
      className={cn(
        "ml-auto h-4 min-w-[16px] inline-flex items-center justify-center select-none rounded border border-border/40 bg-muted/40 px-1 font-mono text-[9px] font-extrabold tracking-normal text-muted-foreground/60 leading-none shadow-xs pointer-events-none pt-0.5",
        className,
      )}
      {...props}
    >
      {props.children}
    </kbd>
  );
};
CommandShortcut.displayName = "Command_Shortcut_Node";

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
