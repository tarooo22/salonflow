import React, { FormEvent, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { WorkspacePageHeader, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { SettingsActionRow, SettingsGuard, SettingsReadinessPanel, SettingsSection, SettingsSectionNav, type SettingsNavItem } from "@/components/workspace/SettingsPrimitives";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { formatKaDateTime } from "@/lib/presentation";
import { VerticalSetting } from "@/components/clinical/VerticalPicker";
import { BellRing, Copy, ExternalLink, LockKeyhole, MapPinned, Paintbrush, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const themes = [{ value: "light", label: "ღია" }, { value: "dark", label: "მუქი" }, { value: "system", label: "სისტემა" }] as const;
const navItems: SettingsNavItem[] = [
  { id: "profile", label: "ჩემი ანგარიში" },
  { id: "workspace", label: "სალონი და ფილიალები", ownerOnly: true },
  { id: "booking", label: "ჩაწერის წესები", ownerOnly: true },
  { id: "hours", label: "სამუშაო საათები" },
  { id: "public", label: "საჯარო პროფილი", ownerOnly: true },
  { id: "privacy", label: "უსაფრთხოება" },
  { id: "integrations", label: "ინტეგრაციები", ownerOnly: true },
];
type BranchDraft = { name: string; timezone: string; address: string; phone: string; email: string; bookingEnabled: boolean; slotIntervalMinutes: number; minimumNoticeMinutes: number; maximumAdvanceDays: number; cancellationCutoffMinutes: number };
type UserSettings = { density: "COMFORTABLE" | "COMPACT"; reducedMotion: boolean; defaultRoute: "/app/today" | "/app/calendar" | "/app/reports"; inAppAlertCategories: Array<"OPERATIONAL" | "MODERATION" | "ACCESS"> };
const defaultUserSettings: UserSettings = { density: "COMFORTABLE", reducedMotion: false, defaultRoute: "/app/today", inAppAlertCategories: ["OPERATIONAL", "MODERATION", "ACCESS"] };

export function branchBookingLink(origin: string, publicSlug: string) { return `${origin}/book/${publicSlug}`; }
function makeDraft(location: { name: string; timezone: string; address: string | null; phone: string | null; email: string | null; bookingEnabled: boolean; slotIntervalMinutes: number; minimumNoticeMinutes: number; maximumAdvanceDays: number; cancellationCutoffMinutes: number }): BranchDraft { return { name: location.name, timezone: location.timezone, address: location.address ?? "", phone: location.phone ?? "", email: location.email ?? "", bookingEnabled: location.bookingEnabled, slotIntervalMinutes: location.slotIntervalMinutes, minimumNoticeMinutes: location.minimumNoticeMinutes, maximumAdvanceDays: location.maximumAdvanceDays, cancellationCutoffMinutes: location.cancellationCutoffMinutes }; }
const formatDate = (value: Date | string | null | undefined) => value ? formatKaDateTime(new Date(value)) : "—";
// Intl lists every IANA zone the browser knows; the current value is always kept selectable.
function timezoneOptions(current: string) {
  const supported = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [];
  return Array.from(new Set(["Asia/Tbilisi", current, ...supported]));
}
const roleLabels: Record<string, string> = { OWNER: "მფლობელი", MANAGER: "მენეჯერი", RECEPTIONIST: "ადმინისტრატორი", STAFF: "სპეციალისტი" };

export default function Settings() {
  const { user } = useAuth();
  const { preference, setPreference } = useTheme();
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const entry = organizations.data?.[0];
  const organizationId = entry?.organization.id ?? "";
  const isOwner = entry?.membership.role === "OWNER";
  const canEditHours = isOwner || entry?.membership.role === "MANAGER";
  const locations = trpc.organizations.listLocations.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const preferences = trpc.productivity.preferences.useQuery({ organizationId }, { enabled: Boolean(organizationId) });
  const [activeSection, setActiveSection] = useState("profile");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const selectedLocation = useMemo(() => locations.data?.find(location => location.id === selectedLocationId) ?? locations.data?.[0], [locations.data, selectedLocationId]);
  const [branchDraft, setBranchDraft] = useState<BranchDraft | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings>(defaultUserSettings);
  useEffect(() => { if (selectedLocation) { setSelectedLocationId(selectedLocation.id); setBranchDraft(makeDraft(selectedLocation)); } }, [selectedLocation?.id]);
  useEffect(() => { if (preferences.data?.settings) setUserSettings(preferences.data.settings as UserSettings); }, [preferences.data?.settings]);
  useEffect(() => { if ((!isOwner && ["workspace", "booking", "public", "integrations"].includes(activeSection)) || (!canEditHours && activeSection === "hours")) setActiveSection("profile"); }, [activeSection, isOwner, canEditHours]);
  const updateLocation = trpc.organizations.updateLocationSettings.useMutation({
    onSuccess: async () => { toast.success("ფილიალის პარამეტრები განახლდა."); await utils.organizations.listLocations.invalidate({ organizationId }); },
    onError: error => toast.error(error.message || "ფილიალის პარამეტრების განახლება ვერ მოხერხდა."),
  });
  const savePreferences = trpc.productivity.savePreferences.useMutation({
    onSuccess: async () => { toast.success("პირადი გარემო შენახულია."); await utils.productivity.preferences.invalidate({ organizationId }); },
    onError: error => toast.error(error.message || "პირადი გარემოს შენახვა ვერ მოხერხდა."),
  });
  const copyBookingLink = async (publicSlug: string) => { try { await navigator.clipboard.writeText(branchBookingLink(window.location.origin, publicSlug)); toast.success("ჩაწერის ბმული დაკოპირდა."); } catch { toast.error("ბმულის დაკოპირება ვერ მოხერხდა."); } };
  const submitBranch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!selectedLocation || !branchDraft) return; updateLocation.mutate({ organizationId, locationId: selectedLocation.id, name: branchDraft.name, timezone: branchDraft.timezone, address: branchDraft.address, phone: branchDraft.phone, email: branchDraft.email }); };
  const submitBookingRules = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!selectedLocation || !branchDraft) return; updateLocation.mutate({ organizationId, locationId: selectedLocation.id, bookingEnabled: branchDraft.bookingEnabled, slotIntervalMinutes: branchDraft.slotIntervalMinutes, minimumNoticeMinutes: branchDraft.minimumNoticeMinutes, maximumAdvanceDays: branchDraft.maximumAdvanceDays, cancellationCutoffMinutes: branchDraft.cancellationCutoffMinutes }); };
  const toggleAlert = (category: UserSettings["inAppAlertCategories"][number]) => setUserSettings(current => ({ ...current, inAppAlertCategories: current.inAppAlertCategories.includes(category) ? current.inAppAlertCategories.filter(item => item !== category) : [...current.inAppAlertCategories, category] }));
  const persistPersonalSettings = () => { if (organizationId) savePreferences.mutate({ organizationId, settings: userSettings }); };

  return <DashboardLayout><div className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5"><WorkspacePageHeader title="პარამეტრები" description="სალონის, ჩაწერის წესებისა და ანგარიშის პარამეტრები." />
    {organizations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
    {organizations.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void organizations.refetch(); }}>თავიდან ცდა</Button>} /> : null}
    {!organizations.isLoading && !organizations.isError ? <><dl className="cwk-sheet grid grid-cols-1 overflow-hidden sm:grid-flow-col sm:auto-cols-fr"><SettingsFact label="სალონი" value={entry?.organization.name ?? "—"} /><SettingsFact label="თქვენი როლი" value={entry ? roleLabels[entry.membership.role] ?? entry.membership.role : "—"} /><SettingsFact label="ბოლო შესვლა" value={formatDate(user?.lastSignedIn)} mono /></dl><SettingsSectionNav items={navItems.filter(item => item.id !== "hours" || canEditHours)} activeId={activeSection} onChange={setActiveSection} isOwner={isOwner} />
      {activeSection === "profile" ? <SettingsSection id="profile" title="ჩემი ანგარიში" action={<WorkspaceStatusPill tone="count"><LockKeyhole aria-hidden="true" />მხოლოდ თქვენთვის</WorkspaceStatusPill>}><div className="grid grid-cols-1 gap-4 xl:grid-cols-[.85fr_1.15fr]"><div className="space-y-3"><SettingsActionRow title="ანგარიში" description={user?.email ?? "ელფოსტა არ არის მითითებული"} /><SettingsActionRow title="სპეციალისტის პროფილი" description="ბიო და ფოტო იმართება გუნდის გვერდზე."><a className="inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted" href="/app/staff">გუნდის გვერდი<ExternalLink className="ml-2 size-4" /></a></SettingsActionRow>{isOwner ? <SettingsActionRow title="პაკეტი და გადახდა" description="პაკეტის სტატუსი, გააქტიურება და გადახდა."><Link className="inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted" href="/app/billing">პაკეტი და გადახდა<ExternalLink className="ml-2 size-4" aria-hidden="true" /></Link></SettingsActionRow> : null}<SettingsActionRow title="თემა" description="ინახება ამ ბრაუზერში."><div className="cwk-seg" role="group" aria-label="თემა">{themes.map(theme => <button key={theme.value} type="button" onClick={() => setPreference?.(theme.value)} aria-pressed={preference === theme.value}>{theme.label}</button>)}</div></SettingsActionRow></div>{preferences.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : preferences.isError ? <WorkspaceState kind="error" title="პირადი გარემო ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void preferences.refetch(); }}>თავიდან ცდა</Button>} /> : <form className="space-y-4" onSubmit={event => { event.preventDefault(); persistPersonalSettings(); }}><p className="font-semibold">სამუშაო გარემო</p><div className="grid gap-3 sm:grid-cols-2"><Field label="ინფორმაციის სიმკვრივე"><Select value={userSettings.density} onValueChange={value => setUserSettings(current => ({ ...current, density: value as UserSettings["density"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="COMFORTABLE">კომფორტული</SelectItem><SelectItem value="COMPACT">კომპაქტური</SelectItem></SelectContent></Select></Field><Field label="საწყისი გვერდი"><Select value={userSettings.defaultRoute} onValueChange={value => setUserSettings(current => ({ ...current, defaultRoute: value as UserSettings["defaultRoute"] }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="/app/today">დღეს</SelectItem><SelectItem value="/app/calendar">კალენდარი</SelectItem><SelectItem value="/app/reports">ანგარიშები</SelectItem></SelectContent></Select></Field></div><label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 border-t border-border py-2 text-sm font-medium"><span>ანიმაციების შემცირება</span><Switch checked={userSettings.reducedMotion} onCheckedChange={checked => setUserSettings(current => ({ ...current, reducedMotion: checked }))} /></label><fieldset><legend className="mb-2 mt-4 text-sm font-semibold text-muted-foreground">შეტყობინებები აპში</legend>{([ ["OPERATIONAL", "დღიური ოპერაციები"], ["MODERATION", "შეფასებები და მოდერაცია"], ["ACCESS", "წვდომა და ვადა"] ] as const).map(([value, label]) => <label key={value} className="flex min-h-11 cursor-pointer items-center justify-between gap-3 border-t border-border py-2 text-sm first:mt-1"><span>{label}</span><Switch checked={userSettings.inAppAlertCategories.includes(value)} onCheckedChange={() => toggleAlert(value)} /></label>)}</fieldset><Button type="submit" className="min-h-11 max-sm:w-full" disabled={savePreferences.isPending}>{savePreferences.isPending ? "ინახება…" : "პირადი გარემოს შენახვა"}</Button></form>}</div></SettingsSection> : null}
      {activeSection === "workspace" ? <SettingsSection id="workspace" title="სალონი და ფილიალები"><SettingsGuard allowed={isOwner}>{entry ? <VerticalSetting key={entry.organization.vertical} organizationId={organizationId} vertical={entry.organization.vertical} /> : null}{locations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : locations.isError ? <WorkspaceState kind="error" title="ფილიალები ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void locations.refetch(); }}>თავიდან ცდა</Button>} /> : <div className="grid grid-cols-1 gap-4 xl:grid-cols-[.65fr_1.35fr]"><div className="space-y-3"><Field label="ფილიალი"><Select value={selectedLocation?.id ?? ""} onValueChange={setSelectedLocationId}><SelectTrigger><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data?.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></Field>{selectedLocation ? <><div><p className="text-xs font-medium text-muted-foreground">ჩაწერის ბმული</p><code className="mt-1 block break-all text-xs">{typeof window === "undefined" ? `/book/${selectedLocation.publicSlug}` : branchBookingLink(window.location.origin, selectedLocation.publicSlug)}</code><Button type="button" variant="outline" size="sm" className="mt-3 min-h-11" onClick={() => copyBookingLink(selectedLocation.publicSlug)}><Copy className="mr-2 size-4" />კოპირება</Button></div><SettingsActionRow title="საჯარო პროფილი" description="ფოტო, აღწერა და ბმულები."><a className="inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted" href="/app/media">ფოტოები და აღწერა<ExternalLink className="ml-2 size-4" /></a></SettingsActionRow></> : null}</div><form className="grid gap-3 sm:grid-cols-2" onSubmit={submitBranch}>{branchDraft ? <><Field label="ფილიალის სახელი"><Input value={branchDraft.name} onChange={event => setBranchDraft(current => current ? { ...current, name: event.target.value } : current)} minLength={2} maxLength={160} required /></Field><Field label="დროის სარტყელი"><Select value={branchDraft.timezone} onValueChange={value => setBranchDraft(current => current ? { ...current, timezone: value } : current)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{timezoneOptions(branchDraft.timezone).map(zone => <SelectItem key={zone} value={zone}>{zone}</SelectItem>)}</SelectContent></Select></Field><Field label="ტელეფონი"><Input value={branchDraft.phone} onChange={event => setBranchDraft(current => current ? { ...current, phone: event.target.value } : current)} type="tel" inputMode="tel" autoComplete="tel" placeholder="+995…" /></Field><Field label="ელფოსტა"><Input value={branchDraft.email} onChange={event => setBranchDraft(current => current ? { ...current, email: event.target.value } : current)} type="email" autoComplete="email" placeholder="salon@example.com" /></Field><div className="sm:col-span-2"><Field label="მისამართი"><Input value={branchDraft.address} onChange={event => setBranchDraft(current => current ? { ...current, address: event.target.value } : current)} maxLength={1200} /></Field></div><div className="sm:col-span-2"><Button type="submit" className="min-h-11 max-sm:w-full" disabled={updateLocation.isPending}>{updateLocation.isPending ? "ინახება…" : "შენახვა"}</Button></div></> : <WorkspaceState kind="empty" title="ფილიალი არ არის არჩეული" />}</form></div>}</SettingsGuard></SettingsSection> : null}
      {activeSection === "booking" ? <SettingsSection id="booking" title="ჩაწერის წესები" description="მოქმედებს ახალ ჯავშნებზე; არსებულს არ ცვლის."><SettingsGuard allowed={isOwner}>{locations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : locations.isError ? <WorkspaceState kind="error" title="ფილიალები ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void locations.refetch(); }}>თავიდან ცდა</Button>} /> : selectedLocation && branchDraft ? <form className="grid gap-4 md:grid-cols-2" onSubmit={submitBookingRules}><label className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-semibold md:col-span-2"><span>ონლაინ ჩაწერა: {branchDraft.bookingEnabled ? "ჩართულია" : "პაუზაზეა"}</span><Switch checked={branchDraft.bookingEnabled} onCheckedChange={checked => setBranchDraft(current => current ? { ...current, bookingEnabled: checked } : current)} /></label><NumberField label="დროის ინტერვალი (წუთი)" value={branchDraft.slotIntervalMinutes} min={5} max={120} onChange={value => setBranchDraft(current => current ? { ...current, slotIntervalMinutes: value } : current)} /><NumberField label="მინ. წინასწარი დრო (წუთი)" value={branchDraft.minimumNoticeMinutes} min={0} max={10080} onChange={value => setBranchDraft(current => current ? { ...current, minimumNoticeMinutes: value } : current)} /><NumberField label="მაქს. წინასწარი დღეები" value={branchDraft.maximumAdvanceDays} min={1} max={365} onChange={value => setBranchDraft(current => current ? { ...current, maximumAdvanceDays: value } : current)} /><NumberField label="გაუქმების ვადა (წუთი)" value={branchDraft.cancellationCutoffMinutes} min={0} max={10080} onChange={value => setBranchDraft(current => current ? { ...current, cancellationCutoffMinutes: value } : current)} /><div className="md:col-span-2"><Button type="submit" className="min-h-11 max-sm:w-full" disabled={updateLocation.isPending}>{updateLocation.isPending ? "ინახება…" : "შენახვა"}</Button></div></form> : <WorkspaceState kind="empty" title="ჯერ აირჩიეთ ფილიალი" description="იხილეთ „სალონი და ფილიალები“." />}</SettingsGuard></SettingsSection> : null}
      {activeSection === "hours" ? <SettingsSection id="hours" title="სამუშაო საათები" description="ფილიალის კვირის განრიგი ონლაინ ჩაწერისთვის."><SettingsGuard allowed={canEditHours} description="ხელმისაწვდომია მხოლოდ მფლობელისა და მენეჯერისთვის.">{locations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : locations.isError ? <WorkspaceState kind="error" title="ფილიალები ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void locations.refetch(); }}>თავიდან ცდა</Button>} /> : <OpeningHoursEditor organizationId={organizationId} locations={locations.data ?? []} />}</SettingsGuard></SettingsSection> : null}
      {activeSection === "public" ? <SettingsSection id="public" title="საჯარო პროფილი"><SettingsGuard allowed={isOwner}><div className="grid grid-cols-1 gap-3 xl:grid-cols-2"><SettingsActionRow title="ფოტოები და აღწერა"><a className="inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted" href="/app/media">ფოტოების მართვა<ExternalLink className="ml-2 size-4" /></a></SettingsActionRow><SettingsActionRow title="კატალოგი და რუკა" description="გამოჩნდება მხოლოდ თქვენი თანხმობითა და დამტკიცების შემდეგ."><a className="inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted" href="/app/marketplace">ონლაინ გვერდი<ExternalLink className="ml-2 size-4" /></a></SettingsActionRow>{selectedLocation ? <SettingsActionRow title="ჩაწერის ბმული"><Button type="button" variant="outline" className="min-h-11" onClick={() => copyBookingLink(selectedLocation.publicSlug)}><Copy className="mr-2 size-4" />ბმულის კოპირება</Button></SettingsActionRow> : null}</div></SettingsGuard></SettingsSection> : null}
      {activeSection === "privacy" ? <SettingsSection id="privacy" title="უსაფრთხოება და კონფიდენციალურობა"><div className="grid grid-cols-1 gap-3 xl:grid-cols-2"><SettingsActionRow title="ავტორიზაცია" description="ელფოსტა და პაროლი; სხვა მოწყობილობიდან გამოსვლა ჯერ არ არის." ><LockKeyhole className="size-5 text-primary" aria-hidden="true" /></SettingsActionRow><SettingsActionRow title="კლიენტის თანხმობა" description="ინახება კლიენტის პროფილში; ანგარიშებში ჩანს მხოლოდ რაოდენობები." ><ShieldCheck className="size-5 text-primary" aria-hidden="true" /></SettingsActionRow><SettingsActionRow title="შეფასებების პოლიტიკა" description="შეფასება მხოლოდ დასრულებული ვიზიტის შემდეგ; დამალვას ან უარყოფას პლატფორმა წყვეტს." ><BellRing className="size-5 text-primary" aria-hidden="true" /></SettingsActionRow><SettingsActionRow title="მონაცემთა ექსპორტი" description="CSV ექსპორტი — ანგარიშების გვერდზე." ><a className="inline-flex min-h-11 items-center rounded-md border px-3 text-sm font-medium hover:bg-muted" href="/app/reports">ანგარიშები<ExternalLink className="ml-2 size-4" /></a></SettingsActionRow></div></SettingsSection> : null}
      {activeSection === "integrations" ? <SettingsSection id="integrations" title="ინტეგრაციები"><SettingsGuard allowed={isOwner}><div className="space-y-3"><SettingsReadinessPanel category="ელფოსტა და SMS" title="ავტომატური შეტყობინებები ჯერ არ არის აქტიური" description="დადასტურება და შეხსენება არ იგზავნება." requirements={["ელფოსტის ან SMS პროვაიდერი", "დამტკიცებული გამგზავნი", "თანხმობის წესი"]} /><SettingsReadinessPanel category="ბრაუზერის შეტყობინებები" title="ჯერ არ არის აქტიური" description="სისტემა ნებართვას არ ითხოვს და შეტყობინებებს არ აგზავნის." requirements={["VAPID გასაღებები", "მომხმარებლის თანხმობა", "გამოწერების შენახვა"]} /><SettingsReadinessPanel category="ონლაინ გადახდა" title="ჯერ არ არის კონფიგურირებული" description="გადარიცხვით გადახდა და სალარო მუშაობს; ბარათით ონლაინ გადახდა არ არის." requirements={["სავაჭრო ანგარიში", "დაბრუნების წესი", "დაცული დადასტურების არხი"]} /></div></SettingsGuard></SettingsSection> : null}
    </> : null}
  </div></DashboardLayout>;
}

function SettingsFact({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) { return <div className="min-w-0 border-b border-border px-3 py-2 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className={`truncate text-sm font-semibold ${mono ? "cwk-num" : ""}`}>{value}</dd></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="grid gap-1.5 text-sm font-medium"><span>{label}</span>{children}</label>; }
function NumberField({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) { return <Field label={label}><Input type="number" value={value} min={min} max={max} onChange={event => onChange(Number(event.target.value))} required /></Field>; }

// Weekday follows the schema and availability engine: 0 = Monday … 6 = Sunday.
const HOURS_WEEKDAYS = ["ორშაბათი", "სამშაბათი", "ოთხშაბათი", "ხუთშაბათი", "პარასკევი", "შაბათი", "კვირა"];
export type HoursDay = { weekday: number; open: boolean; startLocalTime: string; endLocalTime: string };
const DEFAULT_OPEN = "10:00";
const DEFAULT_CLOSE = "18:00";
const QUARTER_HOURS = Array.from({ length: 96 }, (_, index) => `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`);

/** Saved rows ("HH:mm:ss" per open weekday) → seven editable days. With no rows yet, Monday–Friday start open. */
export function hoursFromRows(rows: Array<{ weekday: number; opensAt: string; closesAt: string }> | undefined): HoursDay[] {
  const byWeekday = new Map((rows ?? []).map(row => [row.weekday, row]));
  const hasRows = byWeekday.size > 0;
  return HOURS_WEEKDAYS.map((_, weekday) => {
    const row = byWeekday.get(weekday);
    return { weekday, open: row ? true : !hasRows && weekday <= 4, startLocalTime: row ? row.opensAt.slice(0, 5) : DEFAULT_OPEN, endLocalTime: row ? row.closesAt.slice(0, 5) : DEFAULT_CLOSE };
  });
}
/** Copies Monday's state to Tuesday–Friday. */
export function copyMondayToWeekdays(days: HoursDay[]): HoursDay[] {
  const monday = days.find(day => day.weekday === 0);
  return monday ? days.map(day => day.weekday >= 1 && day.weekday <= 4 ? { ...day, open: monday.open, startLocalTime: monday.startLocalTime, endLocalTime: monday.endLocalTime } : day) : days;
}
export function hoursProblem(days: HoursDay[]): string | null {
  if (!days.some(day => day.open)) return "ერთი სამუშაო დღე მაინც უნდა იყოს ღია.";
  const bad = days.find(day => day.open && day.startLocalTime >= day.endLocalTime);
  return bad ? `${HOURS_WEEKDAYS[bad.weekday]}: დახურვის დრო გახსნის დროს უნდა მოჰყვებოდეს.` : null;
}
// Radix Select fires onValueChange("") when its value moves to an option it has not registered yet; such calls are ignored below.
const timeChoices = (current: string) => QUARTER_HOURS.includes(current) ? QUARTER_HOURS : [...QUARTER_HOURS, current].sort();

export function OpeningHoursEditor({ organizationId, locations }: { organizationId: string; locations: Array<{ id: string; name: string; timezone: string }> }) {
  const utils = trpc.useUtils();
  const [locationId, setLocationId] = useState("");
  const location = locations.find(item => item.id === locationId) ?? locations[0];
  const rows = trpc.organizations.listLocationOpeningHours.useQuery({ organizationId, locationId: location?.id ?? "" }, { enabled: Boolean(organizationId && location?.id) });
  const [days, setDays] = useState<HoursDay[]>(() => hoursFromRows(undefined));
  const [error, setError] = useState("");
  useEffect(() => { if (rows.data) { setDays(hoursFromRows(rows.data)); setError(""); } }, [rows.data, location?.id]);
  const save = trpc.organizations.setLocationOpeningHours.useMutation({
    onSuccess: async () => { setError(""); toast.success("სამუშაო საათები შენახულია."); await utils.organizations.listLocationOpeningHours.invalidate({ organizationId, locationId: location?.id ?? "" }); },
    onError: failure => setError(failure.data?.code === "BAD_REQUEST" ? "შეამოწმეთ საათები: ერთი დღე მაინც უნდა იყოს ღია და დახურვა გახსნას უნდა მოჰყვებოდეს." : failure.message || "სამუშაო საათების შენახვა ვერ მოხერხდა."),
  });
  const update = (weekday: number, patch: Partial<HoursDay>) => { setError(""); setDays(current => current.map(day => day.weekday === weekday ? { ...day, ...patch } : day)); };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!location) return;
    const problem = hoursProblem(days);
    if (problem) { setError(problem); return; }
    setError("");
    save.mutate({ organizationId, locationId: location.id, days });
  };
  if (!location) return <WorkspaceState kind="empty" title="ჯერ აირჩიეთ ფილიალი" description="იხილეთ „სალონი და ფილიალები“." />;
  return <form className="max-w-3xl space-y-4" onSubmit={submit} noValidate>
    {locations.length > 1 ? <Field label="ფილიალი"><Select value={location.id} onValueChange={setLocationId}><SelectTrigger className="w-full sm:w-72" aria-label="ფილიალი"><SelectValue /></SelectTrigger><SelectContent>{locations.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select></Field> : null}
    <p className="text-sm text-muted-foreground">ამ საათების მიღმა ონლაინ ჩაწერა არ იქნება შესაძლებელი. დრო ფილიალის დროის სარტყლით ითვლება: {location.timezone}.</p>
    {rows.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : rows.isError ? <WorkspaceState kind="error" title="სამუშაო საათები ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button type="button" variant="outline" onClick={() => { void rows.refetch(); }}>თავიდან ცდა</Button>} /> : <>
      {rows.data && rows.data.length === 0 ? <p className="text-sm text-muted-foreground">საათები ჯერ არ არის შენახული. ქვემოთ ნაჩვენებია სავარაუდო განრიგი — შეცვალეთ და შეინახეთ.</p> : null}
      <div>{days.map(day => {
        const label = HOURS_WEEKDAYS[day.weekday]!;
        return <div key={day.weekday} role="group" aria-label={label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-t border-border py-3 first:border-t-0 sm:grid-cols-[8rem_9.5rem_1fr]">
          <span className="font-semibold">{label}</span>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 justify-self-end text-sm sm:justify-self-start"><Switch checked={day.open} onCheckedChange={checked => update(day.weekday, { open: checked })} aria-label={`${label}: ${day.open ? "ღიაა" : "დაკეტილია"}`} /><span className="min-w-20">{day.open ? "ღიაა" : "დაკეტილია"}</span></label>
          {day.open ? <div className="col-span-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:col-span-1 sm:max-w-64">
            <Select value={day.startLocalTime} onValueChange={value => { if (value) update(day.weekday, { startLocalTime: value }); }}><SelectTrigger className="w-full" aria-label={`${label}: გახსნის დრო`}><SelectValue /></SelectTrigger><SelectContent>{timeChoices(day.startLocalTime).map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent></Select>
            <span aria-hidden="true" className="text-muted-foreground">–</span>
            <Select value={day.endLocalTime} onValueChange={value => { if (value) update(day.weekday, { endLocalTime: value }); }}><SelectTrigger className="w-full" aria-label={`${label}: დახურვის დრო`}><SelectValue /></SelectTrigger><SelectContent>{timeChoices(day.endLocalTime).map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent></Select>
          </div> : null}
        </div>;
      })}</div>
      {error ? <p role="alert" className="text-sm font-medium text-destructive">{error}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="outline" className="min-h-11" onClick={() => { setError(""); setDays(copyMondayToWeekdays); }}>ყველა სამუშაო დღეზე გადატანა</Button><Button type="submit" className="min-h-11 max-sm:w-full" disabled={save.isPending}>{save.isPending ? "ინახება…" : "შენახვა"}</Button></div>
    </>}
  </form>;
}
