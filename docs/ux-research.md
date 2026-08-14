# SalonFlow — Assumption-Led UX Research and Usability Plan

## Evidence boundary

This is a **research plan**, not a report of interviews, usability sessions, ratings, or quantified user behavior. The personas and risks below are explicit working assumptions derived from the product brief and must be validated with real participants before being treated as findings.[^brief]

| Assumption-led persona | Context and primary job | Key risk to validate |
| --- | --- | --- |
| Owner | Opens a new Georgian salon workspace, often from a laptop between operations. | Can they create a usable first location, catalog, schedule, and booking link without interpreting empty analytics? |
| Receptionist | Manages walk-ins and schedule changes under time pressure on a desktop or tablet. | Can they create or move an appointment without bypassing availability, location, or payment rules? |
| Staff member | Checks a personal day plan on mobile during service transitions. | Can they identify the next permitted action and client context without seeing colleagues’ private finance data? |
| Booking client | Uses a mobile link from a social profile, usually without a SalonFlow account. | Can they choose a service, specialist or any-available option, time, and consent in one to two minutes? |

## Research questions and method

The first round should be moderated task-based testing with consent, screen recording only when approved, and no customer data. Recruit five to eight participants across the four assumed roles, including at least two mobile-first booking clients and one keyboard or screen-reader user where feasible. Review results qualitatively; do not extrapolate statistical conclusions from this small sample.

| Journey | Task and success criteria | Observations to capture |
| --- | --- | --- |
| Owner onboarding | Create a location, hours, service, eligible staff member, and locate the public link. | Completion, time, unclear labels, skipped essential setup, recovery from validation errors. |
| Receptionist walk-in | Place a same-day walk-in in a staff slot and handle an unavailable time. | Awareness of conflict feedback, location choice, service price/duration, and confirmation confidence. |
| Staff daily view | Find next appointment and identify allowed status action. | Scanability, role visibility, mobile touch targets, and lack of finance leakage. |
| Client booking | Complete public booking with any available, a Georgian phone number, and consent. | Step comprehension, price/time clarity, focus order, error recovery, and confirmation understanding. |

## Accessibility and measurement plan

Run each journey at 320px, 375px, 390px, 430px, 768px, 1024px, and 1440px; test keyboard Tab/Shift+Tab/Enter/Escape and a 200% text-size pass. Record task completion, time on task, mis-selections, error recovery, and qualitative confidence. The intended release threshold is no blocking path, no keyboard trap, no horizontal overflow, and a visible named primary action for each journey.

[^brief]: User-supplied *SalonFlow Manus Master Build Kit*, 2026-08-14, `/home/ubuntu/upload/SALONFLOW_MANUS_REFERENCE_LED_BUILD_BRIEF_GE_2026-08-14.md`.
