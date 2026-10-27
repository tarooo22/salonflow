/** Mkhedruli to Latin, so a Georgian business name can prefill a public URL slug. */
const GEORGIAN_TO_LATIN: Record<string, string> = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k", ლ: "l", მ: "m", ნ: "n", ო: "o", პ: "p",
  ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u", ფ: "p", ქ: "k", ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts",
  ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
};

/** "ვაკის სალონი" -> "vakis-saloni": lowercase a-z0-9 words joined by single dashes, at most 60 characters. */
export function slugifyGeorgian(name: string, maxLength = 60) {
  const latin = Array.from(name.toLowerCase()).map(character => GEORGIAN_TO_LATIN[character] ?? character).join("");
  return latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, maxLength).replace(/-+$/g, "");
}
