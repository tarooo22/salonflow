# External Prerequisites

## Transactional email for account recovery

Password-reset and email-verification delivery remain intentionally disabled until the project has a verified sender domain and a transactional email API key. The selected future provider can be Resend; its official documentation states that transactional email requires a domain verified with Resend and an API key. [Resend Introduction](https://resend.com/docs/introduction)

No reset token or verification code may be returned to an unauthenticated browser as a substitute for email delivery. This preserves account-recovery security until the required sender domain is available.
