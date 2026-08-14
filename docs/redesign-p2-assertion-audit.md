# SalonFlow — 104 → 103 Test-Count Audit

## Finding

The earlier delivery language called Vitest test cases “assertions.” Vitest itself reported **test cases**, not a count of individual `expect()` matcher invocations. The P2 operations checkpoint `bb975e5e` recorded **34 test files / 104 test cases**. The later public/auth redesign report recorded **35 test files / 103 test cases**.

This was not an acceptable coverage decrease. Comparing `bb975e5e` to the post-redesign working tree showed that the P2 operational code and its tests had been absent after a sync/replay transition. The evidence does not establish intentional deletion; it shows that the current source no longer contained the already-released P2 symbols.

| Baseline coverage removed from the later tree | Exact protected behavior | Test evidence restored |
|---|---|---|
| `derivePaymentDisplayState` unit case | `UNPAID`, `PARTIAL`, `PAID`, and `REFUNDED` server-derived payment labels | Four matcher cases against persisted payment totals |
| Walk-in calendar-action guard | A caller without `calendar:manage` cannot query/write walk-in data | Rejection plus no database select |
| Checked-in reschedule guard | A checked-in appointment cannot open the reschedule transaction | Rejection plus no transaction call |

The count changed by one in the report because the public/auth redesign added two recovery-code unit cases while three P2 test cases were missing: **104 − 3 + 2 = 103**. The payment-state case itself contained four `expect()` calls, so “one assertion removed” would not have been an accurate technical description.

## Restoration

The following already-released P2 contracts were restored without adding new product scope: `walkInOptions`, `createWalkIn`, `reschedule`, payment-state projection for Today/Calendar, their existing Zod inputs, and their focused regression tests. The restoration preserves organization/location scope, `calendar:manage` authorization, authoritative service price/duration snapshots, schedule locking, transactional overlap checks, pending/confirmed-only rescheduling, and audit history.

## Current verification

After restoration, the full release suite passed: **35 test files / 106 test cases**, TypeScript with zero errors, and production build. This exceeds both reported historical totals and restores the functional safeguards that the 104-test baseline had covered.
