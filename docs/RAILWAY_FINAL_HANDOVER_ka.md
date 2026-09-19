# SalonFlow — Railway საბოლოო handover

## მიმდინარე მდგომარეობა

SalonFlow-ის Railway და Cloudflare R2 მომზადება დასრულებულია. აპლიკაცია იყენებს Railway MySQL-ს, Cloudflare R2-ს ფაილებისთვის და production-ready Node.js/Express გაშვების კონტრაქტს. `GET /health` endpoint, Railway `PORT` binding, secure local-session cookie რეჟიმი და production build უკვე დამატებულია.

Platform Admin Governance მოდული ასევე დასრულებულია. `tarashvili8@gmail.com`-ს აქვს `platform_role = admin` და აპლიკაციის login response-ში ეს როლი სწორად გადაეცემა, რის გამოც admin ანგარიში trial onboarding-ში აღარ ბრუნდება.

## Governance შესაძლებლობები

Platform Admin-ს შეუძლია:

- ყველა რეგისტრირებული ორგანიზაციის/სალონის ინვენტარის ნახვა;
- სალონის operational access-ის შეჩერება და აღდგენა;
- საჯარო ხილვადობის დამალვა და აღდგენა;
- დამატებითი bonus დღეების მინიჭება;
- აქტიური access grant-ის დასრულების თარიღის ნახვა;
- თითოეული ცვლილების immutable audit trail-ის ნახვა;
- ძებნა და სტატუსებით გაფილტვრა.

ჩვეულებრივი owner, manager ან specialist ვერ ხედავს admin governance გვერდებს და ვერ ასრულებს ამ მოქმედებებს. ორგანიზაციისა და ფილიალის მონაცემები ინარჩუნებს არსებულ scope/isolation წესებს.

## Railway-ზე დარჩენილი ზუსტი ნაბიჯები

### 1. Governance schema-ის დამატება

Railway MySQL service-ის **Console**-ში გაუშვით `drizzle/railway-governance-migration.sql`-ის სრული შიგთავსი. ეს migration არის additive და idempotent: არ შლის და არ ცვლის არსებულ სალონებს, მომხმარებლებს ან ჯავშნებს.

ის ქმნის მხოლოდ ორ ცხრილს:

- `organization_governance`
- `organization_governance_events`

SQL-ის გაშვების შემდეგ შემოწმება:

```sql
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_schema = DATABASE()
  AND table_name IN ('organization_governance', 'organization_governance_events');
```

მოსალოდნელი შედეგია `2`.

### 2. Railway redeploy

Migration-ის წარმატებით დასრულების შემდეგ Railway service-ზე შეასრულეთ **Redeploy** ან დააჭირეთ **Deploy latest**. `railway.json` უკვე უთითებს არსებულ build/start კონტრაქტს და healthcheck-ს.

### 3. საბოლოო smoke test

Redeploy-ის შემდეგ შეამოწმეთ:

1. `https://<railway-domain>/health` აბრუნებს HTTP `200`-ს და `ok: true`-ს;
2. `tarashvili8@gmail.com`-ით login გადადის Platform Admin ზედაპირზე და არა trial onboarding-ზე;
3. გვერდით მენიუში ჩანს მუდმივი ბმული **„სალონების კონტროლი“**;
4. governance გვერდზე ორგანიზაციების სია იტვირთება;
5. Suspend/Restore, Hide/Show და Grant Days მოქმედებები წარმატებით სრულდება;
6. audit history-ში თითოეული ცვლილება ჩანს;
7. ჩვეულებრივი owner ანგარიშით admin ბმული/გვერდი არ ჩანს და პირდაპირი URL იძლევა დაცულ უარყოფას;
8. public profile/booking მხოლოდ `publicVisible = true` და მოქმედი access/trial წესების შესაბამის სალონებზე მუშაობს.

## საჭირო Railway variables

მინიმუმ უნდა არსებობდეს:

- `DATABASE_URL`
- `JWT_SECRET`
- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `CANONICAL_ORIGIN` ან `PUBLIC_SITE_URL`

`PORT` ხელით არ დააყენოთ — მას Railway თვითონ აწვდის service-ს.

## ვალიდაცია

კოდში დადასტურებულია:

- Platform Admin auth redirect regression;
- governance role enforcement;
- invalid grant input rejection;
- Georgian reason requirement;
- TypeScript compilation;
- production build;
- სრული Vitest suite-ის ბოლო ცნობილი შედეგი: **86 test files / 241 tests passed**.

## უსაფრთხოების შენიშვნა

Railway Console-ში SQL-ის გაშვებისას გამოიყენეთ მხოლოდ ეს additive migration. არ გაუშვათ `DROP TABLE`, სრული destructive reset ან ავტომატური production migration. Manus deployment შეინარჩუნეთ ხელმისაწვდომად, სანამ Railway-ზე health, auth, governance და public booking smoke test სრულად არ გაივლის.

## დაკავშირებული ფაილები

- `drizzle/railway-governance-migration.sql`
- `docs/RAILWAY_DEPLOYMENT.md`
- `server/routers/governance.ts`
- `server/routers/governance.test.ts`
