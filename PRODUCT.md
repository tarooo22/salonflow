# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Customers (primary for the public site):** people across Georgia looking for a beauty, aesthetic or dental service. They arrive wanting to find a place nearby, see its services and prices, pick a specialist and an open time, and book without calling. Mostly on phones.
- **Businesses (secondary for the public site, primary for the internal panel):** salons, aesthetic/cosmetology centers and dental clinics. Owners, managers, receptionists and staff run their day in the internal panel: calendar, clients, staff, services, POS, reports, marketplace profile.

## Product Purpose

One booking marketplace that unites salons, aesthetic centers and dental clinics. The public site is a customer catalog (the role mysalon.ge plays in the market): browse categories, discover businesses, check a profile, book online. Each business vertical gets its own tailored internal panel (salon vs aesthetic center vs dental clinic). Success: customers book real appointments through the catalog, and businesses join because the catalog brings them clients and the panel runs their day.

## Positioning

- Beauty, aesthetics and dental in one catalog, instead of beauty-only competitors (mysalon.ge covers salons, aesthetic centers and grooming, not dental).
- Availability is real: open times come from each business's live schedule and are re-checked on the server when the booking is committed, so a shown slot is a bookable slot.
- The same platform is the business's management system, so listings stay current without manual upkeep.

## Operating Context

- Customer path: catalog → business profile (services with price and duration, team, hours, address) → service(s) → specialist → date and time → confirm with name and phone → manage/cancel/reschedule via a private link (`/manage-booking/:token`).
- Discovery surfaces: home catalog, category directory (`/salons`), map (`/salons/map`), business profile (`/salon/:slug`).
- Listings are reviewed: a business appears in the catalog only after its marketplace profile is approved. Promotion tiers VIP and RECOMMENDED exist and are disclosed.
- Main competitor and reference: mysalon.ge (customer catalog with banners, category icons, VIP/recommended/new strips, products, vacancies, map).

## Capabilities and Constraints

- Existing: marketplace categories (DB-driven, ka/en/ru names), approved directory with promotion tiers and cover images, map results, public business profile, multi-service booking flow, waitlist, manage-booking by token, feedback, ka/en/ru public locale.
- Not built yet: products shop and job vacancies (planned as separate features), dental-specific categories, per-vertical internal panels.
- Stack is fixed: React 19, Tailwind 4, shadcn/ui, tRPC, MySQL (see `CLAUDE.md`).
- Coverage: all of Georgia from launch, filterable by city/area.
- **Open decision:** the product name. "SalonFlow" is being retired because the platform is not salon-only; a new name is pending. Keep the name in one place so it can change.

## Brand Commitments

- Georgian-first: Georgian is the primary language; English and Russian are secondary.
- No binding visual identity yet; the current look is not a commitment.

## Evidence on Hand

- A few partner businesses are ready to be listed (exact names, photos and services not yet in the repo).
- No testimonials, ratings, press, booking counts or customer numbers exist. Do not invent any; do not show fake businesses as if real.

## Product Principles

1. The customer finds and books in as few steps as possible; every screen earns its place.
2. Show only what is true: real businesses, real open times, real prices.
3. One catalog for every vertical; differences between verticals live in the business panel, not in separate customer sites.
4. Mobile first.

## Accessibility & Inclusion

WCAG 2.1 AA. Full keyboard path through discovery and booking. Georgian script must stay legible at small sizes on phones.
