# PWA და public locale — visual QA notes

## 375px public surface

`/book` და `/salon/gldani-beauty` mobile renders შემოწმდა 375×812 viewport-ზე. Booking discovery ინარჩუნებს ერთსვეტიან searchable location cards-ს და compact hamburger navigation-ს; language selector ხელმისაწვდომია mobile navigation-ის გახსნის შემდეგ. Salon profile აჩვენებს locale selector-ს header-ში, რეალურ cover/service/team მონაცემებს და booking CTA-ს horizontal scroll-ის გარეშე.

## Scope boundary

ამ milestone-ში ka/en/ru selector თარგმნის shared public navigation/footer-ს, booking discovery surface-სა და public salon profile-ის system UI copy-ს. სალონის მიერ შეყვანილი service name, description, staff bio და feed content intentionally არ ითარგმნება ავტომატურად; მათი localized ვერსია უნდა დაამატოს მფლობელმა/მენეჯერმა, რათა customer-facing content არ იყოს არაზუსტი ან დაუდასტურებელი.
