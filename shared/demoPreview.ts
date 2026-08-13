export type DemoAppointmentStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "IN_SERVICE" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

const names = ["ანა აბაშიძე", "თამარ ბერიძე", "ნინო გოგუაძე", "მარიამ დვალიშვილი", "ქეთი ებრალიძე", "სალომე ვაშაკიძე", "ელენე ზურაბიშვილი", "ლიკა თოდაძე", "მაკა იაშვილი", "თეონა კიკნაძე", "ეკა ლომიძე", "სოფო მჭედლიძე"];
const services = [
  ["თმის მოვლა", "თმის შეჭრა", 60, 7500], ["თმის მოვლა", "ფენი", 45, 4500], ["თმის მოვლა", "შეღებვა", 120, 18000],
  ["ფრჩხილები", "მანიკური", 60, 5500], ["ფრჩხილები", "პედიკური", 75, 7000], ["ფრჩხილები", "გელ-ლაქი", 90, 8000],
  ["სახის მოვლა", "კლასიკური წმენდა", 75, 9500], ["სახის მოვლა", "ჰიდრატაცია", 60, 8500], ["სახის მოვლა", "წარბის ფორმა", 30, 3000],
  ["მასაჟი", "რელაქს მასაჟი", 60, 11000], ["მასაჟი", "კისრის მასაჟი", 30, 5000], ["სპა", "ხელის მოვლა", 45, 4000],
] as const;
const appointmentStatuses: DemoAppointmentStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "IN_SERVICE", "COMPLETED", "CANCELLED", "NO_SHOW", "COMPLETED", "CONFIRMED", "COMPLETED", "PENDING", "COMPLETED", "CHECKED_IN", "COMPLETED", "CONFIRMED", "COMPLETED", "IN_SERVICE", "COMPLETED"];

export function createDemoPreview() {
  const locations = [
    { id: "demo-vake", name: "ვაკის სტუდია", timezone: "Asia/Tbilisi", publicSlug: "demo-vake" },
    { id: "demo-saburtalo", name: "საბურთალოს სტუდია", timezone: "Asia/Tbilisi", publicSlug: "demo-saburtalo" },
  ];
  const staff = [
    { id: "demo-staff-1", name: "თათა კ.", specialty: "თმის სტილისტი", locationId: "demo-vake" },
    { id: "demo-staff-2", name: "მარი ბ.", specialty: "ფრჩხილების სპეციალისტი", locationId: "demo-vake" },
    { id: "demo-staff-3", name: "ანა რ.", specialty: "კოსმეტოლოგი", locationId: "demo-saburtalo" },
    { id: "demo-staff-4", name: "სოფო გ.", specialty: "მასაჟის თერაპევტი", locationId: "demo-saburtalo" },
  ];
  const clients = names.map((name, index) => ({ id: `demo-client-${index + 1}`, name, phone: `+995 555 00 ${String(index + 10).padStart(2, "0")}` }));
  const catalog = services.map(([category, name, durationMinutes, priceTetri], index) => ({ id: `demo-service-${index + 1}`, category, name, durationMinutes, priceTetri }));
  const appointments = appointmentStatuses.map((status, index) => {
    const service = catalog[index % catalog.length]!;
    const location = locations[index % locations.length]!;
    const specialist = staff[index % staff.length]!;
    return {
      id: `demo-appointment-${index + 1}`,
      client: clients[index % clients.length]!,
      service,
      location,
      specialist,
      status,
      startsAtLabel: `${String(9 + (index % 8)).padStart(2, "0")}:${index % 2 ? "30" : "00"}`,
      totalTetri: service.priceTetri,
      payment: status === "COMPLETED" ? "PAID" : "PENDING",
    };
  });
  return {
    label: "სადემონსტრაციო მონაცემები",
    locations,
    staff,
    clients,
    services: catalog,
    appointments,
    payments: 14,
    commissions: 8,
    expenses: 4,
  };
}
