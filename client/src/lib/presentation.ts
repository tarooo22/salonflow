export function formatGelTetri(tetri: number) {
  return new Intl.NumberFormat("ka-GE", { style: "currency", currency: "GEL", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(tetri / 100);
}

export function formatKaDateTime(value: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("ka-GE", { dateStyle: "medium", timeStyle: "short", ...(timeZone ? { timeZone } : {}) }).format(value);
}

export function formatKaDate(value: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("ka-GE", { dateStyle: "medium", ...(timeZone ? { timeZone } : {}) }).format(value);
}

export function formatKaTime(value: Date, timeZone?: string) {
  return new Intl.DateTimeFormat("ka-GE", { timeStyle: "short", ...(timeZone ? { timeZone } : {}) }).format(value);
}

const paymentMethodLabels: Record<string, string> = {
  CASH: "ნაღდი ფული",
  CARD_TERMINAL: "ბარათით — ტერმინალი",
  BANK_TRANSFER: "საბანკო გადარიცხვა",
  ONLINE: "ონლაინ გადახდა",
  OTHER: "სხვა მეთოდი",
};

const paymentStateLabels: Record<string, string> = {
  UNPAID: "გადასახდელია",
  PARTIAL: "ნაწილობრივ გადახდილი",
  PAID: "გადახდილი",
  REFUNDED: "დაბრუნებული",
  OVERPAID: "ზედმეტად გადახდილი",
};

export function formatPaymentMethod(method: string) {
  return paymentMethodLabels[method] ?? "სხვა მეთოდი";
}

export function formatPaymentState(state: string | null | undefined) {
  return paymentStateLabels[state ?? "UNPAID"] ?? "გადასახდელია";
}
