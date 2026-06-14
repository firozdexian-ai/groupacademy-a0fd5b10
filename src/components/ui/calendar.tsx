import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * GroUp Academy: Authoritative Temporal Scheduling Matrix Node (Calendar)
 * Hardened calendar terminal ensuring pixel-perfect scheduling layouts and full compatibility with react-day-picker v9+.
 * Version: Launch Candidate Â· Phase Z0 Hardened
 */
function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "p-4 border border-border/40 bg-card/95 backdrop-blur-md rounded-xl shadow-xs select-none antialiased max-w-fit block transform-gpu text-center",
        className,
      )}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 items-start justify-center",
        month: "space-y-3.5 min-w-0 flex flex-col justify-center",
        caption: "flex justify-between items-center relative w-full h-8 leading-none px-1 select-none shrink-0 mb-1",
        caption_label: "text-xs font-bold text-foreground uppercase tracking-wide leading-none pt-0.5",
        nav: "flex items-center gap-1 shrink-0 select-none",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 rounded-lg text-muted-foreground/60 hover:text-foreground hover:bg-accent shrink-0 flex items-center justify-center cursor-pointer border border-border/40",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1 block select-none pointer-events-auto",
        head_row: "flex items-center justify-between w-full mb-1.5 shrink-0",
        head_cell:
          "text-muted-foreground/40 font-mono text-[9px] font-extrabold uppercase tracking-wider w-9 h-4 flex items-center justify-center shrink-0 leading-none",
        row: "flex items-center justify-between w-full mt-1 shrink-0",
        cell: cn(
          "relative p-0 text-center text-xs font-bold w-9 h-9 shrink-0 flex items-center justify-center focus-within:relative focus-within:z-20 transition-colors rounded-lg",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:bg-primary/5 [&:has(>.day-range-start)]:bg-primary/5 [&:has(>.day-range-end)]:rounded-r-lg [&:has(>.day-range-start)]:rounded-l-lg"
            : "[&:has([aria-selected])]:bg-primary/5",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-bold font-mono text-xs text-foreground/80 hover:bg-accent hover:text-foreground rounded-lg transition-all aria-selected:opacity-100 flex items-center justify-center shrink-0 cursor-pointer border border-transparent pt-0.5",
        ),
        day_range_start:
          "day-range-start bg-primary text-primary-foreground hover:bg-primary/90 rounded-l-lg rounded-r-none border-transparent",
        day_range_end:
          "day-range-end bg-primary text-primary-foreground hover:bg-primary/90 rounded-r-lg rounded-l-none border-transparent",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-sm rounded-lg border-transparent",
        day_today: "bg-muted/40 border border-border/60 rounded-lg text-primary font-black",
        day_outside:
          "day-outside text-muted-foreground/20 opacity-40 hover:bg-transparent hover:text-muted-foreground/20 pointer-events-none select-none",
        day_disabled: "text-muted-foreground/10 opacity-20 pointer-events-none select-none cross-lines",
        day_range_middle: "aria-selected:bg-primary/10 aria-selected:text-primary rounded-none font-bold",
        day_hidden: "invisible select-none pointer-events-none",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4 stroke-[2.5]" />,
        IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4 stroke-[2.5]" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar_Core_Scheduling_Node";

export { Calendar };

