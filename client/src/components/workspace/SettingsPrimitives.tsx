import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WorkspaceSection, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { ChevronDown, LockKeyhole } from "lucide-react";
import React, { type ReactNode, useState } from "react";

export type SettingsNavItem = { id: string; label: string; ownerOnly?: boolean };

export function SettingsSectionNav({ items, activeId, onChange, isOwner }: { items: SettingsNavItem[]; activeId: string; onChange: (id: string) => void; isOwner: boolean }) {
  return <nav className="border-b border-border" aria-label="პარამეტრების სექციები"><div className="-mb-px flex gap-1 overflow-x-auto">{items.filter(item => !item.ownerOnly || isOwner).map(item => <Button key={item.id} type="button" variant="ghost" className={`min-h-11 shrink-0 justify-start rounded-b-none border-b-2 ${activeId === item.id ? "border-foreground font-bold text-foreground" : "border-transparent text-muted-foreground"}`} aria-pressed={activeId === item.id} onClick={() => onChange(item.id)}>{item.label}</Button>)}</div></nav>;
}

export function SettingsSection({ id, title, description, children, action }: { id: string; title: string; description?: string; children: ReactNode; action?: ReactNode }) {
  return <section id={id} aria-label={title}><WorkspaceSection title={title} description={description} action={action}>{children}</WorkspaceSection></section>;
}

export function SettingsGuard({ children, allowed, description = "ხელმისაწვდომია მხოლოდ მფლობელისთვის." }: { children: ReactNode; allowed: boolean; description?: string }) {
  if (allowed) return <>{children}</>;
  return <div className="flex items-start gap-3 rounded-[12px] bg-[var(--sf-surface-2)] p-4"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><p className="text-sm text-muted-foreground">{description}</p></div>;
}

export function SettingsActionRow({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return <div className="flex flex-col gap-3 border-t border-border py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold">{title}</p>{description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}</div>{children ? <div className="shrink-0">{children}</div> : null}</div>;
}

export function SettingsReadinessPanel({ category, title, description, requirements }: { category: string; title: string; description: string; requirements: string[] }) {
  const [open, setOpen] = useState(false);
  return <Collapsible open={open} onOpenChange={setOpen} className="rounded-[12px] bg-[var(--sf-surface-2)]"><CollapsibleTrigger asChild><button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><span><span className="block text-sm font-semibold">{category}</span><span className="mt-1 block text-sm text-muted-foreground">{title}</span></span><span className="flex items-center gap-2"><WorkspaceStatusPill tone="warning">ჯერ არ არის აქტიური</WorkspaceStatusPill><ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" /></span></button></CollapsibleTrigger><CollapsibleContent><div className="border-t px-4 pb-4 pt-3"><p className="text-sm text-muted-foreground">{description}</p><p className="mt-3 text-xs font-semibold text-muted-foreground">გასააქტიურებლად საჭიროა</p><ul className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">{requirements.map(requirement => <li key={requirement} className="border-t border-border py-1.5">{requirement}</li>)}</ul></div></CollapsibleContent></Collapsible>;
}
