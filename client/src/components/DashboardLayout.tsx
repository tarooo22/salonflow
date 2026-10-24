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
import { BarChart3, BriefcaseBusiness, Package,CalendarDays, CalendarHeart, ChevronDown, CircleHelp, Clock3, Images, LayoutDashboard, ListChecks, LogOut, MessageSquareText, MoreHorizontal, PanelLeft, ReceiptText, Scissors, Search, Settings2, Store, Users } from "lucide-react";
import { BRAND } from "@shared/brand";
import "@/components/workspace/panel.css";
import { ComponentType, CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { clientTerms } from "@/lib/verticalTerms";
import { GuidedHelpTour } from "@/components/workspace/GuidedHelpTour";
import { CommandPalette } from "@/components/workspace/CommandPalette";

type RailIcon = ComponentType<{ className?: string }>;
const VERTICAL_CHIP: Record<string, string> = { SALON: "სალონი", AESTHETICS: "ესთეტიკა", DENTAL: "სტომატოლოგია" };

const menuItems = [
  { icon: LayoutDashboard, label: "დღეს", path: "/app/today", group: "დღის მართვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] },
  { icon: CalendarDays, label: "კალენდარი", path: "/app/calendar", group: "დღის მართვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] },
  { icon: CalendarHeart, label: "მოლოდინის სია", path: "/app/waitlist", group: "დღის მართვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST"] },
  { icon: Clock3, label: "ოპერაციები", path: "/app/operations", group: "დღის მართვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] },
  { icon: ReceiptText, label: "სალარო", path: "/app/pos", group: "კლიენტები და გაყიდვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST"] },
  { icon: Users, label: "კლიენტები", path: "/app/clients", group: "კლიენტები და გაყიდვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST"] },
  { icon: Images, label: "კლიენტის გალერეა", path: "/app/client-gallery", group: "კლიენტები და გაყიდვა", roles: ["OWNER"] },
  { icon: Scissors, label: "სერვისები", path: "/app/services", group: "სალონის მართვა", roles: ["OWNER"] },
  { icon: Users, label: "გუნდი", path: "/app/staff", group: "სალონის მართვა", roles: ["OWNER", "STAFF"] },
  { icon: BarChart3, label: "ანგარიშები", path: "/app/reports", group: "სალონის მართვა", roles: ["OWNER"] },
  { icon: Images, label: "მედია და პროფილი", path: "/app/media", group: "სალონის მართვა", roles: ["OWNER"] },
  { icon: Store, label: "კატალოგის პროფილი", path: "/app/marketplace", group: "სალონის მართვა", roles: ["OWNER"] },
  { icon: BriefcaseBusiness, label: "ვაკანსიები", path: "/app/vacancies", group: "სალონის მართვა", roles: ["OWNER", "MANAGER"] },
  { icon: Package, label: "პროდუქტები", path: "/app/products", group: "სალონის მართვა", roles: ["OWNER", "MANAGER"] },
  { icon: MessageSquareText, label: "შეფასებები", path: "/app/feedback", group: "სალონის მართვა", roles: ["OWNER", "MANAGER"] },
  { icon: Settings2, label: "პარამეტრები", path: "/app/settings", group: "სალონის მართვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] },
] as const;

const menuGroups = ["დღის მართვა", "კლიენტები და გაყიდვა", "სალონის მართვა"] as const;
const platformAdminItems = [
  { icon: ListChecks, label: "საცდელი მოთხოვნები", path: "/app/trial-admin" },
  { icon: Store, label: "სალონების კონტროლი", path: "/app/organization-governance" },
  { icon: ReceiptText, label: "გადახდები", path: "/app/billing-admin" },
  { icon: MessageSquareText, label: "შეფასებების მოდერაცია", path: "/app/feedback-admin" },
] as const;

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
  const lockedOwnerItems = workspaceRestricted && role === "OWNER" ? [{ icon: ReceiptText, label: "პაკეტის გააქტიურება", path: "/app/billing", group: "წვდომის აღდგენა", roles: ["OWNER"] }] : [];
  const clientsLabel = clientTerms(organizations.data?.[0]?.organization.vertical).plural;
  const visibleMenuItems = role ? [...menuItems.filter(item => (item.roles as readonly string[]).includes(role) && (!workspaceRestricted || item.path === "/app/today")).map(item => item.path === "/app/clients" ? { ...item, label: clientsLabel } : item), ...lockedOwnerItems] : [];
  const dailyItems = visibleMenuItems.filter(item => item.group === "დღის მართვა");
  const salesItems = visibleMenuItems.filter(item => item.group === "კლიენტები და გაყიდვა");
  const managementItems = visibleMenuItems.filter(item => item.group === "სალონის მართვა");
  const visiblePlatformAdminItems = user?.role === "admin" ? platformAdminItems : [];
  const isMobile = useIsMobile();
  const [helpOpen, setHelpOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [managementOpen, setManagementOpen] = useState(() => managementItems.some(item => item.path === location));
  const mobileQuickItems = workspaceRestricted
    ? visibleMenuItems.slice(0, 3)
    : ["/app/today", "/app/calendar", role === "STAFF" ? "/app/staff" : "/app/clients"].map(path => visibleMenuItems.find(item => item.path === path)).filter((item): item is typeof visibleMenuItems[number] => Boolean(item));

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion);
    return () => { delete document.documentElement.dataset.reduceMotion; };
  }, [reduceMotion]);
  useEffect(() => { if (workspaceLocked && location !== "/app/today" && location !== "/app/billing" && user?.role !== "admin") setLocation("/app/today"); }, [location, setLocation, user?.role, workspaceLocked]);
  useEffect(() => { if (managementItems.some(item => item.path === location)) setManagementOpen(true); }, [location, managementItems]);

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
  const railItem = (item: { icon: RailIcon; label: string; path: string }, label = item.label) => {
    const isActive = location === item.path;
    return (
      <SidebarMenuItem key={item.path}>
        <SidebarMenuButton isActive={isActive} onClick={() => setLocation(item.path)} tooltip={label} className="cwk-nav min-h-11 md:min-h-10">
          <item.icon className="h-4 w-4" />
          <span>{label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };
  const groupCaption = (label: string) => (!isCollapsed ? <p className="cwk-group-caption">{label}</p> : null);

  return (
    <MotionConfig reducedMotion={reduceMotion ? "always" : "user"}>
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="cwk-rail border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="cwk-rail-head justify-center p-0">
            <div className="flex min-h-[4rem] w-full items-center gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <button onClick={toggleSidebar} className="cwk-rail-btn" aria-label="ნავიგაციის გადართვა">
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed ? (
                <>
                  <span className="cwk-wordmark min-w-0 flex-1"><span className="cwk-wordmark-ka">{BRAND.nameKa}</span></span>
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
            {[{ label: "დღის მართვა", items: dailyItems }, { label: "კლიენტები და გაყიდვა", items: salesItems }].filter(group => group.items.length).map((group, groupIndex) => <div key={group.label} className={groupIndex ? "mt-5" : ""}>
              {groupCaption(group.label)}
              <SidebarMenu className="gap-0.5">
                {group.items.map(item => railItem(item, item.path === "/app/staff" && role === "STAFF" ? "ჩემი პროფილი" : item.label))}
              </SidebarMenu>
            </div>)}
            {managementItems.length ? <div className="mt-5">
              {!isCollapsed ? <button type="button" onClick={() => setManagementOpen(open => !open)} aria-expanded={managementOpen} className="cwk-group-caption"><span>სალონის მართვა</span><ChevronDown className={`size-4 transition-transform motion-reduce:transition-none motion-reduce:transform-none ${managementOpen ? "rotate-180" : ""}`} aria-hidden="true" /></button> : null}
              {(managementOpen || isCollapsed) ? <SidebarMenu className="mt-1 gap-0.5">{managementItems.map(item => railItem(item))}</SidebarMenu> : null}
            </div> : null}
            {lockedOwnerItems.length ? <div className="mt-5">
              {groupCaption("წვდომის აღდგენა")}
              <SidebarMenu className="gap-0.5">{lockedOwnerItems.map(item => railItem(item))}</SidebarMenu>
            </div> : null}
            {visiblePlatformAdminItems.length ? <div className={(dailyItems.length || salesItems.length || managementItems.length) ? "mt-5" : ""}>
              {groupCaption("პლატფორმის მართვა")}
              <SidebarMenu className="gap-0.5">{visiblePlatformAdminItems.map(item => railItem(item))}</SidebarMenu>
            </div> : null}
          </SidebarContent>

          <SidebarFooter className="cwk-rail-foot p-2">
            <button type="button" onClick={() => setHelpOpen(true)} className="cwk-rail-link group-data-[collapsible=icon]:justify-center" aria-label="სამუშაო სივრცის დახმარება"><CircleHelp className="size-4" /><span className="group-data-[collapsible=icon]:hidden">დახმარება</span></button>
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
        {isMobile ? <nav aria-label="სწრაფი ნავიგაცია" className="cwk-tabbar fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 gap-1 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          {mobileQuickItems.map(item => { const isActive = location === item.path; return <button key={item.path} type="button" onClick={() => setLocation(item.path)} aria-current={isActive ? "page" : undefined} className="cwk-tab"><item.icon className="size-[22px]" aria-hidden="true" /><span className="mt-0.5 max-w-20 truncate">{item.path === "/app/staff" && role === "STAFF" ? "პროფილი" : item.label}</span></button>; })}
          <button type="button" onClick={toggleSidebar} className="cwk-tab"><MoreHorizontal className="size-[22px]" aria-hidden="true" /><span className="mt-0.5">მეტი</span></button>
        </nav> : null}
      </SidebarInset>
      {/* Mounted only while open: the tour must never pop up on its own. */}
      {helpOpen && organizations.data?.[0]?.organization.id ? <GuidedHelpTour organizationId={organizations.data[0].organization.id} role={role} open={helpOpen} onOpenChange={setHelpOpen} /> : null}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} organizationId={organizationId} role={role} restricted={workspaceRestricted} />
    </MotionConfig>
  );
}
