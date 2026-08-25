import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { trpc } from "@/lib/trpc";
import type { WorkspaceRole } from "@/lib/dashboardExperience";
import { BarChart3, CalendarDays, ClipboardList, FileText, LayoutDashboard, Search, Settings2, Users, UsersRound } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

type CommandRoute = { label: string; hint: string; path: string; roles: WorkspaceRole[]; icon: typeof CalendarDays };

const commandRoutes: CommandRoute[] = [
  { label: "დღეს", hint: "დღის ფოკუსი და queue", path: "/app/today", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"], icon: LayoutDashboard },
  { label: "კალენდარი", hint: "დღის ან კვირის განრიგი", path: "/app/calendar", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"], icon: CalendarDays },
  { label: "კლიენტები", hint: "რეესტრი და ვიზიტების ისტორია", path: "/app/clients", roles: ["OWNER", "MANAGER", "RECEPTIONIST"], icon: UsersRound },
  { label: "ოპერაციები", hint: "დღიური პროცესები", path: "/app/operations", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"], icon: ClipboardList },
  { label: "სერვისები", hint: "სერვისები და ფასები", path: "/app/services", roles: ["OWNER"], icon: FileText },
  { label: "გუნდი", hint: "სპეციალისტები და სამუშაო კონტექსტი", path: "/app/staff", roles: ["OWNER", "STAFF"], icon: Users },
  { label: "ანგარიშები", hint: "რეალური მონაცემების ანალიზი", path: "/app/reports", roles: ["OWNER"], icon: BarChart3 },
  { label: "პარამეტრები", hint: "სამუშაო სივრცე და booking ბმული", path: "/app/settings", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"], icon: Settings2 },
];

export function CommandPalette({ open, onOpenChange, organizationId, role, restricted }: { open: boolean; onOpenChange: (open: boolean) => void; organizationId?: string; role: WorkspaceRole; restricted: boolean }) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const clientSearchAllowed = role === "OWNER" || role === "MANAGER" || role === "RECEPTIONIST";
  const normalizedQuery = query.trim();
  const clientResults = trpc.clients.list.useQuery({ organizationId: organizationId ?? "", limit: 5, offset: 0, status: "ACTIVE", search: normalizedQuery }, { enabled: Boolean(open && organizationId && clientSearchAllowed && normalizedQuery.length >= 3) });
  const visibleRoutes = useMemo(() => commandRoutes.filter(route => route.roles.includes(role) && (!restricted || route.path === "/app/today")), [restricted, role]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  const navigate = (path: string) => { setLocation(path); onOpenChange(false); setQuery(""); };
  return <CommandDialog open={open} onOpenChange={onOpenChange} title="სწრაფი ძიება" description="იპოვეთ უსაფრთხო გვერდი, მოქმედება ან კლიენტი." showCloseButton>
    <CommandInput value={query} onValueChange={setQuery} placeholder="მოძებნეთ გვერდი ან კლიენტი…" aria-label="სწრაფი ძიება" />
    <CommandList>
      <CommandEmpty>{normalizedQuery.length && normalizedQuery.length < 3 ? "კლიენტის მოსაძებნად ჩაწერეთ მინიმუმ 3 სიმბოლო." : "დაშვებული შედეგი ვერ მოიძებნა."}</CommandEmpty>
      <CommandGroup heading="სწრაფი გადასვლა">
        {visibleRoutes.map(route => { const Icon = route.icon; return <CommandItem key={route.path} value={`${route.label} ${route.hint}`} onSelect={() => navigate(route.path)}><Icon aria-hidden="true" /><span>{route.label}</span><span className="text-xs text-muted-foreground">{route.hint}</span>{route.path === "/app/today" ? <CommandShortcut>⌘K</CommandShortcut> : null}</CommandItem>; })}
      </CommandGroup>
      {clientSearchAllowed && normalizedQuery.length >= 3 ? <><CommandSeparator /><CommandGroup heading="კლიენტები">
        {clientResults.isLoading ? <CommandItem disabled><Search aria-hidden="true" /><span>კლიენტები იძებნება…</span></CommandItem> : null}
        {clientResults.data?.items.map(client => <CommandItem key={client.id} value={`${client.firstName} ${client.lastName ?? ""}`} onSelect={() => navigate(`/app/clients?clientId=${encodeURIComponent(client.id)}`)}><UsersRound aria-hidden="true" /><span>{client.firstName} {client.lastName ?? ""}</span><span className="ml-auto text-xs text-muted-foreground">დაცული პროფილი</span></CommandItem>)}
      </CommandGroup></> : null}
    </CommandList>
  </CommandDialog>;
}
