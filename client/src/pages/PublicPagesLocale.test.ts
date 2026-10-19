import { describe, expect, it } from "vitest";
import { ui as bookingFeedbackUi } from "@/components/public/BookingFeedbackForm";
import { ui as bookingPrimitivesUi } from "@/components/public/BookingPrimitives";
import { ui as chromeUi } from "@/components/catalog/CatalogChrome";
import { consentUi } from "@/contexts/PublicAnalyticsConsentContext";
import { ui as commerceUi, employmentLabel, salaryLabel } from "@/components/catalog/Commerce";
import { ui as ticketsUi } from "@/components/catalog/Tickets";
import { ui as discoveryUi } from "@/components/public/MarketplaceDiscovery";
import { VERTICALS, verticalLabel } from "@/lib/verticals";
import { ui as book } from "./Book";
import { bookingUi, flowUi, getBookingValidationIssue, weekdayName } from "./BookingFlow";
import { ui as home } from "./Home";
import { ui as manageBooking } from "./ManageBooking";
import { ui as directory } from "./MarketplaceDirectory";
import { ui as map } from "./MarketplaceMap";
import { ui as notFound } from "./NotFound";
import { ui as products } from "./Products";
import { ui as vacancies } from "./Vacancies";
import { ui as vacancyDetail } from "./VacancyDetail";
import { ui as waitlist } from "./Waitlist";

// Same shape as the Georgian source of truth: every key (and array/object entry) exists in en and ru.
function shape(value: unknown): unknown {
  if (typeof value === "string") return "text";
  if (typeof value === "function") return "fn";
  if (Array.isArray(value)) return value.map(shape);
  return Object.fromEntries(Object.entries(value as object).map(([key, item]) => [key, shape(item)]));
}

function texts(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (typeof value === "function") return [];
  return Object.values(value as object).flatMap(texts);
}

const dictionaries = { book, bookingUi, flowUi, home, vacancies, vacancyDetail, products, directory, map, manageBooking, waitlist, notFound, commerceUi, ticketsUi, discoveryUi, chromeUi, bookingPrimitivesUi, bookingFeedbackUi, consentUi };

describe("public pages: en and ru dictionaries mirror ka", () => {
  for (const [name, dictionary] of Object.entries(dictionaries)) {
    it(`${name} has the same keys in ka, en and ru`, () => {
      expect(shape(dictionary.en)).toEqual(shape(dictionary.ka));
      expect(shape(dictionary.ru)).toEqual(shape(dictionary.ka));
    });
  }

  it("keeps the wizard's Georgian validation copy by default and localizes it on request", () => {
    const input = { step: 3, serviceId: "s", staffProfileId: "p", startsAt: new Date(), available: true, firstName: "", phone: "", termsAccepted: false };
    expect(getBookingValidationIssue(input)).toMatchObject({ kind: "contact", title: "მიუთითეთ სახელი" });
    expect(getBookingValidationIssue({ ...input, locale: "en" })?.title).toBe("Enter your first name");
    expect(getBookingValidationIssue({ ...input, locale: "ru" })?.title).toBe("Укажите имя");
    expect(weekdayName(0)).toBe("ორშაბათი");
    expect(weekdayName(6, "ru")).toBe("Воскресенье");
  });

  it("has no empty copy in the Home and Vacancies dictionaries", () => {
    for (const dictionary of [home, vacancies]) {
      for (const locale of ["ka", "en", "ru"] as const) {
        for (const text of texts(dictionary[locale])) expect(text.trim().length).toBeGreaterThan(0);
      }
    }
  });
});

describe("vertical, employment and salary labels", () => {
  it("keeps the Georgian label and adds en/ru", () => {
    expect(VERTICALS.map(item => item.label)).toEqual(["სილამაზე", "ესთეტიკა", "სტომატოლოგია"]);
    expect(verticalLabel("dental", "en")).toBe("Dental");
    expect(verticalLabel("beauty", "ru")).toBe("Красота");
  });

  it("translates employment types and salary phrases without inventing figures", () => {
    expect(employmentLabel("CHAIR_RENTAL", "en")).toBe("Chair rental");
    expect(employmentLabel("PART_TIME", "ru")).toBe("Частичная занятость");
    expect(employmentLabel("OTHER", "en")).toBe("OTHER");
    expect(salaryLabel(null, null, "en")).toBe("Salary by agreement");
    expect(salaryLabel(null, null, "ru")).toBe("Оплата по договорённости");
    expect(salaryLabel(120000, null, "en")).toMatch(/^from /);
    expect(salaryLabel(null, 200000, "ru")).toMatch(/^до /);
  });
});
