import { useCallback, useMemo, useSyncExternalStore } from "react";

// Device-local only: no accounts, no manage tokens or links (orchestrator decision, docs/specs/chawera-redesign-2026-10.md).
export const SAVED_KEY = "chawera-saved-salons-v1";
export const BOOKINGS_KEY = "chawera-device-bookings-v1";
const MAX_SAVED = 100;
const MAX_BOOKINGS = 30;

export type DeviceBooking = { slug: string; salonName: string; services: string[]; startsAt: string };

// Pure helpers (exported for tests) ------------------------------------------------------------

export function parseSaved(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(value) ? Array.from(new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))).slice(0, MAX_SAVED) : [];
  } catch { return []; }
}

export function parseBookings(raw: string | null): DeviceBooking[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is DeviceBooking => Boolean(item) && typeof item.slug === "string" && typeof item.salonName === "string"
      && Array.isArray(item.services) && item.services.every((name: unknown) => typeof name === "string")
      && typeof item.startsAt === "string" && Number.isFinite(Date.parse(item.startsAt))).slice(0, MAX_BOOKINGS);
  } catch { return []; }
}

export function toggleSlug(slugs: string[], slug: string): string[] {
  return slugs.includes(slug) ? slugs.filter(item => item !== slug) : [slug, ...slugs].slice(0, MAX_SAVED);
}

const sameBooking = (a: Pick<DeviceBooking, "slug" | "startsAt">, b: Pick<DeviceBooking, "slug" | "startsAt">) => a.slug === b.slug && a.startsAt === b.startsAt;

export function addBooking(bookings: DeviceBooking[], booking: DeviceBooking): DeviceBooking[] {
  return [booking, ...bookings.filter(item => !sameBooking(item, booking))].slice(0, MAX_BOOKINGS);
}

// Storage + subscription ------------------------------------------------------------------------

const listeners = new Set<() => void>();

function read(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}

function write(key: string, value: unknown) {
  try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode or quota: the list just stays in memory-less state */ }
  listeners.forEach(listener => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => { listeners.delete(listener); window.removeEventListener("storage", listener); };
}

// The snapshot is the raw string, so React sees a stable value until storage really changes.
const snapshot = (key: string) => () => read(key);
const savedSnapshot = snapshot(SAVED_KEY);
const bookingsSnapshot = snapshot(BOOKINGS_KEY);
const serverSnapshot = () => null;

/** Saved salons (public slugs). `toggle` is what the heart button on a card calls. */
export function useSavedSalons() {
  const raw = useSyncExternalStore(subscribe, savedSnapshot, serverSnapshot);
  const slugs = useMemo(() => parseSaved(raw), [raw]);
  const isSaved = useCallback((slug: string) => slugs.includes(slug), [slugs]);
  const toggle = useCallback((slug: string) => write(SAVED_KEY, toggleSlug(parseSaved(read(SAVED_KEY)), slug)), []);
  const remove = useCallback((slug: string) => write(SAVED_KEY, parseSaved(read(SAVED_KEY)).filter(item => item !== slug)), []);
  return { slugs, isSaved, toggle, remove };
}

/** Bookings made on this device. `add` is what the booking success step calls. */
export function addDeviceBooking(booking: DeviceBooking) {
  write(BOOKINGS_KEY, addBooking(parseBookings(read(BOOKINGS_KEY)), booking));
}

export function useDeviceBookings() {
  const raw = useSyncExternalStore(subscribe, bookingsSnapshot, serverSnapshot);
  const bookings = useMemo(() => parseBookings(raw), [raw]);
  const remove = useCallback((booking: Pick<DeviceBooking, "slug" | "startsAt">) => write(BOOKINGS_KEY, parseBookings(read(BOOKINGS_KEY)).filter(item => !sameBooking(item, booking))), []);
  return { bookings, add: addDeviceBooking, remove };
}
