# Customer Booking Lifecycle — Implementation Design

## Audit result

| მოთხოვნა | არსებული საფუძველი | განხორციელების წესი |
|---|---|---|
| საჯარო გადადება/გაუქმება | თითო appointment-ს აქვს `publicTokenHash`, `publicTokenExpiresAt`, cancellation ველები და status history | HMAC token-ით დაცული detail/cancel/reschedule endpoints; მხოლოდ `PENDING`/`CONFIRMED`, location cancellation cutoff, booking window და საბოლოო transactional overlap re-check. |
| Waitlist | შესაბამისი table და staff UI ჯერ არ არსებობს | დაემატოს organization-scoped entry, კონკრეტული დღე/service/staff preference, idempotency, privacy-safe contact და protected operations list. შეტყობინების არქონა არ უნდა წარმოდგეს როგორც ავტომატური alert. |
| რამდენიმე სერვისი | `appointment_services` უკვე ინახავს მრავალ line item-ს, sort order-სა და snapshots-ს | public flow იღებს service array-ს; ერთი სპეციალისტი უნდა იყოს eligible ყველა არჩეულ service-ზე; server ითვლის ჯამურ duration/price/buffers-ს და ქმნის თითო snapshot-ს transaction-ში. |
| SMS/email დადასტურება და 24h reminder | `notification_jobs` და Heartbeat SDK არსებობს, მაგრამ provider env, sender identity და scheduled handler არ არსებობს | ინახება idempotent jobs; delivery მხოლოდ server-side provider adapter + mounted authenticated scheduled handler + deployed configuration-ის შემდეგ. მიმდინარე გარემოში provider variables არ დადასტურდა, ამიტომ dispatch არ აქტიურდება. |
| დეპოზიტი | internal `payments` table არსებობს, მაგრამ checkout/gateway/webhook არა | live charge მხოლოდ provider არჩევის, webhook signing, refund/cancellation rule და deposit percentage policy-ის შემდეგ; მანამდე no checkout/no charge. |

## Delivery order

1. **Public token booking management:** detail, cancel, reschedule, expiry/cutoff/status validation და status history.
2. **Waitlist:** schema migration, public request flow და protected queue visibility; ავტომატური გაგზავნა გამორთული დარჩება.
3. **Multiple services:** atomic availability, staff eligibility, total duration/price snapshots და booking UI.
4. **Notifications:** მხოლოდ როცა დადასტურდება provider, From identity და consent/timing policy.
5. **Deposits:** მხოლოდ payment provider და cancellation/refund policy-ის owner გადაწყვეტილების შემდეგ.

## Non-negotiable constraints

- Public token lookup არასოდეს იღებს appointment ID-ს მომხმარებლისგან.
- Public mutations არასოდეს აძლევს წვდომას სხვა appointment-ს; token იძებნება მხოლოდ hash-ით და ამოწმებს expiry-ს.
- Public reschedule/cancel არ ცვლის ფინანსურ snapshot-ს ან completed/in-service appointment-ს.
- Waitlist entry არ ნიშნავს notification ან გარანტირებულ slot-ს.
- No provider credential, sender identity, payment intent ან secret შედის browser bundle-ში.

## Deposit / წინასწარი გადახდის activation contract

### მიმდინარე რეალური სტატუსი

`payments` ცხრილი ინახავს შიდა accounting ჩანაწერს: თანხა integer tetri-ში, method, status, refund amount და optional external reference. ის **არ** არის payment gateway checkout, არც provider payment intent, არც signed webhook ledger. ამიტომ public booking-ზე დღეს არც checkout იხსნება და არც ბარათიდან/ანგარიშიდან თანხა ჩამოიჭრება.

> **No-charge boundary:** სანამ მფლობელი არ აირჩევს gateway-ს, არ დაამტკიცებს deposit/refund წესს და არ მიაწვდის ნამდვილ server-side secrets-ს, SalonFlow არ ქმნის payment intent-ს, არ redirect-ავს მომხმარებელს checkout-ზე და არ ცვლის `payments` ჩანაწერს როგორც „paid“.

### მფლობელის აუცილებელი policy გადაწყვეტილებები

| გადაწყვეტილება | დასადასტურებელი წესი |
|---|---|
| Gateway | Stripe, ადგილობრივი bank/gateway API ან სხვა კონკრეტული provider. Provider-ის სახელი განსაზღვრავს webhook verification და checkout architecture-ს. |
| რომელი სერვისი ითხოვს deposit-ს | ყველა booking, მხოლოდ შერჩეული services/categories, ან service-specific გამონაკლისები. |
| თანხის წესი | ფიქსირებული GEL თანხა ან 0–100% integer პროცენტი; server-ი ითვლის საბოლოო `depositTetri`-ს price snapshot-იდან. |
| დადასტურების წესი | როდის ხდება booking `CONFIRMED`: payment authorisation-ზე, successful capture-ზე თუ manual review-ზე. |
| გადახდის ვადა | რამდენი წუთი ეძლევა მომხმარებელს pending checkout-ის დასასრულებლად და რა ემართება მის slot hold-ს ვადის გასვლისას. |
| გაუქმება/გადადება | cutoff საათები, სრული/ნაწილობრივი/ნულოვანი refund, reschedule-ზე transfer ან refund და no-show წესი. |
| საკომისიო/ვალუტა | merchant fee-ს ვინ ფარავს და რომელი GEL settlement/accounting rule გამოიყენება. |

### ზუსტი secrets და provider configuration

| არჩეული გზა | სავალდებულო server secrets | browser-ში დასაშვები მნიშვნელობა |
|---|---|---|
| Stripe | `PAYMENT_PROVIDER=stripe`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | მხოლოდ `VITE_STRIPE_PUBLISHABLE_KEY`; იგი არ აძლევს charge/refund უფლებას. |
| ადგილობრივი ბანკი / gateway | `PAYMENT_PROVIDER=<approved-provider>`, `PAYMENT_API_BASE_URL`, `PAYMENT_MERCHANT_ID`, `PAYMENT_API_KEY`, `PAYMENT_WEBHOOK_SECRET` | მხოლოდ provider-ის ოფიციალურად მოთხოვნილი public checkout configuration, თუ არსებობს. |
| Activation flag | `PAYMENT_CAPTURE_ENABLED=true` | browser-ში არ გადადის; default არის unset/false. |

Exact variable names შეიძლება გაფართოვდეს მხოლოდ არჩეული provider-ის ოფიციალური integration specification-ის მიხედვით. API key, webhook secret, merchant secret, private key და raw provider payload არასოდეს მოხვდება client bundle-ში ან audit text-ში.

### აუცილებელი უსაფრთხო ტექნიკური flow

1. Public booking ჯერ ქმნის booking intent-ს/slot hold-ს არსებული availability და idempotency საზღვრებით; charge amount ყოველთვის გამოითვლება server-ზე integer tetri-ში და არა browser-ის მიერ გამოგზავნილი ფასით.
2. დაემატება additive provider-attempt/event persistence: organization/appointment scope, provider checkout ID, expected amount, currency, idempotency key, verified webhook event ID, status და timestamps. Browser return URL არასოდეს არის გადახდის წარმატების მტკიცებულება.
3. Server ქმნის provider checkout/payment intent-ს ერთჯერადი idempotency key-ით. Success/cancel URL მხოლოდ customer experience-ს მართავს; ფინანსურ status-ს ცვლის მხოლოდ signed provider webhook ან provider API-ის სერვერული reconciliation.
4. Webhook route ამოწმებს signature და event freshness-ს, deduplicate-ავს provider event ID-ს, ადარებს provider amount/currency/merchant data-ს მოსალოდნელ booking snapshot-ს და მხოლოდ მერე წერს capture/refund მდგომარეობას.
5. Refund ან cancellation ქმნის provider refund request-ს მხოლოდ მფლობელის დამტკიცებული cutoff/policy-ის მიხედვით; retry/idempotency და provider reference სრულად audit-დება. Manual POS cash/card/bank accounting არ უნდა აირიოს public gateway capture-სთან.
6. Provider failure, timeout ან abandoned checkout არ უნდა გახდეს „paid“ და არ უნდა გამოაჩინოს misleading success. Slot release/hold expiry ქცევა ზუსტად მფლობელის დამტკიცებული policy-ით განისაზღვრება.

### Activation checklist

| ნაბიჯი | რას ვამოწმებთ |
|---|---|
| 1. Provider არჩევა | მფლობელი ადასტურებს gateway-ს, merchant account-სა და GEL/currency მხარდაჭერას. |
| 2. Policy ხელმოწერა | Deposit amount, service scope, payment deadline, cancellation, reschedule, refund, no-show და fee წესები წერილობითია. |
| 3. Secret setup | Server-only payment secrets და webhook secret დამატებულია უსაფრთხო კონფიგურაციით. |
| 4. Schema/API | Payment attempt + verified webhook event persistence, idempotency და organization/appointment scope migration-ითაა დაცული. |
| 5. Tests | წარმატებული capture, duplicate webhook, tampered signature, amount mismatch, timeout, cancel, refund და cross-organization cases დაფარულია. |
| 6. Controlled test | Test/sandbox merchant flow გადის owner-approved test transaction-ზე და reconcile-დება provider dashboard-თან. |
| 7. Enable | მხოლოდ ამის შემდეგ დგება `PAYMENT_CAPTURE_ENABLED=true` და გამოჩნდება customer checkout. |
