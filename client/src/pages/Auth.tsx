import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalonFlowBrand } from "@/components/SalonFlowBrand";
import { trpc } from "@/lib/trpc";
import { pendingInvitePath } from "@/lib/pendingInvite";
import { ArrowLeft, Loader2, LockKeyhole, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link, useLocation } from "wouter";

type AuthMode = "register" | "login";

export default function Auth({ mode }: { mode: AuthMode }) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const register = trpc.auth.register.useMutation();
  const login = trpc.auth.login.useMutation();
  const isRegister = mode === "register";
  const pending = register.isPending || login.isPending;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      if (isRegister) await register.mutateAsync({ name, email, password });
      else await login.mutateAsync({ email, password });
      await utils.auth.me.invalidate();
      setLocation(pendingInvitePath() ?? "/app/today");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "ოპერაცია ვერ დასრულდა.");
    }
  };

  return <main className="min-h-screen bg-[#F7F4EF] px-4 py-8 sm:px-6"><div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl overflow-hidden rounded-[2rem] border border-[#1E2824]/10 bg-white shadow-2xl shadow-[#1E2824]/10 lg:grid-cols-[.82fr_1.18fr]"><aside className="bg-[#1E2824] p-8 text-[#F7F4EF] sm:p-12"><Link href="/" className="inline-flex items-center gap-2 text-sm text-[#E8DDD3] hover:text-white"><ArrowLeft className="h-4 w-4" /> მთავარ გვერდზე</Link><div className="mt-14"><SalonFlowBrand inverted /><p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[#E7B49E]">თქვენი დღის მშვიდი რიტმი</p></div><h1 className="mt-4 font-serif text-4xl font-semibold leading-tight">თქვენი სამუშაო სივრცე იწყება აქედან.</h1><p className="mt-6 max-w-sm text-sm leading-6 text-[#D3DDD6]">რეგისტრაციის შემდეგ შექმნით პირველ სალონსა და ფილიალს. მონაცემები დაცულია და მხოლოდ თქვენს გუნდს ეკუთვნის.</p></aside><section className="flex items-center p-7 sm:p-12"><div className="w-full max-w-md"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#B85C3D]/10 text-[#B85C3D]">{isRegister ? <UserPlus className="h-6 w-6" /> : <LockKeyhole className="h-6 w-6" />}</div><h2 className="mt-7 font-serif text-3xl font-semibold text-[#1E2824]">{isRegister ? "რეგისტრაცია" : "სისტემაში შესვლა"}</h2><p className="mt-2 text-sm leading-6 text-[#627069]">{isRegister ? "შექმენით თქვენი ანგარიშის პაროლი და დაიწყეთ სამუშაო სივრცის აწყობა." : "შედით ელფოსტითა და პაროლით თქვენს სამუშაო სივრცეში."}</p><form className="mt-8 space-y-5" onSubmit={submit} aria-busy={pending}>{isRegister ? <div className="space-y-2"><Label htmlFor="name">სახელი და გვარი</Label><Input id="name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" required minLength={2} /></div> : null}<div className="space-y-2"><Label htmlFor="email">ელფოსტა</Label><Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></div><div className="space-y-2"><Label htmlFor="password">პაროლი</Label><Input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 12 : 1} /><p className="text-xs text-[#627069]">{isRegister ? "მინიმუმ 12 სიმბოლო." : ""}</p></div>{error ? <p role="alert" aria-live="assertive" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}<Button type="submit" className="w-full bg-[#B85C3D] hover:bg-[#9D4C31]" disabled={pending}>{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}{isRegister ? "ანგარიშის შექმნა" : "შესვლა"}</Button></form>{!isRegister ? <p className="mt-4 text-center text-sm"><Link href="/forgot-password" className="font-semibold text-[#B85C3D] hover:underline">დაგავიწყდათ პაროლი?</Link></p> : null}<p className="mt-6 text-center text-sm text-[#627069]">{isRegister ? "უკვე გაქვთ ანგარიში?" : "ჯერ არ გაქვთ ანგარიში?"} <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-[#B85C3D] hover:underline">{isRegister ? "შესვლა" : "რეგისტრაცია"}</Link></p></div></section></div></main>;
}
