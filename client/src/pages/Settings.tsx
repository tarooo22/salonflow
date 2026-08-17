import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const themes = [{ value: "light", label: "ღია" }, { value: "dark", label: "მუქი" }, { value: "system", label: "სისტემა" }] as const;

export default function Settings() {
  const { user } = useAuth();
  const { preference, setPreference } = useTheme();
  const organizations = trpc.organizations.listMine.useQuery();
  const entry = organizations.data?.[0];
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: entry?.organization.id ?? "" }, { enabled: Boolean(entry?.organization.id) });

  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5"><WorkspacePageHeader eyebrow="სამუშაო სივრცის მართვა" title="პარამეტრები" description="პროფილის, ორგანიზაციის, უსაფრთხოების, შეტყობინებებისა და ვიზუალური გარემოს მიმდინარე სტატუსი." />
    {organizations.isLoading ? <WorkspaceState kind="loading" title="პარამეტრები იტვირთება…" /> : null}{organizations.isError ? <WorkspaceState kind="error" title="პარამეტრების მონაცემები მიუწვდომელია" /> : null}
    {!organizations.isLoading && !organizations.isError ? <div className="grid gap-4 xl:grid-cols-2"><WorkspaceSection title="პროფილი" description="თქვენი local SalonFlow ანგარიშის იდენტობა."><div className="grid gap-3 sm:grid-cols-2"><SettingFact label="ელფოსტა" value={user?.email ?? "არ არის მითითებული"} /><SettingFact label="ანგარიშის სტატუსი" value="აქტიური local ანგარიში" /><SettingFact label="როლი" value={entry?.membership.role ?? "სამუშაო სივრცე არ არის არჩეული"} /><SettingFact label="ენა" value="ქართული (ka-GE)" /></div></WorkspaceSection>
      <WorkspaceSection title="სამუშაო სივრცე" description="აქტიური ორგანიზაცია და ფილიალები, რომლებზეც მოქმედებს თქვენი უფლებები."><div className="space-y-2"><div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"><div><p className="font-semibold">{entry?.organization.name ?? "სამუშაო სივრცე ჯერ არ არის"}</p><p className="text-sm text-muted-foreground">ორგანიზაციის მონაცემები და ფილიალები scope-ითაა დაცული.</p></div><WorkspaceStatusPill tone="info">{entry?.membership.role ?? "—"}</WorkspaceStatusPill></div>{locations.isLoading ? <p className="text-sm text-muted-foreground">ფილიალები იტვირთება…</p> : locations.data?.map(location => <div key={location.id} className="flex items-center justify-between rounded-lg bg-muted/35 px-3 py-2 text-sm"><span>{location.name}</span><span className="text-muted-foreground">{location.timezone}</span></div>)}{!locations.isLoading && entry?.organization && !locations.data?.length ? <p className="text-sm text-muted-foreground">აქტიური ფილიალი ჯერ არ არის დამატებული.</p> : null}</div></WorkspaceSection>
      <WorkspaceSection title="უსაფრთხოება" description="ავტორიზაციისა და მონაცემებზე წვდომის დაცული კონტექსტი."><div className="space-y-2"><SettingFact label="ავტორიზაცია" value="ელფოსტა და პაროლი · local-only session" /><SettingFact label="სესია" value="დაცული HTTP-only cookie" /><SettingFact label="მონაცემებზე წვდომა" value="ორგანიზაცია, როლი და ფილიალი მოწმდება სერვერზე" /></div></WorkspaceSection>
      <WorkspaceSection title="შეტყობინებები" description="Customer-facing delivery განზრახ გამორთულია, სანამ sender და provider სრულად არ მომზადდება."><IntegrationReadinessCard category="შეტყობინებები" title="Email/SMS delivery ჯერ არ არის კონფიგურირებული" description="ავტომატური booking confirmation და 24-საათიანი შეხსენება ამჟამად არ იგზავნება." requirements={["Email ან SMS provider", "verified sender domain ან დამტკიცებული ნომერი", "server-only API secret და consent/timing policy"]} /></WorkspaceSection>
      <WorkspaceSection title="გარეგნობა" description="არჩეული რეჟიმი ინახება ამ ბრაუზერში და მოქმედებს ყველა protected page-ზე."><div className="flex flex-wrap gap-2">{themes.map(theme => <Button key={theme.value} type="button" variant={preference === theme.value ? "default" : "outline"} onClick={() => setPreference?.(theme.value)} aria-pressed={preference === theme.value}>{theme.label}</Button>)}</div></WorkspaceSection>
      <WorkspaceSection title="ინტეგრაციები" description="მიმდინარე readiness სტატუსი გამჭვირვალედ — აქ არ არის ცრუ toggle ან „დაკავშირებულია“ სტატუსი."><div className="space-y-3"><IntegrationReadinessCard category="დეპოზიტი და წინასწარი გადახდა" title="ონლაინ გადახდა ჯერ არ არის კონფიგურირებული" description="Checkout და თანხის ჩამოჭრა გამორთულია; POS-ის cash/card/bank აღრიცხვა გარე gateway capture არ არის." requirements={["payment gateway და merchant account", "deposit, cancellation და refund policy", "signed webhook და server-only payment secrets"]} /><div className="grid gap-2 sm:grid-cols-2"><SettingFact label="მონაცემთა ექსპორტი" value="CSV ხელმისაწვდომია ანგარიშების გვერდიდან უფლებამოსილი როლებისთვის" /><SettingFact label="შემდეგი უსაფრთხო ნაბიჯი" value="ჯერ გადაწყვიტეთ provider და policy, შემდეგ დაიწყება controlled activation" /></div></div></WorkspaceSection></div> : null}
  </div></DashboardLayout>;
}

function SettingFact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border bg-muted/15 p-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold leading-5">{value}</p></div>; }

function IntegrationReadinessCard({ category, title, description, requirements }: { category: string; title: string; description: string; requirements: string[] }) {
  return <div className="rounded-xl border border-dashed bg-muted/10 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{category}</p><WorkspaceStatusPill tone="warning">არ არის კონფიგურირებული</WorkspaceStatusPill></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{title}. {description}</p><p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">გასააქტიურებლად საჭიროა</p><ul className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-3">{requirements.map(requirement => <li key={requirement} className="rounded-lg bg-background/60 px-2.5 py-2">{requirement}</li>)}</ul></div>;
}
