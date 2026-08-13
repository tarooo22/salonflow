# SalonFlow — Development Demo Preview

`/preview-demo` is a **development-only** visual preview. It uses a deterministic in-memory dataset and does not call a tRPC mutation, write to TiDB, seed the shared database, create a customer record, or appear in production builds.

The preview includes exactly two locations, four specialists, twelve clients, twelve services, eighteen appointments across operational statuses, and non-zero payment, commission, and expense counts. It is explicitly labelled in Georgian as demonstration data and does not include reviews, ratings, testimonials, or claims attributed to real people.

This choice protects the shared production database while still providing a representative, idempotent preview surface for design, responsive, and workflow review. When a physically isolated non-production database is available, a separate persistence seed may be added behind an explicit environment/database guard and must still retain clear demo labelling.

## Validation evidence

`shared/demoPreview.test.ts` proves the exact deterministic dataset shape. Desktop and 375px rendered reviews confirm that the Georgian disclosure appears before all preview data and that the locations, services, and queue remain readable without horizontal overflow. The guided onboarding companion flow was verified separately with `scripts/authenticated-workspace-check.ts`: it registers a disposable local user, completes all four setup steps, confirms the Today launch checklist, traverses protected workspace pages, and cleans the temporary account and organization data afterward.
