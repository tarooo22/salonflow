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
import LocalAuth from "./pages/LocalAuth";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/book"} component={Book} />
      <Route path={"/book/:slug"} component={BookingFlow} />
      <Route path={"/login"}>{() => <LocalAuth mode="login" />}</Route>
      <Route path={"/register"}>{() => <LocalAuth mode="register" />}</Route>
      <Route path={"/claim-account"}>{() => <LocalAuth mode="claim" />}</Route>
      <Route path={"/app/today"} component={Today} />
      <Route path={"/app/calendar"} component={Calendar} />
      <Route path={"/app/clients"} component={Clients} />
      <Route path={"/app/services"} component={Services} />
      <Route path={"/app/staff"} component={Staff} />
      <Route path={"/app/reports"} component={Reports} />
      <Route path={"/app/setup"} component={WorkspaceSetup} />
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
