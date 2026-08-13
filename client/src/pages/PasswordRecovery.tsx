import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, KeyRound, Loader2, MailCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

export function isResetTokenShape(token: string | null) {
  return Boolean(token && /^[A-Za-z0-9_-]{32,128}$/.test(token));
}

function RecoveryShell({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return <main className="min-h-screen bg-[#F7F4EF] px-4 py-8 sm:px-6"><div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-xl items-center"><section className="w-full rounded-[2rem] border border-[#1E2824]/10 bg-white p-7 shadow-2xl shadow-[#1E2824]/10 sm:p-12"><Link href="/login" className="inline-flex items-center gap-2 text-sm text-[#627069] hover:text-[#1E2824]"><ArrowLeft className="h-4 w-4" />შესვლაზე დაბრუნება</Link><div className="mt-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B85C3D]/10 text-[#B85C3D]"><KeyRound className="h-6 w-6" /></div><h1 className="mt-6 font-serif text-3xl font-semibold text-[#1E2824]">{title}</h1><p className="mt-3 text-sm leading-6 text-[#627069]">{description}</p>{children}</section></div></main>;
}

export default function PasswordRecovery({ mode }: { mode: "request" | "reset" }) {
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = trpc.auth.requestPasswordReset.useMutation();
  const reset = trpc.auth.resetPassword.useMutation();
  const isReset = mode === "reset";
  const pending = request.isPending || reset.isPending;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (!isReset) {
        await request.mutateAsync({ email });
        setComplete(true);
        return;
      }
      if (!isResetTokenShape(token)) throw new Error("პაროლის აღდგენის ბმული მიუწვდომელია ან ვადაგასულია.");
      if (password !== confirmation) throw new Error("პაროლის გამეორება არ ემთხვევა.");
      await reset.mutateAsync({ token: token ?? "", password });
      setComplete(true);
      window.setTimeout(() => setLocation("/login"), 900);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ოპერაცია ვერ დასრულდა.");
    }
  };

  if (!isReset) return <RecoveryShell title="პაროლის აღდგენა" description="შეიყვანეთ ელფოსტა. ანგარიშის არსებობის მიუხედავად, პასუხი ყოველთვის ერთნაირია."><form className="mt-8 space-y-5" onSubmit={submit} aria-busy={pending}><div className="space-y-2"><Label htmlFor="recovery-email">ელფოსტა</Label><Input id="recovery-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></div>{error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}{complete ? <div role="status" aria-live="polite" className="rounded-xl border border-[#17826A]/25 bg-[#17826A]/5 p-4 text-sm text-[#1E2824]"><MailCheck className="mb-2 h-5 w-5 text-[#17826A]" />მოთხოვნა მიღებულია. უსაფრთხოების მიზნით ანგარიშის არსებობას ვერ ვადასტურებთ. ელფოსტით აღდგენის გაგზავნა გააქტიურდება მხოლოდ დამოწმებული sender domain-ის დამატების შემდეგ.</div> : <Button type="submit" className="w-full bg-[#B85C3D] hover:bg-[#9D4C31]" disabled={pending}>{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}აღდგენის მოთხოვნა</Button>}</form></RecoveryShell>;

  return <RecoveryShell title="ახალი პაროლი" description="გამოიყენეთ მხოლოდ თქვენს ელფოსტაზე მიღებული ერთჯერადი აღდგენის ბმული."><form className="mt-8 space-y-5" onSubmit={submit} aria-busy={pending}>{!isResetTokenShape(token) ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">პაროლის აღდგენის ბმული მიუწვდომელია ან ვადაგასულია.</p> : <><div className="space-y-2"><Label htmlFor="reset-password">ახალი პაროლი</Label><Input id="reset-password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={event => setPassword(event.target.value)} required /><p className="text-xs text-[#627069]">მინიმუმ 12 სიმბოლო.</p></div><div className="space-y-2"><Label htmlFor="reset-confirmation">გაიმეორეთ პაროლი</Label><Input id="reset-confirmation" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={event => setConfirmation(event.target.value)} required /></div></>}{error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}{complete ? <p role="status" aria-live="polite" className="rounded-xl border border-[#17826A]/25 bg-[#17826A]/5 p-4 text-sm text-[#1E2824]">პაროლი განახლდა. ახლა შესვლის გვერდზე გადადიხართ…</p> : <Button type="submit" className="w-full bg-[#B85C3D] hover:bg-[#9D4C31]" disabled={pending || !isResetTokenShape(token)}>{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}პაროლის განახლება</Button>}</form></RecoveryShell>;
}
