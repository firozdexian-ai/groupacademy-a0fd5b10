import { useState } from "react";
import { useUgcGraph } from "./hooks/useUgcGraph";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, MessageSquare, ShieldCheck, User, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmPurge } from "@/platform/admin/ui/ConfirmPurge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";


export function UgcFeedTab() {
 const { ugcGraphQuery, mutations: { upsertFeedPost, deleteFeedPost } } = useUgcGraph();
 const { data, isLoading } = ugcGraphQuery;
 const [open, setOpen] = useState(false);
 const [draft, setDraft] = useState<unknown>({ content_type: "text", status: "published", is_active: true, is_pinned: false, audience: "network" });
 const [search, setSearch] = useState("");

 const rows = (data?.feedPosts ?? []).filter((r) =>
 !search || r.text_content?.toLowerCase().includes(search.toLowerCase()) || r.author_name?.toLowerCase().includes(search.toLowerCase())
 );

 return (
 <div className="space-y-6">
 <div className="flex items-start justify-between gap-4 flex-wrap">
 <div>
 <div className="flex items-center gap-2">
 <MessageSquare className="h-5 w-5 text-primary" />
 <h2 className="text-2xl font-medium tracking-tight">Global Feed</h2>
 </div>
 <p className="text-sm text-muted-foreground mt-1">User Generated Posts &amp; Discussions</p>
 </div>
 <Button
 onClick={() => { setDraft({ content_type: "text", status: "published", is_active: true, is_pinned: false, audience: "network" }); setOpen(true); }}
 className="h-12 px-8 rounded-xl font-medium text-xs gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground"
 >
 <Plus className="h-4 w-4" /> Inject Post
 </Button>
 </div>

 <div className="relative max-w-sm">
 <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
 <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content or author..." className="pl-10 h-11 rounded-xl border" />
 </div>

 <Card className="border">
 <CardHeader className="pb-2 flex flex-row items-center gap-2">
 <ShieldCheck className="h-4 w-4 text-primary" />
 <h3 className="text-sm font-medium tracking-wide">Feed Registry ({rows.length})</h3>
 </CardHeader>
 <CardContent className="p-0">
 <Table>
  <TableHeader>
  <TableRow>
  <TableHead>Content Preview</TableHead>
  <TableHead>Author</TableHead>
  <TableHead>Type</TableHead>
  <TableHead>Audience</TableHead>
  <TableHead>Status</TableHead>
  <TableHead>Active</TableHead>
  <TableHead>Pinned</TableHead>
  <TableHead>Created</TableHead>
  <TableHead className="text-right">Actions</TableHead>
  </TableRow>
  </TableHeader>
  <TableBody>
  {isLoading ? (
  <TableRow><TableCell colSpan={9}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
  ) : rows.length === 0 ? (
  <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-10">Zero posts detected.</TableCell></TableRow>
  ) : (
  rows.map((row) => (
  <TableRow key={row.id}>
  <TableCell>
  <div className="flex items-center gap-2 font-medium max-w-md">
  <MessageSquare className="h-4 w-4 text-primary shrink-0" />
  <span className="truncate">
  {row.text_content ? row.text_content.substring(0, 60) + (row.text_content.length > 60 ? "â€¦" : "") : "(no text)"}
  </span>
  </div>
  </TableCell>
  <TableCell className="text-xs text-muted-foreground">
  <span className="inline-flex items-center gap-1">
  <User className="h-3 w-3" />
  {row.author_name || (row.author_user_id ? row.author_user_id.substring(0, 8) : "System")}
  </span>
  </TableCell>
  <TableCell className="text-[10px] uppercase font-bold tabular-nums">{row.content_type}</TableCell>
  <TableCell className="text-[10px] uppercase font-bold text-muted-foreground">{row.audience || "network"}</TableCell>
  <TableCell>
  <Badge
  variant="outline"
  className={cn(
  "uppercase text-[10px] font-medium",
  row.status === "published" && "border-success text-success bg-success/5",
  row.status === "draft" && "border-muted-foreground text-muted-foreground bg-muted/5",
  row.status === "removed" && "border-destructive text-destructive bg-destructive/5"
  )}
  >
  {row.status || "published"}
  </Badge>
  </TableCell>
  <TableCell>
  <Badge
  variant="outline"
  className={cn(
  "uppercase text-[10px] font-medium",
  row.is_active ? "border-success text-success bg-success/5" : "border-destructive text-destructive bg-destructive/5"
  )}
  >
  {row.is_active ? "Active" : "Inactive"}
  </Badge>
  </TableCell>
  <TableCell>
  <Badge
  variant="outline"
  className={cn(
  "uppercase text-[10px] font-medium",
  row.is_pinned ? "border-warning text-warning bg-warning/5" : "border-muted-foreground text-muted-foreground bg-muted/5"
  )}
  >
  {row.is_pinned ? "Pinned" : "No"}
  </Badge>
  </TableCell>
  <TableCell className="text-xs text-muted-foreground tabular-nums">
  {new Date(row.created_at).toLocaleDateString()}
  </TableCell>
  <TableCell className="text-right">
  <div className="flex items-center justify-end gap-1">
  <Button size="icon" aria-label="Edit" variant="ghost" onClick={() => { setDraft(row); setOpen(true); }} className="hover:bg-primary/10 hover:text-primary">
  <Pencil className="h-4 w-4" />
  </Button>
  <ConfirmPurge title="Purge Post?" description="This removes the feed post permanently." onConfirm={() => deleteFeedPost.mutate(row.id)}>
  <Button size="icon" aria-label="Delete" variant="ghost" className="hover:bg-destructive/10 hover:text-destructive">
  <Trash2 className="h-4 w-4" />
  </Button>
  </ConfirmPurge>
  </div>
  </TableCell>
  </TableRow>
  ))
  )}
  </TableBody>
 </Table>
 </CardContent>
 </Card>

 <Dialog open={open} onOpenChange={setOpen}>
 <DialogContent className="max-w-lg">
 <DialogHeader>
 <DialogTitle className="flex items-center gap-2 text-xl font-medium">
 <MessageSquare className="h-5 w-5 text-primary" /> {draft.id ? "Edit" : "Inject"} Post
 </DialogTitle>
 <DialogDescription>
 {draft.id && draft.author_name ? `Editing post by ${draft.author_name}` : "Raw feed content."}
 </DialogDescription>
 </DialogHeader>
  <div className="space-y-3 py-2">
  <div className="grid grid-cols-2 gap-3">
  <div className="space-y-1.5">
  <Label className="text-xs font-bold uppercase tracking-wide">Author Name</Label>
  <Input value={draft.author_name || ""} onChange={(e) => setDraft({ ...draft, author_name: e.target.value })} placeholder="Leave empty for Admin/Email" className="h-11 rounded-xl border" />
  </div>
  <div className="space-y-1.5">
  <Label className="text-xs font-bold uppercase tracking-wide">Author Title</Label>
  <Input value={draft.author_title || ""} onChange={(e) => setDraft({ ...draft, author_title: e.target.value })} placeholder="e.g. CEO, Community Lead" className="h-11 rounded-xl border" />
  </div>
  </div>

  <div className="grid grid-cols-2 gap-3">
  <div className="space-y-1.5">
  <Label className="text-xs font-bold uppercase tracking-wide">Type</Label>
  <Select value={draft.content_type || "text"} onValueChange={(v) => setDraft({ ...draft, content_type: v })}>
  <SelectTrigger className="h-11 rounded-xl border font-bold"><SelectValue /></SelectTrigger>
  <SelectContent>
  <SelectItem value="text">Text</SelectItem>
  <SelectItem value="poll">Poll</SelectItem>
  <SelectItem value="tip">Tip</SelectItem>
  <SelectItem value="news">News</SelectItem>
  <SelectItem value="announcement">Announcement</SelectItem>
  <SelectItem value="media">Media</SelectItem>
  </SelectContent>
  </Select>
  </div>
  <div className="space-y-1.5">
  <Label className="text-xs font-bold uppercase tracking-wide">Audience</Label>
  <Select value={draft.audience || "network"} onValueChange={(v) => setDraft({ ...draft, audience: v })}>
  <SelectTrigger className="h-11 rounded-xl border font-bold"><SelectValue /></SelectTrigger>
  <SelectContent>
  <SelectItem value="network">Network (Global)</SelectItem>
  <SelectItem value="internal">Internal (Company)</SelectItem>
  </SelectContent>
  </Select>
  </div>
  </div>

  <div className="grid grid-cols-3 gap-3 items-end">
  <div className="space-y-1.5">
  <Label className="text-xs font-bold uppercase tracking-wide">Status</Label>
  <Select value={draft.status || "published"} onValueChange={(v) => setDraft({ ...draft, status: v })}>
  <SelectTrigger className="h-11 rounded-xl border font-bold"><SelectValue /></SelectTrigger>
  <SelectContent>
  <SelectItem value="draft">Draft</SelectItem>
  <SelectItem value="published">Published</SelectItem>
  <SelectItem value="archived">Archived</SelectItem>
  </SelectContent>
  </Select>
  </div>
  <div className="flex items-center justify-between rounded-xl border px-3 h-11">
  <Label className="text-xs font-bold uppercase tracking-wide">Active</Label>
  <Switch checked={!!draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} />
  </div>
  <div className="flex items-center justify-between rounded-xl border px-3 h-11">
  <Label className="text-xs font-bold uppercase tracking-wide">Pinned</Label>
  <Switch checked={!!draft.is_pinned} onCheckedChange={(v) => setDraft({ ...draft, is_pinned: v })} />
  </div>
  </div>

  <div className="space-y-1.5">
  <Label className="text-xs font-bold uppercase tracking-wide">Body</Label>
  <Textarea value={draft.text_content || ""} onChange={(e) => setDraft({ ...draft, text_content: e.target.value })} className="min-h-[150px] rounded-xl border font-mono text-sm" />
  </div>
  </div>
 <DialogFooter>
 <Button
 disabled={!draft.text_content || upsertFeedPost.isPending}
 onClick={() => upsertFeedPost.mutate(draft, { onSuccess: () => setOpen(false) })}
 className="h-12 rounded-xl font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
 >
 <ShieldCheck className="mr-2 h-5 w-5" /> Authorize
 </Button>
 </DialogFooter>
 </DialogContent>
 </Dialog>
 </div>
 );
}

export default UgcFeedTab;


