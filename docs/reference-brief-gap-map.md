# SalonFlow — Reference-Led Build Brief Gap Map

## Scope and evidence boundary

This map compares the user-supplied **SalonFlow Manus Master Build Kit** with the currently verified repository state. It is a planning artifact, not user research, and it does not represent deferred providers or unimplemented screens as live functionality. The reference brief remains the controlling product direction.[^brief]

| Brief area | Current verified state | Decision |
| --- | --- | --- |
| Local-only authentication and signed sessions | Implemented, including Georgian login/register, local scrypt password verification, `local_` session guards, legacy claim safety, and the embedded HTTPS cookie repair. | Preserve; do not restore OAuth. |
| Four-step owner onboarding | Implemented with organization, location/timezone, hours, initial catalog, eligibility, launch checklist, and redirect to Today. | Preserve; enhance only after higher-priority operational gaps. |
| Isolated demo preview | Implemented as a development-only in-memory, labelled preview with deterministic operational records. | Preserve data boundary; never seed a real organization. |
| Public booking core | Implemented with location context, service/specialist selection, any-available assignment, server availability, idempotency, conflict re-check, and Georgian confirmation. | Preserve integrity contract; later expand only through a separate validated scope. |
| Operations foundation | Today, Calendar, CRM, Staff, Services, Finance, Reports, four roles, scopes, IANA timezone, integer tetri, CSV protection, and testing already exist. | Preserve; prioritize walk-ins, safe rescheduling, and payment context. |
| Design/theme foundation | Semantic warm SalonFlow tokens and Light/Dark/System support exist, but the preference is not exposed inside workspace navigation. | Implement Settings/theme surface first. |
| Human account recovery | `/claim-account` still requires raw `openId`/`local_` input. | Replace with recovery-code UX without weakening current-password verification. |
| Required documentation names | Existing audit, design foundation, usability/QA, and evidence documents cover parts of the requested material, but the brief’s named artifacts are not all present. | Consolidate and extend documentation without inventing research findings. |
| Customer notification delivery | No verified sender domain or provider credential is available; dispatch remains intentionally disabled. | Keep deferred and clearly labelled. |

## Sequenced implementation decision

The next authenticated experience milestone is **Settings plus human recovery**. Both resolve explicit brief requirements and are independent of unconfigured notification providers. The subsequent operations milestone is **walk-in appointment creation, conflict-safe rescheduling, and visible payment context**. These additions must remain protected by existing organization, location, role, money, and appointment-conflict contracts.

## Explicit non-goals for the current milestone

Marketplace discovery, fabricated reviews or ratings, fake staff/customer imagery, automatic waitlist booking, real email/SMS dispatch, payment-provider claims, and any restoration of Manus OAuth are out of scope. A later integration milestone may only begin after the required business input or credentials are supplied.

[^brief]: User-supplied *SalonFlow Manus Master Build Kit*, 2026-08-14, `/home/ubuntu/upload/SALONFLOW_MANUS_REFERENCE_LED_BUILD_BRIEF_GE_2026-08-14.md`.
