import { MySqlDialect } from "drizzle-orm/mysql-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bookingReceivedEmail, bookingStatusEmail, escapeHtml, formatBookingTime, notifyAppointmentStatusChange, notifyNewOnlineBooking, ownerNewBookingEmail, ownerRecipientEmails, resolveSiteOrigin, sendEmail, type BookingFacts } from "./notifications";

const facts: BookingFacts = {
  salonName: "სალონი <b>&\"'",
  address: "თბილისი, <script>alert(1)</script>",
  serviceNames: ["ვარცხნილობა", "<img src=x onerror=1>"],
  specialistName: "ნინო",
  startsAt: new Date("2026-10-27T10:30:00.000Z"), // 14:30 in Tbilisi (UTC+4)
  timeZone: "Asia/Tbilisi",
  firstName: "<i>თამარი</i>",
};

const message = { to: "customer@example.com", subject: "თემა", html: "<p>x</p>", text: "x" };
const envKeys = ["RESEND_API_KEY", "NOTIFY_FROM", "PUBLIC_SITE_URL", "RAILWAY_PUBLIC_DOMAIN"] as const;
const savedEnv = Object.fromEntries(envKeys.map(key => [key, process.env[key]]));

beforeEach(() => {
  for (const key of envKeys) delete process.env[key];
  vi.spyOn(console, "info").mockImplementation(() => undefined);
});
afterEach(() => {
  for (const key of envKeys) { if (savedEnv[key] === undefined) delete process.env[key]; else process.env[key] = savedEnv[key]; }
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function configure() {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.NOTIFY_FROM = "Chawera <noreply@chawera.ge>";
}

describe("templates", () => {
  it("escapes every dynamic value in html", () => {
    for (const email of [bookingReceivedEmail(facts, "https://x.test/manage-booking/a\"b"), bookingStatusEmail(facts, "CONFIRMED"), bookingStatusEmail(facts, "CANCELLED"), ownerNewBookingEmail(facts, "https://x.test/app/calendar")]) {
      expect(email.html).not.toContain("<script>");
      expect(email.html).not.toContain("<img");
      expect(email.html).not.toContain("<i>");
      expect(email.html).not.toContain("<b>");
    }
    expect(bookingReceivedEmail(facts, null).html).toContain("&lt;script&gt;");
    expect(bookingReceivedEmail(facts, "https://x.test/m/a\"b").html).toContain("a&quot;b");
    expect(escapeHtml(`&<>"'`)).toBe("&amp;&lt;&gt;&quot;&#39;");
  });

  it("customer booking received has status, local time, manage link and footer", () => {
    const email = bookingReceivedEmail(facts, "https://chawera.ge/manage-booking/tok");
    expect(email.text).toContain("დასადასტურებელია");
    expect(email.text).toContain("სამშაბათი, 27 ოქტომბერი, 14:30");
    expect(email.text).toContain("https://chawera.ge/manage-booking/tok");
    expect(email.text).toContain("Chawera — ონლაინ ჩაწერა");
    expect(email.html).toContain("#CF3F55");
  });

  it("status emails carry no manage link or token", () => {
    expect(bookingStatusEmail(facts, "CONFIRMED").subject).toContain("დადასტურებულია");
    expect(bookingStatusEmail(facts, "CANCELLED").subject).toContain("გაუქმებულია");
    expect(bookingStatusEmail(facts, "CONFIRMED").text).not.toContain("manage-booking");
  });

  it("owner email has first name and calendar link but no contact data", () => {
    const email = ownerNewBookingEmail({ ...facts, firstName: "თამარი" }, "https://chawera.ge/app/calendar");
    expect(email.subject).toBe("ახალი ონლაინ ჯავშანი");
    expect(email.text).toContain("თამარი");
    expect(email.text).toContain("https://chawera.ge/app/calendar");
    expect(email.text).not.toMatch(/@|\+995|manage-booking/);
  });

  it("formats the time in the location time zone", () => {
    expect(formatBookingTime(new Date("2026-01-01T20:30:00.000Z"), "Asia/Tbilisi")).toBe("პარასკევი, 2 იანვარი, 00:30");
  });
});

describe("sendEmail", () => {
  it("skips with one log line and no request when not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(message, "booking_received")).toBe("skipped");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledTimes(1);
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining("skipped: email not configured"));
  });

  it("posts to Resend with bearer auth and logs no personal data", async () => {
    configure();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await sendEmail(message, "booking_received")).toBe("sent");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test_key");
    expect(JSON.parse(init.body as string)).toMatchObject({ from: "Chawera <noreply@chawera.ge>", to: ["customer@example.com"], subject: "თემა" });
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain("customer@example.com");
  });

  it("never throws on http errors, network errors or timeouts", async () => {
    configure();
    vi.stubGlobal("fetch", vi.fn(async () => new Response("no", { status: 500 })));
    expect(await sendEmail(message)).toBe("failed");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("boom customer@example.com"); }));
    expect(await sendEmail(message)).toBe("failed");
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => init.signal!.addEventListener("abort", () => reject(new Error("aborted"))))));
    const pending = sendEmail(message);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await pending).toBe("failed");
    vi.useRealTimers();
    expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toContain("customer@example.com");
  });
});

describe("resolveSiteOrigin", () => {
  const req = (host: string) => ({ get: () => host });
  it("prefers PUBLIC_SITE_URL, then Railway domain", () => {
    process.env.PUBLIC_SITE_URL = "https://chawera.ge/";
    expect(resolveSiteOrigin(req("evil.test"))).toBe("https://chawera.ge");
    delete process.env.PUBLIC_SITE_URL;
    process.env.RAILWAY_PUBLIC_DOMAIN = "app.up.railway.app";
    expect(resolveSiteOrigin(req("evil.test"))).toBe("https://app.up.railway.app");
  });
  it("does not trust the Host header in production", () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    expect(resolveSiteOrigin(req("evil.test"))).toBeNull();
    process.env.NODE_ENV = previous;
    expect(resolveSiteOrigin(req("localhost:3000"))).toBe("http://localhost:3000");
  });
});

function renderWhere(where: unknown) {
  return new MySqlDialect().sqlToQuery(where as never);
}

function fakeDb(selects: unknown[][]) {
  const wheres: unknown[] = [];
  const queue = [...selects];
  const chain = (rows: unknown[]) => {
    const c: Record<string, unknown> = {};
    c.from = () => c;
    c.innerJoin = () => c;
    c.where = (condition: unknown) => { wheres.push(condition); return c; };
    c.limit = async () => rows;
    c.orderBy = async () => rows;
    c.then = (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(rows).then(resolve, reject);
    return c;
  };
  return { select: vi.fn(() => chain(queue.shift() ?? [])), wheres } as unknown as Parameters<typeof ownerRecipientEmails>[0] & { wheres: unknown[]; select: ReturnType<typeof vi.fn> };
}

describe("ownerRecipientEmails", () => {
  it("scopes by organization, active membership, OWNER/MANAGER and dedupes", async () => {
    const db = fakeDb([[{ email: "Owner@Example.com" }, { email: "owner@example.com" }, { email: null }, { email: "m@example.com" }]]);
    expect(await ownerRecipientEmails(db, "org_same_00000001")).toEqual(["owner@example.com", "m@example.com"]);
    const { sql, params } = renderWhere((db as unknown as { wheres: unknown[] }).wheres[0]);
    expect(params).toEqual(expect.arrayContaining(["org_same_00000001", "ACTIVE", "OWNER", "MANAGER"]));
    expect(params).not.toContain("RECEPTIONIST");
    expect(sql).toContain("organizationId");
  });
});

describe("notify orchestration", () => {
  const bookingRow = { organizationId: "org_same_00000001", startsAt: facts.startsAt, staffProfileId: "s1", salonName: "სალონი", address: null, timeZone: "Asia/Tbilisi", firstName: "თამარი", clientEmail: "client@example.com" };
  const selects = (clientEmail: string | null = "client@example.com") => [[{ ...bookingRow, clientEmail }], [{ name: "ვარცხნილობა" }], [{ name: "ნინო" }], [{ email: "owner@example.com" }]];

  it("does nothing, and touches no DB, when not configured", async () => {
    const db = fakeDb(selects());
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await notifyNewOnlineBooking(db, { appointmentId: "a1", manageToken: "tok", customerEmail: "client@example.com", origin: "https://chawera.ge" });
    await notifyAppointmentStatusChange(db, { appointmentId: "a1", status: "CONFIRMED" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.select).not.toHaveBeenCalled();
  });

  it("sends customer + owner emails for a new booking, token only in the customer email", async () => {
    configure();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await notifyNewOnlineBooking(fakeDb(selects()), { appointmentId: "a1", manageToken: "secret-token", customerEmail: "client@example.com", origin: "https://chawera.ge" });
    const bodies = fetchMock.mock.calls.map(call => JSON.parse((call as unknown as [string, RequestInit])[1].body as string));
    expect(bodies).toHaveLength(2);
    expect(bodies[0].to).toEqual(["client@example.com"]);
    expect(bodies[0].text).toContain("https://chawera.ge/manage-booking/secret-token");
    expect(bodies[1].to).toEqual(["owner@example.com"]);
    expect(JSON.stringify(bodies[1])).not.toContain("secret-token");
    expect(JSON.stringify(bodies[1])).not.toContain("client@example.com");
  });

  it("greets the customer with the name typed in the booking, not the stored client name", async () => {
    configure();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await notifyNewOnlineBooking(fakeDb(selects()), { appointmentId: "a1", manageToken: "tok", customerEmail: "client@example.com", customerFirstName: "ანა", origin: null });
    const customer = JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(customer.text).toContain("გამარჯობა, ანა!");
    expect(customer.text).not.toContain("თამარი");
    fetchMock.mockClear();
    await notifyNewOnlineBooking(fakeDb(selects()), { appointmentId: "a1", manageToken: "tok", customerEmail: "client@example.com", origin: null });
    expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string).text).not.toContain("თამარი");
  });

  it("skips the customer email when none was given but still alerts the owner; never throws on DB errors", async () => {
    configure();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await notifyNewOnlineBooking(fakeDb(selects()), { appointmentId: "a1", manageToken: "tok", customerEmail: undefined, origin: null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const failing = { select: () => { throw new Error("db down"); } } as never;
    await expect(notifyNewOnlineBooking(failing, { appointmentId: "a1", manageToken: "tok", customerEmail: "c@example.com", origin: null })).resolves.toBeUndefined();
  });

  it("status change emails the customer only for CONFIRMED/CANCELLED and only with an email on record", async () => {
    configure();
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await notifyAppointmentStatusChange(fakeDb(selects()), { appointmentId: "a1", status: "CHECKED_IN" });
    await notifyAppointmentStatusChange(fakeDb(selects(null)), { appointmentId: "a1", status: "CANCELLED" });
    expect(fetchMock).not.toHaveBeenCalled();
    await notifyAppointmentStatusChange(fakeDb(selects()), { appointmentId: "a1", status: "CANCELLED" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
