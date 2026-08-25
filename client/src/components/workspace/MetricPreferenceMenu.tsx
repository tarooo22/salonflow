import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { SlidersHorizontal } from "lucide-react";
import React, { useMemo } from "react";
import { toast } from "sonner";

type MetricKey = "BOOKINGS" | "PENDING" | "SCHEDULED" | "OUTSTANDING" | "UP_NEXT";
const labels: Record<MetricKey, string> = { BOOKINGS: "დღის ჯავშნები", PENDING: "მომლოდინე", SCHEDULED: "დაგეგმილი თანხა", OUTSTANDING: "დარჩენილი ბალანსი", UP_NEXT: "შემდეგი ვიზიტი" };

export function MetricPreferenceMenu({ organizationId, allowedKeys, selectedKeys }: { organizationId: string; allowedKeys: readonly MetricKey[]; selectedKeys: MetricKey[] }) {
  const utils = trpc.useUtils();
  const selected = useMemo(() => selectedKeys.filter(key => allowedKeys.includes(key)).slice(0, 2), [allowedKeys, selectedKeys]);
  const save = trpc.productivity.savePreferences.useMutation({ onSuccess: () => { void utils.productivity.preferences.invalidate({ organizationId }); toast.success("პრიორიტეტული მაჩვენებლები განახლდა."); }, onError: () => toast.error("მაჩვენებლების განახლება ვერ მოხერხდა.") });
  const toggle = (key: MetricKey) => {
    const next = selected.includes(key) ? selected.filter(item => item !== key) : [...selected, key].slice(-2);
    if (next.length < 2) { toast.message("აირჩიეთ ორი პრიორიტეტული მაჩვენებელი."); return; }
    save.mutate({ organizationId, metricKeys: next });
  };
  return <Popover><PopoverTrigger asChild><Button type="button" variant="outline" size="sm" className="bg-card"><SlidersHorizontal className="mr-1.5 size-4" />მაჩვენებლები</Button></PopoverTrigger><PopoverContent align="end" className="w-72 p-3"><p className="text-sm font-semibold">პირველი ორი მაჩვენებელი</p><p className="mt-1 text-xs leading-5 text-muted-foreground">აირჩიეთ რომელი მაჩვენებლები გამოჩნდეს Day Command Center-ის დასაწყისში.</p><div className="mt-3 space-y-1">{allowedKeys.map(key => <label key={key} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-muted/50"><Checkbox checked={selected.includes(key)} disabled={save.isPending || (!selected.includes(key) && selected.length >= 2)} onCheckedChange={() => toggle(key)} /><span>{labels[key]}</span></label>)}</div></PopoverContent></Popover>;
}
