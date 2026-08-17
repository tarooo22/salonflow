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
import { BarChart3, CalendarDays, CalendarHeart, Clock3, Images, LayoutDashboard, LogOut, Monitor, Moon, PanelLeft, ReceiptText, Scissors, Settings2, Sun, Users } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "დღეს", path: "/app/today" },
  { icon: CalendarDays, label: "კალენდარი", path: "/app/calendar" },
  { icon: CalendarHeart, label: "მოლოდინის სია", path: "/app/waitlist" },
  { icon: Clock3, label: "ოპერაციები", path: "/app/operations" },
  { icon: ReceiptText, label: "POS და მარაგი", path: "/app/pos" },
  { icon: Users, label: "კლიენტები", path: "/app/clients" },
  { icon: Images, label: "კლიენტის გალერეა", path: "/app/client-gallery" },
  { icon: Scissors, label: "სერვისები", path: "/app/services" },
  { icon: Users, label: "გუნდი", path: "/app/staff" },
  { icon: BarChart3, label: "ანგარიშები", path: "/app/reports" },
  { icon: Images, label: "მედია და პროფილი", path: "/app/media" },
  { icon: Settings2, label: "პარამეტრები", path: "/app/settings" },
];

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
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { preference, setPreference } = useTheme();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

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
            {!isCollapsed ? <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-sidebar-foreground/55">ოპერაციები</p> : null}
            <SidebarMenu className="gap-1">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="min-h-11 rounded-xl px-3 text-sidebar-foreground/72 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-[0_8px_18px_rgb(0_0_0_/_0.18)]"
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-sidebar-primary-foreground" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-sidebar-border/90 p-3">
            <div className="mb-3 grid grid-cols-3 gap-1 rounded-xl border border-sidebar-border/90 bg-black/12 p-1 group-data-[collapsible=icon]:hidden" aria-label="თემის არჩევა">
              {([
                { value: "light", label: "ღია", icon: Sun },
                { value: "dark", label: "მუქი", icon: Moon },
                { value: "system", label: "სისტემა", icon: Monitor },
              ] as const).map(option => <button key={option.value} type="button" onClick={() => setPreference?.(option.value)} aria-pressed={preference === option.value} aria-label={`${option.label} თემა`} className={`grid min-h-10 place-items-center rounded-lg text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${preference === option.value ? "bg-sidebar-accent text-sidebar-foreground shadow-[inset_0_1px_0_rgb(255_255_255_/_0.04)]" : ""}`}><option.icon className="h-4 w-4" /></button>)}
            </div>
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
                  <span className="text-sm font-semibold tracking-tight text-foreground">{activeMenuItem?.label ?? "მენიუ"}</span>
                  <span className="text-[11px] text-muted-foreground">SalonFlow</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="sf-motion-enter sf-workspace-main flex-1 p-4 sm:p-5 xl:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
