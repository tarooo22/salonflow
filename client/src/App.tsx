import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Book from "./pages/Book";
import BookingFlow from "./pages/BookingFlow";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import Staff from "./pages/Staff";
import Services from "./pages/Services";
import Clients from "./pages/Clients";
import Today from "./pages/Today";
import WorkspaceSetup from "./pages/WorkspaceSetup";
import WorkspacePlaceholder from "./pages/WorkspacePlaceholder";
import InviteAccept, { getPendingInviteToken } from "./pages/InviteAccept";
import Auth from "./pages/Auth";
import { useAuth } from "./_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";

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
      <Route path={"/invite/:token"} component={InviteAccept} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
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
