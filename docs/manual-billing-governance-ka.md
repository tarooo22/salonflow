# SalonFlow — ხელით გადარიცხვისა და წვდომის governance

## მოდელი

SalonFlow არ იღებს ავტომატურ გადახდას და არ აცხადებს, რომ ბანკმა თანხა დაადასტურა. ვადაგასული trial workspace ინახება, მაგრამ ოპერაციული წვდომა იკეტება; მფლობელი ხედავს მხოლოდ Today/Billing activation flow-ს. მფლობელი ბანკში უთითებს საკუთარ `SF-…` სალონის ID-ს გადარიცხვის კომენტარში, ტვირთავს ქვითარს და platform-admin ხელით იღებს გადაწყვეტილებას.

## წვდომა და როლები

| როლი | შეუძლია |
|---|---|
| OWNER | ხედავს bank transfer დეტალს, თავის სალონის ID-ს, ატვირთავს receipt-ს და ხედავს სტატუსს/დარჩენილ დღეებს |
| MANAGER / RECEPTIONIST / STAFF | ხედავს მხოლოდ restricted notice-ს; ვერ ხედავს bank დეტალს ან receipt-ს |
| Platform admin | აყენებს რეკვიზიტებსა და ფასს, ეძებს/ხსნის receipt-ს, ადასტურებს/უარყოფს ქვითარს და ანიჭებს ბონუს დღეებს |

## Receipt lifecycle

Receipt შეიძლება იყოს JPEG, PNG, WEBP ან PDF და მაქსიმუმ 10 MB. S3-ში ინახება ფაილის key და metadata; იგი არ ჩანს public profile/marketplace-ში. სტატუსებია `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CANCELLED`. უარყოფა ინახავს factual Georgian note-ს და მფლობელს აძლევს ხელახლა გაგზავნის გზას.

## Access grant

Admin-ის monthly approval ქმნის calendar-month grant-ს. თუ მოქმედი access ჯერ არ დასრულებულა, ახალი თვე იწყება არსებული დასრულების შემდეგ. Bonus days იქმნება ცალკე grant-ით და ინახავს admin action-სა და მიზეზს. მოქმედი trial ან grant აღადგენს protected workspace და ახალ public online booking-ს; legacy tenant trial record-ის გარეშე არ იცვლება.

## Privacy და მომავალი ავტომატიზაცია

ქვითარი შეიძლება შეიცავდეს პერსონალურ ან საბანკო ინფორმაციას; access რჩება owner-სა და platform-admin-ს შორის. ბენეფიციარის სახელი, პირადი ნომერი, ანგარიშის ნომერი, ფასი, retention ტექსტი და cancellation/refund policy platform-admin-მა უნდა შეავსოს billing configuration-ში რეალური მონაცემებით. მომავალში checkout/webhook შეიძლება დაემატოს მხოლოდ payment provider-ის, ზუსტი პირობებისა და შემოწმებული webhook integration-ის შემდეგ.
