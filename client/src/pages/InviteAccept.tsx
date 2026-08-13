import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { clearPendingInviteToken, rememberPendingInviteToken } from "@/lib/pendingInvite";
import { CheckCircle2, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useRoute } from "wouter";

const roleLabels: Record<string, string> = {
  MANAGER: "მენეჯერი",
  RECEPTIONIST: "ადმინისტრატორი",
  STAFF: "სპეციალისტი",
};

export default function InviteAccept() {
  const [, params] = useRoute("/invite/:token");
  const [, setLocation] = useLocation();
  const token = params?.token ?? "";
  const hasValidTokenShape = /^[A-Za-z0-9_-]{32,128}$/.test(token);
  const { isAuthenticated, loading } = useAuth();
  const preview = trpc.organizations.previewStaffInvite.useQuery({ token }, { enabled: hasValidTokenShape, retry: false });
  const acceptInvite = trpc.organizations.acceptStaffInvite.useMutation({
    onSuccess: () => {
      clearPendingInviteToken();
      setLocation("/app/today");
    },
  });

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    clearPendingInviteToken();
  }, [isAuthenticated, token]);

  const rememberInvite = () => rememberPendingInviteToken(token);

  return <main className="min-h-screen bg-[#F7F4EE] px-4 py-10 sm:px-6"><div className="mx-auto flex min-h-[72vh] max-w-xl items-center"><Card className="w-full border-[#1E2824]/10 shadow-xl shadow-[#1E2824]/5"><CardHeader className="space-y-4"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><UserPlus className="h-6 w-6" /></div><CardTitle className="text-2xl">გუნდის მოწვევა</CardTitle><CardDescription>სალონFlow-ში უსაფრთხო ჩართვისთვის შედით მოწვეული ელფოსტით ან შექმენით ანგარიში იმავე ელფოსტაზე.</CardDescription></CardHeader><CardContent className="space-y-5">{hasValidTokenShape && (preview.isLoading || loading) ? <div className="flex items-center gap-3 rounded-xl border border-dashed p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />მოწვევა იტვირთება…</div> : null}{!hasValidTokenShape || preview.isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">მოწვევა მიუწვდომელია, ვადაგასულია ან უკვე გამოყენებულია.</div> : null}{preview.data ? <div className="rounded-2xl bg-primary/5 p-5"><p className="text-sm text-muted-foreground">ორგანიზაცია</p><p className="mt-1 text-xl font-semibold">{preview.data.organizationName}</p><p className="mt-4 text-sm text-muted-foreground">მოწვეული როლი</p><p className="mt-1 font-medium">{roleLabels[preview.data.role] ?? preview.data.role}</p><p className="mt-4 text-xs text-muted-foreground">მოწვევა ძალაშია {new Intl.DateTimeFormat("ka-GE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(preview.data.expiresAt)}-მდე.</p></div> : null}{preview.data && !loading && !isAuthenticated ? <div className="grid gap-3 sm:grid-cols-2"><Button className="w-full" asChild><Link href="/login" onClick={rememberInvite}><ShieldCheck className="mr-2 h-4 w-4" />ელფოსტით შესვლა</Link></Button><Button className="w-full" variant="outline" asChild><Link href="/register" onClick={rememberInvite}><UserPlus className="mr-2 h-4 w-4" />რეგისტრაცია</Link></Button></div> : null}{preview.data && isAuthenticated ? <Button className="w-full" disabled={acceptInvite.isPending} onClick={() => acceptInvite.mutate({ token })}>{acceptInvite.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}{acceptInvite.isPending ? "მოწვევა მიიღება…" : "მოწვევის მიღება"}</Button> : null}{acceptInvite.error ? <p className="text-sm text-destructive">მოწვევის მიღება ვერ მოხერხდა. დარწმუნდით, რომ მოწვევის ელფოსტა ემთხვევა შესული ანგარიშის ელფოსტას.</p> : null}</CardContent></Card></div></main>;
}
