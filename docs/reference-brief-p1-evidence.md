# SalonFlow — Reference Brief P1 Evidence

## Rendered checks

The authenticated preview Settings route rendered profile editing, Light/Dark/System theme choices, a protected-workspace privacy explanation, and a truthful unconfigured notification state. The sidebar also exposed both Settings and the compact theme chooser.

The public `/claim-account` route rendered a Georgian **აღდგენის კოდი** field and recovery guidance without showing `openId`, `local_`, or a raw technical account reference. The form retains required email and current-password fields.

## Automated checks

Focused TypeScript and unit checks passed for the self-profile mutation, theme context, and recovery-code input contract. The self-cleaning authenticated workspace browser validation passed after it completed onboarding, Settings theme/profile interactions, and the legacy claim flow with the recovery code.
