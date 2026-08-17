# SalonFlow — Production Deployment Options

SalonFlow უკვე მუშაობს Manus-ის managed hosting-ზე და მიმდინარე არქიტექტურაში ეს არის სასურველი production გზა: იგი ინარჩუნებს პროექტის managed database, server-side secrets, S3 storage, checkpoint/rollback და HTTPS domain გარემოს ერთიანად. Custom domain-ის დამატება შესაძლებელია პროექტის domain settings-დან; Cloudflare Tunnel საჭირო არ არის Manus hosted URL-ის გასაჯაროებისთვის.

## არჩევანის საზღვარი

| ვარიანტი | შესაბამისი შემთხვევა | მნიშვნელოვანი შეზღუდვა |
|---|---|---|
| **Manus managed hosting** | მიმდინარე SalonFlow production deployment | რეკომენდებული გზა; მიმდინარე secrets/database/storage აქვეა მიბმული. |
| **Railway** | სრული Node/Express server, დამოუკიდებელი deployment და გარემოს ხელით მართვა | საჭიროა ყველა production secret, database connection, storage integration და domain/cookie policy-ის ხელახლა დაყენება. |
| **Vercel** | მხოლოდ public/static frontend-ის ცალკე deployment ან სპეციალურად გადაარქიტექტურებული serverless backend | მიმდინარე Express server და targeted public-profile rendering ვერ გადაიტანება პირდაპირ static SPA deploy-ად; deep links-ს rewrite სჭირდება. |
| **Cloudflare Tunnel** | user-owned always-on machine/VM-ზე არსებული internal service-ის უსაფრთხოდ გასაჯაროება | მიმდინარე Manus Autoscale URL-ს არ სჭირდება; tunnel connector არ უნდა გაეშვას hibernating development sandbox-ში. |

## Railway: სრული Node/Express deployment

Railway-ზე გამოყენებამდე საჭიროა დამოუკიდებელი production გარემოს მომზადება: GitHub repository, build command `pnpm build`, start command `pnpm start`, გარედან მიწოდებული `PORT`, TiDB/MySQL-compatible `DATABASE_URL`, `JWT_SECRET`, OAuth/local-auth გარემოს საჭირო secrets, storage keys და public domain. Railway-ის Express guide აღნიშნავს environment variable-ებით კონფიგურაციას, Git/CLI deployment-სა და public domain generation-ს.[1]

არ გადაიტანოთ Manus-ის injected secrets ან local `.env` ფაილი repository-ში. ჯერ შექმენით Railway-ის isolated staging environment, გადაამოწმეთ `/`, `/book`, `/salon/:slug`, `/login`, `/app/*` deep links, HTTPS cookie policy და database migrations; მხოლოდ ამის შემდეგ გადართეთ DNS.

## Vercel: მხოლოდ deliberate re-architecture-ის შემდეგ

Vercel Vite-ს ცნობს, მაგრამ SPA deep links-ს default-ად არ ამუშავებს; static SPA ვარიანტს rewrite configuration სჭირდება.[2] SalonFlow-ს ამჟამად აქვს Express/tRPC server, MySQL/TiDB access, signed local sessions, server-side storage helpers და targeted server-rendered SEO snapshot. ამიტომ Vercel-ზე გადასვლა მოითხოვს backend-ის Functions/Nitro/სხვა compatible runtime-ზე მიზნობრივ გარდაქმნას, secret mapping-ს, database networking-ს და route-by-route smoke testing-ს.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

> ეს rewrite მხოლოდ static SPA fallback-ის მაგალითია; იგი **არ** ცვლის მიმდინარე Express API, authenticated session ან dynamic public profile rendering architecture-ს.

## Cloudflare Tunnel: მხოლოდ მუდმივ origin-ზე

Cloudflare Tunnel-ს production გამოყენებისთვის სჭირდება Cloudflare account, Cloudflare-ზე მართული domain და მუდმივად ხელმისაწვდომი server/VM, სადაც `cloudflared` connector არის დაყენებული.[3] Tunnel route public hostname-ს local service URL-ს უკავშირებს; production setup-ში token/configuration საიდუმლოა და server-side secret manager-ში უნდა იყოს დაცული.

Quick Tunnel-ის დროებითი `trycloudflare.com` URL developer preview-სთვისაა და Cloudflare მას production გამოყენებისთვის არ გვირჩევს.[3] ამიტომ იგი არ უნდა გახდეს SalonFlow-ის customer booking ან operations production endpoint.

## DNS cutover checklist

1. დაამატეთ და დაადასტურეთ custom domain იმ hosting გარემოში, რომელსაც საბოლოოდ აირჩევთ.
2. მოამზადეთ TLS/HTTPS, cookie `Secure`/`SameSite` policy და production secrets server-side.
3. გადაამოწმეთ public booking, local login, protected workspace, `/salon/:slug`, manifest და service worker production URL-ზე.
4. მხოლოდ შემდეგ შეცვალეთ DNS record; შეინარჩუნეთ წინა release rollback-ready სანამ DNS/TLS/session smoke test დასრულდება.

## References

[1] [Railway — Deploy an Express App](https://docs.railway.com/guides/express)

[2] [Vercel — Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)

[3] [Cloudflare — Set up a Tunnel](https://developers.cloudflare.com/tunnel/setup/)
