# Home page QA ჩანაწერები

## 2026-08-25 — Conversion-first refresh

Desktop 1440px და mobile 375px სრული გვერდის ვიზუალური შემოწმება ჩატარდა განახლებული Home route-ზე. Hero-ში ორი აუდიტორიის CTA, intent cards, Marketplace discovery form და final owner CTA გამოჩნდა თანმიმდევრული visual hierarchy-ით. Mobile layout-ში intent cards და discovery controls ერთ სვეტად ეწყობა; სრული გვერდის capture-ზე horizontal overflow ან მოჭრილი primary action არ გამოვლინდა.

Full-page capture ანიმაციებს static მდგომარეობაში აჩვენებს და ტექსტს მასშტაბავს, ამიტომ იგი არ ცვლის ჩვეულებრივი viewport-ის ხელით კითხვადობის შემოწმებას. შემდეგი ხარისხის კარიბჭეებია keyboard semantics, reduced-motion styles, build/test და სუფთა runtime logs.
