# Temporary Gmail SMTP Sender Assessment

Gmail can serve as a temporary transactional sender without purchasing a custom domain if the account owner can use an app password. Google documents that app passwords are 16-digit passcodes and require 2-Step Verification; they may be unavailable for Advanced Protection accounts, accounts configured only for security keys, or organization-managed accounts that prohibit them. [Gmail Help: App passwords](https://support.google.com/mail/answer/185833?hl=en)

For Google Workspace, Google documents `smtp.gmail.com` with port 465 or 587 over TLS/SSL, authenticating with the complete email address and an app password. The same guidance notes a 2,000-message daily sending limit and that spam filters can reject suspicious traffic. [Google Workspace: Send email from an app](https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app)

This path is suitable only as a temporary sender. The user must explicitly provide the sender address and a newly generated app password through the project secret form. The app password is never requested in chat, never committed, and should be revoked when a verified-domain sender replaces it.
