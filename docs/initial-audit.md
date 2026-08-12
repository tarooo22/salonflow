# SalonFlow Initial Audit

## Current Starting Point

The supplied package contains a React/Vite interaction prototype with demo data and a visual-reference set. It provides useful interaction and information-architecture cues for dashboards, calendars, and public booking, but it does not yet provide the server-side security, data integrity, authentication, availability locking, payments, reporting, or test coverage required for a production application.

## Visual Reference Findings

The reference dashboards use a practical desktop shell: an always-available side navigation, a restrained top command area, summary cards, dense operational lists, and a time-grid calendar organized by staff member. These are effective functional patterns for a salon operations tool, but the supplied reference branding, logo, palette, and visual styling will not be reproduced.

## Proposed SalonFlow Direction

SalonFlow will use an original **warm, modern operations workspace** direction. The private application will pair a deep ink navigation frame with a soft ivory workspace, terracotta as the primary action color, jade for confirmed or completed states, and amber/red for attention and exceptions. Typography will use a clean humanist sans-serif, deliberate spacing, high-contrast data tables, and compact appointment cards whose colors always have text labels or icons as a non-color cue. The public booking flow will feel lighter and more reassuring, with a focused stepper and larger touch targets rather than an admin dashboard aesthetic.

## Product Foundations Required

The build will introduce organization-scoped records, location slugs, four staff roles, secure procedures, UTC persistence with location-specific IANA time zones, integer-tetri monetary fields, appointment snapshots, server-side balance derivation, protected CSV generation, and transactional conflict prevention for overlapping bookings. These foundations will be developed before the operation screens are connected to live data.
