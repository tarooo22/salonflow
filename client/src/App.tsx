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
import Today from "./pages/Today";
import WorkspacePlaceholder from "./pages/WorkspacePlaceholder";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/book"} component={Book} />
      <Route path={"/book/:slug"} component={BookingFlow} />
      <Route path={"/app/today"} component={Today} />
      <Route path={"/app/calendar"} component={Calendar} />
      <Route path={"/app/clients"}><WorkspacePlaceholder title="კლიენტები" description="კლიენტების დაცული რეესტრი, ისტორია და თანხმობები." /></Route>
      <Route path={"/app/services"}><WorkspacePlaceholder title="სერვისები" description="სერვისები, კატეგორიები, ხანგრძლივობა და სპეციალისტების დაშვებები." /></Route>
      <Route path={"/app/staff"} component={Staff} />
      <Route path={"/app/reports"} component={Reports} />
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
