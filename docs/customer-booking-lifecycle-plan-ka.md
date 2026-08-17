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
