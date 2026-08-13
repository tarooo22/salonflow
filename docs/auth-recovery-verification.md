# Authentication Recovery Verification

**Date:** 13 August 2026

Two unauthenticated browser checks were completed against the current development release.

| Route | Verified result |
|---|---|
| `/app/today` | The protected workspace gate stays on SalonFlow and exposes **Registration** and **Email sign-in** links rather than automatically navigating to Manus OAuth. |
| `/register` | The Georgian local-account form renders directly with name, email, password, account-creation action, and a link to email sign-in. |

The test browser did not open the Manus OAuth screen during either check. The remaining end-to-end validation is to submit a real new account through the registration form and confirm the first-workspace setup routing.

## Published-route follow-up

The public deployment at `https://salonflow-dpxqgxgv.manus.space/register` was checked twice after the registration release. It currently renders the prior Georgian-independent application's generic 404 screen, while the current development release renders the registration form. The production route must be rechecked after deployment propagation and, if still stale, treated as a deployment routing issue rather than a browser authentication problem.
