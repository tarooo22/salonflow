import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import SalonProfile from "./pages/SalonProfile";

const Book = lazy(() => import("./pages/Book"));
const BookingFlow = lazy(() => import("./pages/BookingFlow"));
const ManageBooking = lazy(() => import("./pages/ManageBooking"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const WaitlistQueue = lazy(() => import("./pages/WaitlistQueue"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Reports = lazy(() => import("./pages/Reports"));
const Staff = lazy(() => import("./pages/Staff"));
const Services = lazy(() => import("./pages/Services"));
const Clients = lazy(() => import("./pages/Clients"));
const Today = lazy(() => import("./pages/Today"));
const WorkspaceSetup = lazy(() => import("./pages/WorkspaceSetup"));
const LocalAuth = lazy(() => import("./pages/LocalAuth"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite"));
const DemoPreview = lazy(() => import("./pages/DemoPreview"));
const Settings = lazy(() => import("./pages/Settings"));
const Operations = lazy(() => import("./pages/Operations"));
const POS = lazy(() => import("./pages/POS"));
const Media = lazy(() => import("./pages/Media"));
const ClientGallery = lazy(() => import("./pages/ClientGallery"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const FeaturesPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.FeaturesPage })));
const PricingPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.PricingPage })));
const DemoPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.DemoPage })));
const FaqPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.FaqPage })));
const ContactPage = lazy(() => import("./pages/MarketingPages").then(module => ({ default: module.ContactPage })));

function RouteLoading() {
  return <main className="sf-public-page grid min-h-screen place-items-center px-4" role="status" aria-live="polite"><div className="sf-luxury-panel flex w-full max-w-sm items-center gap-3 rounded-[var(--sf-radius-surface)] p-5"><span className="sf-skeleton size-9 rounded-xl" aria-hidden="true" /><p className="text-sm font-semibold">SalonFlow იტვირთება…</p></div></main>;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<RouteLoading />}>
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/features"} component={FeaturesPage} />
      <Route path={"/pricing"} component={PricingPage} />
      <Route path={"/demo"} component={DemoPage} />
      <Route path={"/faq"} component={FaqPage} />
      <Route path={"/contact"} component={ContactPage} />
      <Route path={"/book"} component={Book} />
      <Route path={"/book/:slug"} component={BookingFlow} />
      <Route path={"/manage-booking/:token"} component={ManageBooking} />
      <Route path={"/waitlist/:slug"} component={Waitlist} />
      <Route path={"/salon/:slug"} component={SalonProfile} />
      <Route path={"/login"}>{() => <LocalAuth mode="login" />}</Route>
      <Route path={"/register"}>{() => <LocalAuth mode="register" />}</Route>
      <Route path={"/claim-account"}>{() => <LocalAuth mode="claim" />}</Route>
      <Route path={"/invite/:token"} component={AcceptInvite} />
      {import.meta.env.DEV ? <Route path={"/preview-demo"} component={DemoPreview} /> : null}
      <Route path={"/app/today"} component={Today} />
      <Route path={"/app/calendar"} component={Calendar} />
      <Route path={"/app/clients"} component={Clients} />
      <Route path={"/app/services"} component={Services} />
      <Route path={"/app/staff"} component={Staff} />
      <Route path={"/app/reports"} component={Reports} />
      <Route path={"/app/settings"} component={Settings} />
      <Route path={"/app/operations"} component={Operations} />
      <Route path={"/app/pos"} component={POS} />
      <Route path={"/app/media"} component={Media} />
      <Route path={"/app/client-gallery"} component={ClientGallery} />
      <Route path={"/app/waitlist"} component={WaitlistQueue} />
      <Route path={"/app/setup"} component={WorkspaceSetup} />
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
        defaultTheme="dark"
        switchable
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
