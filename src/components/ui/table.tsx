import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Authoritative Registry Ledger Protocol Matrix (Table)
 * Hardened atomic data sheet ensuring zero visual row jitters and insulating cell portals from overflow clipping.
 * Version: Launch Candidate · Phase Z0 Tabular Geometric Lock
 */
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full block overflow-x-auto scrollbar-thin select-text transform-gpu antialiased rounded-lg border border-border/60 bg-card/40">
      <table
        ref={ref}
        className={cn(
          "w-full border-collapse caption-bottom text-xs text-left antialiased table-auto m-0 p-0",
          className,
        )}
        {...props}
      />
    </div>
  ),
);
Table.displayName = "Table_Core_Ledger_Matrix";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn("bg-muted/30 border-b border-border/40 select-none pointer-events-none", className)}
      {...props}
    />
  ),
);
TableHeader.displayName = "Table_Core_Header_Node";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0 block-row-reconciliation", className)} {...props} />
  ),
);
TableBody.displayName = "Table_Core_Body_Node";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn(
        "border-t border-border/40 bg-muted/40 font-mono text-[10px] font-extrabold uppercase tracking-wide select-none pointer-events-none leading-none",
        className,
      )}
      {...props}
    />
  ),
);
TableFooter.displayName = "Table_Core_Footer_Node";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border/10 transition-colors duration-100 hover:bg-muted/20 data-[state=selected]:bg-muted/40",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "Table_Core_Row_Node";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "h-10 px-4 text-left align-middle font-mono text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground/50 leading-none pt-0.5 [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "Table_Core_Head_Cell_Node";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-4 py-2.5 align-middle font-medium text-foreground/80 leading-normal text-xs sm:text-sm tracking-tight text-wrap select-text [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    />
  ),
);
TableCell.displayName = "Table_Core_Data_Cell_Node";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn(
        "mt-4 px-4 pb-2 text-center font-mono text-[9px] font-bold uppercase tracking-wide text-muted-foreground/30 select-none block leading-none italic",
        className,
      )}
      {...props}
    />
  ),
);
TableCaption.displayName = "Table_Core_Caption_Node";

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
