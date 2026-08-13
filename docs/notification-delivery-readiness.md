# SalonFlow Transactional Delivery Readiness

## Current State

SalonFlow has local authentication, password recovery, and verification-code security foundations in place. Reset and verification records are purpose-bound, expiry-bound, hash-only, and single-use; the browser never receives a raw stored recovery token. Customer delivery is deliberately disabled.

> No password-reset message, verification code, or appointment reminder is represented as sent until a verified sender identity and approved provider configuration exist.

| Capability | Current state | Delivery dependency |
|---|---|---|
| Local registration and sign-in | Available | None |
| Password-reset request and secure token consumption | Available | A verified sender before a customer can receive the reset link or code |
| Verification-code security lifecycle | Available | A verified sender before a customer can receive the code |
| Appointment reminder jobs | Deferred | Verified sender, provider credentials, consent policy, and Heartbeat-backed scheduler configuration |

## Required Inputs Before Activation

The project owner must provide the verified custom sender domain and select a transactional provider. The provider configuration must support an API credential that is stored as a server-only secret; it must never be embedded in the browser bundle, source code, sample data, or logs.

| Required input | Why it is required |
|---|---|
| Verified sender domain, such as `mail.example.ge` | Establishes an approved From identity for recipient-facing transactional messages. |
| Transactional provider API key | Authorizes server-side dispatch and provider status checks. |
| Approved From name and From address | Makes recipient-facing communication recognizable and consistent. |
| Provider webhook/signature details, if delivery events are required | Enables status, bounce, and retry records without trusting unauthenticated callbacks. |
| Reminder timing and consent policy | Determines which appointment messages can be queued and when. |

## Activation Guardrails

When these inputs are available, message creation should remain separate from delivery. The implementation must create idempotent notification jobs, send through the provider from the server only, persist sanitized provider outcome metadata, and schedule retries/reminders through Heartbeat rather than in-process timers. A booking must remain committed when a notification provider is temporarily unavailable; the notification job should record the failure for safe retry.
