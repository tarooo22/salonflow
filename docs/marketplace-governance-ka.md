# SalonFlow Marketplace — კატეგორიები, ხილვადობა და promotion governance

## მიზანი

Marketplace აჩვენებს მხოლოდ რეალური, დამტკიცებული და საჯაროდ გამოქვეყნებისთვის მზად სალონის ფილიალებს. მისი მიზანია სტუმარს დაუკავშიროს სწორ სალონსა და არსებულ online booking flow-ს; ის არ ქმნის ხელოვნურ რეიტინგს, ფასს, შეფასებას ან availability claim-ს.

## Controlled კატეგორიები

პირველი Marketplace taxonomy არის: **თმა**, **ფრჩხილები**, **მაკიაჟი**, **წარბები და წამწამები**, **კოსმეტოლოგია**, **მასაჟი და SPA**, **ეპილაცია** და **სხვა სერვისები**. Location ერთზე მეტ კატეგორიაში ხვდება მხოლოდ მაშინ, როდესაც მფლობელმა იგი აირჩია და location-ს აქვს შესაბამისი active, online-bookable service. Category label მხოლოდ directory/discovery მიზნისთვისაა და არასოდეს ცვლის service eligibility-ს ან booking availability-ს.

## Listing lifecycle

| მდგომარეობა | საჯარო ხილვადობა | ვინ ცვლის |
|---|---|---|
| `DRAFT` | არა | საკუთარი organization-ის OWNER |
| `SUBMITTED` | არა | OWNER აგზავნის, platform admin იხილავს |
| `APPROVED` | კი, მხოლოდ თუ booking და public controls აქტიურია | მხოლოდ platform admin |
| `HIDDEN` | არა | platform admin; OWNER ხედავს მიზეზს/settings guidance-ს |
| `REJECTED` | არა | platform admin; audit-ში რჩება მიზეზი |

`OWNER` მართავს საკუთარი ფილიალის აღწერას, category mapping-ს, cover/media არჩევანს და რუკაზე ხილვადობის consent-ს. `MANAGER`, `RECEPTIONIST` და `STAFF` ვერ აგზავნიან marketplace listing-ს, ვერ ცვლიან მის სტატუსს და ვერ მართავენ promoted placement-ს. Platform-wide `users.role = admin` არის დამოუკიდებელი gate; სალონის `OWNER` არ არის marketplace admin.

## Address და რუკა

რუკაზე ხილვადობა არის explicit owner consent. მისამართის geocode candidate უნდა დაადასტუროს მფლობელმა; მხოლოდ დადასტურებული latitude/longitude გამოიყენება marker-ში. დამალული ან დაუდასტურებელი მისამართი არასოდეს ბრუნდება public map endpoint-ში. Directory card შეიძლება აჩვენებდეს მფლობელის მიერ ნებადართულ ფართო area/city ტექსტს, თუმცა private street address არა.

## Recommended და VIP

`RECOMMENDED` და `VIP` არის promoted placement, არა ორგანული ხარისხის ან მომხმარებლის შეფასების ნიშანი. ორივესთან ყოველთვის ჩანს მკაფიო ქართული label: **„რეკომენდებული“** ან **„VIP / რეკლამა“**. Promotion მოქმედებს მხოლოდ უკვე შესაბამის, approved შედეგზე და ვერ არღვევს კატეგორიის/ლოკაციის filter-ს. ყველა ცვლილება იწერება audit event-ში, აქვს start/end timestamp და ვადის ამოწურვისას ქრება შედეგებიდან.

## Billing boundary

Marketplace v1-ში promotion schedule ხელით, platform-admin-ის მიერ იმართება. 5–10₾ და 10–15₾ იდეები არ არის გამოტანილი UI-ში, არ ინახება როგორც product price და არ იწვევს თანხის ჩამოჭრას. Checkout, recurring subscription, invoice, payment capture, refund და provider webhook რჩება გამორთული verified merchant, provider credentials, terms, tax/refund decisions და signed webhook validation-მდე.

## Public-safe content

Public listing იყენებს მხოლოდ owner-approved cover, consent-filtered gallery/feed, active public services, online-booking-visible staff და მფლობელის მიერ ნებადართულ public contact details. არ გამოიყენება demo listing, seed data, fabricated reviews, rating, popularity count, distance, availability ან scarcity claim.
