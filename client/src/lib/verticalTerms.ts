export type OrganizationVertical = "SALON" | "AESTHETICS" | "DENTAL";

export const VERTICAL_OPTIONS: ReadonlyArray<{ value: OrganizationVertical; label: string; description: string }> = [
  { value: "SALON", label: "სალონი", description: "სილამაზის სალონი, ბარბერშოპი ან სხვა მომსახურების ბიზნესი." },
  { value: "AESTHETICS", label: "ესთეტიკის ცენტრი", description: "პროცედურების ჟურნალი: პრეპარატი, სერია, დოზა და ვადა." },
  { value: "DENTAL", label: "სტომატოლოგიური კლინიკა", description: "პაციენტები და კბილების ფორმულა (FDI)." },
];

export function verticalName(vertical: OrganizationVertical | undefined | null) {
  return VERTICAL_OPTIONS.find(option => option.value === vertical)?.label ?? "სალონი";
}

/** Customer wording per business type: dental clinics have patients, everyone else clients. */
export function clientTerms(vertical: OrganizationVertical | undefined | null) {
  return vertical === "DENTAL"
    ? { singular: "პაციენტი", plural: "პაციენტები", genitive: "პაციენტის", pluralGenitive: "პაციენტების" }
    : { singular: "კლიენტი", plural: "კლიენტები", genitive: "კლიენტის", pluralGenitive: "კლიენტების" };
}
