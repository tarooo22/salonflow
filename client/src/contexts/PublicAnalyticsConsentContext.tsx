import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import "@/components/catalog/catalog.css";

const STORAGE_KEY = "salonflow-public-conversion-consent-v1";
const CONSENT_VERSION = "public-conversion-v1" as const;
const allowedEvents = new Set([
  "PUBLIC_PAGE_VIEW", "DIRECTORY_VIEWED", "MAP_VIEWED", "SALON_PROFILE_VIEWED", "BOOKING_STARTED", "PARTNER_VIEWED", "OWNER_REGISTRATION_OPENED", "DISCOVERY_SEARCH_SUBMITTED", "DIRECTORY_MAP_OPENED", "OWNER_CTA_SELECTED", "BOOKING_SERVICE_SELECTED", "BOOKING_ANY_AVAILABLE_SELECTED", "BOOKING_SPECIALIST_SELECTED", "BOOKING_TIME_SELECTED", "BOOKING_SUBMIT_SELECTED", "BOOKING_WAITLIST_HANDOFF", "BOOKING_WAITLIST_SUBMIT",
]);
type ConsentChoice = "accepted" | "declined" | null;
type AnalyticsEvent = "PUBLIC_PAGE_VIEW" | "DIRECTORY_VIEWED" | "MAP_VIEWED" | "SALON_PROFILE_VIEWED" | "BOOKING_STARTED" | "PARTNER_VIEWED" | "OWNER_REGISTRATION_OPENED" | "DISCOVERY_SEARCH_SUBMITTED" | "DIRECTORY_MAP_OPENED" | "OWNER_CTA_SELECTED" | "BOOKING_SERVICE_SELECTED" | "BOOKING_ANY_AVAILABLE_SELECTED" | "BOOKING_SPECIALIST_SELECTED" | "BOOKING_TIME_SELECTED" | "BOOKING_SUBMIT_SELECTED" | "BOOKING_WAITLIST_HANDOFF" | "BOOKING_WAITLIST_SUBMIT";

const PublicAnalyticsConsentContext = createContext<{ choice: ConsentChoice; setChoice: (value: Exclude<ConsentChoice, null>) => void }>({ choice: null, setChoice: () => undefined });

function publicRoute(pathname: string) {
  return !pathname.startsWith("/app/") && !pathname.startsWith("/invite/") && !pathname.startsWith("/claim-account");
}

function routeEvent(pathname: string): AnalyticsEvent {
  if (pathname === "/salons") return "DIRECTORY_VIEWED";
  if (pathname === "/salons/map") return "MAP_VIEWED";
  if (pathname.startsWith("/salon/")) return "SALON_PROFILE_VIEWED";
  if (pathname === "/book" || pathname.startsWith("/book/")) return "BOOKING_STARTED";
  if (pathname === "/partner") return "PARTNER_VIEWED";
  if (pathname === "/register") return "OWNER_REGISTRATION_OPENED";
  return "PUBLIC_PAGE_VIEW";
}

export function PublicAnalyticsConsentProvider({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [choice, setChoiceState] = useState<ConsentChoice>(null);
  const lastPageRef = useRef<string | null>(null);
  const record = trpc.publicAnalytics.record.useMutation();
  const setChoice = (value: Exclude<ConsentChoice, null>) => { localStorage.setItem(STORAGE_KEY, value); setChoiceState(value); };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "accepted" || stored === "declined") setChoiceState(stored);
  }, []);

  useEffect(() => {
    if (choice !== "accepted" || !publicRoute(location) || lastPageRef.current === location) return;
    lastPageRef.current = location;
    record.mutate({ eventName: routeEvent(location), routePath: location, consentVersion: CONSENT_VERSION });
  }, [choice, location, record]);

  useEffect(() => {
    if (choice !== "accepted") return;
    const onClick = (event: MouseEvent) => {
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-conversion-event]") : null;
      const name = element?.dataset.conversionEvent;
      if (!name || !allowedEvents.has(name) || !publicRoute(window.location.pathname)) return;
      record.mutate({ eventName: name as AnalyticsEvent, routePath: window.location.pathname, consentVersion: CONSENT_VERSION });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [choice, record]);

  const value = useMemo(() => ({ choice, setChoice }), [choice]);
  return <PublicAnalyticsConsentContext.Provider value={value}>{children}{publicRoute(location) && location !== "/privacy" ? <AnalyticsConsentSurface /> : null}</PublicAnalyticsConsentContext.Provider>;
}

export function usePublicAnalyticsConsent() { return useContext(PublicAnalyticsConsentContext); }

export function AnalyticsConsentPreferencesButton({ className = "" }: { className?: string }) {
  const { setChoice } = usePublicAnalyticsConsent();
  return <button type="button" className={`text-left underline decoration-[var(--sf-line)] underline-offset-4 transition-colors hover:text-[var(--sf-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-focus)] ${className}`} onClick={() => setChoice("declined")}>Analytics არჩევანი</button>;
}

function AnalyticsConsentSurface() {
  const { choice, setChoice } = usePublicAnalyticsConsent();
  if (choice !== null) return null;
  return <section className="cw fixed inset-x-3 bottom-3 z-50 mx-auto max-w-2xl rounded-[4px] border-[1.5px] border-[var(--cw-ink)] p-3 shadow-[0_14px_30px_-16px_rgba(8,7,32,0.6)] sm:flex sm:items-center sm:gap-4 md:bottom-5" aria-label="ანალიტიკის თანხმობა"><p className="text-sm leading-6 text-[var(--cw-ink)]"><strong>ანონიმური სტატისტიკა?</strong> ვინახავთ მხოლოდ გვერდს და დროს — არა სახელს, ტელეფონს ან ჯავშნის დეტალებს. <a href="/privacy#analytics" className="font-bold text-[var(--cw-stamp)] underline">დეტალურად</a></p><div className="mt-2 flex shrink-0 gap-2 sm:mt-0"><button type="button" className="cw-btn cw-btn-stamp min-h-10 px-4 text-sm" onClick={() => setChoice("accepted")}>თანხმობა</button><button type="button" className="cw-btn cw-btn-line min-h-10 px-4 text-sm" onClick={() => setChoice("declined")}>უარი</button></div></section>;
}
