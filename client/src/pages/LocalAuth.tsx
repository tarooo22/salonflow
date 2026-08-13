import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CalendarCheck2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

function getReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo") ?? "/app/today";
  return raw.startsWith("/app/") ? raw : "/app/today";
}

export default function LocalAuth({ mode }: { mode: "login" | "register" }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const returnTo = useMemo(getReturnTo, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isRegister = mode === "register";
  const finish = async (user: { id: number; openId: string; name: string | null; email: string | null }) => {
    utils.auth.me.setData(undefined, user as never);
    await utils.auth.me.invalidate();
    setLocation(returnTo);
  };
  const register = trpc.auth.register.useMutation({ onSuccess: finish, onError: cause => setError(cause.message) });
  const login = trpc.auth.login.useMutation({ onSuccess: finish, onError: cause => setError(cause.message) });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (isRegister) {
      if (password.length < 10) { setError("პაროლი მინიმუმ 10 სიმბოლოს უნდა შეიცავდეს."); return; }
      register.mutate({ name, email, password });
      return;
    }
    login.mutate({ email, password });
  };
  const pending = register.isPending || login.isPending;
  const alternate = isRegister ? "/login" : "/register";
  const alternateLabel = isRegister ? "უკვე გაქვთ ანგარიში? შედით" : "ჯერ არ გაქვთ ანგარიში? დარეგისტრირდით";

  return <main className="min-h-screen bg-[#F7F4EF] px-4 py-8 text-[#1E2824] sm:flex sm:items-center sm:justify-center"><Card className="mx-auto w-full max-w-md border-[#1E2824]/10 bg-white shadow-xl shadow-[#1E2824]/10"><CardHeader className="space-y-4"><Link href="/" className="flex w-fit items-center gap-2 font-serif text-xl font-semibold"><span className="rounded-lg bg-[#1E2824] p-2 text-[#F7F4EF]"><CalendarCheck2 className="h-4 w-4" /></span>SalonFlow</Link><div><CardTitle className="font-serif text-3xl">{isRegister ? "შექმენით ანგარიში" : "შედით სამუშაო სივრცეში"}</CardTitle><CardDescription className="mt-2 leading-6">{isRegister ? "დაიწყეთ თქვენი სალონის ოპერაციების მართვა Georgian local ანგარიშით." : "გამოიყენეთ თქვენი ელფოსტა და პაროლი. Manus ანგარიში საჭირო არ არის."}</CardDescription></div></CardHeader><CardContent><form className="space-y-4" onSubmit={submit}>{isRegister ? <div className="space-y-2"><Label htmlFor="auth-name">სახელი</Label><div className="relative"><UserRound className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="auth-name" className="pl-9" value={name} onChange={event => setName(event.target.value)} autoComplete="name" minLength={2} required /></div></div> : null}<div className="space-y-2"><Label htmlFor="auth-email">ელფოსტა</Label><div className="relative"><Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="auth-email" className="pl-9" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" type="email" required /></div></div><div className="space-y-2"><Label htmlFor="auth-password">პაროლი</Label><div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="auth-password" className="pl-9" value={password} onChange={event => setPassword(event.target.value)} autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 10 : 1} type="password" required /></div>{isRegister ? <p className="text-xs text-muted-foreground">მინიმუმ 10 სიმბოლო.</p> : null}</div>{error ? <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}<Button type="submit" className="w-full bg-[#B85C3D] hover:bg-[#9D4C31]" disabled={pending}>{pending ? "მიმდინარეობს…" : isRegister ? "რეგისტრაცია" : "შესვლა"}</Button></form><p className="mt-6 text-center text-sm text-muted-foreground"><Link href={`${alternate}?returnTo=${encodeURIComponent(returnTo)}`} className="font-medium text-[#B85C3D] underline-offset-4 hover:underline">{alternateLabel}</Link></p></CardContent></Card></main>;
}
