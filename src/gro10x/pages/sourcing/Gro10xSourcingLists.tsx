import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTalentLists, useCreateTalentList, useListMembers } from "@/domains/profile/hooks/useTalentLists";
import { useActiveCompany } from "@/gro10x/hooks/useActiveCompany";
import { GRO10X_BG, GRO10X_TEXT, GRO10X_PANEL, GRO10X_MUTED } from "@/gro10x/lib/tokens";
import { Plus, Users, X, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Gro10xLoading } from "@/gro10x/components/Gro10xLoading";

export default function Gro10xSourcingLists() {
  const { companyId } = useActiveCompany();
  const { data: lists, isLoading } = useTalentLists(companyId);
  const create = useCreateTalentList();
  const [name, setName] = useState("");
  const [selectedList, setSelectedList] = useState<unknown | null>(null);

  const handleCreate = async () => {
    if (!companyId || !name.trim()) return;
    await create.mutateAsync({ companyId, name: name.trim() });
    setName("");
    toast.success("List created");
  };

  return (
    <div className={`min-h-screen ${GRO10X_BG} ${GRO10X_TEXT} pb-24 px-4 pt-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Talent Lists</h1>
        <Link to="/gro10x/sourcing" className="text-xs text-[#33E1E4]">
          Search â†’
        </Link>
      </div>

      <div className={`${GRO10X_PANEL} rounded-2xl p-3 border border-white/5 flex gap-2`}>
        <Input
          placeholder="New list name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent border-white/10"
        />
        <Button size="sm" onClick={handleCreate} disabled={!name.trim() || create.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && <Gro10xLoading label="Loading listsâ€¦" />}

      <div className="space-y-2">
        {(lists ?? []).map((l) => (
          <Card
            key={l.id}
            onClick={() => setSelectedList(l)}
            className={`${GRO10X_PANEL} border-white/5 p-3 cursor-pointer hover:bg-white/5 transition-colors`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-slate-100">{l.name}</p>
                {l.description && (
                  <p className={`text-xs ${GRO10X_MUTED} truncate`}>{l.description}</p>
                )}
              </div>
              <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {l.member_count}
              </span>
            </div>
          </Card>
        ))}
        {!isLoading && (lists ?? []).length === 0 && (
          <p className={`text-sm ${GRO10X_MUTED} text-center py-8`}>
            No lists yet. Create one to start curating talent.
          </p>
        )}
      </div>

      {selectedList && (
        <ListMembersSheet
          list={selectedList}
          onClose={() => setSelectedList(null)}
        />
      )}
    </div>
  );
}

function ListMembersSheet({ list, onClose }: { list: unknown; onClose: () => void }) {
  const { data: members, isLoading } = useListMembers(list.id);

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[80vh] max-h-[80vh] rounded-t-2xl border-t border-white/10 bg-[#0B1220]/95 backdrop-blur-xl flex flex-col p-4 sm:p-5 text-left antialiased text-slate-100 outline-none"
      >
        <SheetHeader className="mb-4 text-left shrink-0 w-full flex flex-row items-center justify-between">
          <div className="min-w-0 flex-1">
            <SheetTitle className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wide truncate">
              {list.name} Candidates
            </SheetTitle>
            <SheetDescription className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none pt-1">
              Inspect curated talent nodes in this sourcing playlist
            </SheetDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full border border-white/10 hover:bg-white/5 text-slate-400 hover:text-slate-100 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        <ScrollArea className="flex-1 w-full min-w-0 pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[#33E1E4]" />
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                Synchronizing roster...
              </span>
            </div>
          ) : !members || members.length === 0 ? (
            <div className="text-center py-20 opacity-30 flex flex-col items-center justify-center gap-3">
              <Users className="h-12 w-12 text-slate-400" />
              <p className="text-xs font-bold uppercase tracking-widest">No candidates in this list</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pb-6">
              {members.map((m) => {
                if (!m.talents) return null;
                return (
                  <Card
                    key={m.id}
                    className={`${GRO10X_PANEL} border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:bg-white/[0.08] transition-all`}
                  >
                    <div className="flex gap-3">
                      <Avatar className="h-10 w-10 border border-white/10 shrink-0">
                        <AvatarImage src={m.talents.profile_photo_url ?? undefined} />
                        <AvatarFallback className="bg-[#0B1220] text-slate-200">
                          {m.talents.full_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold truncate text-slate-100">
                          {m.talents.full_name}
                        </h4>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {m.talents.custom_profession || "Candidate Node"}
                        </p>
                        {m.talents.country && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 font-medium">
                            <MapPin className="h-3 w-3 text-slate-500" />
                            <span>{m.talents.country}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {m.note && (
                      <div className="mt-3 p-2.5 rounded-xl bg-black/20 border border-white/5 text-[11px] text-slate-300 italic font-medium leading-normal">
                        Note: {m.note}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 shrink-0">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                        Added {new Date(m.added_at).toLocaleDateString()}
                      </span>
                      {m.talents.public_handle ? (
                        <Link
                          to={`/t/${m.talents.public_handle}`}
                          onClick={onClose}
                          className="text-xs font-bold text-[#33E1E4] hover:underline flex items-center gap-1"
                        >
                          View Profile &rarr;
                        </Link>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 uppercase">No Handle</span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}


