import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { WorkspaceSection, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { ChevronDown, LockKeyhole } from "lucide-react";
import React, { type ReactNode, useState } from "react";

export type SettingsNavItem = { id: string; label: string; ownerOnly?: boolean };

export function SettingsSectionNav({ items, activeId, onChange, isOwner }: { items: SettingsNavItem[]; activeId: string; onChange: (id: string) => void; isOwner: boolean }) {
  return <nav className="rounded-2xl border bg-card/80 p-2 shadow-sm" aria-label="პარამეტრების სექციები"><div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-4">{items.filter(item => !item.ownerOnly || isOwner).map(item => <Button key={item.id} type="button" variant={activeId === item.id ? "default" : "ghost"} className="min-h-11 justify-start" aria-pressed={activeId === item.id} onClick={() => onChange(item.id)}>{item.label}</Button>)}</div></nav>;
}

export function SettingsSection({ id, title, description, children, action }: { id: string; title: string; description: string; children: ReactNode; action?: ReactNode }) {
  return <section id={id} aria-label={title}><WorkspaceSection title={title} description={description} action={action}>{children}</WorkspaceSection></section>;
}

export function SettingsGuard({ children, allowed, description = "ეს კონტროლი ხელმისაწვდომია მხოლოდ სამუშაო სივრცის მფლობელისთვის." }: { children: ReactNode; allowed: boolean; description?: string }) {
  if (allowed) return <>{children}</>;
  return <div className="flex items-start gap-3 rounded-xl border border-dashed bg-muted/20 p-4"><LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><p className="text-sm leading-6 text-muted-foreground">{description}</p></div>;
}

export function SettingsActionRow({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return <div className="flex flex-col gap-3 rounded-xl border bg-muted/15 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div>{children ? <div className="shrink-0">{children}</div> : null}</div>;
}

export function SettingsReadinessPanel({ category, title, description, requirements }: { category: string; title: string; description: string; requirements: string[] }) {
  const [open, setOpen] = useState(false);
  return <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border border-dashed bg-muted/10"><CollapsibleTrigger asChild><button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><span><span className="block text-sm font-semibold">{category}</span><span className="mt-1 block text-sm text-muted-foreground">{title}</span></span><span className="flex items-center gap-2"><WorkspaceStatusPill tone="warning">ჯერ არ არის აქტიური</WorkspaceStatusPill><ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" /></span></button></CollapsibleTrigger><CollapsibleContent><div className="border-t px-4 pb-4 pt-3"><p className="text-sm leading-6 text-muted-foreground">{description}</p><p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">გასააქტიურებლად საჭიროა</p><ul className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">{requirements.map(requirement => <li key={requirement} className="rounded-lg bg-background/70 px-2.5 py-2">{requirement}</li>)}</ul></div></CollapsibleContent></Collapsible>;
}
