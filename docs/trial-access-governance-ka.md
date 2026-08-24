# SalonFlow — 7-დღიანი საცდელი წვდომის მართვა

## დანიშნულება

ეს დოკუმენტი აღწერს SalonFlow-ის მიმდინარე **owner-approved, 7-დღიან უფასო საცდელ პროცესს**. პროცესის მიზანია სალონის განაცხადის ხელით განხილვა და არა ავტომატური ვერიფიკაცია, პაკეტის გაყიდვა ან გადახდის დამუშავება.

## მომხმარებლის გზა

| ეტაპი | ვინ მოქმედებს | რა ხდება | რა ჯერ არ ხდება |
|---|---|---|---|
| ანგარიშის რეგისტრაცია | განმცხადებელი | იქმნება ადგილობრივი ელფოსტა/პაროლის ანგარიში | სალონი და სამუშაო სივრცე არ იქმნება |
| საცდელი მოთხოვნა | განმცხადებელი | შეჰყავს სალონის სახელი და უნიკალური კოდი | წვდომა ავტომატურად არ აქტიურდება |
| Facebook კონტაქტი | განმცხადებელი | წერს SalonFlow-ის მითითებულ Facebook გვერდზე | Facebook არ არის ავტომატური verification ან payment provider |
| განხილვა | platform admin | ამოწმებს მოთხოვნას და იღებს გადაწყვეტილებას | Salon OWNER ვერ ამტკიცებს საკუთარ ან სხვის განაცხადს |
| დამტკიცება | platform admin | ითვლის ზუსტად 7 კალენდარულ დღეს approval მომენტიდან | თანხა არ ჩამოიჭრება და პაკეტი არ შეიძინება |
| workspace setup | განმცხადებელი | მოქმედი entitlement-ისას ქმნის ერთ სალონს/სამუშაო სივრცეს | მეორე workspace არ შეიძლება იმავე trial-ით |

## სტატუსები და truthfulness

| სტატუსი | განმცხადებლის ეკრანზე | backend policy |
|---|---|---|
| `PENDING` | „მოთხოვნა მიღებულია“, Facebook-ზე მიწერის CTA და refresh | workspace შექმნა აკრძალულია |
| `APPROVED` | მოქმედების ბოლო თარიღი და setup CTA | workspace შეიძლება შეიქმნას ერთჯერადად |
| `REJECTED` | reviewer-ის factual note და ახალი განაცხადის/კონტაქტის CTA | workspace შექმნა აკრძალულია |
| `EXPIRED` | ვადის გასვლის შეტყობინება და ხელახალი განხილვის CTA | დაცული workspace ოპერაციები იბლოკება; მონაცემი არ იშლება |
| `CANCELLED` | არააქტიური entitlement | workspace შექმნა აკრძალულია |

## უფლებები და უსაფრთხოება

* Platform admin არის მხოლოდ `users.role = admin`. ეს დამოუკიდებელია სალონის `OWNER`, `MANAGER`, `RECEPTIONIST` და `STAFF` membership-ებისგან.
* Primary onboarding და legacy `organizations.create` / `organizations.createWorkspace` ერთნაირად ითხოვენ დამტკიცებულ, არვადაგასულ trial-ს.
* Trial-ისას შექმნილი organization დაკავშირებულია კონკრეტულ trial request-თან; შექმნისა და სტატუსის გარდაქმნის მოქმედებები audit event-ებად ინახება.
* Trial-linked organization-ის დაცული ოპერაციები ვადის გასვლის შემდეგ იბლოკება. ძველი organization-ები, რომელთაც trial request საერთოდ არ აქვთ, არ კარგავენ არსებულ წვდომას.
* სისტემის დრო ინახება UTC-ში; UI Georgian locale-ით აჩვენებს თარიღსა და დროს.

## მონაცემის შენახვისა და public booking-ის პოლიტიკა

მიმდინარე უსაფრთხო default არის **არაფერი წაიშალოს**: სალონის, კლიენტისა და ჩანაწერის მონაცემები retention-ში რჩება მომავალი აქტივაციისთვის. Trial expiry workspace action-ებს ბლოკავს. Public profile/booking-ის ზუსტი expiry policy უნდა დამტკიცდეს ცალკე product decision-ით, სანამ public listing ან existing booking data ავტომატურად დაიმალება/გაუქმდება.

## გადახდის მომავალი აქტივაცია

სანამ რეალური package purchase ჩაირთვება, აუცილებელია შემდეგი: payment provider, ზუსტი plans/prices, გადასახადების წესები, refund/cancellation/renewal პირობები, მომხმარებლის შესაბამისი სამართლებრივი ტექსტი და provider-ის verified webhook-ები. ამ ინფორმაციის გარეშე UI არ უნდა ამტკიცებდეს გადახდას, გამოწერას, განახლებას ან აქტიურ paid package-ს.

## UI ხარისხის check

Applicant screens იყენებს ხილულ label-ებს, field-local error text-ს, 44px-მდე touch target-ებს, keyboard-focus-ready control-ებს, semantic status/error messaging-სა და responsive single-column mobile layout-ს. Lazy routes ამცირებს public landing-ის initial bundle impact-ს.

## Validation evidence

სუფთა server restart-ის შემდეგ 375px და 1024px-ზე შემოწმდა `/register`, `/app/trial-request`, `/app/trial-status` და `/app/trials-admin`. რეგისტრაციის card-ს არ ჰქონდა horizontal overflow; 1024px-ზე auth fallback დარჩა readable ორპანელიან layout-ად. არაავტორიზებული applicant/status URL-ები local login-ზე გადავიდა და platform-admin URL-მა აჩვენა centered, overflow-free workspace sign-in gate. ამ შემოწმებისთვის არ შექმნილა ხელოვნური სალონი, trial, შეფასება ან customer data. ავტორიზებული applicant/admin state-ების server-side policy დაფარულია 191 automated assertion-ით; ვიზუალური role-state validation რჩება checkpoint-მდე გასატარებელ separate QA ნაბიჯად.
