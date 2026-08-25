import DashboardLayout from "@/components/DashboardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState } from "@/components/workspace/WorkspacePrimitives";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const receiptStatusLabel: Record<string, string> = {
  SUBMITTED: "შემოწმებას ელოდება",
  UNDER_REVIEW: "ხელით მოწმდება",
  APPROVED: "დამტკიცებულია",
  REJECTED: "უარყოფილია",
  CANCELLED: "გაუქმებულია",
};

export default function BillingAdmin() {
  const { user, loading } = useAuth();
  const [, go] = useLocation();
  const utils = trpc.useUtils();
  const config = trpc.billing.adminConfig.useQuery(undefined, { enabled: user?.role === "admin" });
  const [form, setForm] = useState({ beneficiaryName: "", personalNumber: "", accountNumber: "", monthlyPriceGel: "", transferCommentPrefix: "SF", privacyNoticeKa: "ქვითარი ხელით მოწმდება SalonFlow platform admin-ის მიერ." });
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [approvalId, setApprovalId] = useState<string | null>(null);
  const list = trpc.billing.adminList.useQuery({ search: search || undefined }, { enabled: user?.role === "admin" });
  const approvalItem = list.data?.find(item => item.id === approvalId) ?? null;

  const save = trpc.billing.saveConfig.useMutation({
    onSuccess: async () => { await utils.billing.adminConfig.invalidate(); toast.success("რეკვიზიტები შენახულია."); },
    onError: error => toast.error(error.message),
  });
  const approve = trpc.billing.approveMonthly.useMutation({
    onSuccess: async result => { setApprovalId(null); await utils.billing.adminList.invalidate(); toast.success(`1-თვიანი წვდომა გააქტიურდა ${new Date(result.endsAt).toLocaleDateString("ka-GE")}-მდე.`); },
    onError: error => toast.error(error.message),
  });
  const reject = trpc.billing.rejectReceipt.useMutation({
    onSuccess: async () => { await utils.billing.adminList.invalidate(); toast.success("ქვითარი უარყოფილია; მფლობელს შეუძლია ხელახლა გაგზავნა."); },
    onError: error => toast.error(error.message),
  });
  const bonus = trpc.billing.grantBonusDays.useMutation({
    onSuccess: async result => { await utils.billing.adminList.invalidate(); toast.success(`ბონუს დღეები დაემატა ${new Date(result.endsAt).toLocaleDateString("ka-GE")}-მდე.`); },
    onError: error => toast.error(error.message),
  });

  useEffect(() => { if (!loading && user && user.role !== "admin") go("/app/today"); }, [go, loading, user]);
  if (!loading && user && user.role !== "admin") return <DashboardLayout><WorkspaceState kind="loading" title="თქვენს სამუშაო სივრცეში გადამისამართება…" /></DashboardLayout>;
  if (loading || !user) return <DashboardLayout><WorkspaceState kind="loading" title="წვდომა მოწმდება…" /></DashboardLayout>;

  const currentConfig = config.data;
  const value = (key: Exclude<keyof typeof form, "monthlyPriceGel">) => form[key] || String(currentConfig?.[key as keyof NonNullable<typeof currentConfig>] ?? "");
  const gelValue = form.monthlyPriceGel || (currentConfig?.monthlyPriceTetri ? (currentConfig.monthlyPriceTetri / 100).toFixed(2) : "");
  const submitConfig = () => {
    const priceGel = Number(gelValue.replace(",", "."));
    if (!value("beneficiaryName") || !value("personalNumber") || !value("accountNumber") || !Number.isFinite(priceGel) || priceGel <= 0) {
      setFormError("შეავსეთ ბენეფიციარი, პირადი ნომერი, ანგარიში და სწორი თვიური ფასი ლარში.");
      return;
    }
    setFormError("");
    save.mutate({ beneficiaryName: value("beneficiaryName"), personalNumber: value("personalNumber"), accountNumber: value("accountNumber"), monthlyPriceTetri: Math.round(priceGel * 100), transferCommentPrefix: value("transferCommentPrefix"), privacyNoticeKa: value("privacyNoticeKa") });
  };

  return <DashboardLayout>
    <main className="sf-workspace-page mx-auto w-full max-w-6xl space-y-5">
      <WorkspacePageHeader eyebrow="PLATFORM ADMIN" title="Billing payments" description="ხელით საბანკო გადარიცხვის რეკვიზიტები და ქვითრების შემოწმება." />
      <WorkspaceSection title="გადახდის რეკვიზიტები" description="ეს მონაცემები გამოჩნდება მხოლოდ ვადაგასული workspace-ის მფლობელთან. სალონის მფლობელი ხედავს მხოლოდ აქ შენახულ ნამდვილ მონაცემებს.">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium"><span>ბენეფიციარის სახელი</span><Input value={value("beneficiaryName")} onChange={event => setForm(current => ({ ...current, beneficiaryName: event.target.value }))} placeholder="მაგ. თამარ ტარაშვილი" autoComplete="name" /></label>
          <label className="grid gap-1.5 text-sm font-medium"><span>პირადი ნომერი</span><Input value={value("personalNumber")} onChange={event => setForm(current => ({ ...current, personalNumber: event.target.value }))} placeholder="11 ციფრი" inputMode="numeric" autoComplete="off" /></label>
          <label className="grid gap-1.5 text-sm font-medium"><span>ანგარიშის ნომერი</span><Input value={value("accountNumber")} onChange={event => setForm(current => ({ ...current, accountNumber: event.target.value }))} placeholder="GE00TB0000000000000000" autoCapitalize="characters" autoComplete="off" /></label>
          <label className="grid gap-1.5 text-sm font-medium"><span>1-თვიანი პაკეტის ფასი (₾)</span><Input value={gelValue} onChange={event => setForm(current => ({ ...current, monthlyPriceGel: event.target.value }))} placeholder="მაგ. 49.00" inputMode="decimal" /></label>
          <label className="grid gap-1.5 text-sm font-medium"><span>გადარიცხვის კომენტარის prefix</span><Input value={value("transferCommentPrefix")} onChange={event => setForm(current => ({ ...current, transferCommentPrefix: event.target.value.toUpperCase() }))} placeholder="SF" /></label>
          <label className="grid gap-1.5 text-sm font-medium"><span>მფლობელისთვის ნაჩვენები კონფიდენციალურობის ტექსტი</span><Textarea value={value("privacyNoticeKa")} onChange={event => setForm(current => ({ ...current, privacyNoticeKa: event.target.value }))} className="min-h-20" /></label>
        </div>
        {formError ? <p className="mt-4 text-sm text-destructive" role="alert">{formError}</p> : null}
        <div className="mt-5 flex flex-wrap items-center gap-3"><Button onClick={submitConfig} disabled={save.isPending}>{save.isPending ? "ინახება…" : "რეკვიზიტების შენახვა"}</Button><p className="text-xs leading-5 text-muted-foreground">ფასი შეიყვანეთ ლარში; სისტემა მას უსაფრთხოდ ინახავს თეთრებში.</p></div>
      </WorkspaceSection>

      <WorkspaceSection title="ქვითრები" description="დაადასტურეთ მხოლოდ ხელით შემოწმებული ქვითარი; preview URL გენერირდება მხოლოდ ამ დაცული admin queue-ისთვის.">
        <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="სალონის სახელი, ID ან მფლობელის ელფოსტა" aria-label="ქვითრის ძებნა" />
        <div className="mt-4 grid gap-3">
          {list.data?.map(item => <article key={item.id} className="rounded-2xl border p-4">
            <p className="font-semibold">{item.organizationName} · {item.billingCodeSnapshot}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.ownerEmail} · {receiptStatusLabel[item.status] ?? item.status} · {item.transferComment}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><a href={item.receiptUrl} target="_blank" rel="noreferrer">ქვითრის ნახვა</a></Button>
              {["SUBMITTED", "UNDER_REVIEW"].includes(item.status) ? <>
                <Button size="sm" onClick={() => setApprovalId(item.id)}>1 თვე</Button>
                <Button size="sm" variant="outline" onClick={() => { const note = window.prompt("უარყოფის მოკლე მიზეზი"); if (note) reject.mutate({ submissionId: item.id, note }); }}>უარყოფა</Button>
                <Button size="sm" variant="ghost" onClick={() => { const days = Number(window.prompt("ბონუს დღეების რაოდენობა")); const reason = window.prompt("ბონუსის მიზეზი"); if (Number.isInteger(days) && days > 0 && reason) bonus.mutate({ organizationId: item.organizationId, days, reason }); }}>ბონუს დღეები</Button>
              </> : null}
            </div>
          </article>)}
          {!list.isLoading && !list.data?.length ? <WorkspaceState kind="empty" title="ქვითარი არ არის" /> : null}
        </div>
      </WorkspaceSection>
    </main>

    <AlertDialog open={Boolean(approvalItem)} onOpenChange={open => { if (!open && !approve.isPending) setApprovalId(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>დაადასტურეთ 1-თვიანი პაკეტი</AlertDialogTitle>
          <AlertDialogDescription>დარწმუნდით, რომ უკვე ხელით შეამოწმეთ ქვითარი და გადარიცხვის კომენტარი. ეს მოქმედება შექმნის {approvalItem?.organizationName ?? "ამ სალონის"} 1-თვიან წვდომას.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="rounded-xl border bg-muted/30 p-3 text-sm">
          <p><strong>SalonFlow ID:</strong> {approvalItem?.billingCodeSnapshot}</p>
          {approvalItem?.amountTetri ? <p className="mt-1"><strong>ქვითრის თანხა:</strong> {(approvalItem.amountTetri / 100).toLocaleString("ka-GE", { style: "currency", currency: "GEL" })}</p> : null}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={approve.isPending}>გაუქმება</AlertDialogCancel>
          <AlertDialogAction disabled={approve.isPending} onClick={() => approvalItem && approve.mutate({ submissionId: approvalItem.id })}>{approve.isPending ? "აქტიურდება…" : "ხელით დადასტურება და 1 თვის ჩართვა"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </DashboardLayout>;
}
