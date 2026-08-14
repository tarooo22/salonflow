import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme, type ThemePreference } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { BellOff, Check, Laptop, LockKeyhole, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

const themeOptions: Array<{ value: ThemePreference; label: string; description: string; Icon: typeof Sun }> = [
  { value: "light", label: "ღია", description: "ნათელი სამუშაო სივრცე", Icon: Sun },
  { value: "dark", label: "მუქი", description: "მუქი კონტრასტული ხედვა", Icon: Moon },
  { value: "system", label: "სისტემა", description: "მოწყობილობის არჩევანს მიჰყვება", Icon: Laptop },
];

export default function Settings() {
  const { user } = useAuth();
  const { preference, setPreference } = useTheme();
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const activeRole = organizations.data?.[0]?.membership.role;
  const canManageWorkspace = activeRole === "OWNER" || activeRole === "MANAGER";
  const [name, setName] = useState(user?.name ?? "");
  const [error, setError] = useState("");

  useEffect(() => setName(user?.name ?? ""), [user?.name]);

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: async profile => {
      utils.auth.me.setData(undefined, profile as never);
      await utils.auth.me.invalidate();
      toast.success("პროფილი განახლდა.");
      setError("");
    },
    onError: cause => setError(cause.message),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = name.trim();
    if (normalized.length < 2) {
      setError("სახელი მინიმუმ 2 სიმბოლოს უნდა შეიცავდეს.");
      return;
    }
    updateProfile.mutate({ name: normalized });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium text-primary">პირადი და სამუშაო სივრცის პარამეტრები</p>
          <h1 className="text-3xl font-semibold tracking-tight">პარამეტრები</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">მართეთ თქვენი პროფილი და ეკრანის ხილვადობა. მიწოდების ინტეგრაციები გამორთულია, სანამ ვერიფიცირებული provider არ დაემატება.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <UserRound className="h-5 w-5 text-primary" />
              <CardTitle className="mt-3">პროფილი</CardTitle>
              <CardDescription>ეს სახელი გამოჩნდება თქვენს დაცულ სამუშაო სივრცეში.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2"><Label htmlFor="settings-name">სახელი</Label><Input id="settings-name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={160} required /></div>
                <div className="space-y-2"><Label htmlFor="settings-email">ელფოსტა</Label><Input id="settings-email" value={user?.email ?? ""} disabled aria-describedby="settings-email-help" /><p id="settings-email-help" className="text-xs leading-5 text-muted-foreground">ელფოსტის შეცვლა ამ ეტაპზე ამ პარამეტრებში არ არის ხელმისაწვდომი.</p></div>
                {error ? <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
                <Button type="submit" disabled={updateProfile.isPending}>{updateProfile.isPending ? "ინახება…" : "პროფილის შენახვა"}</Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Sun className="h-5 w-5 text-primary" />
              <CardTitle className="mt-3">გარეგნობა</CardTitle>
              <CardDescription>არჩევანი ინახება ამ ბრაუზერში და მოქმედებს SalonFlow-ის ყველა გვერდზე.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div role="radiogroup" aria-label="თემის არჩევა" className="grid gap-2">
                {themeOptions.map(({ value, label, description, Icon }) => {
                  const selected = preference === value;
                  return <button key={value} type="button" role="radio" aria-checked={selected} onClick={() => setPreference?.(value)} className={`flex min-h-11 w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"}`}>
                    <Icon className="h-4 w-4 text-primary" /><span className="flex-1"><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-muted-foreground">{description}</span></span>{selected ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>;
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <LockKeyhole className="h-5 w-5 text-primary" />
              <CardTitle className="mt-3">კონფიდენციალურობა</CardTitle>
              <CardDescription>SalonFlow-ის სამუშაო სივრცე იყენებს local session-სა და ორგანიზაციის/როლის scope-ს.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><p>კლიენტებისა და ოპერაციების მონაცემები ხელმისაწვდომია მხოლოდ თქვენს როლსა და აქტიურ ორგანიზაციას შესაბამისი server-side წესებით.</p><Badge variant="outline" className="border-primary/25 bg-primary/5 text-primary"><ShieldCheck className="mr-1.5 h-3.5 w-3.5" />დაცული სამუშაო სივრცე</Badge></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BellOff className="h-5 w-5 text-primary" />
              <CardTitle className="mt-3">შეტყობინებები</CardTitle>
              <CardDescription>{canManageWorkspace ? "სამუშაო სივრცის მიწოდების სტატუსი" : "თქვენი შეტყობინებების სტატუსი"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground"><Badge variant="outline" className="border-warning/30 bg-warning/5 text-warning">ჯერ არ არის კონფიგურირებული</Badge><p>ელფოსტის, SMS-ის და WhatsApp-ის გაგზავნა გათიშულია. ვერიფიცირებული sender domain და provider credentials აუცილებელია, სანამ რეალურ შეხსენებებს ან დასტურებს ჩავრთავთ.</p>{canManageWorkspace ? <p className="text-xs">Owner/Manager ხედავთ ამ სტატუსს; provider მონაცემები არასოდეს გამოჩნდება ან შეინახება client UI-ში.</p> : null}</CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
