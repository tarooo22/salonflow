# Marketplace რუკის ინტეგრაციის შენიშვნა

Marketplace-ის რუკის გვერდი იღებს მონაცემებს მხოლოდ `marketplace.mapResults` public projection-იდან. ეს projection აბრუნებს **მხოლოდ** დამტკიცებულ, აქტიურ, online-bookable listing-ს, რომლისთვისაც მფლობელმა დაადასტურა geocode point და ცალკე შეინახა `mapVisibility=true` თანხმობა. ჩვეულებრივი `marketplace.directory` პასუხი არც მისამართს და არც E6 კოორდინატებს არ აბრუნებს.

> ფილიალის მისამართის geocoding სრულდება server-side authenticated Maps proxy-ით. მფლობელი ირჩევს შედეგს, ხოლო სერვერი confirmation-ისას იგივე შენახულ მისამართს ხელახლა ამოწმებს და მხოლოდ ზუსტად დამთხვევილ `placeId`/E6 წერტილს ინახავს. ამ ქმედებას არც რუკაზე ხილვადობის თანხმობა და არც listing approval არ მოჰყვება ავტომატურად.

ამ პროექტში template დოკუმენტაციაში აღწერილი `client/src/components/Map.tsx` frontend SDK component ფაქტობრივად არ არსებობს. ამიტომ `/salons/map` ამ release-ში იყენებს consented წერტილების interactive, კლავიატურით სამართავ ვიზუალურ განლაგებას, ერთ კოორდინატზე clustering-ს, ყოველთვის ხელმისაწვდომ სინქრონულ ტექსტურ სიას და თითოეული სალონის Google Maps მიმართულების გარე ბმულს. იგი არ იყენებს თვითნებურ API key-ს, მესამე მხარის client-side ბიბლიოთეკას ან consent-ის გარეშე მისამართს.

როდესაც პროექტს sanctioned `MapView` კომპონენტი რეალურად დაემატება, ეს same `mapResults` projection შეიძლება გახდეს Google Maps JS SDK-ის ერთადერთი marker source. მანამდე list fallback რჩება primary, სრულად ფუნქციურ discovery გზად.
