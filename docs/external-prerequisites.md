# External Prerequisites

## Transactional email for account recovery

Password-reset and email-verification delivery remain intentionally disabled until the project has a verified sender domain and a transactional email API key. The selected future provider can be Resend; its official documentation states that transactional email requires a domain verified with Resend and an API key. [Resend Introduction](https://resend.com/docs/introduction)

No reset token or verification code may be returned to an unauthenticated browser as a substitute for email delivery. This preserves account-recovery security until the required sender domain is available.

The application now creates only hash-only, expiring reset-token records for eligible local accounts and offers a generic request response regardless of account existence. The raw token is discarded until a verified sender can deliver it. An opt-in live database test verifies reset-token persistence, expiry rejection, single-use consumption, and password replacement against an isolated temporary user.
