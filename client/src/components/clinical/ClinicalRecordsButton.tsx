import { AestheticProcedures } from "@/components/clinical/AestheticProcedures";
import { DentalChart } from "@/components/clinical/DentalChart";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { CLINICAL_ACCESS_STATUSES } from "@shared/validation";

type ClinicalAppointment = { id: string; clientId: string | null; status: string; client: { firstName: string; lastName: string | null } | null };

/**
 * Opens the patient's tooth chart (DENTAL) or procedure records (AESTHETICS) from an appointment.
 * This is the only clinical entry point for STAFF; the server re-checks that the specialist has an appointment with the patient.
 * Only the client's name is shown.
 */
export function ClinicalRecordsButton({ appointment, className }: { appointment: ClinicalAppointment; className?: string }) {
  const [open, setOpen] = useState(false);
  const organizations = trpc.organizations.listMine.useQuery();
  const entry = organizations.data?.[0];
  const vertical = entry?.organization.vertical;
  const role = entry?.membership.role;
  if (!entry || !appointment.clientId || !(CLINICAL_ACCESS_STATUSES as readonly string[]).includes(appointment.status)) return null;
  if (vertical !== "DENTAL" && vertical !== "AESTHETICS") return null;
  if (role !== "OWNER" && role !== "MANAGER" && role !== "STAFF") return null;

  const isDental = vertical === "DENTAL";
  const label = isDental ? "კბილების ფორმულა" : "პროცედურები";
  const clientName = appointment.client ? `${appointment.client.firstName} ${appointment.client.lastName ?? ""}`.trim() : "";
  return <>
    <Button type="button" variant="outline" size="sm" className={className ?? "min-h-11"} onClick={() => setOpen(true)}>{label}</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{label}{clientName ? ` · ${clientName}` : ""}</DialogTitle><DialogDescription>ჩანაწერები ემატება ამ ვიზიტზე.</DialogDescription></DialogHeader>
        {isDental
          ? <DentalChart organizationId={entry.organization.id} clientId={appointment.clientId} appointmentId={appointment.id} />
          : <AestheticProcedures organizationId={entry.organization.id} clientId={appointment.clientId} appointmentId={appointment.id} ownProfileOnly={role === "STAFF"} />}
      </DialogContent>
    </Dialog>
  </>;
}
