export const DENTAL_CONDITIONS = [
  { value: "HEALTHY", label: "ჯანსაღი", color: "#d8f0df", ink: "#14532d" },
  { value: "CARIES", label: "კარიესი", color: "#fecaca", ink: "#7f1d1d" },
  { value: "FILLED", label: "ბჟენი", color: "#bfdbfe", ink: "#1e3a8a" },
  { value: "CROWN", label: "გვირგვინი", color: "#fde68a", ink: "#713f12" },
  { value: "ROOT_CANAL", label: "არხი დამუშავებული", color: "#e9d5ff", ink: "#581c87" },
  { value: "IMPLANT", label: "იმპლანტი", color: "#a5f3fc", ink: "#164e63" },
  { value: "BRIDGE", label: "ხიდი", color: "#fed7aa", ink: "#7c2d12" },
  { value: "MISSING", label: "ამოღებული", color: "#e5e7eb", ink: "#374151" },
  { value: "EXTRACTION_NEEDED", label: "ამოსაღები", color: "#fbcfe8", ink: "#831843" },
  { value: "OTHER", label: "სხვა", color: "#f5f5f4", ink: "#292524" },
] as const;
export type DentalCondition = (typeof DENTAL_CONDITIONS)[number]["value"];

export const conditionLabel = (value: string) => DENTAL_CONDITIONS.find(item => item.value === value)?.label ?? value;

export const TOOTH_SURFACE_OPTIONS = [
  { value: "M", hint: "M: მეზიალური, შუა ხაზთან უახლოესი მხარე" },
  { value: "O", hint: "O: ოკლუზიური, საღეჭი ზედაპირი" },
  { value: "D", hint: "D: დისტალური, შუა ხაზიდან დაშორებული მხარე" },
  { value: "B", hint: "B: ბუკალური, ლოყისკენ მიმართული მხარე" },
  { value: "L", hint: "L: ლინგვალური, ენისკენ მიმართული მხარე" },
] as const;

const range = (from: number, to: number) => Array.from({ length: Math.abs(to - from) + 1 }, (_, i) => (from <= to ? from + i : from - i));
const codes = (quadrant: number, from: number, to: number) => range(from, to).map(position => `${quadrant}${position}`);

/** Each arch is shown as the patient's right | left, as in a clinical chart. */
export const TOOTH_LAYOUT = {
  permanent: {
    upper: [codes(1, 8, 1), codes(2, 1, 8)],
    lower: [codes(4, 8, 1), codes(3, 1, 8)],
  },
  primary: {
    upper: [codes(5, 5, 1), codes(6, 1, 5)],
    lower: [codes(8, 5, 1), codes(7, 1, 5)],
  },
} as const;

export function allToothCodes(dentition: keyof typeof TOOTH_LAYOUT): string[] {
  const { upper, lower } = TOOTH_LAYOUT[dentition];
  return [...upper, ...lower].flat();
}

export function toothAriaLabel(code: string, condition: string | undefined) {
  return `კბილი ${code} — ${condition ? conditionLabel(condition) : "ჩანაწერი არ არის"}`;
}
