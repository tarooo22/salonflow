import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { type OrganizationVertical, VERTICAL_OPTIONS, verticalName } from "@/lib/verticalTerms";
import { useState } from "react";
import { toast } from "sonner";

/** Three cards for choosing the business type; a radio group so it works with the keyboard. */
export function VerticalPicker({ value, onChange, disabled = false, legend = "საქმიანობის სფერო" }: { value: OrganizationVertical; onChange: (value: OrganizationVertical) => void; disabled?: boolean; legend?: string }) {
  return <fieldset className="grid gap-2" disabled={disabled}>
    <legend className="mb-1 text-sm font-medium">{legend}</legend>
    <div className="grid gap-3 sm:grid-cols-3">
      {VERTICAL_OPTIONS.map(option => <label key={option.value} className={`flex min-h-11 cursor-pointer flex-col gap-1 rounded-xl border p-4 text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${value === option.value ? "border-primary bg-primary/10" : "bg-card hover:bg-muted/40"}`}>
        <input type="radio" name="organization-vertical" className="sr-only" value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
        <span className="font-semibold">{option.label}</span>
        <span className="text-xs leading-5 text-muted-foreground">{option.description}</span>
      </label>)}
    </div>
  </fieldset>;
}

/** Owner-only control in Settings; changing the type hides, but never deletes, the other sphere's clinical records. */
export function VerticalSetting({ organizationId, vertical }: { organizationId: string; vertical: OrganizationVertical }) {
  const utils = trpc.useUtils();
  const [draft, setDraft] = useState<OrganizationVertical>(vertical);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const setVertical = trpc.organizations.setVertical.useMutation({
    onSuccess: async () => { await utils.organizations.listMine.invalidate(); setConfirmOpen(false); toast.success("საქმიანობის სფერო განახლდა."); },
    onError: error => { setConfirmOpen(false); toast.error(error.message || "საქმიანობის სფეროს შეცვლა ვერ მოხერხდა."); },
  });
  return <div className="mb-4 space-y-3 rounded-2xl border bg-muted/10 p-4">
    <VerticalPicker value={draft} onChange={setDraft} disabled={setVertical.isPending} />
    <Button type="button" className="min-h-11" disabled={draft === vertical || setVertical.isPending} onClick={() => setConfirmOpen(true)}>საქმიანობის სფეროს შეცვლა</Button>
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>შევცვალოთ საქმიანობის სფერო: {verticalName(draft)}?</AlertDialogTitle>
          <AlertDialogDescription>შეცვლის შემდეგ მეორე სფეროს კლინიკური ჩანაწერები (კბილების ფორმულა ან პროცედურების ჟურნალი) აღარ გამოჩნდება. ისინი არ წაიშლება: თუ სფეროს უკან დააბრუნებთ, ჩანაწერები ისევ გამოჩნდება.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="min-h-11">გაუქმება</AlertDialogCancel>
          <AlertDialogAction className="min-h-11" onClick={event => { event.preventDefault(); setVertical.mutate({ organizationId, vertical: draft }); }}>{setVertical.isPending ? "მიმდინარეობს…" : "შეცვლა"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
