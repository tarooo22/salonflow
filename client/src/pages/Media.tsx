import React, { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ImagePlus, Images, Link2, Sparkles, UploadCloud, UsersRound } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilePicker } from "@/components/ui/file-picker";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { fileToImageDataUrl } from "@/lib/imageUpload";
import { WorkspacePageHeader, WorkspaceSection, WorkspaceState, WorkspaceStatusPill } from "@/components/workspace/WorkspacePrimitives";
import { toast } from "sonner";

const toDataUrl = async (file: File | null) => file ? fileToImageDataUrl(file) : null;

export default function Media() {
  const utils = trpc.useUtils();
  const organizations = trpc.organizations.listMine.useQuery();
  const entry = organizations.data?.[0];
  const organization = entry?.organization;
  const canManage = ["OWNER", "MANAGER"].includes(entry?.membership.role ?? "");
  const locations = trpc.organizations.listLocations.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const staff = trpc.staff.list.useQuery({ organizationId: organization?.id ?? "" }, { enabled: Boolean(organization?.id) });
  const [locationId, setLocationId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverAlt, setCoverAlt] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarAlt, setAvatarAlt] = useState("");
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [feedFile, setFeedFile] = useState<File | null>(null);
  const [feedAlt, setFeedAlt] = useState("");
  const [feedTitle, setFeedTitle] = useState("");
  const [feedCaption, setFeedCaption] = useState("");
  const [feedPublic, setFeedPublic] = useState(false);

  useEffect(() => { if (!locationId && locations.data?.[0]) setLocationId(locations.data[0].id); }, [locationId, locations.data]);
  const selectedLocation = locations.data?.find(location => location.id === locationId);
  useEffect(() => {
    if (!selectedLocation) return;
    setDescription(selectedLocation.publicDescription ?? "");
    const social = selectedLocation.socialLinks as { instagram?: string; website?: string } | null;
    setInstagram(social?.instagram ?? "");
    setWebsite(social?.website ?? "");
  }, [selectedLocation?.id]);
  useEffect(() => { if (!staffId && staff.data?.[0]?.profile) setStaffId(staff.data[0].profile.id); }, [staff.data, staffId]);
  const feedInput = useMemo(() => ({ organizationId: organization?.id ?? "", locationId }), [locationId, organization?.id]);
  const feed = trpc.media.listFeed.useQuery(feedInput, { enabled: Boolean(organization?.id && locationId && canManage) });
  const updateProfile = trpc.media.updatePublicLocationProfile.useMutation({ onSuccess: async () => { await utils.organizations.listLocations.invalidate(); toast.success("პროფილი განახლდა."); }, onError: error => toast.error(error.message || "პროფილის განახლება ვერ მოხერხდა.") });
  const setCover = trpc.media.setLocationCover.useMutation({ onSuccess: async () => { await utils.organizations.listLocations.invalidate(); setCoverFile(null); toast.success("ტიტულური ფოტო განახლდა."); }, onError: error => toast.error(error.message || "ფოტოს ატვირთვა ვერ მოხერხდა.") });
  const setAvatar = trpc.media.setStaffAvatar.useMutation({ onSuccess: async () => { await utils.staff.list.invalidate(); setAvatarFile(null); toast.success("თანამშრომლის ავატარი განახლდა."); }, onError: error => toast.error(error.message || "ავატარის ატვირთვა ვერ მოხერხდა.") });
  const createFeed = trpc.media.createFeedPost.useMutation({ onSuccess: async () => { await utils.media.listFeed.invalidate(); setFeedFile(null); setFeedAlt(""); setFeedTitle(""); setFeedCaption(""); setFeedPublic(false); toast.success("პოსტი შეინახა."); }, onError: error => toast.error(error.message || "პოსტის შენახვა ვერ მოხერხდა.") });
  const setFeedVisibility = trpc.media.setFeedVisibility.useMutation({ onSuccess: () => utils.media.listFeed.invalidate() });
  const deleteFeed = trpc.media.deleteFeedPost.useMutation({ onSuccess: () => { utils.media.listFeed.invalidate(); toast.success("პოსტი წაიშალა."); } });

  const saveProfile = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!organization || !locationId) return; updateProfile.mutate({ organizationId: organization.id, locationId, publicDescription: description, socialLinks: { ...(instagram ? { instagram } : {}), ...(website ? { website } : {}) } }); };
  const uploadCover = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!organization || !locationId || !coverFile) return; try { const imageDataUrl = await toDataUrl(coverFile); if (imageDataUrl) setCover.mutate({ organizationId: organization.id, locationId, imageDataUrl, altTextKa: coverAlt }); } catch (error) { toast.error(error instanceof Error ? error.message : "ფოტოს წაკითხვა ვერ მოხერხდა."); } };
  const uploadAvatar = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!organization || !staffId || !avatarFile) return; try { const imageDataUrl = await toDataUrl(avatarFile); if (imageDataUrl) setAvatar.mutate({ organizationId: organization.id, staffProfileId: staffId, imageDataUrl, altTextKa: avatarAlt }); } catch (error) { toast.error(error instanceof Error ? error.message : "ავატარის წაკითხვა ვერ მოხერხდა."); } };
  const publishFeed = async (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!organization || !locationId || !feedFile) return; try { const imageDataUrl = await toDataUrl(feedFile); if (imageDataUrl) createFeed.mutate({ organizationId: organization.id, locationId, imageDataUrl, altTextKa: feedAlt, titleKa: feedTitle || undefined, captionKa: feedCaption || undefined, publicVisible: feedPublic }); } catch (error) { toast.error(error instanceof Error ? error.message : "ფოტოს წაკითხვა ვერ მოხერხდა."); } };

  return <DashboardLayout><main className="sf-workspace-page mx-auto w-full max-w-7xl space-y-5"><WorkspacePageHeader title="მედია და პროფილი" actions={selectedLocation ? <Link href={`/salon/${selectedLocation.publicSlug}`} className="inline-flex"><Button variant="outline"><Link2 className="mr-2 h-4 w-4" />საჯარო გვერდის ნახვა</Button></Link> : null} />
    {organizations.isLoading || locations.isLoading ? <WorkspaceState kind="loading" title="იტვირთება…" /> : null}
    {organizations.isError || locations.isError ? <WorkspaceState kind="error" title="მონაცემები მიუწვდომელია" /> : null}
    {!organizations.isLoading && organization && !canManage ? <WorkspaceState kind="empty" title="მედიის მართვის უფლება არ გაქვთ" description="ხელმისაწვდომია მფლობელისა და მენეჯერისთვის." /> : null}
    {organization && canManage ? <><WorkspaceSection title="ფილიალი"><Select value={locationId} onValueChange={setLocationId}><SelectTrigger className="max-w-lg"><SelectValue placeholder="აირჩიეთ ფილიალი" /></SelectTrigger><SelectContent>{locations.data?.map(location => <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>)}</SelectContent></Select></WorkspaceSection>
      {selectedLocation ? <div className="grid grid-cols-1 gap-4 xl:grid-cols-2"><WorkspaceSection title="ტიტულური ფოტო"><div className="space-y-4">{selectedLocation.coverImageKey ? <img src={`/manus-storage/${selectedLocation.coverImageKey}`} alt={selectedLocation.coverImageAltKa || `${selectedLocation.name} — ტიტულური ფოტო`} className="aspect-[16/8] w-full rounded-md border object-cover" /> : <div className="aspect-[16/8] w-full"><WorkspaceState kind="empty" title="ფოტო ჯერ არ არის" /></div>}<form onSubmit={uploadCover} className="space-y-3"><div className="space-y-2"><Label htmlFor="location-cover">JPEG, PNG ან WebP · მაქს. 5 MB</Label><FilePicker id="location-cover" accept="image/jpeg,image/png,image/webp" value={coverFile} onChange={setCoverFile} /></div><div className="space-y-2"><Label htmlFor="cover-alt">ფოტოს აღწერა</Label><Input id="cover-alt" value={coverAlt} onChange={event => setCoverAlt(event.target.value)} placeholder="მაგ. სალონის მთავარი ინტერიერი" minLength={3} maxLength={255} required /></div><div className="flex flex-wrap items-center gap-3"><Button type="submit" variant={coverFile ? "default" : "outline"} disabled={!coverFile || setCover.isPending} aria-describedby={coverFile ? undefined : "cover-file-help"}>{setCover.isPending ? "იტვირთება…" : <><UploadCloud className="mr-2 h-4 w-4" />ატვირთვა</>}</Button>{coverFile ? null : <p id="cover-file-help" className="text-sm text-muted-foreground">ჯერ აირჩიეთ ფაილი.</p>}</div></form></div></WorkspaceSection>
        <WorkspaceSection title="აღწერა და ბმულები"><form onSubmit={saveProfile} className="space-y-3"><div className="space-y-2"><Label htmlFor="public-description">სალონის აღწერა</Label><Textarea id="public-description" value={description} onChange={event => setDescription(event.target.value)} maxLength={2000} placeholder="რა სერვისებსა და გამოცდილებას სთავაზობს თქვენი ფილიალი?" /></div><div className="space-y-2"><Label htmlFor="instagram-url">Instagram-ის ბმული</Label><Input id="instagram-url" type="url" value={instagram} onChange={event => setInstagram(event.target.value)} placeholder="https://instagram.com/…" /></div><div className="space-y-2"><Label htmlFor="website-url">ვებსაიტი</Label><Input id="website-url" type="url" value={website} onChange={event => setWebsite(event.target.value)} placeholder="https://…" /></div><Button type="submit" disabled={updateProfile.isPending}>{updateProfile.isPending ? "ინახება…" : "შენახვა"}</Button></form></WorkspaceSection>
        <WorkspaceSection title="სპეციალისტის ფოტო"><form onSubmit={uploadAvatar} className="space-y-3"><div className="space-y-2"><Label htmlFor="staff-avatar-target">სპეციალისტი</Label><Select value={staffId} onValueChange={setStaffId}><SelectTrigger id="staff-avatar-target"><SelectValue placeholder="აირჩიეთ სპეციალისტი" /></SelectTrigger><SelectContent>{staff.data?.map(item => <SelectItem key={item.profile.id} value={item.profile.id}>{item.profile.publicDisplayName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="staff-avatar-file">JPEG, PNG ან WebP · მაქს. 5 MB</Label><FilePicker id="staff-avatar-file" accept="image/jpeg,image/png,image/webp" value={avatarFile} onChange={setAvatarFile} /></div><div className="space-y-2"><Label htmlFor="staff-avatar-alt">ფოტოს აღწერა</Label><Input id="staff-avatar-alt" value={avatarAlt} onChange={event => setAvatarAlt(event.target.value)} placeholder="მაგ. სტილისტი ნინო" minLength={3} maxLength={255} required /></div><div className="flex flex-wrap items-center gap-3"><Button type="submit" variant={avatarFile ? "default" : "outline"} disabled={!avatarFile || !staffId || setAvatar.isPending} aria-describedby={avatarFile ? undefined : "avatar-file-help"}><UsersRound className="mr-2 h-4 w-4" />{setAvatar.isPending ? "იტვირთება…" : "ატვირთვა"}</Button>{avatarFile ? null : <p id="avatar-file-help" className="text-sm text-muted-foreground">ჯერ აირჩიეთ ფაილი.</p>}</div></form></WorkspaceSection>
        <WorkspaceSection title="ფოტო-გალერეა" description="პოსტი თავიდან დაფარულია; გამოაქვეყნეთ მხოლოდ ის, რისი გამოქვეყნების უფლებაც გაქვთ."><form onSubmit={publishFeed} className="space-y-3"><div className="space-y-2"><Label htmlFor="feed-file">ფოტო</Label><FilePicker id="feed-file" accept="image/jpeg,image/png,image/webp" value={feedFile} onChange={setFeedFile} /></div><div className="space-y-2"><Label htmlFor="feed-alt">ფოტოს აღწერა</Label><Input id="feed-alt" value={feedAlt} onChange={event => setFeedAlt(event.target.value)} minLength={3} maxLength={255} required /></div><div className="space-y-2"><Label htmlFor="feed-title">სათაური <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Input id="feed-title" value={feedTitle} onChange={event => setFeedTitle(event.target.value)} maxLength={160} /></div><div className="space-y-2"><Label htmlFor="feed-caption">აღწერა <span className="text-muted-foreground">(არასავალდებულო)</span></Label><Textarea id="feed-caption" value={feedCaption} onChange={event => setFeedCaption(event.target.value)} maxLength={2000} /></div><label className="flex items-start gap-3 rounded-md border p-3 text-sm"><input type="checkbox" checked={feedPublic} onChange={event => setFeedPublic(event.target.checked)} className="mt-0.5 size-4 accent-primary" /><span>საჯაროდ გამოჩნდეს</span></label><div className="flex flex-wrap items-center gap-3"><Button type="submit" variant={feedFile ? "default" : "outline"} disabled={!feedFile || createFeed.isPending} aria-describedby={feedFile ? undefined : "feed-file-help"}><ImagePlus className="mr-2 h-4 w-4" />{createFeed.isPending ? "ინახება…" : "პოსტის შენახვა"}</Button>{feedFile ? null : <p id="feed-file-help" className="text-sm text-muted-foreground">ჯერ აირჩიეთ ფაილი.</p>}</div></form><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">{feed.isLoading ? <p className="text-sm text-muted-foreground">იტვირთება…</p> : null}{feed.data?.map(post => <article key={post.id} className="overflow-hidden rounded-md border"><img src={post.url} alt={post.altTextKa} className="aspect-square w-full object-cover" loading="lazy" /><div className="space-y-2 p-3"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-semibold">{post.titleKa || "უსათაურო პოსტი"}</p><WorkspaceStatusPill tone={post.publicVisible ? "success" : "warning"}>{post.publicVisible ? "საჯაროა" : "დაფარულია"}</WorkspaceStatusPill></div>{post.captionKa ? <p className="line-clamp-2 text-xs text-muted-foreground">{post.captionKa}</p> : null}<div className="flex gap-2"><Button size="sm" variant="outline" disabled={setFeedVisibility.isPending} onClick={() => setFeedVisibility.mutate({ organizationId: organization.id, postId: post.id, publicVisible: !post.publicVisible })}>{post.publicVisible ? "დამალვა" : "გამოქვეყნება"}</Button><Button size="sm" variant="ghost" disabled={deleteFeed.isPending} onClick={() => deleteFeed.mutate({ organizationId: organization.id, postId: post.id })}>წაშლა</Button></div></div></article>)}{!feed.isLoading && !feed.data?.length ? <div className="sm:col-span-2"><WorkspaceState kind="empty" title="პოსტები ჯერ არ არის" /></div> : null}</div></WorkspaceSection></div> : null}</> : null}
  </main></DashboardLayout>;
}
