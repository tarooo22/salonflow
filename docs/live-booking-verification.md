# Live Public Booking Verification

This opt-in integration verification is intentionally excluded from the default test suite. It is run only with `RUN_LIVE_DB_TESTS=1` after explicit user approval because it creates a unique, isolated booking fixture in the live database.

The test creates a temporary platform user, organization, public location, active service, active public specialist, and active service eligibility record. It then verifies the initial public booking commit, idempotent retry behavior, and two concurrent submissions for the same specialist slot. The fixture and every related booking/client/schedule-lock record are deleted in `afterAll`, including the booking-generated consent, status-history, immutable service-snapshot rows, membership, and temporary user.

The verification is successful only when one first commit persists, its retry returns the original confirmation token with `replayed: true`, and exactly one of the competing slot submissions succeeds while the other is rejected as unavailable.
