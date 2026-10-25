import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { MotionConfig } from "framer-motion";
import { ChevronDown, CircleHelp, LogOut, MoreHorizontal, PanelLeft, Search } from "lucide-react";
import { BRAND } from "@shared/brand";
import "@/components/workspace/panel.css";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { isBillingVisible, isPanelNavActive, panelNav, panelTabBar, type PanelNavItem } from "@/lib/panelNav";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { GuidedHelpTour } from "@/components/workspace/GuidedHelpTour";
import { CommandPalette } from "@/components/workspace/CommandPalette";
import { ChaweraMark } from "@/components/brand/ChaweraMark";

const VERTICAL_CHIP: Record<string, string> = { SALON: "სალონი", AESTHETICS: "ესთეტიკა", DENTAL: "სტომატოლოგია" };
const RAIL_OPEN_KEY = "chawera.rail.open";

/** Open/closed state of the collapsible rail groups ("მეტი", "პლატფორმა"), kept on this device. */
function readRailOpen(): Record<string, boolean> {
  try {
    const parsed = JSON.parse(localStorage.getItem(RAIL_OPEN_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function writeRailOpen(value: Record<string, boolean>) {
  try {
    localStorage.setItem(RAIL_OPEN_KEY, JSON.stringify(value));
  } catch {
    /* private mode or blocked storage: the group still opens, it just is not remembered */
  }
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--sf-bg)] px-4">
        <div className="sf-luxury-panel flex w-full max-w-md flex-col items-center gap-8 rounded-[var(--sf-radius-hero)] p-8">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              შედით სამუშაო სივრცეში
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Chawera-ის სამუშაო სივრცე დაცულია. გასაგრძელებლად გაიარეთ ავტორიზაცია.
            </p>
          </div>
          <Button
            onClick={() => { window.location.assign(`/login?returnTo=${encodeURIComponent(window.location.pathname)}`); }}
            size="lg"
            className="w-full"
          >
            შესვლა
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent sidebarWidth={sidebarWidth} setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  sidebarWidth: number;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  sidebarWidth,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const organizations = trpc.organizations.listMine.useQuery();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const role = organizations.data?.[0]?.membership.role;
  const organizationId = organizations.data?.[0]?.organization.id;
  const workspaceStatus = trpc.billing.workspaceStatus.useQuery({ organizationId: organizationId ?? "" }, { enabled: Boolean(organizationId) });
  // The saved "reduce animations" setting (Settings page) drives framer-motion and the CSS rule in index.css.
  const preferences = trpc.productivity.preferences.useQuery({ organizationId: organizationId ?? "" }, { enabled: Boolean(organizationId) });
  const reduceMotion = preferences.data?.settings?.reducedMotion === true;
  const workspaceLocked = workspaceStatus.data?.locked === true;
  const workspaceRestricted = Boolean(organizationId && (workspaceStatus.isLoading || workspaceStatus.isError || workspaceLocked));
  const vertical = organizations.data?.[0]?.organization.vertical;
  // Billing shows in the rail only when the workspace is locked (or its status is unknown) or access ends within 3 days.
  const billingVisible = workspaceRestricted || isBillingVisible(workspaceStatus.data);
  const nav = panelNav(role, { vertical, isPlatformAdmin: user?.role === "admin", billingVisible });
  // A locked workspace only reaches "დღეს" and the billing page.
  const railGroups = workspaceRestricted
    ? nav.groups.filter(group => group.key === "main" || group.key === "billing" || group.key === "platform").map(group => group.key === "main" ? { ...group, items: group.items.filter(item => item.href === "/app/today") } : group)
    : nav.groups;
  const railFooter = workspaceRestricted ? [] : nav.footer;
  const tabItems = workspaceRestricted
    ? railGroups.filter(group => group.key === "main" || group.key === "billing").flatMap(group => group.items)
    : panelTabBar(role, vertical);
  const sheetGroups = railGroups
    .map(group => ({ ...group, items: group.items.filter(item => !tabItems.some(tab => tab.href === item.href)) }))
    .filter(group => group.items.length);
  const sheetItems = [...sheetGroups.flatMap(group => group.items), ...railFooter];
  const isMobile = useIsMobile();
  const [helpOpen, setHelpOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [railOpen, setRailOpen] = useState<Record<string, boolean>>(readRailOpen);
  const activeCollapsibleKeys = railGroups.filter(group => group.collapsible && group.items.some(item => isPanelNavActive(item, location))).map(group => group.key).join(",");

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
    return () => { delete document.documentElement.dataset.reduceMotion; };
  }, [reduceMotion]);
  useEffect(() => { if (workspaceLocked && location !== "/app/today" && location !== "/app/billing" && user?.role !== "admin") setLocation("/app/today"); }, [location, setLocation, user?.role, workspaceLocked]);
  // A collapsed group opens by itself when one of its pages is the current one (not remembered: only a click is).
  useEffect(() => {
    if (!activeCollapsibleKeys) return;
    setRailOpen(open => activeCollapsibleKeys.split(",").every(key => open[key]) ? open : { ...open, ...Object.fromEntries(activeCollapsibleKeys.split(",").map(key => [key, true])) });
  }, [activeCollapsibleKeys]);
  useEffect(() => { setMoreSheetOpen(false); }, [location]);
  const toggleRailGroup = (key: string) => setRailOpen(open => { const next = { ...open, [key]: !open[key] }; writeRailOpen(next); return next; });

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const organization = organizations.data?.[0]?.organization;
  const railItem = (item: PanelNavItem) => {
    const isActive = isPanelNavActive(item, location);
    return (
      <SidebarMenuItem key={item.key}>
        <SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.href)} tooltip={item.label} aria-current={isActive ? "page" : undefined} className="cwk-nav min-h-11 md:min-h-10">
          {item.icon ? <item.icon className="h-4 w-4" /> : null}
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };
  const groupCaption = (label: string) => (!isCollapsed ? <p className="cwk-group-caption">{label}</p> : null);

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="cwk-rail cw-on-band border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="cwk-rail-head justify-center p-0">
            <div className="flex min-h-[4rem] w-full items-center gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <button onClick={toggleSidebar} className="cwk-rail-btn" aria-label="ნავიგაციის გადართვა">
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed ? (
                <>
                  <span className="cwk-wordmark cw-on-band min-w-0 flex-1 gap-2"><ChaweraMark size={24} /><span className="cwk-wordmark-ka">{BRAND.nameKa}</span></span>
                  <button type="button" onClick={() => setCommandOpen(true)} className="cwk-rail-btn" aria-label="სწრაფი ძიება"><Search className="size-4" aria-hidden="true" /></button>
                </>
              ) : null}
            </div>
            {!isCollapsed && organization ? (
              <div className="cwk-org pb-3">
                <span className="cwk-org-name" title={organization.name}>{organization.name}</span>
                <span className="cwk-vchip" data-v={organization.vertical}>{VERTICAL_CHIP[organization.vertical] ?? VERTICAL_CHIP.SALON}</span>
              </div>
            ) : null}
          </SidebarHeader>

          <SidebarContent className="gap-0 px-2 pb-5 pt-4">
            {railGroups.map((group, index) => {
              const open = !group.collapsible || isCollapsed || railOpen[group.key] === true;
              const listId = `cwk-rail-${group.key}`;
              return <div key={group.key} className={index ? "mt-5" : ""}>
                {group.label ? (group.collapsible
                  ? (!isCollapsed ? <button type="button" onClick={() => toggleRailGroup(group.key)} aria-expanded={open} aria-controls={listId} className="cwk-group-caption"><span>{group.label}</span><ChevronDown className={`size-4 transition-transform motion-reduce:transition-none motion-reduce:transform-none ${open ? "rotate-180" : ""}`} aria-hidden="true" /></button> : null)
                  : groupCaption(group.label)) : null}
                {open ? <SidebarMenu id={listId} className={`gap-0.5 ${group.collapsible ? "mt-1" : ""}`}>{group.items.map(railItem)}</SidebarMenu> : null}
              </div>;
            })}
          </SidebarContent>

          <SidebarFooter className="cwk-rail-foot p-2">
            <div className="cwk-rail-links">
              {railFooter.map(item => { const isActive = isPanelNavActive(item, location); return <button key={item.key} type="button" onClick={() => setLocation(item.href)} aria-current={isActive ? "page" : undefined} title={item.label} className="cwk-rail-link group-data-[collapsible=icon]:justify-center">{item.icon ? <item.icon className="size-4 shrink-0" aria-hidden="true" /> : null}<span className="group-data-[collapsible=icon]:hidden">{item.label}</span></button>; })}
              <button type="button" onClick={() => setHelpOpen(true)} className="cwk-rail-link group-data-[collapsible=icon]:justify-center" aria-label="სამუშაო სივრცის დახმარება"><CircleHelp className="size-4 shrink-0" /><span className="group-data-[collapsible=icon]:hidden">დახმარება</span></button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="cwk-rail-link min-h-12 gap-3 group-data-[collapsible=icon]:justify-center">
                  <Avatar className="cwk-avatar h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <p className="cwk-user-name truncate leading-none">{user?.name || "-"}</p>
                    <p className="cwk-user-mail mt-1 truncate">{user?.email || "-"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>გასვლა</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="გვერდითი მენიუს სიგანე"
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={MAX_WIDTH}
          aria-valuenow={Math.round(sidebarWidth)}
          tabIndex={isCollapsed ? -1 : 0}
          className={`cwk-resize absolute top-0 right-0 w-1 h-full cursor-col-resize ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          onKeyDown={event => {
            const step = event.key === "ArrowLeft" ? -16 : event.key === "ArrowRight" ? 16 : 0;
            if (!step) return;
            event.preventDefault();
            setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, sidebarWidth + step)));
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="sf-workspace-inset">
        {isMobile && (
          <div className="cwk-topbar sticky top-0 z-40 flex h-14 items-center justify-between px-3">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger className="cwk-topbtn" />
              <div className="flex min-w-0 flex-col">
                <span className="cwk-wordmark"><span className="cwk-wordmark-ka">{BRAND.nameKa}</span></span>
              </div>
            </div>
            <div className="flex items-center gap-2"><button type="button" onClick={() => setCommandOpen(true)} className="cwk-topbtn" aria-label="სწრაფი ძიება"><Search className="size-4" /></button><button type="button" onClick={() => setHelpOpen(true)} className="cwk-topbtn" aria-label="სამუშაო სივრცის დახმარება"><CircleHelp className="size-4" /></button></div>
          </div>
        )}
        <main key={location} className="cwk-main sf-motion-enter flex-1 p-3 pb-24 sm:p-5 sm:pb-5 xl:p-6">{children}</main>
        {isMobile ? <nav aria-label="სწრაფი ნავიგაცია" className="cwk-tabbar fixed inset-x-0 bottom-0 z-40 grid gap-0 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2" style={{ gridTemplateColumns: `repeat(${tabItems.length + 1}, minmax(0, 1fr))` }}>
          {tabItems.map(item => { const isActive = isPanelNavActive(item, location); return <button key={item.key} type="button" onClick={() => setLocation(item.href)} aria-current={isActive ? "page" : undefined} title={item.label} className="cwk-tab">{item.icon ? <item.icon className="size-[22px]" aria-hidden="true" /> : null}<span className="cwk-tab-label">{item.label}</span></button>; })}
          <button type="button" onClick={() => setMoreSheetOpen(true)} aria-haspopup="dialog" aria-expanded={moreSheetOpen} data-active={sheetItems.some(item => isPanelNavActive(item, location)) ? "true" : undefined} className="cwk-tab"><MoreHorizontal className="size-[22px]" aria-hidden="true" /><span className="cwk-tab-label">მეტი</span></button>
        </nav> : null}
        {isMobile ? <Sheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
          <SheetContent side="bottom" className="cwk-more-sheet">
            <SheetHeader><SheetTitle>მეტი</SheetTitle><SheetDescription className="sr-only">დანარჩენი გვერდები და პარამეტრები</SheetDescription></SheetHeader>
            <div className="cwk-more-body">
              {[...sheetGroups.map(group => ({ key: group.key, label: group.key === "more" ? null : group.label, items: group.items })), ...(railFooter.length ? [{ key: "footer", label: null, items: railFooter }] : [])].map(group => <section key={group.key} className="cwk-more-group">
                {group.label ? <p className="cwk-more-caption">{group.label}</p> : null}
                <ul>{group.items.map(item => { const isActive = isPanelNavActive(item, location); return <li key={item.key}><button type="button" onClick={() => { setMoreSheetOpen(false); setLocation(item.href); }} aria-current={isActive ? "page" : undefined} className="cwk-more-link">{item.icon ? <item.icon className="size-5 shrink-0" aria-hidden="true" /> : null}<span>{item.label}</span></button></li>; })}</ul>
              </section>)}
            </div>
          </SheetContent>
        </Sheet> : null}
      </SidebarInset>
      {/* Mounted only while open: the tour must never pop up on its own. */}
      {helpOpen && organizations.data?.[0]?.organization.id ? <GuidedHelpTour organizationId={organizations.data[0].organization.id} role={role} open={helpOpen} onOpenChange={setHelpOpen} /> : null}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} organizationId={organizationId} role={role} restricted={workspaceRestricted} />
    </MotionConfig>
  );
}
