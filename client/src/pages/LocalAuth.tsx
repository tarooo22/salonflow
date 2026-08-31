import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalonFlowMark } from "@/components/public/PublicPrimitives";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

function getReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo") ?? "/app/trial-status";
  return raw.startsWith("/app/") ? raw : "/app/trial-status";
}

function PasswordField({ value, onChange, autoComplete, minLength, error }: { value: string; onChange: (value: string) => void; autoComplete: string; minLength: number; error?: string }) {
  const [visible, setVisible] = useState(false);
  return <div className="space-y-2"><Label htmlFor="auth-password">პაროლი</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sf-muted)]" aria-hidden="true" /><Input id="auth-password" className="h-11 bg-[var(--sf-surface)] pl-10 pr-12" value={value} onChange={event => onChange(event.target.value)} autoComplete={autoComplete} minLength={minLength} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} required /><Button type="button" variant="publicQuiet" size="icon-sm" className="absolute right-1 top-1/2 -translate-y-1/2" aria-label={visible ? "პაროლის დამალვა" : "პაროლის ჩვენება"} onClick={() => setVisible(current => !current)}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button></div>{minLength >= 10 ? <p className="text-xs text-[var(--sf-muted)]">მინიმუმ 10 სიმბოლო.</p> : null}</div>;
}

export default function LocalAuth({ mode }: { mode: "login" | "register" | "claim" }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const returnTo = useMemo(getReturnTo, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [error, setError] = useState("");
  const isRegister = mode === "register";
  const isClaim = mode === "claim";
  const finish = async (user: { id: number; openId: string; name: string | null; email: string | null; role?: "user" | "admin" }, destination = returnTo) => {
    utils.auth.me.setData(undefined, user as never);
    await utils.auth.me.invalidate();
    const safeDestination = user.role === "admin" && (destination === "/app/trial-status" || destination === "/app/trial-request") ? "/app/trial-admin" : destination;
    setLocation(safeDestination);
  };
  const register = trpc.auth.register.useMutation({ onSuccess: user => finish(user, "/app/trial-request"), onError: cause => setError(cause.message) });
  const login = trpc.auth.login.useMutation({ onSuccess: user => finish(user), onError: cause => setError(cause.message) });
  const claimLegacyLocal = trpc.auth.claimLegacyLocal.useMutation({ onSuccess: user => finish(user), onError: cause => setError(cause.message) });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (isRegister) {
      if (password.length < 10) { setError("პაროლი მინიმუმ 10 სიმბოლოს უნდა შეიცავდეს."); return; }
      register.mutate({ name, email, password });
      return;
    }
    if (isClaim) {
      if (password.length < 10) { setError("პაროლი მინიმუმ 10 სიმბოლოს უნდა შეიცავდეს."); return; }
      claimLegacyLocal.mutate({ recoveryCode, email, password });
      return;
    }
    login.mutate({ email, password });
  };
  const pending = register.isPending || login.isPending || claimLegacyLocal.isPending;
  const alternate = isRegister ? "/login" : "/register";
  const alternateLabel = isRegister ? "უკვე გაქვთ ანგარიში? შედით" : "ჯერ არ გაქვთ ანგარიში? დარეგისტრირდით";
  const title = isRegister ? "შექმენით თქვენი სამუშაო სივრცის ანგარიში" : isClaim ? "აღადგინეთ ძველი ანგარიში" : "კეთილი იყოს თქვენი დაბრუნება";
  const description = isRegister ? "რეგისტრაციის შემდეგ შეიტანთ სალონის საცდელ მოთხოვნას; 7-დღიანი წვდომა გაიხსნება მხოლოდ SalonFlow platform admin-ის ხელით დამტკიცების შემდეგ." : isClaim ? "შეიყვანეთ SalonFlow-ისგან მიღებული აღდგენის კოდი, თქვენი მიმდინარე პაროლი და ახალი ელფოსტა." : "შედით თქვენი SalonFlow ელფოსტითა და პაროლით.";
  const submitLabel = isRegister ? "ანგარიშის შექმნა" : isClaim ? "ანგარიშის აღდგენა" : "შესვლა";

  return <main className="sf-public-page sf-auth-shell grid min-h-screen lg:grid-cols-[.92fr_1.08fr]"><section className="sf-auth-hero hidden p-10 text-[var(--sf-surface)] lg:flex lg:flex-col lg:justify-between"><SalonFlowMark inverted /><div className="max-w-md"><p className="sf-salon-eyebrow text-[var(--sf-salon-champagne)]">თქვენი მშვიდი სამუშაო დღე</p><h1 className="sf-display mt-4 text-5xl font-semibold leading-[1.02]">სალონის ოპერაციები — ნაკლები ქაოსით.</h1><p className="mt-6 text-base leading-7 text-white/70">ონლაინ ჩაწერა, დღიური queue, გუნდი და კონტროლი ერთ დაცულ სისტემაში.</p></div><div className="grid gap-3 text-sm text-white/70"><AuthPromise text="ადგილობრივი ელფოსტა და პაროლი" /><AuthPromise text="როლზე და ორგანიზაციაზე დაფუძნებული წვდომა" /><AuthPromise text="ქართული-first სამუშაო სივრცე" /></div></section><section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6"><div className="w-full max-w-md"><div className="mb-8 lg:hidden"><SalonFlowMark /></div><div className="sf-auth-card sf-salon-panel overflow-hidden"><div className="border-b border-[var(--sf-salon-hairline)] bg-[color-mix(in_srgb,var(--sf-salon-warm)_5%,transparent)] px-6 py-6 sm:px-8"><div className="flex items-center justify-between gap-3"><p className="sf-salon-eyebrow">SalonFlow ანგარიში</p><span className="rounded-full border border-[var(--sf-salon-hairline)] bg-[var(--sf-surface-elevated)] px-2.5 py-1 text-[0.68rem] font-semibold text-[var(--sf-muted)]">{isRegister ? "ახალი სივრცე" : isClaim ? "უსაფრთხო აღდგენა" : "დაცული შესვლა"}</span></div><h2 className="mt-3 text-2xl font-bold tracking-tight">{title}</h2><p className="mt-3 text-sm leading-6 text-[var(--sf-muted)]">{description}</p></div><div className="px-6 py-7 sm:px-8"><form className="space-y-5" onSubmit={submit} noValidate>{isRegister ? <div className="space-y-2"><Label htmlFor="auth-name">სახელი</Label><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sf-muted)]" aria-hidden="true" /><Input id="auth-name" className="h-11 bg-[var(--sf-surface)] pl-10" value={name} onChange={event => setName(event.target.value)} autoComplete="name" minLength={2} autoFocus required /></div></div> : null}{isClaim ? <div className="rounded-xl border border-[color-mix(in_srgb,var(--sf-salon-warm)_25%,transparent)] bg-[color-mix(in_srgb,var(--sf-salon-warm)_5%,transparent)] p-4"><Label htmlFor="recovery-code">აღდგენის კოდი</Label><div className="relative mt-2"><KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sf-salon-warm)]" aria-hidden="true" /><Input id="recovery-code" className="h-11 bg-[var(--sf-surface)] pl-10 font-mono tracking-[0.1em]" value={recoveryCode} onChange={event => setRecoveryCode(event.target.value.toUpperCase())} placeholder="SF-1234-5678-9ABC" autoComplete="one-time-code" autoFocus required /></div><p className="mt-2 text-xs leading-5 text-[var(--sf-muted)]">კოდი არ არის თქვენი პაროლი. თუ ის არ მიგიღიათ, მიმართეთ SalonFlow მხარდაჭერას.</p></div> : null}<div className="space-y-2"><Label htmlFor="auth-email">ელფოსტა</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--sf-muted)]" aria-hidden="true" /><Input id="auth-email" className="h-11 bg-[var(--sf-surface)] pl-10" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" type="email" autoFocus={!isRegister && !isClaim} aria-invalid={Boolean(error)} required /></div></div><PasswordField value={password} onChange={setPassword} autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister || isClaim ? 10 : 1} error={error} />{error ? <p role="alert" className="rounded-xl border border-[color-mix(in_srgb,var(--sf-danger)_30%,transparent)] bg-[color-mix(in_srgb,var(--sf-danger)_6%,transparent)] p-3 text-sm leading-6 text-[var(--sf-danger)]">{error}</p> : null}<Button type="submit" variant="public" size="lg" className="w-full" disabled={pending}>{pending ? "მიმდინარეობს…" : submitLabel}</Button></form><div className="mt-6 border-t border-[var(--sf-line)] pt-5 text-center text-sm text-[var(--sf-muted)]"><Link href={`${alternate}?returnTo=${encodeURIComponent(returnTo)}`} className="font-semibold text-[var(--sf-salon-warm)] underline-offset-4 hover:underline">{alternateLabel}</Link>{!isClaim ? <p className="mt-3 text-xs"><Link href={`/claim-account?returnTo=${encodeURIComponent(returnTo)}`} className="underline-offset-4 hover:text-[var(--sf-salon-warm)] hover:underline">ძველი ანგარიშის პრობლემა გაქვთ?</Link></p> : <p className="mt-3 text-xs"><Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="underline-offset-4 hover:text-[var(--sf-salon-warm)] hover:underline">დაბრუნდით შესვლაზე</Link></p>}</div></div></div></div></section></main>;
}

function AuthPromise({ text }: { text: string }) { return <p className="flex items-center gap-2"><ShieldCheck className="size-4 text-[var(--sf-jade)]" aria-hidden="true" />{text}</p>; }
