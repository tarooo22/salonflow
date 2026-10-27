import { useState } from "react";
import { Wallet } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatGelTetri } from "@/lib/presentation";
import { trpc } from "@/lib/trpc";
import { gelInputToTetri } from "@shared/money";

export type ReceivePaymentTarget = { id: string; clientName: string; detail?: string; totalTetri: number; balanceTetri: number };

const METHODS = [
  { value: "CASH", label: "ნაღდი" },
  { value: "CARD_TERMINAL", label: "ბარათი" },
  { value: "BANK_TRANSFER", label: "გადარიცხვა" },
] as const;
type Method = (typeof METHODS)[number]["value"];

const PAYMENT_ROLES = new Set(["OWNER", "MANAGER", "RECEPTIONIST"]);

/** Mirrors the server rule (payments:record, not cancelled/no-show, something left to pay); the server re-checks all of it. */
export function canReceivePayment(role: string | undefined, status: string, balanceTetri: number) {
  return PAYMENT_ROLES.has(role ?? "") && status !== "CANCELLED" && status !== "NO_SHOW" && balanceTetri > 0;
}

/** Integer-only tetri → "25.00" for the editable GEL field. */
export function tetriToGelInput(tetri: number) {
  return `${Math.floor(tetri / 100)}.${String(tetri % 100).padStart(2, "0")}`;
}

function newIdempotencyKey() {
  return crypto.randomUUID();
}

/**
 * Records money received for one visit. The key is created once per dialog, so a retry after a lost
 * response returns the same payment instead of charging twice. The server decides status and balance.
 */
export function ReceivePaymentDialog({ organizationId, target, onClose }: { organizationId: string; target: ReceivePaymentTarget; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [amount, setAmount] = useState(() => tetriToGelInput(target.balanceTetri));
  const [method, setMethod] = useState<Method>("CASH");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [idempotencyKey] = useState(newIdempotencyKey);
  const record = trpc.payments.recordForAppointment.useMutation({
    onSuccess: async data => {
      await Promise.all([
        utils.appointments.dashboard.invalidate(),
        utils.appointments.listRange.invalidate(),
        utils.payments.invalidate(),
        utils.reporting.invalidate(),
      ]);
      toast.success(data.balanceTetri > 0 ? `გადახდა მიღებულია · დარჩენილია ${formatGelTetri(data.balanceTetri)}` : "გადახდა მიღებულია · ვიზიტი სრულად გადახდილია");
      onClose();
    },
    onError: mutationError => setError(mutationError.message || "გადახდის მიღება ვერ მოხერხდა. სცადეთ ხელახლა."),
  });
  const pending = record.isPending;

  const submit = () => {
    const amountTetri = gelInputToTetri(amount);
    if (amountTetri === null || amountTetri <= 0) { setError("მიუთითეთ თანხა ლარში, მაგ. 25.00."); return; }
    if (amountTetri > target.balanceTetri) { setError(`თანხა აღემატება დარჩენილ დავალიანებას (${formatGelTetri(target.balanceTetri)}).`); return; }
    setError("");
    record.mutate({ organizationId, appointmentId: target.id, amountTetri, method, idempotencyKey, note: note.trim() || undefined });
  };

  return <Dialog open onOpenChange={open => { if (!open && !pending) onClose(); }}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>გადახდის მიღება</DialogTitle>
        <DialogDescription>{target.clientName}{target.detail ? ` · ${target.detail}` : ""}</DialogDescription>
      </DialogHeader>
      <form className="grid gap-4" noValidate onSubmit={event => { event.preventDefault(); if (!pending) submit(); }}>
        <dl className="grid grid-cols-2 gap-3 rounded-lg border border-border bg-[var(--sf-surface-2)] px-3 py-2 text-sm">
          <div><dt className="text-[var(--sf-muted)]">ვიზიტის ჯამი</dt><dd className="cwk-num font-semibold">{formatGelTetri(target.totalTetri)}</dd></div>
          <div><dt className="text-[var(--sf-muted)]">დარჩენილი</dt><dd className="cwk-num font-semibold" data-testid="receive-payment-balance">{formatGelTetri(target.balanceTetri)}</dd></div>
        </dl>
        <div className="grid gap-1.5 text-sm font-medium">
          <label htmlFor="receive-payment-amount">თანხა (₾)</label>
          <Input id="receive-payment-amount" inputMode="decimal" autoComplete="off" value={amount} onChange={event => setAmount(event.target.value)} disabled={pending} aria-invalid={Boolean(error)} aria-describedby={error ? "receive-payment-error" : undefined} className="cwk-num min-h-11" />
        </div>
        <div className="grid gap-1.5 text-sm font-medium">
          <span id="receive-payment-method-label">გადახდის მეთოდი</span>
          <div className="cwk-seg w-full" role="group" aria-labelledby="receive-payment-method-label">
            {METHODS.map(item => <button key={item.value} type="button" className="min-h-11 flex-1" aria-pressed={method === item.value} disabled={pending} onClick={() => setMethod(item.value)}>{item.label}</button>)}
          </div>
        </div>
        <div className="grid gap-1.5 text-sm font-medium">
          <label htmlFor="receive-payment-note">შენიშვნა <span className="font-normal text-[var(--sf-muted)]">(არასავალდებულო)</span></label>
          <Textarea id="receive-payment-note" value={note} onChange={event => setNote(event.target.value)} maxLength={300} rows={2} disabled={pending} />
        </div>
        {error ? <p id="receive-payment-error" role="alert" className="text-sm text-destructive">{error}</p> : null}
        <p className="text-xs text-[var(--sf-muted)]">შიდა აღრიცხვაა — ბარათიდან თანხა არ ჩამოიჭრება.</p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={pending}>გაუქმება</Button>
          <Button type="submit" disabled={pending}><Wallet className="size-4" aria-hidden="true" />{pending ? "ფიქსირდება…" : "გადახდის მიღება"}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
