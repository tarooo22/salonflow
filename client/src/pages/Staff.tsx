import React, { FormEvent, useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { fileToImageDataUrl } from "@/lib/imageUpload";
import { formatGelTetri, formatKaDate, formatKaDateTime } from "@/lib/presentation";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { localInputToUtc, utcToLocalInput } from "@shared/timezones";
import { CalendarOff, Check, Clock3, Copy, ImagePlus, Link2, Pencil, Plus, Send, Trash2, X } from "lucide-react";
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
  const isStaff = organizationEntry?.membership.role === "STAFF";
  const staff = trpc.staff.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const scheduleInput = { organizationId: organization?.id ?? "" };
  const workingHours = trpc.staff.listWorkingHours.useQuery(scheduleInput, { enabled: Boolean(organization?.id && isOwner) });
  const exceptions = trpc.staff.listScheduleExceptions.useQuery(scheduleInput, { enabled: Boolean(organization?.id && isOwner) });
  const performanceInput = useMemo(() => { const endsAt = new Date(); const startsAt = new Date(endsAt); startsAt.setUTCDate(startsAt.getUTCDate() - 30); return { organizationId: organization?.id ?? "", startsAt, endsAt }; }, [organization?.id]);
  const performance = trpc.staff.performance.useQuery(performanceInput, { enabled: Boolean(organization?.id && isOwner) });
  const hasOwnProfile = Boolean(staff.data?.some(item => item.membership.id === organizationEntry?.membership.id));
  const ownProfile = staff.data?.find(item => item.membership.id === organizationEntry?.membership.id);

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
  const [selfProfileId, setSelfProfileId] = useState("");
  const [selfDisplayName, setSelfDisplayName] = useState("");
  const [selfPublicBio, setSelfPublicBio] = useState("");
  const [selfJobTitle, setSelfJobTitle] = useState("");
  const [selfSpecialty, setSelfSpecialty] = useState("");
  const [selfExperienceYears, setSelfExperienceYears] = useState("");
  const [selfAvatarAltKa, setSelfAvatarAltKa] = useState("");
  const [selfProfileError, setSelfProfileError] = useState("");
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
  const updateSelfProfile = trpc.staff.updateSelfProfile.useMutation({
    onSuccess: async () => { await utils.staff.list.invalidate(); setSelfProfileError(""); toast.success("ჩემი პროფილი განახლდა."); },
    onError: error => setSelfProfileError(error.message || "პროფილის განახლება ვერ მოხერხდა."),
  });
  const updateSelfAvatar = trpc.media.updateSelfAvatar.useMutation({
    onSuccess: async () => { await utils.staff.list.invalidate(); setSelfProfileError(""); toast.success("ავატარი განახლდა."); },
    onError: error => setSelfProfileError(error.message || "ავატარის ატვირთვა ვერ მოხერხდა."),
  });
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

  useEffect(() => {
    if (!isStaff || !ownProfile || ownProfile.profile.id === selfProfileId) return;
    setSelfProfileId(ownProfile.profile.id);
    setSelfDisplayName(ownProfile.profile.publicDisplayName);
    setSelfPublicBio(ownProfile.profile.publicBio ?? "");
    setSelfJobTitle(ownProfile.profile.jobTitle ?? "");
    setSelfSpecialty(ownProfile.profile.specialty ?? "");
    setSelfExperienceYears(ownProfile.profile.experienceYears === null || ownProfile.profile.experienceYears === undefined ? "" : String(ownProfile.profile.experienceYears));
    setSelfAvatarAltKa(ownProfile.profile.avatarAltKa ?? `${ownProfile.profile.publicDisplayName} — პროფილის ფოტო`);
    setSelfProfileError("");
  }, [isStaff, ownProfile, selfProfileId]);

  const openHoursCreate = (staffProfileId: string) => { setHoursEditingId(undefined); setHoursProfileId(staffProfileId); setHoursLocationId(""); setHoursWeekday("0"); setHoursStart("09:00"); setHoursEnd("18:00"); setHoursError(""); setHoursOpen(true); };
  const openHoursEdit = (item: NonNullable<typeof workingHours.data>[number]) => { setHoursEditingId(item.rule.id); setHoursProfileId(item.rule.staffProfileId); setHoursLocationId(item.rule.locationId); setHoursWeekday(String(item.rule.weekday)); setHoursStart(item.rule.startLocalTime.slice(0, 5)); setHoursEnd(item.rule.endLocalTime.slice(0, 5)); setHoursError(""); setHoursOpen(true); };
  const openExceptionCreate = () => { setExceptionEditingId(undefined); setExceptionProfileId(""); setExceptionLocationId(""); setExceptionType("VACATION"); setExceptionStartsAt(""); setExceptionEndsAt(""); setExceptionReason(""); setExceptionError(""); setExceptionOpen(true); };
  // Exception times are wall-clock times at the chosen location, not in the browser's time zone.
  const locationTimeZone = (locationId?: string | null) => locations.data?.find(location => location.id === locationId)?.timezone ?? "Asia/Tbilisi";
  const openExceptionEdit = (item: NonNullable<typeof exceptions.data>[number]) => { setExceptionEditingId(item.exception.id); setExceptionProfileId(item.exception.staffProfileId ?? ""); setExceptionLocationId(item.exception.locationId ?? ""); setExceptionType(item.exception.type as ExceptionType); const timeZone = locationTimeZone(item.exception.locationId); setExceptionStartsAt(utcToLocalInput(new Date(item.exception.startsAt), timeZone)); setExceptionEndsAt(utcToLocalInput(new Date(item.exception.endsAt), timeZone)); setExceptionReason(item.exception.reason ?? ""); setExceptionError(""); setExceptionOpen(true); };
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
  const submitSelfProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !ownProfile) return;
    const experienceYears = selfExperienceYears === "" ? null : Number(selfExperienceYears);
    if (!Number.isInteger(experienceYears ?? 0) || (experienceYears !== null && (experienceYears < 0 || experienceYears > 80))) { setSelfProfileError("გამოცდილება მიუთითეთ 0-დან 80 წლამდე მთელი რიცხვით."); return; }
    setSelfProfileError("");
    updateSelfProfile.mutate({ organizationId: organization.id, staffProfileId: ownProfile.profile.id, publicDisplayName: selfDisplayName, publicBio: selfPublicBio || null, jobTitle: selfJobTitle || null, specialty: selfSpecialty || null, experienceYears, avatarAltKa: selfAvatarAltKa || null });
  };
  const chooseSelfAvatar = async (file: File | null) => {
    if (!organization || !ownProfile || !file) return;
    try {
      setSelfProfileError("");
      const imageDataUrl = await fileToImageDataUrl(file);
      const altTextKa = selfAvatarAltKa.trim() || `${selfDisplayName || ownProfile.profile.publicDisplayName} — პროფილის ფოტო`;
      await updateSelfAvatar.mutateAsync({ organizationId: organization.id, staffProfileId: ownProfile.profile.id, imageDataUrl, altTextKa });
      setSelfAvatarAltKa(altTextKa);
    } catch (error) { setSelfProfileError(error instanceof Error ? error.message : "ავატარის ატვირთვა ვერ მოხერხდა."); }
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
  const submitException = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!organization || !exceptionProfileId || !exceptionLocationId || !exceptionStartsAt || !exceptionEndsAt) { setExceptionError("აირჩიეთ სპეციალისტი, ფილიალი და დროის დიაპაზონი."); return; } const timeZone = locationTimeZone(exceptionLocationId); const startsAt = localInputToUtc(exceptionStartsAt, timeZone); const endsAt = localInputToUtc(exceptionEndsAt, timeZone); if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) { setExceptionError("დასრულება დაწყებაზე გვიან უნდა იყოს."); return; } const input = { organizationId: organization.id, staffProfileId: exceptionProfileId, locationId: exceptionLocationId, type: exceptionType, startsAt, endsAt, fullDay: false, reason: exceptionReason || undefined }; if (exceptionEditingId) updateScheduleException.mutate({ ...input, id: exceptionEditingId }); else addScheduleException.mutate(input); };

  return <DashboardLayout><div className="sf-workspace-page mx-auto min-w-0 w-full max-w-7xl space-y-6">
    <WorkspacePageHeader title="გუნდი" actions={<>{organization && isOwner ? <Button variant="outline" onClick={openInviteDialog}><Send className="mr-2 h-4 w-4" aria-hidden="true" />მოწვევა</Button> : null}{organization && isOwner ? <Button onClick={openMemberDialog}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />გუნდის წევრი</Button> : null}</>} moreActions={organization && isOwner && (staff.data?.length || !hasOwnProfile) ? <>{staff.data?.length ? <DropdownMenuItem onSelect={openExceptionCreate}>კალენდრის ბლოკი</DropdownMenuItem> : null}{!hasOwnProfile ? <DropdownMenuItem onSelect={() => setProfileOpen(true)}>ჩემი პროფილი</DropdownMenuItem> : null}</> : undefined} />
    {organizations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}{organizations.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void organizations.refetch(); }}>თავიდან ცდა</Button>} /> : null}{!organizations.isLoading && !organizations.isError && !organization ? <WorkspaceState kind="empty" title="ჯერ შექმენით სამუშაო სივრცე" /> : null}
    {organization ? <>
      {isStaff && ownProfile ? <SelfProfileCard profile={ownProfile.profile} locations={locations.data ?? []} displayName={selfDisplayName} setDisplayName={setSelfDisplayName} publicBio={selfPublicBio} setPublicBio={setSelfPublicBio} jobTitle={selfJobTitle} setJobTitle={setSelfJobTitle} specialty={selfSpecialty} setSpecialty={setSelfSpecialty} experienceYears={selfExperienceYears} setExperienceYears={setSelfExperienceYears} avatarAltKa={selfAvatarAltKa} setAvatarAltKa={setSelfAvatarAltKa} error={selfProfileError} onSubmit={submitSelfProfile} onChooseAvatar={chooseSelfAvatar} saving={updateSelfProfile.isPending} uploading={updateSelfAvatar.isPending} /> : null}
      <WorkspaceSection title={isOwner ? "აქტიური გუნდი" : "ჩემი პროფილი"} description={isOwner ? (staff.isLoading || locations.isLoading ? "სტატისტიკა: ბოლო 30 დღე" : `${staff.data?.length ?? 0} პროფილი · ${locations.data?.length ?? 0} ფილიალი · ონლაინ ხილული: ${staff.data?.filter(item => item.profile.onlineBookingVisible).length ?? 0} · სტატისტიკა: ბოლო 30 დღე`) : undefined}><div className="divide-y divide-border">{staff.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}{staff.isError ? <WorkspaceState kind="error" title="გუნდის სია ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void staff.refetch(); }}>თავიდან ცდა</Button>} /> : null}{!staff.isLoading && !staff.isError && !staff.data?.length ? <WorkspaceState kind="empty" title="სპეციალისტი ჯერ არ არის დამატებული" /> : null}{staff.data?.map(item => <div key={item.profile.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--sf-accent-soft)] text-sm font-semibold text-[var(--sf-accent-ink)]">{item.profile.avatarKey ? <img src={`/manus-storage/${item.profile.avatarKey}`} alt={item.profile.avatarAltKa || `${item.profile.publicDisplayName} — პროფილის ფოტო`} width={40} height={40} loading="lazy" className="size-full object-cover" /> : item.profile.publicDisplayName.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1 basis-48"><div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h3 className="truncate font-semibold">{item.profile.publicDisplayName}</h3><WorkspaceStatusPill tone="neutral">{roleLabel[item.membership.role] ?? item.membership.role}</WorkspaceStatusPill>{item.profile.onlineBookingVisible ? null : <WorkspaceStatusPill tone="neutral">ონლაინ დამალულია</WorkspaceStatusPill>}</div><p className="truncate text-sm text-muted-foreground">{item.profile.jobTitle || item.profile.specialty || "—"}</p></div>{isOwner ? (() => { const metrics = performance.data?.find(row => row.profile.id === item.profile.id)?.metrics; const cell = (value: string | number | undefined) => performance.isLoading ? "…" : value ?? "0"; return <dl className="grid grid-cols-3 gap-4 text-right"><div><dt className="text-[11px] text-muted-foreground">შესრულებული</dt><dd className="cwk-num text-sm font-semibold">{cell(metrics?.completedAppointments)}</dd></div><div><dt className="text-[11px] text-muted-foreground">სერვისები</dt><dd className="cwk-num text-sm font-semibold">{cell(metrics?.serviceVolume)}</dd></div><div><dt className="text-[11px] text-muted-foreground">თანხა</dt><dd className="cwk-num text-sm font-semibold">{performance.isLoading ? "…" : formatGEL(metrics?.bookedRevenueTetri ?? 0)}</dd></div></dl>; })() : null}{isOwner ? <label className="inline-flex rounded-lg has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--sf-focus)]"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={`${item.profile.publicDisplayName}: ფოტოს შეცვლა`} onChange={event => { void replaceStaffAvatar(item.profile.id, item.profile.publicDisplayName, event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} disabled={setStaffAvatar.isPending} /><Button type="button" variant="outline" size="sm" className="max-md:h-11" asChild disabled={setStaffAvatar.isPending}><span><ImagePlus className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />{setStaffAvatar.isPending ? "იტვირთება…" : "ფოტო"}</span></Button></label> : null}</div>)}</div></WorkspaceSection>
      {isOwner && invites.data?.length ? <WorkspaceSection title={`მოწვევები (${invites.data.length})`}><div className="space-y-2">{invites.data.map(invite => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div className="min-w-0"><p className="truncate font-medium">{invite.email}</p><p className="mt-0.5 text-xs text-muted-foreground">{roleLabel[invite.role]} · ვადა {formatKaDate(new Date(invite.expiresAt))}</p></div><Button variant="ghost" size="sm" className="max-md:h-11" onClick={() => organization && revokeInvite.mutate({ organizationId: organization.id, id: invite.id })} disabled={revokeInvite.isPending}><X className="mr-1 h-3.5 w-3.5" />გაუქმება</Button></div>)}</div></WorkspaceSection> : null}
      {isOwner ? <><WorkspaceSection title="განრიგი"><div className="space-y-6"><ScheduleRules query={workingHours} staff={staff.data ?? []} onEdit={openHoursEdit} onAdd={openHoursCreate} /><ScheduleExceptions query={exceptions} locationTimeZone={locationTimeZone} onEdit={openExceptionEdit} onDelete={id => organization && deleteException.mutate({ organizationId: organization.id, id })} /></div></WorkspaceSection></> : null}
    </> : null}
  </div><ProfileDialog open={profileOpen} setOpen={setProfileOpen} submit={submitProfile} displayName={displayName} setDisplayName={setDisplayName} jobTitle={jobTitle} setJobTitle={setJobTitle} locations={locations.data ?? []} selected={selectedLocationIds} setSelected={setSelectedLocationIds} error={formError} pending={createProfile.isPending} /><MemberDialog open={memberOpen} setOpen={setMemberOpen} submit={submitMember} fullName={memberFullName} setFullName={setMemberFullName} displayName={memberDisplayName} setDisplayName={setMemberDisplayName} jobTitle={memberJobTitle} setJobTitle={setMemberJobTitle} role={memberRole} setRole={setMemberRole} color={memberColor} setColor={setMemberColor} locations={locations.data ?? []} selected={memberLocationIds} setSelected={setMemberLocationIds} imageDataUrl={memberAvatarImageDataUrl} setImageDataUrl={setMemberAvatarImageDataUrl} altTextKa={memberAvatarAltKa} setAltTextKa={setMemberAvatarAltKa} onChooseAvatar={chooseMemberAvatar} error={memberError} pending={createMember.isPending || setStaffAvatar.isPending} /><HoursDialog open={hoursOpen} setOpen={setHoursOpen} editing={Boolean(hoursEditingId)} locations={locations.data ?? []} locationId={hoursLocationId} setLocationId={setHoursLocationId} weekday={hoursWeekday} setWeekday={setHoursWeekday} start={hoursStart} setStart={setHoursStart} end={hoursEnd} setEnd={setHoursEnd} submit={submitHours} error={hoursError} pending={addWorkingHours.isPending || updateWorkingHours.isPending} onDelete={() => { if (organization && hoursEditingId) { deleteWorkingHours.mutate({ organizationId: organization.id, id: hoursEditingId }); setHoursOpen(false); } }} deleting={deleteWorkingHours.isPending} /><ExceptionDialog open={exceptionOpen} setOpen={setExceptionOpen} editing={Boolean(exceptionEditingId)} staff={staff.data ?? []} locations={locations.data ?? []} profileId={exceptionProfileId} setProfileId={setExceptionProfileId} locationId={exceptionLocationId} setLocationId={setExceptionLocationId} type={exceptionType} setType={setExceptionType} starts={exceptionStartsAt} setStarts={setExceptionStartsAt} ends={exceptionEndsAt} setEnds={setExceptionEndsAt} reason={exceptionReason} setReason={setExceptionReason} submit={submitException} error={exceptionError} pending={addScheduleException.isPending || updateScheduleException.isPending} /><InviteDialog open={inviteOpen} setOpen={setInviteOpen} submit={submitInvite} email={inviteEmail} setEmail={setInviteEmail} displayName={inviteDisplayName} setDisplayName={setInviteDisplayName} jobTitle={inviteJobTitle} setJobTitle={setInviteJobTitle} role={inviteRole} setRole={setInviteRole} color={inviteColor} setColor={setInviteColor} locations={locations.data ?? []} locationId={inviteLocationId} setLocationId={setInviteLocationId} error={inviteError} pending={createInvite.isPending} result={inviteResult} onCopy={copyInviteLink} copied={linkCopied} /><IssuedCredentialsDialog credentials={issuedCredentials} onClose={() => setIssuedCredentials(null)} /></DashboardLayout>;
}

type ScheduleQuery = { data?: any[]; isLoading: boolean; isError: boolean; refetch: () => unknown };
const weekdayOrder = ["0", "1", "2", "3", "4", "5", "6"];
const weekdayShort: Record<string, string> = { "0": "ორშ", "1": "სამ", "2": "ოთხ", "3": "ხუთ", "4": "პარ", "5": "შაბ", "6": "კვი" };
function SubHead({ icon: Icon, title }: { icon: typeof Clock3; title: string }) { return <div className="mb-3 flex items-center gap-2"><Icon className="h-4 w-4 text-[var(--sf-accent-ink)]" aria-hidden="true" /><h3 className="text-sm font-semibold">{title}</h3></div>; }
function ScheduleRules({ query, staff, onEdit, onAdd }: { query: ScheduleQuery; staff: any[]; onEdit: (item: any) => void; onAdd: (staffProfileId: string) => void }) {
  const rules = query.data ?? [];
  return <section aria-label="სამუშაო საათები"><SubHead icon={Clock3} title="სამუშაო საათები" />
    {query.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
    {query.isError ? <WorkspaceState kind="error" title="სამუშაო საათები ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void query.refetch(); }}>თავიდან ცდა</Button>} /> : null}
    {!query.isLoading && !query.isError && !staff.length ? <WorkspaceState kind="empty" title="სამუშაო საათები ჯერ არ არის დამატებული" description="ჯერ დაამატეთ გუნდის წევრი." /> : null}
    {!query.isLoading && !query.isError && staff.length ? <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[44rem] text-left text-sm"><thead className="bg-[var(--sf-surface-2)] text-[13px] text-muted-foreground"><tr className="h-10"><th scope="col" className="sticky left-0 bg-[var(--sf-surface-2)] px-3 font-semibold">სპეციალისტი</th>{weekdayOrder.map(day => <th key={day} scope="col" className="px-2 text-center font-semibold" title={weekdayLabel[day]}>{weekdayShort[day]}</th>)}<th scope="col" className="px-2"><span className="sr-only">მოქმედება</span></th></tr></thead><tbody className="divide-y divide-border">{staff.map(item => <tr key={item.profile.id} className="align-top"><th scope="row" className="sticky left-0 bg-card px-3 py-2 text-left font-semibold">{item.profile.publicDisplayName}</th>{weekdayOrder.map(day => { const dayRules = rules.filter(rule => rule.rule.staffProfileId === item.profile.id && String(rule.rule.weekday) === day).sort((x, y) => String(x.rule.startLocalTime).localeCompare(String(y.rule.startLocalTime))); return <td key={day} className="px-1 py-1">{dayRules.length ? dayRules.map(rule => { const range = `${rule.rule.startLocalTime.slice(0, 5)}–${rule.rule.endLocalTime.slice(0, 5)}`; return <button key={rule.rule.id} type="button" onClick={() => onEdit(rule)} title={rule.location?.name} aria-label={`სამუშაო საათების შეცვლა: ${item.profile.publicDisplayName}, ${weekdayLabel[day]}, ${range}${rule.location?.name ? `, ${rule.location.name}` : ""}`} className="cwk-num block w-full whitespace-nowrap rounded-lg px-2 py-1.5 text-center hover:bg-[var(--sf-surface-2)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--sf-focus)] max-md:min-h-11">{range}</button>; }) : <span className="block px-2 py-1.5 text-center text-muted-foreground" aria-label="სამუშაო საათი არ არის">—</span>}</td>; })}<td className="px-1 py-1 text-right"><Button type="button" variant="ghost" size="icon-sm" aria-label={`${item.profile.publicDisplayName}: სამუშაო საათის დამატება`} onClick={() => onAdd(item.profile.id)}><Plus className="size-4" aria-hidden="true" /></Button></td></tr>)}</tbody></table></div> : null}
  </section>;
}
function ScheduleExceptions({ query, onEdit, onDelete, locationTimeZone }: { query: ScheduleQuery; locationTimeZone: (locationId?: string | null) => string; onEdit: (item: any) => void; onDelete: (id: string) => void }) {
  const data = query.data;
  return <section aria-label="კალენდრის გამონაკლისები"><SubHead icon={CalendarOff} title="კალენდრის გამონაკლისები" />
    {query.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
    {query.isError ? <WorkspaceState kind="error" title="გამონაკლისები ვერ ჩაიტვირთა" description="შეამოწმეთ კავშირი და სცადეთ ხელახლა." action={<Button variant="outline" onClick={() => { void query.refetch(); }}>თავიდან ცდა</Button>} /> : null}
    {!query.isLoading && !query.isError && !data?.length ? <WorkspaceState kind="empty" title="გამონაკლისი ჯერ არ არის დამატებული" /> : null}
    {data?.length ? <div className="divide-y divide-border rounded-xl border border-border">{data.map(item => { const who = item.profile?.publicDisplayName ?? item.location?.name ?? "სალონის ბლოკი"; return <div key={item.exception.id} className="flex items-center justify-between gap-3 px-3 py-2"><div className="min-w-0"><p className="font-medium">{who}</p><p className="text-sm text-muted-foreground">{exceptionTypeLabel[item.exception.type]} · <span className="cwk-num">{formatScheduleDate(item.exception.startsAt, locationTimeZone(item.exception.locationId))}–{formatScheduleDate(item.exception.endsAt, locationTimeZone(item.exception.locationId))}</span></p></div><div className="flex"><Button variant="ghost" size="icon" aria-label={`კალენდრის ბლოკის შეცვლა: ${who}`} onClick={() => onEdit(item)}><Pencil className="h-4 w-4" aria-hidden="true" /></Button><Button variant="ghost" size="icon" aria-label={`კალენდრის ბლოკის წაშლა: ${who}`} onClick={() => onDelete(item.exception.id)}><Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" /></Button></div></div>; })}</div> : null}
  </section>;
}
function ProfileDialog({ open, setOpen, submit, displayName, setDisplayName, jobTitle, setJobTitle, locations, selected, setSelected, error, pending }: any) { const toggle = (id: string) => setSelected((current: string[]) => current.includes(id) ? current.filter(value => value !== id) : [...current, id]); return <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>ჩემი სპეციალისტის პროფილი</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4"><Field label="საჯარო სახელი"><Input value={displayName} onChange={event => setDisplayName(event.target.value)} minLength={2} required /></Field><Field label="როლი ან სპეციალიზაცია"><Input value={jobTitle} onChange={event => setJobTitle(event.target.value)} /></Field><fieldset className="space-y-2"><legend className="text-sm font-medium">ფილიალები</legend>{locations.map((location: any) => <label key={location.id} className="flex items-center gap-2 rounded-md border p-2"><input type="checkbox" checked={selected.includes(location.id)} onChange={() => toggle(location.id)} />{location.name}</label>)}</fieldset>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="submit" disabled={pending}>{pending ? "ინახება…" : "პროფილის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>; }

function SelfProfileCard({ profile, locations, displayName, setDisplayName, publicBio, setPublicBio, jobTitle, setJobTitle, specialty, setSpecialty, experienceYears, setExperienceYears, avatarAltKa, setAvatarAltKa, error, onSubmit, onChooseAvatar, saving, uploading }: any) {
  return <WorkspaceSection title="ჩემი საჯარო პროფილი"><form onSubmit={onSubmit} className="space-y-5"><div className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center"><div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary/10 text-lg font-semibold text-primary">{profile.avatarKey ? <img src={`/manus-storage/${profile.avatarKey}`} alt={avatarAltKa || `${displayName} — პროფილის ფოტო`} className="size-full object-cover" /> : displayName.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><p className="font-medium">პროფილის ავატარი</p><p className="mt-1 text-sm text-muted-foreground">JPEG, PNG ან WebP, მაქს. 5 MB.</p><div className="mt-3 flex flex-wrap gap-2"><label className="inline-flex"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => { void onChooseAvatar(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} disabled={uploading} /><Button type="button" variant="outline" size="sm" className="max-md:h-11" asChild disabled={uploading}><span><ImagePlus className="mr-1.5 size-3.5" />{uploading ? "იტვირთება…" : "ფოტოს არჩევა"}</span></Button></label></div></div></div><Field label="ფოტოს აღწერა ქართულად"><Input value={avatarAltKa} onChange={event => setAvatarAltKa(event.target.value)} maxLength={255} placeholder="მაგ. ნინო ბერიძის პროფესიული პორტრეტი" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="საჯარო სახელი *"><Input value={displayName} onChange={event => setDisplayName(event.target.value)} minLength={2} maxLength={160} required /></Field><Field label="თანამდებობა"><Input value={jobTitle} onChange={event => setJobTitle(event.target.value)} maxLength={160} placeholder="მაგ. წამყვანი სტილისტი" /></Field><Field label="სპეციალიზაცია"><Input value={specialty} onChange={event => setSpecialty(event.target.value)} maxLength={255} placeholder="მაგ. კოლორისტიკა და ბალაიაჟი" /></Field><Field label="გამოცდილება (წლები)"><Input type="number" min="0" max="80" step="1" inputMode="numeric" value={experienceYears} onChange={event => setExperienceYears(event.target.value)} placeholder="მაგ. 6" /></Field></div><Field label="საჯარო აღწერა"><Textarea value={publicBio} onChange={event => setPublicBio(event.target.value)} maxLength={2000} rows={5} placeholder="მოკლედ აღწერეთ თქვენი გამოცდილება, მიდგომა და სპეციალიზაცია…" /><p className="text-right text-xs text-muted-foreground">{publicBio.length}/2000</p></Field><p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">ფილიალს, როლს და ონლაინ ხილვადობას მხოლოდ მფლობელი ცვლის. ახლა: {locations.map((location: any) => location.name).join(", ") || "ფილიალი არ არის"} · ონლაინ {profile.onlineBookingVisible ? "ჩანს" : "დამალულია"}.</p>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<div className="flex justify-end"><Button type="submit" disabled={saving || uploading}>{saving ? "ინახება…" : "ჩემი პროფილის შენახვა"}</Button></div></form></WorkspaceSection>;
}

function ColorSwatches({ color, setColor }: { color: string; setColor: (value: string) => void }) {
  return <div className="flex flex-wrap gap-1">{memberColorPresets.map(preset => <button key={preset} type="button" aria-label={`ფერი ${preset}`} aria-pressed={color === preset} onClick={() => setColor(preset)} className="grid size-11 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--sf-focus)] md:size-9"><span className={`size-8 rounded-full transition md:size-7 ${color === preset ? "ring-2 ring-offset-2 ring-[var(--sf-accent-ink)]" : ""}`} style={{ background: preset }} /></button>)}</div>;
}
const memberColorPresets = ["#ec4899", "#7c3aed", "#12b5a6", "#f59e0b", "#0ea472", "#2fa8f0", "#e05ac9", "#f97316"];
function MemberDialog({ open, setOpen, submit, fullName, setFullName, displayName, setDisplayName, jobTitle, setJobTitle, role, setRole, color, setColor, locations, selected, setSelected, imageDataUrl, setImageDataUrl, altTextKa, setAltTextKa, onChooseAvatar, error, pending }: any) {
  const toggle = (id: string) => setSelected((current: string[]) => role === "STAFF" ? [id] : current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  const onRoleChange = (value: "MANAGER" | "RECEPTIONIST" | "STAFF") => { setRole(value); if (value === "STAFF") setSelected((current: string[]) => current.slice(0, 1)); };
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>ახალი გუნდის წევრი</DialogTitle><DialogDescription>სისტემა გასცემს შესვლის ID-ს და საწყის პაროლს.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="სრული სახელი *"><Input value={fullName} onChange={event => { setFullName(event.target.value); if (!displayName) setDisplayName(event.target.value); }} placeholder="მაგ. ნინო ბერიძე" required minLength={2} /></Field><Field label="საჯარო სახელი *"><Input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="ჩაწერაში გამოსაჩენი სახელი" required minLength={2} /></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="როლი"><Select value={role} onValueChange={value => onRoleChange(value as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STAFF">სპეციალისტი</SelectItem><SelectItem value="RECEPTIONIST">ადმინისტრატორი</SelectItem><SelectItem value="MANAGER">მენეჯერი</SelectItem></SelectContent></Select></Field><Field label="სპეციალიზაცია"><Input value={jobTitle} onChange={event => setJobTitle(event.target.value)} placeholder="მაგ. სტილისტი / კოლორისტი" /></Field></div><Field group label="პროფილის ავატარი"><div className="flex flex-wrap items-center gap-3"><div className="flex size-14 items-center justify-center overflow-hidden rounded-md border bg-muted/30 text-xs text-muted-foreground">{imageDataUrl ? <img src={imageDataUrl} alt={altTextKa || "ფოტოს გადახედვა"} className="size-full object-cover" /> : "ფოტო"}</div><label className="inline-flex"><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={event => { void onChooseAvatar(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} /><Button type="button" variant="outline" size="sm" className="max-md:h-11" asChild><span><ImagePlus className="mr-1.5 h-3.5 w-3.5" />ფოტოს არჩევა</span></Button></label>{imageDataUrl ? <Button type="button" variant="ghost" size="sm" className="max-md:h-11" onClick={() => setImageDataUrl("")}>წაშლა</Button> : null}</div><Input className="mt-2" value={altTextKa} onChange={event => setAltTextKa(event.target.value)} placeholder="ფოტოს აღწერა ქართულად (არასავალდებულო)" maxLength={255} /></Field><Field group label="ფერი კალენდარში"><ColorSwatches color={color} setColor={setColor} /></Field><fieldset className="space-y-2"><legend className="text-sm font-medium">{role === "STAFF" ? "ფილიალი * (ზუსტად ერთი)" : "ფილიალები *"}</legend>{locations.length ? locations.map((location: any) => <label key={location.id} className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted/40 cursor-pointer"><input type={role === "STAFF" ? "radio" : "checkbox"} name={role === "STAFF" ? "specialist-location" : undefined} checked={selected.includes(location.id)} onChange={() => toggle(location.id)} className="accent-primary" />{location.name}</label>) : <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">ჯერ არ არის აქტიური ფილიალი.</p>}</fieldset><p className="text-sm text-muted-foreground">შესვლის მონაცემები ერთხელ გამოჩნდება შექმნის შემდეგ.</p>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="submit" disabled={pending}>{pending ? "ინახება…" : "დამატება"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function IssuedCredentialsDialog({ credentials, onClose }: { credentials: { loginId: string; temporaryPassword: string; fullName: string } | null; onClose: () => void }) {
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); toast.success("დაკოპირებულია."); } catch { toast.error("დაკოპირება ვერ მოხერხდა."); } };
  return <Dialog open={Boolean(credentials)} onOpenChange={open => { if (!open) onClose(); }}><DialogContent><DialogHeader><DialogTitle>შესვლის მონაცემები — შეინახეთ ახლა</DialogTitle><DialogDescription>{credentials?.fullName}: მონაცემები მხოლოდ ერთხელ ჩანს.</DialogDescription></DialogHeader><div className="space-y-3"><CredentialRow label="შესვლის ID" value={credentials?.loginId ?? ""} onCopy={copy} /><CredentialRow label="საწყისი პაროლი" value={credentials?.temporaryPassword ?? ""} onCopy={copy} /></div><DialogFooter><Button onClick={onClose}>შევინახე</Button></DialogFooter></DialogContent></Dialog>;
}

function CredentialRow({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string) => void }) { return <div className="rounded-md border bg-muted/20 p-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><div className="mt-1 flex items-center justify-between gap-2"><code className="break-all text-sm font-semibold">{value}</code><Button type="button" variant="outline" size="sm" className="max-md:h-11" onClick={() => onCopy(value)}><Copy className="mr-1 h-3.5 w-3.5" />კოპირება</Button></div></div>; }
function HoursDialog({ open, setOpen, editing, locations, locationId, setLocationId, weekday, setWeekday, start, setStart, end, setEnd, submit, error, pending, onDelete, deleting }: any) { return <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "სამუშაო საათების შეცვლა" : "სამუშაო საათების დამატება"}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4"><Field label="ფილიალი"><Select value={locationId} onValueChange={setLocationId}><SelectTrigger><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.map((location: any) => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></Field><Field label="დღე"><Select value={weekday} onValueChange={setWeekday}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(weekdayLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="დაწყება"><Input type="time" value={start} onChange={event => setStart(event.target.value)} required /></Field><Field label="დასრულება"><Input type="time" value={end} onChange={event => setEnd(event.target.value)} required /></Field></div>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<DialogFooter>{editing ? <Button type="button" variant="destructive" disabled={deleting || pending} onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />წაშლა</Button> : null}<Button type="submit" disabled={pending}>{pending ? "ინახება…" : editing ? "ცვლილების შენახვა" : "საათების შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>; }
function ExceptionDialog({ open, setOpen, editing, staff, locations, profileId, setProfileId, locationId, setLocationId, type, setType, starts, setStarts, ends, setEnds, reason, setReason, submit, error, pending }: any) { return <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "კალენდრის ბლოკის შეცვლა" : "კალენდრის გამონაკლისი"}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="სპეციალისტი"><Select value={profileId} onValueChange={setProfileId}><SelectTrigger><SelectValue placeholder="აირჩიეთ სპეციალისტი" /></SelectTrigger><SelectContent>{staff.map((item: any) => <SelectItem key={item.profile.id} value={item.profile.id}>{item.profile.publicDisplayName}</SelectItem>)}</SelectContent></Select></Field><Field label="ფილიალი"><Select value={locationId} onValueChange={setLocationId}><SelectTrigger><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.map((location: any) => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></Field></div><Field label="ტიპი"><Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VACATION">შვებულება</SelectItem><SelectItem value="SICK_LEAVE">ავადმყოფობა</SelectItem><SelectItem value="CUSTOM_BLOCK">ინდივიდუალური ბლოკი</SelectItem></SelectContent></Select></Field><div className="grid gap-3 sm:grid-cols-2"><Field label="დაწყება"><Input type="datetime-local" value={starts} onChange={event => setStarts(event.target.value)} required /></Field><Field label="დასრულება"><Input type="datetime-local" value={ends} onChange={event => setEnds(event.target.value)} required /></Field></div><Field label="მიზეზი"><Input value={reason} onChange={event => setReason(event.target.value)} /></Field>{error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}<DialogFooter><Button type="submit" disabled={pending}>{pending ? "ინახება…" : editing ? "ცვლილების შენახვა" : "გამონაკლისის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>; }
function InviteDialog({ open, setOpen, submit, email, setEmail, displayName, setDisplayName, jobTitle, setJobTitle, role, setRole, color, setColor, locations, locationId, setLocationId, error, pending, result, onCopy, copied }: any) {
  const showForm = !result;
  return <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{result ? "მოწვევა მზადაა" : "მოწვევის გაგზავნა"}</DialogTitle><DialogDescription>{result ? "გაუგზავნეთ ბმული მოწვეულს." : "ერთჯერადი ბმული პაროლის დასაყენებლად."}</DialogDescription></DialogHeader>
  {showForm ? <form onSubmit={submit} className="space-y-4">
    <Field label="ელფოსტა *"><Input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="staff@example.com" required autoComplete="off" /></Field>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="საჯარო სახელი"><Input value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="ჩაწერაში გამოსაჩენი სახელი" /></Field><Field label="სპეციალიზაცია"><Input value={jobTitle} onChange={event => setJobTitle(event.target.value)} placeholder="მაგ. სტილისტი" /></Field></div>
    <div className="grid gap-3 sm:grid-cols-2"><Field label="როლი"><Select value={role} onValueChange={value => setRole(value as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="STAFF">სპეციალისტი</SelectItem><SelectItem value="RECEPTIONIST">ადმინისტრატორი</SelectItem><SelectItem value="MANAGER">მენეჯერი</SelectItem></SelectContent></Select></Field>{locations.length ? <Field label="ფილიალი"><Select value={locationId} onValueChange={setLocationId}><SelectTrigger><SelectValue placeholder="ყველა (არ არჩეულა)" /></SelectTrigger><SelectContent>{locations.map((location: any) => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></Field> : null}</div>
    <Field group label="ფერი კალენდარში"><ColorSwatches color={color} setColor={setColor} /></Field>
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
    <DialogFooter><Button type="submit" disabled={pending}><Send className="mr-2 h-4 w-4" />{pending ? "იქმნება…" : "მოწვევის შექმნა"}</Button></DialogFooter>
  </form> : <div className="space-y-4">
    <div className="rounded-md border border-primary/25 bg-primary/5 p-4"><p className="text-xs font-semibold text-primary">მოწვევის ბმული</p><div className="mt-2 flex items-center gap-2"><Link2 className="h-4 w-4 shrink-0 text-primary" /><code className="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2 text-xs">{typeof window !== "undefined" ? window.location.origin : ""}{result.acceptUrl}</code><Button type="button" variant="outline" size="sm" className="max-md:h-11" onClick={onCopy}>{copied ? <><Check className="mr-1 h-3.5 w-3.5" />დაკოპირდა</> : <><Copy className="mr-1 h-3.5 w-3.5" />კოპირება</>}</Button></div></div>
    <p className="text-xs text-muted-foreground">ვადა: <span className="">{formatKaDateTime(new Date(result.expiresAt))}</span></p>
    <DialogFooter><Button type="button" onClick={() => setOpen(false)}>დახურვა</Button></DialogFooter>
  </div>}
  </DialogContent></Dialog>;
}
function Field({ label, children, group = false }: { label: string; children: React.ReactNode; group?: boolean }) {
  // A wrapping <label> ties the caption to its control; multi-control fields (avatar, colours) are a labelled group instead.
  if (group) return <div role="group" aria-label={label} className="space-y-2"><span className="block text-sm font-medium leading-none">{label}</span>{children}</div>;
  return <label className="block space-y-2"><span className="block text-sm font-medium leading-none">{label}</span>{children}</label>;
}
function formatGEL(tetri: number) { return formatGelTetri(tetri); }
function formatScheduleDate(value: Date, timeZone: string) { return formatKaDateTime(new Date(value), timeZone); }
