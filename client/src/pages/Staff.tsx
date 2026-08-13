import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { BriefcaseBusiness, MapPin, Plus, UsersRound } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const roleLabel: Record<string, string> = {
  OWNER: "მფლობელი",
  MANAGER: "მენეჯერი",
  RECEPTIONIST: "ადმინისტრატორი",
  STAFF: "სპეციალისტი",
};

const weekdayLabel: Record<string, string> = {
  "0": "ორშაბათი", "1": "სამშაბათი", "2": "ოთხშაბათი", "3": "ხუთშაბათი", "4": "პარასკევი", "5": "შაბათი", "6": "კვირა",
};

export default function Staff() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const organizationEntry = organizations.data?.[0];
  const organization = organizationEntry?.organization;
  const staff = trpc.staff.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const timeOffRequests = trpc.staff.listTimeOffRequests.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const canManage = ["OWNER", "MANAGER"].includes(organizationEntry?.membership.role ?? "");
  const unprofiledMembers = trpc.staff.listUnprofiledMembers.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) && canManage });
  const hasOwnProfile = Boolean(staff.data?.some(item => item.membership.id === organizationEntry?.membership.id));
  const leaveEligibleStaff = useMemo(() => {
    if (!staff.data) return [];
    return canManage ? staff.data : staff.data.filter(item => item.membership.id === organizationEntry?.membership.id);
  }, [canManage, organizationEntry?.membership.id, staff.data]);

  const [createOpen, setCreateOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [profileMembershipId, setProfileMembershipId] = useState("");
  const [hoursOpen, setHoursOpen] = useState(false);
  const [hoursProfileId, setHoursProfileId] = useState("");
  const [hoursLocationId, setHoursLocationId] = useState("");
  const [hoursWeekday, setHoursWeekday] = useState("0");
  const [hoursStart, setHoursStart] = useState("09:00");
  const [hoursEnd, setHoursEnd] = useState("18:00");
  const [hoursError, setHoursError] = useState("");
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionProfileId, setExceptionProfileId] = useState("");
  const [exceptionLocationId, setExceptionLocationId] = useState("");
  const [exceptionType, setExceptionType] = useState<"VACATION" | "SICK_LEAVE" | "CUSTOM_BLOCK">("VACATION");
  const [exceptionStartsAt, setExceptionStartsAt] = useState("");
  const [exceptionEndsAt, setExceptionEndsAt] = useState("");
  const [exceptionReason, setExceptionReason] = useState("");
  const [exceptionError, setExceptionError] = useState("");
  const [timeOffOpen, setTimeOffOpen] = useState(false);
  const [timeOffProfileId, setTimeOffProfileId] = useState("");
  const [timeOffLocationId, setTimeOffLocationId] = useState("");
  const [timeOffStartsAt, setTimeOffStartsAt] = useState("");
  const [timeOffEndsAt, setTimeOffEndsAt] = useState("");
  const [timeOffReason, setTimeOffReason] = useState("");
  const [timeOffError, setTimeOffError] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "RECEPTIONIST" | "STAFF">("STAFF");
  const [inviteLocationId, setInviteLocationId] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editProfileId, setEditProfileId] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editJobTitle, setEditJobTitle] = useState("");
  const [editSpecialty, setEditSpecialty] = useState("");
  const [editColor, setEditColor] = useState("#17826A");
  const [editOnlineBookingVisible, setEditOnlineBookingVisible] = useState(true);
  const [editLocationIds, setEditLocationIds] = useState<string[]>([]);
  const [editError, setEditError] = useState("");
  const profileLocations = trpc.staff.listProfileLocations.useQuery({ organizationId: organization?.id ?? "", staffProfileId: editProfileId || "invalid_profile" }, { enabled: Boolean(organization?.id && editProfileId) });

  const createProfile = trpc.staff.createProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.staff.list.invalidate(), utils.staff.listUnprofiledMembers.invalidate()]);
      setDisplayName("");
      setJobTitle("");
      setSelectedLocationIds([]);
      setProfileMembershipId("");
      setFormError("");
      setCreateOpen(false);
    },
  });
  const addWorkingHours = trpc.staff.addWorkingHours.useMutation({
    onSuccess: () => {
      setHoursError("");
      setHoursOpen(false);
      toast.success("სამუშაო საათები დაემატა.");
    },
    onError: () => setHoursError("სამუშაო საათების დამატება ვერ მოხერხდა. შეამოწმეთ ფილიალი და დრო."),
  });
  const addScheduleException = trpc.staff.addScheduleException.useMutation({
    onSuccess: () => {
      setExceptionOpen(false);
      setExceptionError("");
      toast.success("კალენდრის გამონაკლისი დაემატა.");
    },
    onError: () => setExceptionError("გამონაკლისის დამატება ვერ მოხერხდა. შეამოწმეთ ფილიალი, დრო და სპეციალისტის მინიჭება."),
  });
  const requestTimeOff = trpc.staff.requestTimeOff.useMutation({
    onSuccess: async () => {
      await utils.staff.listTimeOffRequests.invalidate();
      setTimeOffOpen(false);
      setTimeOffError("");
      setTimeOffStartsAt("");
      setTimeOffEndsAt("");
      setTimeOffReason("");
      toast.success("დასვენების მოთხოვნა გაიგზავნა დასამტკიცებლად.");
    },
    onError: () => setTimeOffError("მოთხოვნის გაგზავნა ვერ მოხერხდა. შეამოწმეთ სპეციალისტი, ფილიალი და დრო."),
  });
  const reviewTimeOff = trpc.staff.reviewTimeOffRequest.useMutation({
    onSuccess: async (_, variables) => {
      await utils.staff.listTimeOffRequests.invalidate();
      toast.success(variables.status === "APPROVED" ? "დასვენების მოთხოვნა დამტკიცდა." : "დასვენების მოთხოვნა უარყოფილია.");
    },
    onError: () => toast.error("მოთხოვნის სტატუსის განახლება ვერ მოხერხდა."),
  });
  const createStaffInvite = trpc.organizations.createStaffInvite.useMutation({
    onSuccess: result => {
      setInviteError("");
      setInviteUrl(result.inviteUrl);
      toast.success("მოწვევის ბმული მზადაა გასაზიარებლად.");
    },
    onError: () => setInviteError("მოწვევის შექმნა ვერ მოხერხდა. შეამოწმეთ ელფოსტა და ფილიალი."),
  });
  const updateProfile = trpc.staff.updateProfile.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.staff.list.invalidate(), utils.staff.listProfileLocations.invalidate()]);
      setEditError("");
      setEditOpen(false);
      toast.success("სპეციალისტის პროფილი განახლდა.");
    },
    onError: () => setEditError("პროფილის განახლება ვერ მოხერხდა. შეამოწმეთ აქტიური ფილიალები და სავალდებულო ველები."),
  });

  useEffect(() => {
    if (profileLocations.data) setEditLocationIds(profileLocations.data.map(location => location.id));
  }, [profileLocations.data]);

  const toggleLocation = (locationId: string) => {
    setSelectedLocationIds(current => current.includes(locationId) ? current.filter(id => id !== locationId) : [...current, locationId]);
  };
  const toggleEditLocation = (locationId: string) => {
    setEditLocationIds(current => current.includes(locationId) ? current.filter(id => id !== locationId) : [...current, locationId]);
  };
  const openProfileEditor = (item: NonNullable<typeof staff.data>[number]) => {
    setEditProfileId(item.profile.id);
    setEditDisplayName(item.profile.publicDisplayName);
    setEditJobTitle(item.profile.jobTitle ?? "");
    setEditSpecialty(item.profile.specialty ?? "");
    setEditColor(item.profile.color);
    setEditOnlineBookingVisible(item.profile.onlineBookingVisible);
    setEditLocationIds([]);
    setEditError("");
    setEditOpen(true);
  };
  const openCreateProfile = () => {
    const currentMembershipId = organizationEntry?.membership.id ?? "";
    setProfileMembershipId(canManage ? (unprofiledMembers.data?.[0]?.membership.id ?? currentMembershipId) : currentMembershipId);
    setDisplayName("");
    setJobTitle("");
    setSelectedLocationIds([]);
    setFormError("");
    setCreateOpen(true);
  };
  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !organizationEntry || !profileMembershipId) return;
    if (!selectedLocationIds.length) {
      setFormError("აირჩიეთ მინიმუმ ერთი აქტიური ფილიალი.");
      return;
    }
    setFormError("");
    createProfile.mutate({
      organizationId: organization.id,
      membershipId: profileMembershipId,
      publicDisplayName: displayName,
      jobTitle: jobTitle || undefined,
      onlineBookingVisible: true,
      color: "#17826A",
      locationIds: selectedLocationIds,
    });
  };
  const submitProfileUpdate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !editProfileId) return;
    if (!editLocationIds.length) {
      setEditError("აირჩიეთ მინიმუმ ერთი აქტიური ფილიალი.");
      return;
    }
    setEditError("");
    updateProfile.mutate({ organizationId: organization.id, staffProfileId: editProfileId, publicDisplayName: editDisplayName, jobTitle: editJobTitle || undefined, specialty: editSpecialty || undefined, onlineBookingVisible: editOnlineBookingVisible, color: editColor, locationIds: editLocationIds });
  };
  const submitWorkingHours = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !hoursProfileId || !hoursLocationId) {
      setHoursError("აირჩიეთ სპეციალისტი და ფილიალი.");
      return;
    }
    if (hoursStart >= hoursEnd) {
      setHoursError("სამუშაო დღის დასრულება დაწყებაზე გვიან უნდა იყოს.");
      return;
    }
    setHoursError("");
    addWorkingHours.mutate({ organizationId: organization.id, staffProfileId: hoursProfileId, locationId: hoursLocationId, weekday: Number(hoursWeekday), startLocalTime: hoursStart, endLocalTime: hoursEnd });
  };
  const submitException = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !exceptionProfileId || !exceptionLocationId || !exceptionStartsAt || !exceptionEndsAt) {
      setExceptionError("აირჩიეთ სპეციალისტი, ფილიალი და დროის დიაპაზონი.");
      return;
    }
    const startsAt = new Date(exceptionStartsAt);
    const endsAt = new Date(exceptionEndsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) {
      setExceptionError("დასრულება დაწყებაზე გვიან უნდა იყოს.");
      return;
    }
    setExceptionError("");
    addScheduleException.mutate({ organizationId: organization.id, staffProfileId: exceptionProfileId, locationId: exceptionLocationId, type: exceptionType, startsAt, endsAt, fullDay: false, reason: exceptionReason || undefined });
  };
  const submitTimeOff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !timeOffProfileId || !timeOffLocationId || !timeOffStartsAt || !timeOffEndsAt) {
      setTimeOffError("აირჩიეთ სპეციალისტი, ფილიალი და დროის დიაპაზონი.");
      return;
    }
    const startsAt = new Date(timeOffStartsAt);
    const endsAt = new Date(timeOffEndsAt);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || startsAt >= endsAt) {
      setTimeOffError("დასრულება დაწყებაზე გვიან უნდა იყოს.");
      return;
    }
    setTimeOffError("");
    requestTimeOff.mutate({ organizationId: organization.id, staffProfileId: timeOffProfileId, locationId: timeOffLocationId, startsAt, endsAt, reason: timeOffReason || undefined });
  };
  const submitInvite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization || !inviteEmail.trim()) {
      setInviteError("მიუთითეთ მოწვეული თანამშრომლის ელფოსტა.");
      return;
    }
    setInviteError("");
    setInviteUrl("");
    createStaffInvite.mutate({ organizationId: organization.id, locationId: inviteLocationId || undefined, email: inviteEmail.trim(), role: inviteRole, origin: window.location.origin });
  };
  const copyInviteUrl = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("მოწვევის ბმული დაკოპირებულია.");
    } catch {
      toast.error("ბმულის დაკოპირება ვერ მოხერხდა.");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm font-medium text-primary">გუნდის სამუშაო სივრცე</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">გუნდი</h1><p className="mt-2 text-sm text-muted-foreground">სპეციალისტების როლები, საჯარო პროფილები და ფილიალების აქტიური ქსელი.</p></div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="w-fit border-primary/30 bg-primary/5 px-3 py-1 text-primary">{organization?.name ?? "სამუშაო სივრცე"}</Badge>
            {organization && canManage ? <Button variant="outline" onClick={() => { setInviteEmail(""); setInviteLocationId(""); setInviteRole("STAFF"); setInviteUrl(""); setInviteError(""); setInviteOpen(true); }}>გუნდის მოწვევა</Button> : null}
            {organization && canManage && staff.data?.length ? <Button variant="outline" onClick={() => openProfileEditor(staff.data[0])}>პროფილების რედაქტირება</Button> : null}
            {organization && leaveEligibleStaff.length ? <Button variant="outline" onClick={() => { setTimeOffProfileId(leaveEligibleStaff[0]?.profile.id ?? ""); setTimeOffLocationId(""); setTimeOffError(""); setTimeOffOpen(true); }}>დასვენების მოთხოვნა</Button> : null}
            {organization && canManage && staff.data?.length ? <Button variant="outline" onClick={() => { setExceptionError(""); setExceptionOpen(true); }}>კალენდრის ბლოკი</Button> : null}
            {organization && canManage && unprofiledMembers.data?.length ? <Button onClick={openCreateProfile}><Plus className="mr-2 h-4 w-4" />პროფილის დამატება</Button> : null}
            {organization && !canManage && !hasOwnProfile ? <Button onClick={openCreateProfile}><Plus className="mr-2 h-4 w-4" />ჩემი პროფილის დამატება</Button> : null}
          </div>
        </header>
        {organizations.isLoading ? <StateCard text="გუნდის სამუშაო სივრცე იტვირთება…" /> : null}
        {organizations.isError ? <StateCard text="სამუშაო სივრცის მონაცემები დროებით მიუწვდომელია." error /> : null}
        {!organizations.isLoading && !organizations.isError && !organization ? <StateCard text="გუნდის გვერდის სანახავად ჯერ შექმენით სამუშაო სივრცე." /> : null}
        {organization ? <>
          <div className="grid gap-4 md:grid-cols-3">
            <Metric icon={UsersRound} label="აქტიური პროფილები" value={staff.isLoading ? "…" : String(staff.data?.length ?? 0)} hint="ორგანიზაციის აქტიური თანამშრომლები" />
            <Metric icon={MapPin} label="აქტიური ფილიალები" value={locations.isLoading ? "…" : String(locations.data?.length ?? 0)} hint="ფილიალები, სადაც გუნდი განთავსდება" />
            <Metric icon={BriefcaseBusiness} label="ონლაინ პროფილები" value={staff.isLoading ? "…" : String(staff.data?.filter(item => item.profile.onlineBookingVisible).length ?? 0)} hint="საჯარო ჩაწერაში ხილული სპეციალისტები" />
          </div>
          <Card><CardHeader><CardTitle>აქტიური გუნდი</CardTitle></CardHeader><CardContent><div className="grid gap-4 lg:grid-cols-2">
            {staff.isLoading ? <p className="text-sm text-muted-foreground">გუნდის პროფილები იტვირთება…</p> : null}
            {staff.isError ? <p className="text-sm text-destructive">გუნდის მონაცემების ჩატვირთვა ვერ მოხერხდა.</p> : null}
            {!staff.isLoading && !staff.isError && staff.data?.length === 0 ? <div className="rounded-xl border border-dashed p-6 text-sm leading-6 text-muted-foreground"><p>აქ გამოჩნდება გუნდის პროფილები, როგორც კი ფილიალში პირველი სპეციალისტი დაემატება.</p>{canManage ? <Button variant="outline" size="sm" className="mt-4" onClick={openCreateProfile}><Plus className="mr-1.5 h-4 w-4" />პირველი პროფილის დამატება</Button> : null}</div> : null}
            {staff.data?.map(item => <div key={item.profile.id} className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold tracking-tight">{item.profile.publicDisplayName}</h2><p className="mt-1 text-sm text-muted-foreground">{item.profile.jobTitle || item.profile.specialty || "როლი და სპეციალიზაცია დაემატება აქ"}</p></div><Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">{roleLabel[item.membership.role] ?? item.membership.role}</Badge></div><div className="mt-4 space-y-2 text-sm text-muted-foreground"><p>საჯარო პროფილი: {item.profile.onlineBookingVisible ? "აქტიურია" : "დამალულია"}</p><p>წევრობის სტატუსი: {item.membership.status}</p><p>ფერი: <span className="font-medium text-foreground">{item.profile.color}</span></p></div>{canManage ? <Button variant="outline" size="sm" className="mt-4" onClick={() => { setHoursProfileId(item.profile.id); setHoursLocationId(""); setHoursError(""); setHoursOpen(true); }}>სამუშაო საათები</Button> : null}</div>)}
          </div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between gap-4"><div><CardTitle>დასვენების მოთხოვნები</CardTitle><p className="mt-1 text-sm text-muted-foreground">მოლოდინში, დამტკიცებული და უარყოფილი მოთხოვნები აქტიური გუნდისთვის.</p></div><span className="shrink-0 text-sm text-muted-foreground">{timeOffRequests.data?.length ?? 0} ჩანაწერი</span></CardHeader><CardContent><div className="space-y-3">{timeOffRequests.isLoading ? <p className="text-sm text-muted-foreground">მოთხოვნები იტვირთება…</p> : null}{timeOffRequests.isError ? <p className="text-sm text-destructive">მოთხოვნების ჩატვირთვა ვერ მოხერხდა.</p> : null}{!timeOffRequests.isLoading && !timeOffRequests.isError && !timeOffRequests.data?.length ? <p className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">დასვენების მოთხოვნა ჯერ არ არის.</p> : null}{timeOffRequests.data?.map(({ request, profile }) => <div key={request.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{profile.publicDisplayName}</p><p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("ka-GE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(request.startsAt)} — {new Intl.DateTimeFormat("ka-GE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(request.endsAt)}{request.reason ? ` · ${request.reason}` : ""}</p></div><div className="flex flex-wrap items-center gap-2"><Badge variant="outline" className={request.status === "APPROVED" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : request.status === "REJECTED" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-amber-300 bg-amber-50 text-amber-700"}>{request.status === "APPROVED" ? "დამტკიცებულია" : request.status === "REJECTED" ? "უარყოფილია" : "მოლოდინში"}</Badge>{canManage && request.status === "PENDING" ? <><Button variant="outline" size="sm" disabled={reviewTimeOff.isPending} onClick={() => organization && reviewTimeOff.mutate({ organizationId: organization.id, requestId: request.id, status: "APPROVED" })}>დამტკიცება</Button><Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/5" disabled={reviewTimeOff.isPending} onClick={() => organization && reviewTimeOff.mutate({ organizationId: organization.id, requestId: request.id, status: "REJECTED" })}>უარყოფა</Button></> : null}</div></div>)}</div></CardContent></Card>
        </> : null}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent><DialogHeader><DialogTitle>{canManage ? "სპეციალისტის პროფილის დამატება" : "ჩემი სპეციალისტის პროფილი"}</DialogTitle><DialogDescription>პროფილი უკავშირდება აქტიურ ორგანიზაციულ წევრობას და მინიმუმ ერთ მოქმედ ფილიალს. მენეჯერს შეუძლია მოიწვიოს და შემდეგ ჩართოს სხვა მიღებული წევრი.</DialogDescription></DialogHeader><form onSubmit={submitProfile} className="space-y-4">{canManage ? <div className="space-y-2"><Label htmlFor="profile-member">ორგანიზაციის წევრი</Label><Select value={profileMembershipId} onValueChange={setProfileMembershipId}><SelectTrigger id="profile-member"><SelectValue placeholder="აირჩიეთ წევრი" /></SelectTrigger><SelectContent>{unprofiledMembers.data?.map(item => <SelectItem key={item.membership.id} value={item.membership.id}>{item.user.name || item.user.email || item.membership.id}</SelectItem>)}</SelectContent></Select></div> : null}<div className="space-y-2"><Label htmlFor="staff-display-name">საჯარო სახელი</Label><Input id="staff-display-name" value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="მაგ. ლელა ბერიძე" minLength={2} maxLength={160} required /></div><div className="space-y-2"><Label htmlFor="staff-title">როლი ან სპეციალიზაცია <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="staff-title" value={jobTitle} onChange={event => setJobTitle(event.target.value)} placeholder="მაგ. თმის სტილისტი" maxLength={160} /></div><fieldset className="space-y-2"><legend className="text-sm font-medium">ფილიალები</legend>{locations.isLoading ? <p className="text-sm text-muted-foreground">ფილიალები იტვირთება…</p> : null}{!locations.isLoading && !locations.data?.length ? <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">პროფილის დამატებამდე საჭიროა მინიმუმ ერთი აქტიური ფილიალი.</p> : null}{locations.data?.map(location => <label key={location.id} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={selectedLocationIds.includes(location.id)} onChange={() => toggleLocation(location.id)} className="h-4 w-4 accent-primary" /><span>{location.name}</span></label>)}</fieldset>{formError ? <p className="text-sm text-destructive">{formError}</p> : null}{createProfile.error ? <p className="text-sm text-destructive">პროფილის დამატება ვერ მოხერხდა. სცადეთ ხელახლა.</p> : null}<DialogFooter><Button type="submit" disabled={createProfile.isPending || !locations.data?.length || !profileMembershipId}>{createProfile.isPending ? "ინახება…" : "პროფილის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={exceptionOpen} onOpenChange={setExceptionOpen}><DialogContent><DialogHeader><DialogTitle>კალენდრის გამონაკლისი</DialogTitle><DialogDescription>ჩაწერეთ შვებულება, ავადმყოფობა ან კონკრეტული სამუშაო ბლოკი მხოლოდ იმ ფილიალისთვის, სადაც სპეციალისტი აქტიურად არის მინიჭებული.</DialogDescription></DialogHeader><form onSubmit={submitException} className="space-y-4"><StaffLocationFields staff={staff.data ?? []} locations={locations.data ?? []} profileId={exceptionProfileId} onProfileChange={setExceptionProfileId} locationId={exceptionLocationId} onLocationChange={setExceptionLocationId} prefix="exception" /><div className="space-y-2"><Label htmlFor="exception-type">ტიპი</Label><Select value={exceptionType} onValueChange={value => setExceptionType(value as "VACATION" | "SICK_LEAVE" | "CUSTOM_BLOCK")}><SelectTrigger id="exception-type"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VACATION">შვებულება</SelectItem><SelectItem value="SICK_LEAVE">ავადმყოფობა</SelectItem><SelectItem value="CUSTOM_BLOCK">ინდივიდუალური ბლოკი</SelectItem></SelectContent></Select></div><DateRangeFields prefix="exception" startsAt={exceptionStartsAt} endsAt={exceptionEndsAt} onStartsAtChange={setExceptionStartsAt} onEndsAtChange={setExceptionEndsAt} /> <div className="space-y-2"><Label htmlFor="exception-reason">მიზეზი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="exception-reason" value={exceptionReason} onChange={event => setExceptionReason(event.target.value)} maxLength={255} /></div>{exceptionError ? <p className="text-sm text-destructive">{exceptionError}</p> : null}<DialogFooter><Button type="submit" disabled={addScheduleException.isPending}>{addScheduleException.isPending ? "ინახება…" : "გამონაკლისის შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={timeOffOpen} onOpenChange={setTimeOffOpen}><DialogContent><DialogHeader><DialogTitle>დასვენების მოთხოვნა</DialogTitle><DialogDescription>მოთხოვნა შეინახება მოსალოდნელი სტატუსით. სპეციალისტი ხედავს მხოლოდ საკუთარ პროფილს, ხოლო მენეჯერი ან მფლობელი — ორგანიზაციის აქტიურ გუნდს.</DialogDescription></DialogHeader><form onSubmit={submitTimeOff} className="space-y-4"><StaffLocationFields staff={leaveEligibleStaff} locations={locations.data ?? []} profileId={timeOffProfileId} onProfileChange={setTimeOffProfileId} locationId={timeOffLocationId} onLocationChange={setTimeOffLocationId} prefix="time-off" /><DateRangeFields prefix="time-off" startsAt={timeOffStartsAt} endsAt={timeOffEndsAt} onStartsAtChange={setTimeOffStartsAt} onEndsAtChange={setTimeOffEndsAt} /><div className="space-y-2"><Label htmlFor="time-off-reason">მიზეზი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="time-off-reason" value={timeOffReason} onChange={event => setTimeOffReason(event.target.value)} maxLength={255} /></div>{timeOffError ? <p className="text-sm text-destructive">{timeOffError}</p> : null}<DialogFooter><Button type="submit" disabled={requestTimeOff.isPending}>{requestTimeOff.isPending ? "იგზავნება…" : "მოთხოვნის გაგზავნა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}><DialogContent><DialogHeader><DialogTitle>გუნდის წევრის მოწვევა</DialogTitle><DialogDescription>მოწვევა ელფოსტას უკავშირდება, შვიდ დღეში იწურება და მისი მიღება მხოლოდ იმ ანგარიშით არის შესაძლებელი, რომლის ელფოსტაც ზუსტად ემთხვევა მოწვევას.</DialogDescription></DialogHeader><form onSubmit={submitInvite} className="space-y-4"><div className="space-y-2"><Label htmlFor="invite-email">ელფოსტა</Label><Input id="invite-email" type="email" value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} placeholder="team@example.com" required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="invite-role">როლი</Label><Select value={inviteRole} onValueChange={value => setInviteRole(value as "MANAGER" | "RECEPTIONIST" | "STAFF")}><SelectTrigger id="invite-role"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MANAGER">მენეჯერი</SelectItem><SelectItem value="RECEPTIONIST">ადმინისტრატორი</SelectItem><SelectItem value="STAFF">სპეციალისტი</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label htmlFor="invite-location">ფილიალი <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Select value={inviteLocationId || "all"} onValueChange={value => setInviteLocationId(value === "all" ? "" : value)}><SelectTrigger id="invite-location"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">ყველა ფილიალი</SelectItem>{locations.data?.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></div></div>{inviteError ? <p className="text-sm text-destructive">{inviteError}</p> : null}{inviteUrl ? <div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-medium">მოწვევის უსაფრთხო ბმული</p><p className="mt-2 break-all font-mono text-xs text-muted-foreground">{inviteUrl}</p><Button type="button" variant="outline" size="sm" className="mt-3" onClick={copyInviteUrl}>ბმულის დაკოპირება</Button></div> : null}<DialogFooter><Button type="submit" disabled={createStaffInvite.isPending}>{createStaffInvite.isPending ? "იქმნება…" : "მოწვევის ბმულის შექმნა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={hoursOpen} onOpenChange={setHoursOpen}><DialogContent><DialogHeader><DialogTitle>სამუშაო საათების დამატება</DialogTitle><DialogDescription>საათები დაემატება მხოლოდ იმ აქტიური ფილიალისთვის, სადაც სპეციალისტი უკვე არის მინიჭებული.</DialogDescription></DialogHeader><form onSubmit={submitWorkingHours} className="space-y-4"><div className="space-y-2"><Label htmlFor="hours-location">ფილიალი</Label><Select value={hoursLocationId} onValueChange={setHoursLocationId}><SelectTrigger id="hours-location"><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data?.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="hours-weekday">დღე</Label><Select value={hoursWeekday} onValueChange={setHoursWeekday}><SelectTrigger id="hours-weekday"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(weekdayLabel).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="hours-start">დაწყება</Label><Input id="hours-start" type="time" value={hoursStart} onChange={event => setHoursStart(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor="hours-end">დასრულება</Label><Input id="hours-end" type="time" value={hoursEnd} onChange={event => setHoursEnd(event.target.value)} required /></div></div>{hoursError ? <p className="text-sm text-destructive">{hoursError}</p> : null}<DialogFooter><Button type="submit" disabled={addWorkingHours.isPending}>{addWorkingHours.isPending ? "ინახება…" : "საათების შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent><DialogHeader><DialogTitle>სპეციალისტის პროფილის რედაქტირება</DialogTitle><DialogDescription>განაახლეთ საჯარო პროფილი და მინიჭებული ფილიალები. მიმდინარე მინიჭებები იტვირთება ორგანიზაციის უსაფრთხო ფარგლების მიხედვით.</DialogDescription></DialogHeader><form onSubmit={submitProfileUpdate} className="space-y-4"><div className="space-y-2"><Label htmlFor="edit-profile-select">სპეციალისტი</Label><Select value={editProfileId} onValueChange={value => { const selected = staff.data?.find(item => item.profile.id === value); if (selected) openProfileEditor(selected); }}><SelectTrigger id="edit-profile-select"><SelectValue placeholder="აირჩიეთ სპეციალისტი" /></SelectTrigger><SelectContent>{staff.data?.map(item => <SelectItem key={item.profile.id} value={item.profile.id}>{item.profile.publicDisplayName}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="edit-staff-name">საჯარო სახელი</Label><Input id="edit-staff-name" value={editDisplayName} onChange={event => setEditDisplayName(event.target.value)} minLength={2} maxLength={160} required /></div><div className="space-y-2"><Label htmlFor="edit-staff-title">როლი ან სპეციალიზაცია</Label><Input id="edit-staff-title" value={editJobTitle} onChange={event => setEditJobTitle(event.target.value)} maxLength={160} /></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="edit-staff-specialty">სპეციალიზაცია</Label><Input id="edit-staff-specialty" value={editSpecialty} onChange={event => setEditSpecialty(event.target.value)} maxLength={255} /></div><div className="space-y-2"><Label htmlFor="edit-staff-color">ფერი</Label><Input id="edit-staff-color" value={editColor} onChange={event => setEditColor(event.target.value)} pattern="^#[0-9A-Fa-f]{6}$" maxLength={7} required /></div></div><label className="flex items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={editOnlineBookingVisible} onChange={event => setEditOnlineBookingVisible(event.target.checked)} className="h-4 w-4 accent-primary" /><span>გამოჩნდეს ონლაინ ჩაწერაში</span></label><fieldset className="space-y-2"><legend className="text-sm font-medium">აქტიური ფილიალები</legend>{profileLocations.isLoading ? <p className="text-sm text-muted-foreground">მიმდინარე მინიჭებები იტვირთება…</p> : null}{locations.data?.map(location => <label key={location.id} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm"><input type="checkbox" checked={editLocationIds.includes(location.id)} onChange={() => toggleEditLocation(location.id)} className="h-4 w-4 accent-primary" /><span>{location.name}</span></label>)}</fieldset>{editError ? <p className="text-sm text-destructive">{editError}</p> : null}<DialogFooter><Button type="submit" disabled={updateProfile.isPending || profileLocations.isLoading}>{updateProfile.isPending ? "ინახება…" : "ცვლილებების შენახვა"}</Button></DialogFooter></form></DialogContent></Dialog>
    </DashboardLayout>
  );
}

type StaffEntry = { profile: { id: string; publicDisplayName: string }; membership: { id: string } };
type LocationEntry = { id: string; name: string };

function StaffLocationFields({ staff, locations, profileId, onProfileChange, locationId, onLocationChange, prefix }: { staff: StaffEntry[]; locations: LocationEntry[]; profileId: string; onProfileChange: (value: string) => void; locationId: string; onLocationChange: (value: string) => void; prefix: string }) {
  return <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor={`${prefix}-staff`}>სპეციალისტი</Label><Select value={profileId} onValueChange={onProfileChange}><SelectTrigger id={`${prefix}-staff`}><SelectValue placeholder="აირჩიეთ სპეციალისტი" /></SelectTrigger><SelectContent>{staff.map(item => <SelectItem key={item.profile.id} value={item.profile.id}>{item.profile.publicDisplayName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor={`${prefix}-location`}>ფილიალი</Label><Select value={locationId} onValueChange={onLocationChange}><SelectTrigger id={`${prefix}-location`}><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></div></div>;
}

function DateRangeFields({ prefix, startsAt, endsAt, onStartsAtChange, onEndsAtChange }: { prefix: string; startsAt: string; endsAt: string; onStartsAtChange: (value: string) => void; onEndsAtChange: (value: string) => void }) {
  return <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor={`${prefix}-start`}>დაწყება</Label><Input id={`${prefix}-start`} type="datetime-local" value={startsAt} onChange={event => onStartsAtChange(event.target.value)} required /></div><div className="space-y-2"><Label htmlFor={`${prefix}-end`}>დასრულება</Label><Input id={`${prefix}-end`} type="datetime-local" value={endsAt} onChange={event => onEndsAtChange(event.target.value)} required /></div></div>;
}

function Metric({ icon: Icon, label, value, hint }: { icon: typeof UsersRound; label: string; value: string; hint: string }) {
  return <Card><CardContent className="p-5"><Icon className="h-5 w-5 text-primary" /><p className="mt-4 text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p><p className="mt-3 text-xs text-muted-foreground">{hint}</p></CardContent></Card>;
}

function StateCard({ text, error = false }: { text: string; error?: boolean }) {
  return <Card className={error ? "border-destructive/30 bg-destructive/5" : ""}><CardContent className={`p-8 text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{text}</CardContent></Card>;
}
