# SalonFlow — შეტყობინებების delivery readiness

## მიმდინარე რეალური სტატუსი

SalonFlow-ს აქვს `notification_jobs` რიგის მონაცემთა მოდელი, რომელშიც ინახება channel, template, დაგეგმილი დრო, მცდელობები, provider message ID და უნიკალური idempotency key. ეს არის **მოსამზადებელი საფუძველი** და არა მოქმედი delivery სისტემა. მიმდინარე production configuration-ში არ არსებობს customer-facing email/SMS provider adapter, დადასტურებული sender identity, provider secret ან `/api/scheduled/*` delivery endpoint.

> **No-send boundary:** booking confirmation, password-recovery message, verification code და 24-საათიანი reminder არ უნდა გამოცხადდეს გაგზავნილად და არ უნდა გაეგზავნოს მომხმარებელს, სანამ ქვემოთ მოცემული activation contract სრულად არ შესრულდება.

| შესაძლებლობა | სტატუსი | რას ნიშნავს პრაქტიკაში |
|---|---|---|
| Local registration და sign-in | მოქმედებს | email/password authentication მუშაობს დამოუკიდებლად. |
| უსაფრთხო recovery/verification records | მოქმედებს | token/code lifecycle არსებობს, მაგრამ customer delivery გამორთულია. |
| Booking confirmation job model | მოსამზადებელია | მომავალში შეიქმნება idempotent job; დღეს არ იგზავნება. |
| 24-საათიანი reminder model | მოსამზადებელია | მომავალში due jobs შეირჩევა scheduler-ით; დღეს არ არსებობს scheduler handler. |
| Provider dispatch / bounce status | არ არის კონფიგურირებული | არც ერთი provider არ არის დაკავშირებული. |
| Web Push / PWA notification | არ არის კონფიგურირებული | PWA install foundation არსებობს, მაგრამ browser permission, push subscription და provider delivery ჯერ არ ითხოვება და არ სრულდება. |

## არჩევანი, რომელიც მფლობელმა უნდა დაადასტუროს

| გადაწყვეტილება | საჭირო პასუხი |
|---|---|
| არხი | Email, SMS ან ორივე; თითოეული არხი დამოუკიდებლად ჩაირთვება. |
| Email provider | მაგალითად Resend/SendGrid/სხვა transactional provider და verified From address. |
| SMS provider | მაგალითად Twilio/ადგილობრივი SMS gateway და დამტკიცებული sender/ნომერი. |
| Recipient consent | რომელ contact preference-ზეა ნებადართული transactional message; marketing consent არასოდეს უნდა შეიცვალოს transactional consent-ით. |
| Timing | დადასტურება booking commit-ის შემდეგ; reminder appointment start-მდე ზუსტად 24 საათით ადრე, დაგვიანებული queue მხოლოდ ერთხელ. |
| Template approval | ქართული (`ka-GE`) message templates, sender name, fallback copy და cancellation/reschedule links. |

## ზუსტი secrets და configuration contract

Secrets ინახება მხოლოდ server environment-ში. ისინი არასოდეს შედის browser bundle-ში, source-ში, test fixture-ში, notification payload log-ში ან settings UI-ში.

| Channel / adapter | სავალდებულო environment variables | დამატებითი წინაპირობა |
|---|---|---|
| Email — Resend | `NOTIFICATION_EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | `RESEND_FROM_EMAIL` უნდა იყოს provider-ში verified domain/address; webhook tracking-ისთვის დაემატება `RESEND_WEBHOOK_SECRET`. |
| SMS — Twilio | `NOTIFICATION_SMS_PROVIDER=twilio`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` | `TWILIO_FROM_NUMBER` უნდა იყოს დამტკიცებული messaging sender. Twilio callback signature მოწმდება `TWILIO_AUTH_TOKEN`-ით. |
| Provider-neutral toggle | `NOTIFICATION_DELIVERY_ENABLED=true` | ეს მნიშვნელობა განისაზღვრება **მხოლოდ** adapter, sender, templates, handler, scheduler და test runbook-ის წარმატებული deploy-ის შემდეგ. default არის unset/false. |
| Web Push — VAPID | `WEB_PUSH_ENABLED=true`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | `VAPID_SUBJECT` უნდა იყოს მოქმედი `mailto:` ან HTTPS contact URL. Private key რჩება server-only; public key მიეწოდება მხოლოდ explicit subscribe flow-ს. |

შერჩეული provider-ის ოფიციალური webhook signature scheme უნდა შემოწმდეს მის მიმდინარე დოკუმენტაციასთან integration-ის განხორციელების დროს. Webhook არასოდეს ენდობა request body-ს: იგი ამოწმებს signature/timestamp-ს, ინახავს მხოლოდ აუცილებელ provider event metadata-ს და provider event ID-ს unique key-ით idempotently.

## Web Push / PWA activation contract

PWA install და Web Push დამოუკიდებელი შესაძლებლობებია. აპის დაყენება browser-ში **არ** ნიშნავს notification permission-ს და subscriber record-ის შექმნას. Push permission მოითხოვება მხოლოდ მომხმარებლის ნათელი მოქმედების შემდეგ, ქართულ/ინგლისურ/რუსულ განმარტებასთან და unsubscribe control-თან ერთად.

1. დაემატება authenticated, organization-scoped `push_subscriptions` store: recipient user/client identity, endpoint, `p256dh`/`auth` keys, consent timestamp, locale, status და safe failure metadata. Endpoint/client keys არ ხვდება browser log-ში ან public profile-ში.
2. Browser ითხოვს permission-ს მხოლოდ explicit “შეტყობინებების ჩართვა” მოქმედების შემდეგ. `denied`/`default` პასუხი არ ჩაითვლება consent-ად და UI პატივს სცემს ბრაუზერის არჩევანს.
3. Backend ამოწმებს subscription ownership-ს, იყენებს VAPID private key-ს server-ზე, expiry/410 failure-ზე აუქმებს მხოლოდ შესაბამის subscription-ს და ყოველი dispatch-ს აქვს idempotency key.
4. Booking reminder-ისთვის გამოიყენება platform-managed scheduled endpoint და due job claim; აკრძალულია `setInterval`, `node-cron` ან browser tab-ზე დამოკიდებული timer. Schedule იქმნება მხოლოდ live deployment, handler test და owner-controlled test recipient-ის შემდეგ.
5. მომხმარებელს ექნება unsubscribe/disable მოქმედება; email/SMS, web push და marketing consent ერთმანეთისგან დამოუკიდებელი preference-ებია.

> **No-push boundary:** `WEB_PUSH_ENABLED` default-ად unset/false რჩება. სანამ VAPID keys, subscription store, explicit consent UI, server sender, service-worker notification handler, unsubscribe და controlled delivery test არ დასრულდება, SalonFlow არც notification permission-ს ითხოვს და არც push შეტყობინებას გზავნის.

## უსაფრთხო delivery architecture

Notification job creation და delivery გაყოფილია. Booking commit არ უნდა ჩავარდეს მხოლოდ იმიტომ, რომ provider დროებით მიუწვდომელია.

1. Booking commit ქმნის ერთ job-ს `BOOKING_CONFIRMATION`-ისთვის და ერთ job-ს `APPOINTMENT_REMINDER_24H`-ისთვის მხოლოდ მოქმედი consent/არხის საფუძველზე. თითო job იყენებს deterministic `idempotencyKey`-ს, მაგალითად appointment + event + channel + version.
2. Confirmation job დაიგეგმება დაუყოვნებლივ, ხოლო reminder job — appointment start-მდე 24 საათით ადრე. Reschedule/cancel flow ძველ pending reminder-ს აუქმებს და მხოლოდ საჭიროებისას ქმნის ახალ, unique job-ს.
3. Production endpoint `/api/scheduled/notification-delivery` authenticates scheduler identity-ს, არჩევს მხოლოდ due `PENDING`/retryable jobs-ს, ატარებს lock-ს ან safe claim-ს და არასოდეს იღებს appointment/job ID-ს დაუცველი request body-დან.
4. Endpoint მუშაობს Heartbeat პერიოდული trigger-ით, არა `setInterval`, `node-cron` ან in-process timer-ით. Handler არის idempotent, error-ზე აბრუნებს sanitized JSON-ს და შეუძლია retry მხოლოდ მკაფიოდ განსაზღვრული attempt budget-ით.
5. Provider-ის მიღებული response ინახავს მხოლოდ `providerMessageId`, status და უსაფრთხო error classification-ს. Email address, phone, full message content, API key და raw webhook payload არ ჩაიწერება error/log-ში.
6. Hard failures ან bounce/undeliverable event ნიშნავს job-ის შეჩერებას და workspace audit visibility-ს; ისინი არ ცვლიან booking-ს და არ გზავნიან ფარულ retry-loop-ს.

## Scheduler-ის activation checklist

| ნაბიჯი | სავალდებულო მტკიცებულება |
|---|---|
| 1. Provider + sender | Provider account, verified domain/number, From name/address და approved Georgian templates. |
| 2. Secret setup | ზემოთ ჩამოთვლილი server-only variables დამატებულია უსაფრთხოდ; client env-ში არც ერთი საიდუმლო არ არის. |
| 3. Adapter tests | Mocked provider tests ადასტურებს idempotent send, timeout, retryable/non-retryable failure და consent/no-contact skip-ს. |
| 4. Scheduled handler | `/api/scheduled/notification-delivery` mounted, scheduler-only authenticated და due queue-ს უსაფრთხოდ ამუშავებს. |
| 5. Deployment | Handler-იანი release live-ა **scheduler creation-მდე**; შემდეგ იქმნება platform-managed periodic trigger და მისი task UID ინახება durable configuration-ში. |
| 6. Controlled test | მხოლოდ owner-approved test recipient-ზე მოწმდება confirmation, 24h reminder, reschedule, cancel და duplicate trigger; შემდეგ იხილება execution log. |
| 7. Enable | მხოლოდ ყველა წინა ნაბიჯის შემდეგ დგება `NOTIFICATION_DELIVERY_ENABLED=true`. |

## Activation-მდე აკრძალული ქმედებები

- არ დაემატოს UI toggle, რომელიც ქმნის შთაბეჭდილებას, რომ reminders უკვე live-ა.
- არ დაემატოს browser-side provider call, API secret, raw payment/notification payload ან fixed in-memory timer.
- არ ითქვას „გაგზავნილია“, სანამ provider-ის მიღებული outcome არ ჩაიწერება შესაბამის job-ზე.
- არ გაიგზავნოს marketing message transactional booking job-ის სახელით და არ გამოყენებულ იქნას marketing consent როგორც ავტომატური transactional permission.
