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
import { BarChart3, CalendarDays, CalendarHeart, CircleHelp, Clock3, Images, LayoutDashboard, ListChecks, LogOut, MessageSquareText, PanelLeft, ReceiptText, Scissors, Settings2, Store, Users } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";
import { GuidedHelpTour } from "@/components/workspace/GuidedHelpTour";

const menuItems = [
  { icon: LayoutDashboard, label: "დღეს", path: "/app/today", group: "დღის მართვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] },
  { icon: CalendarDays, label: "კალენდარი", path: "/app/calendar", group: "დღის მართვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] },
  { icon: CalendarHeart, label: "მოლოდინის სია", path: "/app/waitlist", group: "დღის მართვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST"] },
  { icon: Clock3, label: "ოპერაციები", path: "/app/operations", group: "დღის მართვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] },
  { icon: ReceiptText, label: "POS და მარაგი", path: "/app/pos", group: "კლიენტები და გაყიდვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST"] },
  { icon: Users, label: "კლიენტები", path: "/app/clients", group: "კლიენტები და გაყიდვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST"] },
  { icon: Images, label: "კლიენტის გალერეა", path: "/app/client-gallery", group: "კლიენტები და გაყიდვა", roles: ["OWNER"] },
  { icon: Scissors, label: "სერვისები", path: "/app/services", group: "სალონის მართვა", roles: ["OWNER"] },
  { icon: Users, label: "გუნდი", path: "/app/staff", group: "სალონის მართვა", roles: ["OWNER", "STAFF"] },
  { icon: BarChart3, label: "ანგარიშები", path: "/app/reports", group: "სალონის მართვა", roles: ["OWNER"] },
  { icon: Images, label: "მედია და პროფილი", path: "/app/media", group: "სალონის მართვა", roles: ["OWNER"] },
  { icon: Store, label: "Marketplace", path: "/app/marketplace", group: "სალონის მართვა", roles: ["OWNER"] },
  { icon: MessageSquareText, label: "შეფასებები", path: "/app/feedback", group: "სალონის მართვა", roles: ["OWNER", "MANAGER"] },
  { icon: Settings2, label: "პარამეტრები", path: "/app/settings", group: "სალონის მართვა", roles: ["OWNER", "MANAGER", "RECEPTIONIST", "STAFF"] },
] as const;

const menuGroups = ["დღის მართვა", "კლიენტები და გაყიდვა", "სალონის მართვა"] as const;
const platformAdminItems = [
  { icon: ListChecks, label: "Trial requests", path: "/app/trial-admin" },
  { icon: ReceiptText, label: "Billing payments", path: "/app/billing-admin" },
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
              SalonFlow-ის სამუშაო სივრცე დაცულია. გასაგრძელებლად გაიარეთ ავტორიზაცია.
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
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
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
  const workspaceLocked = workspaceStatus.data?.locked === true;
  const workspaceRestricted = Boolean(organizationId && (workspaceStatus.isLoading || workspaceStatus.isError || workspaceLocked));
  const lockedOwnerItems = workspaceRestricted && role === "OWNER" ? [{ icon: ReceiptText, label: "პაკეტის გააქტიურება", path: "/app/billing", group: "წვდომის აღდგენა", roles: ["OWNER"] }] : [];
  const visibleMenuItems = role ? [...menuItems.filter(item => (item.roles as readonly string[]).includes(role) && (!workspaceRestricted || item.path === "/app/today")), ...lockedOwnerItems] : [];
  const visibleMenuGroups = menuGroups.map(label => ({ label, items: visibleMenuItems.filter(item => item.group === label) })).filter(group => group.items.length);
  const visiblePlatformAdminItems = user?.role === "admin" ? platformAdminItems : [];
  const activeMenuItem = [...visibleMenuItems, ...visiblePlatformAdminItems].find(item => item.path === location);
  const isMobile = useIsMobile();
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => { if (workspaceLocked && location !== "/app/today" && location !== "/app/billing" && user?.role !== "admin") setLocation("/app/today"); }, [location, setLocation, user?.role, workspaceLocked]);

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

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="sf-workspace-sidebar border-r border-sidebar-border/90 bg-sidebar shadow-[18px_0_44px_rgb(0_0_0_/_0.16)]"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-[4.75rem] justify-center border-b border-sidebar-border/90">
            <div className="flex items-center gap-3 px-3 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-sidebar-border/90 bg-sidebar-accent/45 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="ნავიგაციის გადართვა"
              >
                <PanelLeft className="h-4 w-4 text-sidebar-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="sf-brand-mark sf-brand-mark--inverted" aria-hidden="true"><i /><i /><i /></span>
                  <div className="min-w-0"><span className="block truncate text-sm font-semibold tracking-tight text-sidebar-foreground">SalonFlow</span><span className="block truncate text-[11px] text-sidebar-foreground/65">სამუშაო სივრცე</span></div>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 px-2 py-4">
            {visibleMenuGroups.map((group, groupIndex) => <div key={group.label} className={groupIndex ? "mt-5" : ""}>
              {!isCollapsed ? <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">{group.label}</p> : null}
              <SidebarMenu className="gap-1">
              {group.items.map(item => {
                const isActive = location === item.path;
                const label = item.path === "/app/staff" && role === "STAFF" ? "ჩემი პროფილი" : item.label;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={label}
                      className="min-h-11 rounded-xl px-3 text-sidebar-foreground/72 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_8px_18px_rgb(0_0_0_/_0.18)]"
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-sidebar-primary-foreground" : ""}`}
                      />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              </SidebarMenu>
            </div>)}
            {lockedOwnerItems.length ? <div className="mt-5">
              {!isCollapsed ? <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">წვდომის აღდგენა</p> : null}
              <SidebarMenu className="gap-1">{lockedOwnerItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="min-h-11 rounded-xl px-3 text-sidebar-foreground/72 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary-foreground"><item.icon className={`h-4 w-4 ${location === item.path ? "text-sidebar-primary-foreground" : ""}`} /><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
            </div> : null}
            {visiblePlatformAdminItems.length ? <div className={visibleMenuGroups.length ? "mt-5" : ""}>
              {!isCollapsed ? <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">პლატფორმის მართვა</p> : null}
              <SidebarMenu className="gap-1">
                {visiblePlatformAdminItems.map(item => <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location === item.path}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className="min-h-11 rounded-xl px-3 text-sidebar-foreground/72 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_8px_18px_rgb(0_0_0_/_0.18)]"
                  >
                    <item.icon className={`h-4 w-4 ${location === item.path ? "text-sidebar-primary-foreground" : ""}`} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
              </SidebarMenu>
            </div> : null}
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border/90 p-3">
            <button type="button" onClick={() => setHelpOpen(true)} className="mb-2 flex min-h-10 w-full items-center gap-2 rounded-xl px-2 text-left text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-data-[collapsible=icon]:justify-center" aria-label="სამუშაო სივრცის დახმარება"><CircleHelp className="size-4" /><span className="group-data-[collapsible=icon]:hidden">დახმარება</span></button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border border-sidebar-border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60 truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
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
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="sf-workspace-inset">
        {isMobile && (
          <div className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/90 bg-background px-3 shadow-[0_8px_24px_rgb(0_0_0_/_0.08)]">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="h-11 w-11 rounded-xl border border-border/75 bg-card" />
              <div className="flex items-center gap-3">
                <span className="sf-brand-mark" aria-hidden="true"><i /><i /><i /></span>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold tracking-tight text-foreground">{activeMenuItem?.path === "/app/staff" && role === "STAFF" ? "ჩემი პროფილი" : activeMenuItem?.label ?? "მენიუ"}</span>
                  <span className="text-[11px] text-muted-foreground">SalonFlow</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setHelpOpen(true)} className="grid size-11 place-items-center rounded-xl border border-border/75 bg-card text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="სამუშაო სივრცის დახმარება"><CircleHelp className="size-4" /></button>
          </div>
        )}
        <main className="sf-motion-enter sf-workspace-main flex-1 p-4 sm:p-5 xl:p-6">{children}</main>
      </SidebarInset>
      {organizations.data?.[0]?.organization.id ? <GuidedHelpTour organizationId={organizations.data[0].organization.id} role={role} open={helpOpen} onOpenChange={setHelpOpen} /> : null}
    </>
  );
}
