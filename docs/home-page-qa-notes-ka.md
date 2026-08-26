# Home page QA ჩანაწერები

## 2026-08-25 — Conversion-first refresh

Desktop 1440px და mobile 375px სრული გვერდის ვიზუალური შემოწმება ჩატარდა განახლებული Home route-ზე. Hero-ში ორი აუდიტორიის CTA, intent cards, Marketplace discovery form და final owner CTA გამოჩნდა თანმიმდევრული visual hierarchy-ით. Mobile layout-ში intent cards და discovery controls ერთ სვეტად ეწყობა; სრული გვერდის capture-ზე horizontal overflow ან მოჭრილი primary action არ გამოვლინდა.

Full-page capture ანიმაციებს static მდგომარეობაში აჩვენებს და ტექსტს მასშტაბავს, ამიტომ იგი არ ცვლის ჩვეულებრივი viewport-ის ხელით კითხვადობის შემოწმებას. შემდეგი ხარისხის კარიბჭეებია keyboard semantics, reduced-motion styles, build/test და სუფთა runtime logs.

## 2026-08-26 — Public experience QA

Desktop 1280px შემოწმებაზე Marketplace Directory, Map და public Salon Profile routes სწორად დალაგდა: category/search controls, consent-oriented map empty state და booking-path trust note ხილულია. Partner Landing-ის hero-ში ორი დეკორატიული storage image preview-ში არ ჩაიტვირთა და გამოჩნდა მათი alt ტექსტი. ეს არის მოქმედი visual defect და უნდა გამოსწორდეს სხვა final QA-მდე; პირადი სალონის მონაცემი ან public booking flow არ დაზიანებულა.

Partner asset URL-ები project-scoped storage path-ით განახლდა, მაგრამ preview storage პასუხის შემთხვევაშიც დაემატა graceful gradient fallback. ხელახალ desktop 1280px capture-ზე raw alt ტექსტი აღარ ჩანს; hero media card და ქვედა დეკორატიული media surface ინარჩუნებს სტაბილურ ზომას და კონტრასტს.
