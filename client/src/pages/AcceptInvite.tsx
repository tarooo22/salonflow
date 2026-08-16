import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalonFlowMark } from "@/components/public/PublicPrimitives";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldAlert, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";

const ROLE_LABEL: Record<string, string> = { MANAGER: "მენეჯერი", RECEPTIONIST: "რეცეფცია", STAFF: "სპეციალისტი" };

export default function AcceptInvite() {
  const [, params] = useRoute("/invite/:token");
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const token = params?.token ?? "";
  const preview = trpc.invitations.previewByToken.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");

  const accept = trpc.invitations.accept.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      setLocation("/app/today");
    },
    onError: cause => setError(cause.message),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (password.length < 10) { setError("პაროლი მინიმუმ 10 სიმბოლოს უნდა შეიცავდეს."); return; }
    accept.mutate({ token, password, fullName: fullName || undefined });
  };

  const invalid = preview.isSuccess && preview.data?.valid === false;
  const invite = preview.data?.valid ? preview.data : undefined;

  return <main className="sf-public-page sf-auth-shell grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
    <section className="sf-auth-hero hidden p-10 text-white lg:flex lg:flex-col lg:justify-between">
      <SalonFlowMark inverted />
      <div className="max-w-md">
        <p className="sf-kicker text-white/90">გუნდში მიღება</p>
        <h1 className="sf-display mt-4 text-5xl font-semibold leading-[1.02]">კეთილი იყოს თქვენი მოსვლა{invite ? ` ${invite.organizationName}-ში` : ""}.</h1>
        <p className="mt-6 text-base leading-7 text-white/80">დააყენეთ პაროლი და მიიღეთ წვდომა თქვენს პირად სამუშაო სივრცეზე.</p>
      </div>
      <div className="grid gap-3 text-sm text-white/80">
        <p className="flex items-center gap-2"><ShieldCheck className="size-4" aria-hidden="true" />მოწვევა ხელმოწერილია და ვადიანია</p>
        <p className="flex items-center gap-2"><ShieldCheck className="size-4" aria-hidden="true" />თქვენი ელფოსტა და როლი უკვე დადგენილია</p>
      </div>
    </section>

    <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 lg:hidden"><SalonFlowMark /></div>
        <div className="sf-auth-card overflow-hidden">
          <div className="border-b border-[var(--sf-line)] bg-[color-mix(in_srgb,var(--sf-accent-strong)_5%,transparent)] px-6 py-6 sm:px-8">
            <p className="sf-kicker">გუნდში მიღება</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight">დაასრულეთ თქვენი ანგარიშის შექმნა</h2>
            {invite ? <div className="mt-4 grid gap-2 rounded-xl border border-[var(--sf-line)] bg-[var(--sf-surface)] p-3 text-sm">
              <p><span className="text-[var(--sf-muted)]">ორგანიზაცია:</span> <span className="font-semibold">{invite.organizationName}</span></p>
              <p><span className="text-[var(--sf-muted)]">ელფოსტა:</span> <span className="font-semibold">{invite.email}</span></p>
              <p><span className="text-[var(--sf-muted)]">როლი:</span> <span className="font-semibold">{ROLE_LABEL[invite.role] ?? invite.role}</span></p>
              <p><span className="text-[var(--sf-muted)]">დისპლეი:</span> <span className="font-semibold">{invite.publicDisplayName}</span></p>
            </div> : null}
          </div>
          <div className="px-6 py-7 sm:px-8">
            {preview.isLoading ? <p className="text-sm text-[var(--sf-muted)]">მოწვევა იტვირთება…</p> : null}
            {invalid ? <div className="flex gap-3 rounded-xl border border-[color-mix(in_srgb,var(--sf-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--sf-danger)_6%,transparent)] p-4 text-sm leading-6 text-[var(--sf-danger)]"><ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="font-semibold">ეს მოწვევა აღარ მოქმედებს</p><p className="mt-1">ბმულის ვადა გავიდა ან უკვე გამოყენებულია. მოითხოვეთ ახალი მოწვევა თქვენი მენეჯერისგან.</p></div></div> : null}
            {invite ? <form className="space-y-5" onSubmit={submit} noValidate>
              <div className="space-y-2"><Label htmlFor="invite-name">სახელი (არასავალდებულო)</Label><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sf-muted)]" aria-hidden="true" /><Input id="invite-name" className="h-11 bg-[var(--sf-surface)] pl-10" value={fullName} onChange={event => setFullName(event.target.value)} placeholder={invite.publicDisplayName} autoFocus /></div></div>
              <div className="space-y-2"><Label htmlFor="invite-password">პაროლი</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sf-muted)]" aria-hidden="true" /><Input id="invite-password" className="h-11 bg-[var(--sf-surface)] pl-10 pr-12" value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={10} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} required /><Button type="button" variant="publicQuiet" size="icon-sm" className="absolute right-1 top-1/2 -translate-y-1/2" aria-label={visible ? "პაროლის დამალვა" : "პაროლის ჩვენება"} onClick={() => setVisible(current => !current)}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button></div><p className="text-xs text-[var(--sf-muted)]">მინიმუმ 10 სიმბოლო.</p></div>
              {error ? <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--sf-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--sf-danger)_6%,transparent)] p-3 text-sm leading-6 text-[var(--sf-danger)]">{error}</p> : null}
              <Button type="submit" variant="public" size="lg" className="w-full" disabled={accept.isPending}>{accept.isPending ? "მიმდინარეობს…" : <><CheckCircle2 className="size-4" aria-hidden="true" /> ანგარიშის დადასტურება</>}</Button>
            </form> : null}
            <div className="mt-6 border-t border-[var(--sf-line)] pt-5 text-center text-sm text-[var(--sf-muted)]"><Link href="/" className="underline-offset-4 hover:text-[var(--sf-accent-strong)] hover:underline">მთავარ გვერდზე დაბრუნება</Link></div>
          </div>
        </div>
      </div>
    </section>
  </main>;
}
