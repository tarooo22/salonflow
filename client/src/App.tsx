import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { getPendingInviteToken } from "./lib/pendingInvite";
import { useAuth } from "./_core/hooks/useAuth";
import React, { lazy, Suspense, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

const Book = lazy(() => import("./pages/Book"));
const BookingFlow = lazy(() => import("./pages/BookingFlow"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Reports = lazy(() => import("./pages/Reports"));
const Staff = lazy(() => import("./pages/Staff"));
const Services = lazy(() => import("./pages/Services"));
const Clients = lazy(() => import("./pages/Clients"));
const Today = lazy(() => import("./pages/Today"));
const WorkspaceSetup = lazy(() => import("./pages/WorkspaceSetup"));
const InviteAccept = lazy(() => import("./pages/InviteAccept"));
const Auth = lazy(() => import("./pages/Auth"));
const PasswordRecovery = lazy(() => import("./pages/PasswordRecovery"));

export function RouteLoadingFallback() {
  return <main className="flex min-h-screen items-center justify-center bg-[#F7F4EF] px-6" role="status" aria-live="polite" aria-busy="true"><div className="flex items-center gap-3 rounded-2xl border border-[#1E2824]/10 bg-white px-5 py-4 text-sm font-medium text-[#1E2824] shadow-lg shadow-[#1E2824]/5"><Loader2 className="h-5 w-5 animate-spin text-[#B85C3D]" aria-hidden="true" />SalonFlow იტვირთება…</div></main>;
}

function PendingInviteRedirect() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (!isAuthenticated || loading || typeof window === "undefined") return;
    const token = getPendingInviteToken();
    if (token && window.location.pathname === "/") setLocation(`/invite/${token}`);
  }, [isAuthenticated, loading, setLocation]);
  return null;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/book"} component={Book} />
      <Route path={"/book/:slug"} component={BookingFlow} />
      <Route path={"/app/today"} component={Today} />
      <Route path={"/app/calendar"} component={Calendar} />
      <Route path={"/app/clients"} component={Clients} />
      <Route path={"/app/services"} component={Services} />
      <Route path={"/app/staff"} component={Staff} />
      <Route path={"/app/reports"} component={Reports} />
      <Route path={"/app/setup"} component={WorkspaceSetup} />
      <Route path={"/register"}>{() => <Auth mode="register" />}</Route>
      <Route path={"/login"}>{() => <Auth mode="login" />}</Route>
      <Route path={"/forgot-password"}>{() => <PasswordRecovery mode="request" />}</Route>
      <Route path={"/reset-password"}>{() => <PasswordRecovery mode="reset" />}</Route>
      <Route path={"/invite/:token"} component={InviteAccept} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
      <TooltipProvider>
          <PendingInviteRedirect />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
