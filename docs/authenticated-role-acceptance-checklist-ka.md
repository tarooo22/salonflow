# SalonFlow — authenticated role acceptance checklist

ეს არის ხელით გასავლელი QA სცენარი რეალური test accounts-ისთვის. თითოეული ნაბიჯი უნდა შესრულდეს ცალკე browser session-ში, რათა organization და role scope არ აირიოს.

| როლი | აუცილებელი შემოწმებები |
|---|---|
| OWNER | Login, Today, Calendar, Services, Team, Settings, Marketplace readiness, public booking link, trial/activation state და logout. |
| MANAGER | Login, calendar/client/appointment management, owner-only Settings და Marketplace კონტროლების არჩენა ან დაცული უარყოფა. |
| RECEPTIONIST | მხოლოდ მის როლზე ნებადართული appointment/client დღიური ოპერაციები; billing, owner settings და platform sections მიუწვდომელია. |
| STAFF | მხოლოდ საკუთარი სამუშაო schedule/ანონიმიზებული სამუშაო კონტექსტი; არ აქვს კლიენტის სრული მონაცემის, ფინანსური ან workspace configuration წვდომა. |
| PLATFORM ADMIN | Trial/billing queues, Marketplace review, feedback moderation/audit; salon workspace owner არ შეუძლია ამავე admin მოქმედებების გამეორება. |

ყველა როლისთვის დაადასტურეთ keyboard focus, 375px mobile layout, error state, logout და პირდაპირი URL-ის გახსნა. Expired workspace-ზე ცალკე შეამოწმეთ, რომ owner მხოლოდ Today და activation flow-ს ხედავს, სხვა workspace ოპერაციები კი fail-closed არის.
