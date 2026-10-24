import { CatalogFooter, CatalogHeader } from "@/components/catalog/CatalogChrome";
import "@/components/catalog/marketing.css";
import { usePublicMeta } from "@/components/public/PublicMeta";
import { trpc } from "@/lib/trpc";
import { BRAND } from "@shared/brand";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

function getReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo") ?? "/app/trial-status";
  return raw.startsWith("/app/") ? raw : "/app/trial-status";
}

function PasswordField({ value, onChange, autoComplete, minLength, error }: { value: string; onChange: (value: string) => void; autoComplete: string; minLength: number; error?: string }) {
  const [visible, setVisible] = useState(false);
  return <div>
    <div className="mkt-field">
      <label htmlFor="auth-password">პაროლი</label>
      <div className="mkt-field-row">
        <input id="auth-password" value={value} onChange={event => onChange(event.target.value)} autoComplete={autoComplete} minLength={minLength} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} aria-describedby={minLength >= 10 ? "auth-password-hint" : undefined} required />
        <button type="button" className="mkt-field-btn" aria-label={visible ? "პაროლის დამალვა" : "პაროლის ჩვენება"} aria-pressed={visible} onClick={() => setVisible(current => !current)}>{visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}</button>
      </div>
    </div>
    {minLength >= 10 ? <p id="auth-password-hint" className="mkt-hint mkt-hint-top">მინიმუმ 10 სიმბოლო.</p> : null}
  </div>;
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
  const description = isRegister ? `რეგისტრაციის შემდეგ შეიტანთ სალონის საცდელ მოთხოვნას; 7-დღიანი წვდომა გაიხსნება მხოლოდ ${BRAND.name} platform admin-ის ხელით დამტკიცების შემდეგ.` : isClaim ? `შეიყვანეთ ${BRAND.name}-ისგან მიღებული აღდგენის კოდი, თქვენი მიმდინარე პაროლი და ახალი ელფოსტა.` : `შედით თქვენი ${BRAND.name} ელფოსტითა და პაროლით.`;
  const submitLabel = isRegister ? "ანგარიშის შექმნა" : isClaim ? "ანგარიშის აღდგენა" : "შესვლა";
  const modeLabel = isRegister ? "ახალი სივრცე" : isClaim ? "უსაფრთხო აღდგენა" : "დაცული შესვლა";

  usePublicMeta({ title: `${isRegister ? "რეგისტრაცია" : isClaim ? "ანგარიშის აღდგენა" : "შესვლა"} | ${BRAND.name}`, description, canonicalPath: isRegister ? "/register" : isClaim ? "/claim-account" : "/login", robots: "noindex,nofollow" });

  return <div className="cw min-h-screen">
    <CatalogHeader />
    <main id="main-content" tabIndex={-1} className="mkt-auth">
      <div className="mkt-auth-inner">
        <p className="mkt-wordmark">{BRAND.nameKa}</p>
        <div className="mkt-auth-card">
          <p className="mkt-caption">{BRAND.name} · {modeLabel}</p>
          <h1 className="mkt-auth-title">{title}</h1>
          <p className="mkt-hint mkt-auth-desc">{description}</p>
          <form className="mkt-form" onSubmit={submit} noValidate>
            {isRegister ? <div className="mkt-field">
              <label htmlFor="auth-name">სახელი</label>
              <input id="auth-name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" minLength={2} autoFocus required />
            </div> : null}
            {isClaim ? <div>
              <div className="mkt-field">
                <label htmlFor="recovery-code">აღდგენის კოდი</label>
                <input id="recovery-code" className="tabular-nums" value={recoveryCode} onChange={event => setRecoveryCode(event.target.value.toUpperCase())} placeholder="SF-1234-5678-9ABC" autoComplete="one-time-code" aria-describedby="recovery-code-hint" autoFocus required />
              </div>
              <p id="recovery-code-hint" className="mkt-hint mkt-hint-top">კოდი არ არის თქვენი პაროლი. თუ ის არ მიგიღიათ, მიმართეთ {BRAND.name}-ის მხარდაჭერას.</p>
            </div> : null}
            <div className="mkt-field">
              <label htmlFor="auth-email">ელფოსტა</label>
              <input id="auth-email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" type="email" autoFocus={!isRegister && !isClaim} aria-invalid={Boolean(error)} required />
            </div>
            <PasswordField value={password} onChange={setPassword} autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister || isClaim ? 10 : 1} error={error} />
            {error ? <p role="alert" className="mkt-alert">{error}</p> : null}
            <button type="submit" className="mkt-btn mkt-btn-primary mkt-btn-block" disabled={pending}>{pending ? "მიმდინარეობს…" : submitLabel}</button>
          </form>
          <div className="mkt-divider mkt-links">
            <Link href={`${alternate}?returnTo=${encodeURIComponent(returnTo)}`} className="mkt-link">{alternateLabel}</Link>
            {!isClaim
              ? <Link href={`/claim-account?returnTo=${encodeURIComponent(returnTo)}`} className="mkt-subtle-link">ძველი ანგარიშის პრობლემა გაქვთ?</Link>
              : <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`} className="mkt-subtle-link">დაბრუნდით შესვლაზე</Link>}
          </div>
          <ul className="mkt-list mkt-auth-promises">
            <AuthPromise text="ადგილობრივი ელფოსტა და პაროლი" />
            <AuthPromise text="როლზე და ორგანიზაციაზე დაფუძნებული წვდომა" />
            <AuthPromise text="ქართული-first სამუშაო სივრცე" />
          </ul>
        </div>
      </div>
    </main>
    <CatalogFooter />
  </div>;
}

function AuthPromise({ text }: { text: string }) { return <li><ShieldCheck className="size-4" aria-hidden="true" />{text}</li>; }
