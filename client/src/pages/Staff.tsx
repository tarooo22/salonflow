import React, { FormEvent, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { fileToImageDataUrl } from "@/lib/imageUpload";
import { formatGelTetri } from "@/lib/presentation";
import { BriefcaseBusiness, CalendarOff, Check, Clock3, Copy, ImagePlus, Link2, Mail, MapPin, Pencil, Plus, Send, Trash2, UsersRound, X } from "lucide-react";
import { toast } from "sonner";

const roleLabel: Record<string, string> = { OWNER: "მფლობელი", MANAGER: "მენეჯერი", RECEPTIONIST: "ადმინისტრატორი", STAFF: "სპეციალისტი" };
const weekdayLabel: Record<string, string> = { "0": "ორშაბათი", "1": "სამშაბათი", "2": "ოთხშაბათი", "3": "ხუთშაბათი", "4": "პარასკევი", "5": "შაბათი", "6": "კვირა" };
const exceptionTypeLabel: Record<string, string> = { VACATION: "შვებულება", SICK_LEAVE: "ავადმყოფობა", CUSTOM_BLOCK: "ინდივიდუალური ბლოკი", BREAK: "შესვენება", EXTENDED_WORKING_TIME: "გაფართოებული საათები", CLOSURE: "დახურვა" };
type ExceptionType = "VACATION" | "SICK_LEAVE" | "CUSTOM_BLOCK";

export default function Staff() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const isOwner = organizationEntry?.membership.role === "OWNER";
  const staff = trpc.staff.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const scheduleInput = { organizationId: organization?.id ?? "" };
  const workingHours = trpc.staff.listWorkingHours.useQuery(scheduleInput, { enabled: Boolean(organization?.id && isOwner) });
  const exceptions = trpc.staff.listScheduleExceptions.useQuery(scheduleInput, { enabled: Boolean(organization?.id && isOwner) });
  const performanceInput = useMemo(() => { const endsAt = new Date(); const startsAt = new Date(endsAt); startsAt.setUTCDate(startsAt.getUTCDate() - 30); return { organizationId: organization?.id ?? "", startsAt, endsAt }; }, [organization?.id]);
  const performance = trpc.staff.performance.useQuery(performanceInput, { enabled: Boolean(organization?.id && isOwner) });
  const hasOwnProfile = Boolean(staff.data?.some(item => item.membership.id === organizationEntry?.membership.id));

  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberFullName, setMemberFullName] = useState("");
  const [memberDisplayName, setMemberDisplayName] = useState("");
  const [memberJobTitle, setMemberJobTitle] = useState("");
  const [memberRole, setMemberRole] = useState<"MANAGER" | "RECEPTIONIST" | "STAFF">("STAFF");
  const [memberColor, setMemberColor] = useState("#7C3AED");
  const [memberLocationIds, setMemberLocationIds] = useState<string[]>([]);
  const [memberAvatarImageDataUrl, setMemberAvatarImageDataUrl] = useState("");
  const [memberAvatarAltKa, setMemberAvatarAltKa] = useState("");
  const [memberError, setMemberError] = useState("");
  const [issuedCredentials, setIssuedCredentials] = useState<{ loginId: string; temporaryPassword: string; fullName: string } | null>(null);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [hoursEditingId, setHoursEditingId] = useState<string>();
  const [hoursProfileId, setHoursProfileId] = useState("");
  const [hoursLocationId, setHoursLocationId] = useState("");
  const [hoursWeekday, setHoursWeekday] = useState("0");
  const [hoursStart, setHoursStart] = useState("09:00");
  const [hoursEnd, setHoursEnd] = useState("18:00");
  const [hoursError, setHoursError] = useState("");
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionEditingId, setExceptionEditingId] = useState<string>();
  const [exceptionProfileId, setExceptionProfileId] = useState("");
  const [exceptionLocationId, setExceptionLocationId] = useState("");
  const [exceptionType, setExceptionType] = useState<ExceptionType>("VACATION");
  const [exceptionStartsAt, setExceptionStartsAt] = useState("");
  const [exceptionEndsAt, setExceptionEndsAt] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionError, setExceptionError] = useState("");
  const invites = trpc.invitations.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id && isOwner) });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviteJobTitle, setInviteJobTitle] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "RECEPTIONIST" | "STAFF">("STAFF");
  const [inviteColor, setInviteColor] = useState("#7C3AED");
  const [inviteLocationId, setInviteLocationId] = useState<string>("");
  const [inviteError, setInviteError] = useState("");
  const [inviteResult, setInviteResult] = useState<{ token: string; acceptUrl: string; expiresAt: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const createInvite = trpc.invitations.create.useMutation({
    onSuccess: async result => { await invites.refetch(); setInviteResult({ token: result.token, acceptUrl: result.acceptUrl, expiresAt: result.expiresAt }); setInviteError(""); toast.success("მოწვევის ბმული შეიქმნა."); },
    onError: err => setInviteError(err.message || "მოწვევის შექმნა ვერ მოხერხდა."),
  });
  const revokeInvite = trpc.invitations.revoke.useMutation({
    onSuccess: async () => { await invites.refetch(); toast.success("მოწვევა გაუქმდა."); },
    onError: err => toast.error(err.message || "მოწვევის გაუქმება ვერ მოხერხდა."),
  });
  const openInviteDialog = () => { setInviteEmail(""); setInviteDisplayName(""); setInviteJobTitle(""); setInviteRole("STAFF"); setInviteColor("#7C3AED"); setInviteLocationId(locations.data?.length === 1 ? locations.data[0]!.id : ""); setInviteError(""); setInviteResult(null); setLinkCopied(false); setInviteOpen(true); };
  const submitInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;
    setInviteError("");
    createInvite.mutate({
      organizationId: organization.id,
      email: inviteEmail,
      role: inviteRole,
      publicDisplayName: inviteDisplayName || inviteEmail.split("@")[0] || "",
      jobTitle: inviteJobTitle || undefined,
      color: inviteColor,
      locationId: inviteLocationId || undefined,
      expiresInDays: 7,
    });
  };
  const copyInviteLink = async () => {
    if (!inviteResult) return;
    const url = `${window.location.origin}${inviteResult.acceptUrl}`;
    try { await navigator.clipboard.writeText(url); setLinkCopied(true); toast.success("ბმული დაკოპირდა."); setTimeout(() => setLinkCopied(false), 2000); }
    catch { toast.error("ბმულის დაკოპირება ვერ მოხერხდა."); }
  };

  const refreshSchedules = async () => { await Promise.all([workingHours.refetch(), exceptions.refetch()]); };
  const createProfile = trpc.staff.createProfile.useMutation({ onSuccess: async () => { await utils.staff.list.invalidate(); setProfileOpen(false); setDisplayName(""); setJobTitle(""); setSelectedLocationIds([]); toast.success("პროფილი შეიქმნა."); } });
  const setStaffAvatar = trpc.media.setStaffAvatar.useMutation({ onSuccess: async () => { await utils.staff.list.invalidate(); } });
  const createMember = trpc.staff.createMember.useMutation({
    onSuccess: async result => {
      const avatarImageDataUrl = memberAvatarImageDataUrl;
      const avatarAltKa = memberAvatarAltKa || `${memberDisplayName || memberFullName} — პროფილის ფოტო`;
      if (avatarImageDataUrl && organization) {
        try {
          await setStaffAvatar.mutateAsync({ organizationId: organization.id, staffProfileId: result.id, imageDataUrl: avatarImageDataUrl, altTextKa: avatarAltKa });
          toast.success("სპეციალისტის ავატარი აიტვირთა.");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "სპეციალისტი შეიქმნა, მაგრამ ავატარის ატვირთვა ვერ მოხერხდა.");
        }
      }
      await Promise.all([utils.staff.list.invalidate(), utils.staff.performance.invalidate()]);
      setMemberOpen(false); setMemberDisplayName(""); setMemberJobTitle(""); setMemberRole("STAFF"); setMemberColor("#7C3AED"); setMemberLocationIds([]); setMemberAvatarImageDataUrl(""); setMemberAvatarAltKa(""); setMemberError("");
      setIssuedCredentials({ loginId: result.loginId, temporaryPassword: result.temporaryPassword, fullName: memberFullName });
      setMemberFullName("");
      toast.success("გუნდის ახალი წევრი დაემატა. შეინახეთ მისთვის გაცემული შესვლის მონაცემები.");
    },
    onError: err => setMemberError(err.message || "შენახვა ვერ მოხერხდა."),
  });
  const addWorkingHours = trpc.staff.addWorkingHours.useMutation({ onSuccess: async () => { await refreshSchedules(); toast.success("სამუშაო საათები დაემატა."); setHoursOpen(false); } });
  const updateWorkingHours = trpc.staff.updateWorkingHours.useMutation({ onSuccess: async () => { await refreshSchedules(); toast.success("სამუშაო საათები განახლდა."); setHoursOpen(false); } });
  const deleteWorkingHours = trpc.staff.deleteWorkingHours.useMutation({ onSuccess: async () => { await workingHours.refetch(); toast.success("სამუშაო საათების წესი წაიშალა."); } });
  const addScheduleException = trpc.staff.addScheduleException.useMutation({ onSuccess: async () => { await refreshSchedules(); toast.success("კალენდრის გამონაკლისი დაემატა."); setExceptionOpen(false); } });
  const updateScheduleException = trpc.staff.updateScheduleException.useMutation({ onSuccess: async () => { await refreshSchedules(); toast.success("კალენდრის გამონაკლისი განახლდა."); setExceptionOpen(false); } });
  const deleteException = trpc.staff.deleteScheduleException.useMutation({ onSuccess: async () => { await exceptions.refetch(); toast.success("კალენდრის გამონაკლისი წაიშალა."); } });

  const openHoursCreate = (staffProfileId: string) => { setHoursEditingId(undefined); setHoursProfileId(staffProfileId); setHoursLocationId(""); setHoursWeekday("0"); setHoursStart("09:00"); setHoursEnd("18:00"); setHoursError(""); setHoursOpen(true); };
  const openHoursEdit = (item: NonNullable<typeof workingHours.data>[number]) => { setHoursEditingId(item.rule.id); setHoursProfileId(item.rule.staffProfileId); setHoursLocationId(item.rule.locationId); setHoursWeekday(String(item.rule.weekday)); setHoursStart(item.rule.startLocalTime.slice(0, 5)); setHoursEnd(item.rule.endLocalTime.slice(0, 5)); setHoursError(""); setHoursOpen(true); };
  const openExceptionCreate = () => { setExceptionEditingId(undefined); setExceptionProfileId(""); setExceptionLocationId(""); setExceptionType("VACATION"); setExceptionStartsAt(""); setExceptionEndsAt(""); setExceptionReason(""); setExceptionError(""); setExceptionOpen(true); };
  const openExceptionEdit = (item: NonNullable<typeof exceptions.data>[number]) => { setExceptionEditingId(item.exception.id); setExceptionProfileId(item.exception.staffProfileId ?? ""); setExceptionLocationId(item.exception.locationId ?? ""); setExceptionType(item.exception.type as ExceptionType); setExceptionStartsAt(toDateTimeLocal(item.exception.startsAt)); setExceptionEndsAt(toDateTimeLocal(item.exception.endsAt)); setExceptionReason(item.exception.reason ?? ""); setExceptionError(""); setExceptionOpen(true); };
  const submitProfile = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!organization || !organizationEntry || !selectedLocationIds.length) { setFormError("აირჩიეთ მინიმუმ ერთი აქტიური ფილიალი."); return; } createProfile.mutate({ organizationId: organization.id, membershipId: organizationEntry.membership.id, publicDisplayName: displayName, jobTitle: jobTitle || undefined, onlineBookingVisible: true, color: "#7C3AED", locationIds: selectedLocationIds }); };
  const openMemberDialog = () => { setMemberFullName(""); setMemberDisplayName(""); setMemberJobTitle(""); setMemberRole("STAFF"); setMemberColor("#7C3AED"); setMemberLocationIds(locations.data?.length === 1 ? [locations.data[0]!.id] : []); setMemberAvatarImageDataUrl(""); setMemberAvatarAltKa(""); setMemberError(""); setMemberOpen(true); };
  const chooseMemberAvatar = async (file: File | null) => {
    if (!file) return;
    try { setMemberAvatarImageDataUrl(await fileToImageDataUrl(file)); setMemberError(""); }
    catch (error) { setMemberError(error instanceof Error ? error.message : "ფოტოს მომზადება ვერ მოხერხდა."); }
  };
  const replaceStaffAvatar = async (staffProfileId: string, publicDisplayName: string, file: File | null) => {
    if (!organization || !file) return;
    try {
      const imageDataUrl = await fileToImageDataUrl(file);
      await setStaffAvatar.mutateAsync({ organizationId: organization.id, staffProfileId, imageDataUrl, altTextKa: `${publicDisplayName} — პროფილის ფოტო` });
      toast.success("სპეციალისტის ავატარი განახლდა.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "ავატარის ატვირთვა ვერ მოხერხდა."); }
  };
  const submitMember = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization) return;
    if (!memberLocationIds.length) { setMemberError("აირჩიეთ მინიმუმ ერთი აქტიური ფილიალი."); return; }
    if (memberRole === "STAFF" && memberLocationIds.length !== 1) { setMemberError("სპეციალისტი ზუსტად ერთ ფილიალზე უნდა იყოს მინიჭებული."); return; }
    setMemberError("");
    createMember.mutate({
      organizationId: organization.id,
      fullName: memberFullName,
      role: memberRole,
      publicDisplayName: memberDisplayName || memberFullName,
      jobTitle: memberJobTitle || undefined,
      onlineBookingVisible: memberRole === "STAFF",
      color: memberColor,
      locationIds: memberLocationIds,
    });
  };
  const submitHours = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!organization || !hoursProfileId || !hoursLocationId || hoursStart >= hoursEnd) { setHoursError("შეამოწმეთ სპეციალისტი, ფილიალი და დროის დიაპაზონი."); return; } const input = { organizationId: organization.id, staffProfileId: hoursProfileId, locationId: hoursLocationId, weekday: Number(hoursWeekday), startLocalTime: hoursStart, endLocalTime: hoursEnd }; if (hoursEditingId) updateWorkingHours.mutate({ ...input, id: hoursEditingId }); else addWorkingHours.mutate(input); };
  const submitException = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!organization || !exceptionProfileId || !exceptionLocationId || !exceptionStartsAt || !exceptionEndsAt) { setExceptionError("აირჩიეთ სპეციალისტი, ფილიალი და დროის დიაპაზონი."); return; } const startsAt = new Date(exceptionStartsAt); const endsAt = new Date(exceptionEndsAt); if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) { setExceptionError("დასრულება დაწყებაზე გვიან უნდა იყოს."); return; } const input = { organizationId: organization.id, staffProfileId: exceptionProfileId, locationId: exceptionLocationId, type: exceptionType, startsAt, endsAt, fullDay: false, reason: exceptionReason || undefined }; if (exceptionEditingId) updateScheduleException.mutate({ ...input, id: exceptionEditingId }); else addScheduleException.mutate(input); };

  return <DashboardLayout><div className="sf-workspace-page mx-auto min-w-0 w-full max-w-7xl space-y-6">
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="min-w-0"><p className="text-sm font-medium text-primary">გუნდის სამუშაო სივრცე</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">გუნდი</h1><p className="mt-2 text-sm text-muted-foreground">სპეციალისტების როლები, საჯარო პროფილები და ფილიალების აქტიური ქსელი.</p></div><div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-primary/30 bg-primary/5 px-3 py-1 text-primary">{organization?.name ?? "სამუშაო სივრცე"}</Badge>{organization && isOwner && staff.data?.length ? <Button variant="outline" onClick={openExceptionCreate}>კალენდრის ბლოკი</Button> : null}{organization && isOwner && !hasOwnProfile ? <Button variant="outline" onClick={() => setProfileOpen(true)}><Plus className="mr-2 h-4 w-4" />ჩემი პროფილი</Button> : null}{organization && isOwner ? <Button variant="outline" onClick={openInviteDialog}><Send className="mr-2 h-4 w-4" />მოწვევა</Button> : null}{organization && isOwner ? <Button onClick={openMemberDialog}><Plus className="mr-2 h-4 w-4" />გუნდის წევრი</Button> : null}</div></header>
    {organizations.isLoading ? <StateCard text="გუნდის სამუშაო სივრცე იტვირთება…" /> : null}{organizations.isError ? <StateCard error text="სამუშაო სივრცის მონაცემები დროებით მიუწვდომელია." /> : null}{!organizations.isLoading && !organizations.isError && !organization ? <StateCard text="გუნდის გვერდის სანახავად ჯერ შექმენით სამუშაო სივრცე." /> : null}
    {organization ? <><div className="grid gap-4 lg:grid-cols-3"><Metric icon={UsersRound} label="აქტიური პროფილები" value={staff.isLoading ? "…" : String(staff.data?.length ?? 0)} hint="ორგანიზაციის აქტიური თანამშრომლები" /><Metric icon={MapPin} label="აქტიური ფილიალები" value={locations.isLoading ? "…" : String(locations.data?.length ?? 0)} hint="ფილიალები, სადაც გუნდი განთავსდება" /><Metric icon={BriefcaseBusiness} label="ონლაინ პროფილები" value={staff.isLoading ? "…" : String(staff.data?.filter(item => item.profile.onlineBookingVisible).length ?? 0)} hint="საჯარო ჩაწერაში ხილული სპეციალისტები" /></div>
      <Card><CardHeader><CardTitle>{isOwner ? "აქტიური გუნდი" : "ჩემი სპეციალისტის პროფილი"}</CardTitle></CardHeader><CardContent><div className="grid gap-4 lg:grid-cols-2">{staff.isLoading ? <p className="text-sm text-muted-foreground">გუნდის პროფილები იტვირთება…</p> : null}{!staff.isLoading && !staff.data?.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">სპეციალისტის პროფილი ჯერ არ არის დამატებული.</p> : null}{staff.data?.map(item => <div key={item.profile.id} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10 text-sm font-semibold text-primary">{item.profile.avatarKey ? <img src={`/manus-storage/${item.profile.avatarKey}`} alt={item.profile.avatarAltKa || `${item.profile.publicDisplayName} — პროფილის ფოტო`} className="size-full object-cover" /> : item.profile.publicDisplayName.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><h2 className="truncate text-lg font-semibold">{item.profile.publicDisplayName}</h2><p className="mt-1 text-sm text-muted-foreground">{item.profile.jobTitle || item.profile.specialty || "როლი და სპეციალიზაცია დაემატება აქ"}</p></div></div><Badge variant="outline">{roleLabel[item.membership.role] ?? item.membership.role}</Badge></div><p className="mt-4 text-sm text-muted-foreground">საჯარო პროფილი: {item.profile.onlineBookingVisible ? "აქტიურია" : "დამალულია"}</p>{isOwner ? <div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => openHoursCreate(item.profile.id)}>სამუშაო საათები</Button><label className="inline-flex"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => { void replaceStaffAvatar(item.profile.id, item.profile.publicDisplayName, event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} disabled={setStaffAvatar.isPending} /><Button type="button" variant="outline" size="sm" asChild disabled={setStaffAvatar.isPending}><span><ImagePlus className="mr-1.5 h-3.5 w-3.5" />{setStaffAvatar.isPending ? "იტვირთება…" : "ავატარის შეცვლა"}</span></Button></label></div> : null}</div>)}</div></CardContent></Card>
      {isOwner && invites.data?.length ? <Card><CardHeader><CardTitle className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />მოლოდინში მოწვევები ({invites.data.length})</CardTitle></CardHeader><CardContent className="space-y-2">{invites.data.map(invite => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div className="min-w-0"><p className="font-medium truncate">{invite.email}</p><p className="mt-0.5 text-xs text-muted-foreground">{roleLabel[invite.role]} · ვადა {new Intl.DateTimeFormat("ka-GE", { dateStyle: "medium" }).format(new Date(invite.expiresAt))}</p></div><Button variant="ghost" size="sm" onClick={() => organization && revokeInvite.mutate({ organizationId: organization.id, id: invite.id })} disabled={revokeInvite.isPending}><X className="mr-1 h-3.5 w-3.5" />გაუქმება</Button></div>)}</CardContent></Card> : null}
      {isOwner ? <><StaffPerformancePanel isLoading={performance.isLoading} isError={performance.isError} data={performance.data} /><Card><CardHeader><CardTitle>განრიგის წესები და ბლოკები</CardTitle></CardHeader><CardContent className="grid gap-5 lg:grid-cols-2"><ScheduleRules data={workingHours.data} onEdit={openHoursEdit} onDelete={id => organization && deleteWorkingHours.mutate({ organizationId: organization.id, id })} /><ScheduleExceptions data={exceptions.data} onEdit={openExceptionEdit} onDelete={id => organization && deleteException.mutate({ organizationId: organization.id, id })} /></CardContent></Card></> : null}
    </> : null}
  </div><ProfileDialog open={profileOpen} setOpen={setProfileOpen} submit={submitProfile} displayName={displayName} setDisplayName={setDisplayName} jobTitle={jobTitle} setJobTitle={setJobTitle} locations={locations.data ?? []} selected={selectedLocationIds} setSelected={setSelectedLocationIds} error={formError} pending={createProfile.isPending} /><MemberDialog open={memberOpen} setOpen={setMemberOpen} submit={submitMember} fullName={memberFullName} setFullName={setMemberFullName} displayName={memberDisplayName} setDisplayName={setMemberDisplayName} jobTitle={memberJobTitle} setJobTitle={setMemberJobTitle} role={memberRole} setRole={setMemberRole} color={memberColor} setColor={setMemberColor} locations={locations.data ?? []} selected={memberLocationIds} setSelected={setMemberLocationIds} imageDataUrl={memberAvatarImageDataUrl} setImageDataUrl={setMemberAvatarImageDataUrl} altTextKa={memberAvatarAltKa} setAltTextKa={setMemberAvatarAltKa} onChooseAvatar={chooseMemberAvatar} error={memberError} pending={createMember.isPending || setStaffAvatar.isPending} /><HoursDialog open={hoursOpen} setOpen={setHoursOpen} editing={Boolean(hoursEditingId)} locations={locations.data ?? []} locationId={hoursLocationId} setLocationId={setHoursLocationId} weekday={hoursWeekday} setWeekday={setHoursWeekday} start={hoursStart} setStart={setHoursStart} end={hoursEnd} setEnd={setHoursEnd} submit={submitHours} error={hoursError} pending={addWorkingHours.isPending || updateWorkingHours.isPending} /><ExceptionDialog open={exceptionOpen} setOpen={setExceptionOpen} editing={Boolean(exceptionEditingId)} staff={staff.data ?? []} locations={locations.data ?? []} profileId={exceptionProfileId} setProfileId={setExceptionProfileId} locationId={exceptionLocationId} setLocationId={setExceptionLocationId} type={exceptionType} setType={setExceptionType} starts={exceptionStartsAt} setStarts={setExceptionStartsAt} ends={exceptionEndsAt} setEnds={exceptionEndsAt} reason={exceptionReason} setReason={setExceptionReason} submit={submitException} error={exceptionError} pending={addScheduleException.isPending || updateScheduleException.isPending} /><InviteDialog open={inviteOpen} setOpen={setInviteOpen} submit={submitInvite} email={inviteEmail} setEmail={setInviteEmail} displayName={inviteDisplayName} setDisplayName={setInviteDisplayName} jobTitle={inviteJobTitle} setJobTitle={setInviteJobTitle} role={inviteRole} setRole={setInviteRole} color={inviteColor} setColor={setInviteColor} locations={locations.data ?? []} locationId={inviteLocationId} setLocationId={setInviteLocationId} error={inviteError} pending={createInvite.isPending} result={inviteResult} onCopy={copyInviteLink} copied={linkCopied} /><IssuedCredentialsDialog credentials={issuedCredentials} onClose={() => setIssuedCredentials(null)} /></DashboardLayout>;
}

function ScheduleRules({ data, onEdit, onDelete }: { data: any[] | undefined; onEdit: (item: any) => void; onDelete: (id: string) => void }) { return <section><div className="mb-3 flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" /><p className="text-sm font-medium">სამუშაო საათები</p></div>{!data?.length ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">სამუშაო საათების წესი ჯერ არ არის დამატებული.</p> : <div className="space-y-2">{data.map(item => <div key={item.rule.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">{item.profile.publicDisplayName} · {weekdayLabel[String(item.rule.weekday)]}</p><p className="text-sm text-muted-foreground">{item.location.name} · {item.rule.startLocalTime}–{item.rule.endLocalTime}</p></div><div className="flex"><Button variant="ghost" size="icon" aria-label="სამუშაო საათების შეცვლა" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="სამუშაო საათების წაშლა" onClick={() => onDelete(item.rule.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)}</div>}</section>; }
function ScheduleExceptions({ data, onEdit, onDelete }: { data: any[] | undefined; onEdit: (item: any) => void; onDelete: (id: string) => void }) { return <section><div className="mb-3 flex items-center gap-2"><CalendarOff className="h-4 w-4 text-primary" /><p className="text-sm font-medium">კალენდრის გამონაკლისები</p></div>{!data?.length ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">კალენდრის გამონაკლისი ჯერ არ არის დამატებული.</p> : <div className="space-y-2">{data.map(item => <div key={item.exception.id} className="flex items-center justify-between gap-3 rounded-xl border p-3"><div><p className="font-medium">{item.profile?.publicDisplayName ?? item.location?.name ?? "ორგანიზაციის ბლოკი"}</p><p className="text-sm text-muted-foreground">{exceptionTypeLabel[item.exception.type]} · {formatScheduleDate(item.exception.startsAt)}–{formatScheduleDate(item.exception.endsAt)}</p></div><div className="flex"><Button variant="ghost" size="icon" aria-label="კალენდრის ბლოკის შეცვლა" onClick={() => onEdit(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" aria-label="კალენდრის ბლოკის წაშლა" onClick={() => onDelete(item.exception.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div></div>)}</div>}</section>; }
export function StaffPerformancePanel({ isLoading, isError, data }: { isLoading: boolean; isError: boolean; data?: Array<{ profile: { id: string; publicDisplayName: string }; metrics: { completedAppointments: number; serviceVolume: number; bookedRevenueTetri: number } }> }) { return <Card><CardHeader><CardTitle>ბოლო 30 დღის სპეციალისტების სიგნალები</CardTitle></CardHeader><CardContent>{isLoading ? <p className="text-sm text-muted-foreground">მონაცემები იტვირთება…</p> : null}{isError ? <p className="text-sm text-destructive">სპეციალისტების მაჩვენებლები ვერ ჩაიტვირთა.</p> : null}{!isLoading && !isError ? <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">{data?.map(item => <div key={item.profile.id} className="rounded-xl border bg-muted/15 p-4"><p className="font-medium">{item.profile.publicDisplayName}</p><div className="mt-3 grid grid-cols-3 gap-2 text-center"><Signal label="დასრულებული" value={String(item.metrics.completedAppointments)} /><Signal label="მომსახურება" value={String(item.metrics.serviceVolume)} /><Signal label="ჯავშნები" value={formatGEL(item.metrics.bookedRevenueTetri)} /></div></div>)}{!data?.length ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">არჩეულ პერიოდში სპეციალისტის მონაცემი ჯერ არ არის.</p> : null}</div> : null}</CardContent></Card>; }
function ProfileDialog({ open, setOpen, submit, displayName, setDisplayName, jobTitle, setJobTitle, locations, selected, setSelected, error, pending }: any) { const toggle = (id: string) => setSelected((current: string[]) => current.includes(id) ? current.filter(value => value !== id) : [...current, id]); return <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>ჩემი სპეციალისტის პროფილი</DialogTitle><DialogDescription>პროფილი უკავშირდება თქვენს მიმდინარე წევრობას.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><Field label="საჯარო სახელი"><Input value={displayName} onChange={event => setDisplayName(event.target.value)} minLength={2} required /></Field><Field label="როლი ან სპეციალიზაცია"><Input value={jobTitle} onChange={event => setJobTitle(event.target.value)} /></Field><fieldset className="space-y-2"><legend className="text-sm font-medium">ფილიალები</legend>{locations.map((location: any) => <label key={location.id} className="flex items-center gap-2 rounded-lg border p-2"><input type="checkbox" checked={selected.includes(location.id)} onChange={() => toggle(location.id)} />{location.name}</label>)}</fieldset>{error ? <p className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="submit" disabled={pending}>{pending ? "ინახება…" : "პროფილის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>; }

const memberColorPresets = ["#ec4899", "#7c3aed", "#12b5a6", "#f59e0b", "#0ea472", "#2fa8f0", "#e05ac9", "#f97316"];
function MemberDialog({ open, setOpen, submit, fullName, setFullName, displayName, setDisplayName, jobTitle, setJobTitle, role, setRole, color, setColor, locations, selected, setSelected, imageDataUrl, setImageDataUrl, altTextKa, setAltTextKa, onChooseAvatar, error, pending }: any) {
  const toggle = (id: string) => setSelected((current: string[]) => role === "STAFF" ? [id] : current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const onRoleChange = (value: "MANAGER" | "RECEPTIONIST" | "STAFF") => { setRole(value); if (value === "STAFF") setSelected((current: string[]) => current.slice(0, 1)); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>ახალი გუნდის წევრი</DialogTitle><DialogDescription>მხოლოდ მფლობელი ქმნის ანგარიშს. SalonFlow ავტომატურად გასცემს უნიკალურ შესვლის ID-სა და საწყის პაროლს.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="სრული სახელი *"><Input value={fullName} onChange={event => { setFullName(event.target.value); if (!displayName) setDisplayName(event.target.value); }} placeholder="მაგ. ნინო ბერიძე" required minLength={2} /></Field><Field label="საჯარო სახელი *"><Input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="ჩაწერაში გამოსაჩენი სახელი" required minLength={2} /></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="როლი"><Select value={role} onValueChange={value => onRoleChange(value as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STAFF">სპეციალისტი</SelectItem><SelectItem value="RECEPTIONIST">ადმინისტრატორი</SelectItem><SelectItem value="MANAGER">მენეჯერი</SelectItem></SelectContent></Select></Field><Field label="სპეციალიზაცია"><Input value={jobTitle} onChange={event => setJobTitle(event.target.value)} placeholder="მაგ. სტილისტი / კოლორისტი" /></Field></div><Field label="პროფილის ავატარი"><div className="flex flex-wrap items-center gap-3"><div className="flex size-14 items-center justify-center overflow-hidden rounded-2xl border bg-muted/30 text-xs text-muted-foreground">{imageDataUrl ? <img src={imageDataUrl} alt={altTextKa || "ავატარის preview"} className="size-full object-cover" /> : "ფოტო"}</div><label className="inline-flex"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => { void onChooseAvatar(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} /><Button type="button" variant="outline" size="sm" asChild><span><ImagePlus className="mr-1.5 h-3.5 w-3.5" />ფოტოს არჩევა</span></Button></label>{imageDataUrl ? <Button type="button" variant="ghost" size="sm" onClick={() => setImageDataUrl("")}>წაშლა</Button> : null}</div><Input className="mt-2" value={altTextKa} onChange={event => setAltTextKa(event.target.value)} placeholder="ფოტოს აღწერა ქართულად (არასავალდებულო)" maxLength={255} /></Field><Field label="ფერი კალენდარში"><div className="flex flex-wrap gap-2">{memberColorPresets.map(preset => <button key={preset} type="button" aria-label={`ფერი ${preset}`} aria-pressed={color === preset} onClick={() => setColor(preset)} className={`size-8 rounded-full transition ${color === preset ? "ring-2 ring-offset-2 ring-primary" : "hover:scale-110"}`} style={{ background: preset }} />)}</div></Field><fieldset className="space-y-2"><legend className="text-sm font-medium">{role === "STAFF" ? "ფილიალი * (ზუსტად ერთი)" : "ფილიალები *"}</legend>{locations.length ? locations.map((location: any) => <label key={location.id} className="flex items-center gap-2 rounded-lg border p-2 hover:bg-muted/40 cursor-pointer"><input type={role === "STAFF" ? "radio" : "checkbox"} name={role === "STAFF" ? "specialist-location" : undefined} checked={selected.includes(location.id)} onChange={() => toggle(location.id)} className="accent-primary" />{location.name}</label>) : <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">ჯერ არ არის აქტიური ფილიალი.</p>}</fieldset><div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">შესვლის ID და საწყისი პაროლი გენერირდება საიტზე და გამოჩნდება მხოლოდ შექმნის დასრულების შემდეგ. შეინახეთ და უსაფრთხოდ გადაეცით თანამშრომელს.</div>{error ? <p className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="submit" disabled={pending}>{pending ? "ინახება…" : "წევრის დამატება და მონაცემების გაცემა"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function IssuedCredentialsDialog({ credentials, onClose }: { credentials: { loginId: string; temporaryPassword: string; fullName: string } | null; onClose: () => void }) {
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); toast.success("დაკოპირებულია."); } catch { toast.error("დაკოპირება ვერ მოხერხდა."); } };
  return <Dialog open={Boolean(credentials)} onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>შესვლის მონაცემები — შეინახეთ ახლა</DialogTitle><DialogDescription>{credentials?.fullName}–სთვის ეს მონაცემები მხოლოდ ერთხელ გამოჩნდება. SalonFlow მათ plain text-ად აღარ ინახავს.</DialogDescription></DialogHeader><div className="space-y-3"><CredentialRow label="შესვლის ID" value={credentials?.loginId ?? ""} onCopy={copy} /><CredentialRow label="საწყისი პაროლი" value={credentials?.temporaryPassword ?? ""} onCopy={copy} /></div><DialogFooter><Button onClick={onClose}>შევინახე</Button></DialogFooter></DialogContent></Dialog>;
}

function CredentialRow({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string) => void }) { return <div className="rounded-xl border bg-muted/20 p-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><div className="mt-1 flex items-center justify-between gap-2"><code className="break-all text-sm font-semibold">{value}</code><Button type="button" variant="outline" size="sm" onClick={() => onCopy(value)}><Copy className="mr-1 h-3.5 w-3.5" />კოპირება</Button></div></div>; }
function HoursDialog({ open, setOpen, editing, locations, locationId, setLocationId, weekday, setWeekday, start, setStart, end, setEnd, submit, error, pending }: any) { return <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "სამუშაო საათების შეცვლა" : "სამუშაო საათების დამატება"}</DialogTitle><DialogDescription>ცვლილება მოქმედებს მხოლოდ აქტიურ ფილიალში მინიჭებულ სპეციალისტზე.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><Field label="ფილიალი"><Select value={locationId} onValueChange={setLocationId}><SelectTrigger><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.map((location: any) => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></Field><Field label="დღე"><Select value={weekday} onValueChange={setWeekday}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(weekdayLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="დაწყება"><Input type="time" value={start} onChange={event => setStart(event.target.value)} required /></Field><Field label="დასრულება"><Input type="time" value={end} onChange={event => setEnd(event.target.value)} required /></Field></div>{error ? <p className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="submit" disabled={pending}>{pending ? "ინახება…" : editing ? "ცვლილების შენახვა" : "საათების შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>; }
function ExceptionDialog({ open, setOpen, editing, staff, locations, profileId, setProfileId, locationId, setLocationId, type, setType, starts, setStarts, ends, setEnds, reason, setReason, submit, error, pending }: any) { return <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "კალენდრის ბლოკის შეცვლა" : "კალენდრის გამონაკლისი"}</DialogTitle><DialogDescription>შვებულება, ავადმყოფობა ან ინდივიდუალური სამუშაო ბლოკი.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="სპეციალისტი"><Select value={profileId} onValueChange={setProfileId}><SelectTrigger><SelectValue placeholder="აირჩიეთ სპეციალისტი" /></SelectTrigger><SelectContent>{staff.map((item: any) => <SelectItem key={item.profile.id} value={item.profile.id}>{item.profile.publicDisplayName}</SelectItem>)}</SelectContent></Select></Field><Field label="ფილიალი"><Select value={locationId} onValueChange={setLocationId}><SelectTrigger><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.map((location: any) => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></Field></div><Field label="ტიპი"><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VACATION">შვებულება</SelectItem><SelectItem value="SICK_LEAVE">ავადმყოფობა</SelectItem><SelectItem value="CUSTOM_BLOCK">ინდივიდუალური ბლოკი</SelectItem></SelectContent></Select></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="დაწყება"><Input type="datetime-local" value={starts} onChange={event => setStarts(event.target.value)} required /></Field><Field label="დასრულება"><Input type="datetime-local" value={ends} onChange={event => setEnds(event.target.value)} required /></Field></div><Field label="მიზეზი"><Input value={reason} onChange={event => setReason(event.target.value)} /></Field>{error ? <p className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="submit" disabled={pending}>{pending ? "ინახება…" : editing ? "ცვლილების შენახვა" : "გამონაკლისის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>; }
function InviteDialog({ open, setOpen, submit, email, setEmail, displayName, setDisplayName, jobTitle, setJobTitle, role, setRole, color, setColor, locations, locationId, setLocationId, error, pending, result, onCopy, copied }: any) {
  const showForm = !result;
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{result ? "მოწვევა მზადაა" : "მოწვევის გაგზავნა"}</DialogTitle><DialogDescription>{result ? "გააზიარეთ ბმული — მოწვეული სპეციალისტი დააყენებს პაროლს და ავტომატურად შემოვა თქვენს გუნდში." : "შექმენით ერთჯერადი ბმული, რომელიც მოწვეულს პაროლის დაყენებით უსაფრთხოდ ჩართავს გუნდში."}</DialogDescription></DialogHeader>
  {showForm ? <form onSubmit={submit} className="space-y-4">
    <Field label="ელფოსტა *"><Input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="staff@example.com" required autoComplete="off" /></Field>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="საჯარო სახელი"><Input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="ჩაწერაში გამოსაჩენი სახელი" /></Field><Field label="სპეციალიზაცია"><Input value={jobTitle} onChange={event => setJobTitle(event.target.value)} placeholder="მაგ. სტილისტი" /></Field></div>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="როლი"><Select value={role} onValueChange={value => setRole(value as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STAFF">სპეციალისტი</SelectItem><SelectItem value="RECEPTIONIST">ადმინისტრატორი</SelectItem><SelectItem value="MANAGER">მენეჯერი</SelectItem></SelectContent></Select></Field>{locations.length ? <Field label="ფილიალი"><Select value={locationId} onValueChange={setLocationId}><SelectTrigger><SelectValue placeholder="ყველა (არ არჩეულა)" /></SelectTrigger><SelectContent>{locations.map((location: any) => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></Field> : null}</div>
    <Field label="ფერი კალენდარში"><div className="flex flex-wrap gap-2">{memberColorPresets.map(preset => <button key={preset} type="button" aria-label={`ფერი ${preset}`} aria-pressed={color === preset} onClick={() => setColor(preset)} className={`size-8 rounded-full transition ${color === preset ? "ring-2 ring-offset-2 ring-primary" : "hover:scale-110"}`} style={{ background: preset }} />)}</div></Field>
    {error ? <p className="text-sm text-destructive">{error}</p> : null}
    <DialogFooter><Button type="submit" disabled={pending}><Send className="mr-2 h-4 w-4" />{pending ? "იქმნება…" : "მოწვევის შექმნა"}</Button></DialogFooter>
  </form> : <div className="space-y-4">
    <div className="rounded-xl border border-primary/25 bg-primary/5 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">მოწვევის ბმული</p><div className="mt-2 flex items-center gap-2"><Link2 className="h-4 w-4 shrink-0 text-primary" /><code className="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2 text-xs">{typeof window !== "undefined" ? window.location.origin : ""}{result.acceptUrl}</code><Button type="button" variant="outline" size="sm" onClick={onCopy}>{copied ? <><Check className="mr-1 h-3.5 w-3.5" />დაკოპირდა</> : <><Copy className="mr-1 h-3.5 w-3.5" />კოპირება</>}</Button></div></div>
    <p className="text-xs text-muted-foreground">ბმულის ვადა: {new Intl.DateTimeFormat("ka-GE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(result.expiresAt))}</p>
    <DialogFooter><Button type="button" onClick={() => setOpen(false)}>დახურვა</Button></DialogFooter>
  </div>}
  </DialogContent></Dialog>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Metric({ icon: Icon, label, value, hint }: { icon: typeof UsersRound; label: string; value: string; hint: string }) { return <Card><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-3 text-xs text-muted-foreground">{hint}</p></CardContent></Card>; }
function StateCard({ text, error = false }: { text: string; error?: boolean }) { return <Card className={error ? "border-destructive/30 bg-destructive/5" : ""}><CardContent className={`p-8 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{text}</CardContent></Card>; }
function Signal({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] leading-3 text-muted-foreground">{label}</p><p className="mt-1 text-xs font-semibold">{value}</p></div>; }
function formatGEL(tetri: number) { return formatGelTetri(tetri); }
function formatScheduleDate(value: Date) { return new Intl.DateTimeFormat("ka-GE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)); }
function toDateTimeLocal(value: Date) { const date = new Date(value); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 16); }
