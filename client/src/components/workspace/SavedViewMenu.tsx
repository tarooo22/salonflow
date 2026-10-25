import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type SavedViewPayload = { view?: "day" | "week"; locationId?: string; staffFilter?: string; period?: "7d" | "30d" | "90d"; clientStatus?: "ACTIVE"; clientSource?: "INTERNAL" | "PUBLIC_WEB" };
type SavedViewRoute = "/app/calendar" | "/app/clients" | "/app/reports";

function isSavedViewPayload(value: unknown): value is SavedViewPayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const payload = value as Record<string, unknown>;
  return Object.keys(payload).every(key => ["view", "locationId", "staffFilter", "period", "clientStatus", "clientSource"].includes(key));
}

/** `open`/`onOpenChange` + `hideTrigger` let a parent open the popover from its own menu item; the default stays self-contained. */
export function SavedViewMenu({ organizationId, route, filterPayload, onApply, open, onOpenChange, hideTrigger }: { organizationId: string; route: SavedViewRoute; filterPayload: SavedViewPayload; onApply: (payload: SavedViewPayload) => void; open?: boolean; onOpenChange?: (open: boolean) => void; hideTrigger?: boolean }) {
  const utils = trpc.useUtils();
  const views = trpc.productivity.listSavedViews.useQuery({ organizationId, route }, { enabled: Boolean(organizationId) });
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const appliedDefaultId = useRef<string | null>(null);
  const save = trpc.productivity.saveSavedView.useMutation({ onSuccess: async () => { await utils.productivity.listSavedViews.invalidate({ organizationId, route }); setName(""); setIsDefault(false); toast.success("ხედის პარამეტრები შეინახა."); }, onError: () => toast.error("ხედის შენახვა ვერ მოხერხდა.") });
  const remove = trpc.productivity.deleteSavedView.useMutation({ onSuccess: () => void utils.productivity.listSavedViews.invalidate({ organizationId, route }), onError: () => toast.error("ხედის წაშლა ვერ მოხერხდა.") });

  useEffect(() => {
    const defaultView = views.data?.find(view => view.isDefault && view.schemaVersion === 1 && isSavedViewPayload(view.filterPayload));
    if (defaultView && isSavedViewPayload(defaultView.filterPayload) && appliedDefaultId.current !== defaultView.id) { appliedDefaultId.current = defaultView.id; onApply(defaultView.filterPayload); }
  }, [onApply, views.data]);

  const apply = (payload: unknown) => { if (isSavedViewPayload(payload)) onApply(payload); else toast.message("ეს შენახული ხედი მოძველებულია; გამოყენებულია უსაფრთხო ნაგულისხმევი პარამეტრები."); };
  return <Popover open={open} onOpenChange={onOpenChange} modal={hideTrigger}>{hideTrigger ? <PopoverAnchor asChild><span aria-hidden="true" /></PopoverAnchor> : <PopoverTrigger asChild><Button variant="outline" size="sm" className="size-11 bg-card px-0 sm:h-8 sm:w-auto sm:px-3" aria-label="ხედები"><Bookmark className="size-4 sm:mr-1.5" aria-hidden="true" /><span className="hidden sm:inline">ხედები</span></Button></PopoverTrigger>}<PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">შენახული ხედები</p><p className="text-xs text-muted-foreground">მხოლოდ თქვენი სამუშაო სივრცისთვის</p></div><span className="text-xs text-muted-foreground">{views.data?.length ?? 0}</span></div><div className="mt-3 space-y-2"><Input value={name} onChange={event => setName(event.target.value)} maxLength={80} placeholder="მაგ. ჩემი კვირის კალენდარი" aria-label="ხედის სახელი" /><label className="flex min-h-9 items-center gap-2 text-xs text-muted-foreground"><Checkbox checked={isDefault} onCheckedChange={checked => setIsDefault(checked === true)} /><span>გამოიყენე ავტომატურად ამ გვერდის გახსნისას</span></label><Button type="button" size="sm" className="w-full" disabled={name.trim().length < 2 || save.isPending} onClick={() => save.mutate({ organizationId, route, name: name.trim(), filterPayload, isDefault })}>{save.isPending ? "ინახება…" : "მიმდინარე ხედის შენახვა"}</Button></div><div className="mt-3 max-h-56 space-y-1 overflow-y-auto border-t pt-2">{views.isLoading ? <p className="px-1 py-3 text-xs text-muted-foreground">ხედები იტვირთება…</p> : null}{!views.isLoading && !views.data?.length ? <p className="px-1 py-3 text-xs leading-5 text-muted-foreground">ჯერ არ გაქვთ შენახული ფილტრი ან ხედის პარამეტრი.</p> : null}{views.data?.map(view => <div key={view.id} className="flex items-center gap-1 rounded-lg p-1 hover:bg-muted/50"><button type="button" onClick={() => apply(view.filterPayload)} className="min-h-10 min-w-0 flex-1 rounded-md px-2 text-left text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="flex items-center gap-1.5 font-medium">{view.isDefault ? <BookmarkCheck className="size-3.5 text-primary" /> : null}{view.name}</span></button><Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-destructive" aria-label={`${view.name} წაშლა`} disabled={remove.isPending} onClick={() => remove.mutate({ organizationId, id: view.id })}><Trash2 className="size-3.5" /></Button></div>)}</div></PopoverContent></Popover>;
}
