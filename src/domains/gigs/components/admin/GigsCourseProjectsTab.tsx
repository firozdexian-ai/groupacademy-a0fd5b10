import { useState } from "react";
import { useGigGraph } from "./hooks/useGigGraph";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Layers, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function GigsCourseProjectsTab() {
 const {
 gigGraphQuery,
 mutations: { upsertCourseProject, deleteCourseProject },
 } = useGigGraph();
 const { data, isLoading } = gigGraphQuery;
 const [open, setOpen] = useState(false);
 const [draft, setDraft] = useState<unknown>({ status: "draft" });

 return (
 <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
 <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
 <div className="space-y-1 text-left">
 <div className="flex items-center gap-3 text-emerald-500">
 <Layers className="h-8 w-8 text-emerald-500 fill-emerald-500/20" />
 <h2 className="text-3xl font-medium tracking-tighter italic leading-none text-foreground">
 Course Projects
 </h2>
 </div>
 <p className="text-[10px] font-medium tracking-[0.3em] text-muted-foreground/60 italic">
 Educational Deliverables & Assignments
 </p>
 </div>
 <Button
 onClick={() => {
 setDraft({ status: "draft" });
 setOpen(true);
 }}
 className="h-12 px-8 rounded-xl font-medium text-xs gap-2 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white"
 >
 <Plus className="h-4 w-4" /> Inject Project
 </Button>
 </header>

 <Card className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
 <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600" />
 <CardContent className="p-0">
 <div className="overflow-x-auto">
 <Table>
 <TableHeader className="bg-muted/10 border-b border-border/20">
 <TableRow className="hover:bg-transparent">
 <TableHead className="font-medium text-xs py-5 pl-8">
 Project Definition
 </TableHead>
 <TableHead className="font-medium text-xs">Status</TableHead>
 <TableHead className="font-medium text-xs text-right">
 Published
 </TableHead>
 <TableHead className="text-right py-5 pr-8">Manage</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody className="divide-y divide-border/5">
 {isLoading ? (
 <TableRow>
 <TableCell colSpan={4} className="py-20 text-center">
 <Skeleton className="h-8 w-32 mx-auto" />
 </TableCell>
 </TableRow>
 ) : data?.courseProjects?.length === 0 ? (
 <TableRow>
 <TableCell
 colSpan={4}
 className="py-20 text-center font-medium text-xs text-muted-foreground/50 italic"
 >
 Zero projects detected.
 </TableCell>
 </TableRow>
 ) : (
 data?.courseProjects?.map((row) => (
 <TableRow key={row.id} className="group hover:bg-emerald-500/[0.02]">
 <TableCell className="py-6 pl-8">
 <div className="flex items-center gap-3">
 <div className="h-8 w-8 rounded-lg bg-background border border-border/40 flex items-center justify-center shrink-0">
 <Layers className="h-3 w-3 text-emerald-500" />
 </div>
 <span className="font-black text-sm font-medium">{row.title}</span>
 </div>
 </TableCell>
 <TableCell>
 <Badge
 className={cn(
 "font-bold text-[9px] border-none px-3 uppercase",
 row.status === "open" || row.status === "paid"
 ? "bg-emerald-500/10 text-emerald-600"
 : row.status === "claimed"
 ? "bg-blue-500/10 text-blue-600"
 : row.status === "in_progress"
 ? "bg-amber-500/10 text-amber-600"
 : row.status === "submitted"
 ? "bg-indigo-500/10 text-indigo-600"
 : row.status === "approved"
 ? "bg-teal-500/10 text-teal-600"
 : row.status === "abandoned"
 ? "bg-rose-500/10 text-rose-600"
 : "bg-muted text-muted-foreground",
 )}
 >
 {row.status}
 </Badge>
 </TableCell>
 <TableCell className="text-right font-mono text-[10px] text-muted-foreground">
 {new Date(row.created_at).toLocaleDateString()}
 </TableCell>
 <TableCell className="text-right pr-8">
 <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
 <Button
 variant="ghost"
 size="icon" aria-label="Edit"
 onClick={() => {
 setDraft(row);
 setOpen(true);
 }}
 className="hover:bg-emerald-500/10 hover:text-emerald-600"
 >
 <Pencil className="h-4 w-4" />
 </Button>
 <Button
 variant="ghost"
 size="icon" aria-label="Delete"
 className="text-destructive hover:bg-destructive/10"
 onClick={() => {
 if (confirm("Purge Project?")) deleteCourseProject.mutate(row.id);
 }}
 >
 <Trash2 className="h-4 w-4" />
 </Button>
 </div>
 </TableCell>
 </TableRow>
 ))
 )}
 </TableBody>
 </Table>
 </div>
 </CardContent>
 </Card>

 <Dialog open={open} onOpenChange={setOpen}>
 <DialogContent className="max-w-md rounded-2xl p-8 border-4 border-border/40 text-left">
 <DialogHeader>
 <DialogTitle className="text-2xl font-semibold text-emerald-500 flex items-center gap-2">
 <Layers className="h-6 w-6" /> Inject Project
 </DialogTitle>
 <DialogDescription className="text-sm text-muted-foreground">
 Update course project parameters.
 </DialogDescription>
 </DialogHeader>
 <div className="space-y-4 py-4">
 <div className="space-y-2">
 <Label className="text-[10px] font-black text-primary ml-1">
 Project Title
 </Label>
 <Input
 placeholder="Title"
 value={draft.title || ""}
 onChange={(e) => setDraft({ ...draft, title: e.target.value })}
 className="h-14 rounded-xl border font-bold"
 />
 </div>
 <div className="space-y-2">
 <Label className="text-[10px] font-black text-primary ml-1">
 Deployment Status
 </Label>
 <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v })}>
 <SelectTrigger className="h-14 rounded-xl border font-bold text-xs uppercase">
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="open" className="font-bold text-xs text-emerald-500">
 Open
 </SelectItem>
 <SelectItem value="claimed" className="font-bold text-xs text-blue-500">
 Claimed
 </SelectItem>
 <SelectItem value="in_progress" className="font-bold text-xs text-amber-500">
 In Progress
 </SelectItem>
 <SelectItem value="submitted" className="font-bold text-xs text-indigo-500">
 Submitted
 </SelectItem>
 <SelectItem value="approved" className="font-bold text-xs text-teal-500">
 Approved
 </SelectItem>
 <SelectItem value="paid" className="font-bold text-xs text-emerald-500">
 Paid
 </SelectItem>
 <SelectItem value="abandoned" className="font-bold text-xs text-rose-500">
 Abandoned
 </SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 <Button
 disabled={!draft.title || upsertCourseProject.isPending}
 onClick={() => upsertCourseProject.mutate(draft, { onSuccess: () => setOpen(false) })}
 className="h-14 rounded-xl font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
 >
 <ShieldCheck className="mr-2 h-5 w-5" /> Authorize
 </Button>
 </DialogContent>
 </Dialog>
 </div>
 );
}

export default GigsCourseProjectsTab;


