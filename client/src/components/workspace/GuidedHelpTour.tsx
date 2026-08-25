import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Check, CircleHelp, EyeOff, ExternalLink, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const TOUR_KEY = "workspace-foundation" as const;
const autoShownKey = (organizationId: string) => `${TOUR_KEY}:auto-shown:${organizationId}`;

type TourRole = "OWNER" | "MANAGER" | "RECEPTIONIST" | "STAFF" | undefined;
type TourStep = { title: string; description: string; path: string; actionLabel: string };

export function guidedTourSteps(role: TourRole): TourStep[] {
  if (role === "OWNER") return [
    { title: "დღის მართვა", description: "აქ იწყება სამუშაო დღე: ნახავთ შემდეგ კლიენტს, booking-ების რაოდენობას და რაც ყველაზე სწრაფად მოითხოვს ყურადღებას.", path: "/app/today", actionLabel: "დღის გვერდის ნახვა" },
    { title: "კალენდარი", description: "ნახეთ დღის ან კვირის განრიგი, დაადასტურეთ ჩანაწერი ან უსაფრთხოდ გადაანაცვლეთ დრო მხოლოდ ხელმისაწვდომი slot-ის ფარგლებში.", path: "/app/calendar", actionLabel: "კალენდრის გახსნა" },
    { title: "სერვისები და გუნდი", description: "ონლაინ ჩაწერისთვის ჯერ მიუთითეთ სერვისის ფასი/ხანგრძლივობა და სპეციალისტის სამუშაო კონტექსტი.", path: "/app/services", actionLabel: "სერვისების გახსნა" },
    { title: "ონლაინ ჩაწერის ბმული", description: "პარამეტრებში იპოვით ფილიალის პირად booking ბმულს. გააზიარეთ მხოლოდ მას შემდეგ, რაც სერვისი და საათები მზად იქნება.", path: "/app/settings", actionLabel: "პარამეტრების გახსნა" },
  ];
  if (role === "MANAGER") return [
    { title: "დღის queue", description: "აქ ჩანს booking-ები, რომლებსაც დღეს მოქმედება სჭირდება — მაგალითად დადასტურება ან სტუმრის მიღება.", path: "/app/today", actionLabel: "დღის გვერდის ნახვა" },
    { title: "კალენდარი", description: "კალენდარში მუშაობთ დროით და ფილიალის კონტექსტით: გადაამოწმეთ დეტალი სანამ სტატუსს ან დროს შეცვლით.", path: "/app/calendar", actionLabel: "კალენდრის გახსნა" },
    { title: "კლიენტები", description: "კლიენტის სივრცეში სწრაფად იპოვით ისტორიას, კონტაქტს და მომავალ ჩანაწერს.", path: "/app/clients", actionLabel: "კლიენტების გახსნა" },
  ];
  if (role === "RECEPTIONIST") return [
    { title: "დღის queue", description: "ჯერ ნახეთ ვინ მოდის ახლა და ვინ არის შემდეგი; ეს გვერდი დაგეხმარებათ მიღებისა და სწრაფი ჩანაწერის მართვაში.", path: "/app/today", actionLabel: "დღის გვერდის ნახვა" },
    { title: "კალენდარი", description: "კალენდარში დაამატებთ ან მოძებნით booking-ს თქვენი უფლებების ფარგლებში.", path: "/app/calendar", actionLabel: "კალენდრის გახსნა" },
    { title: "კლიენტები", description: "კლიენტის ძიება და ისტორია ყოველთვის ხელმისაწვდომია სწრაფი მომსახურებისთვის.", path: "/app/clients", actionLabel: "კლიენტების გახსნა" },
  ];
  return [
    { title: "ჩემი დღე", description: "აქ ნახავთ მხოლოდ თქვენს დღევანდელ booking-ებს და შემდეგი კლიენტის დროს.", path: "/app/today", actionLabel: "ჩემი დღის ნახვა" },
    { title: "ჩემი კალენდარი", description: "კალენდარი გაჩვენებთ მხოლოდ თქვენს სამუშაო კონტექსტს და არ გახსნის სხვის განრიგს.", path: "/app/calendar", actionLabel: "კალენდრის გახსნა" },
    { title: "ჩემი პროფილი", description: "აქ შეგიძლიათ განაახლოთ საკუთარი avatar, აღწერა, გამოცდილება და სპეციალიზაცია. ფილიალი, როლი და ონლაინ ხილვადობა მფლობელის კონტროლში რჩება.", path: "/app/staff", actionLabel: "ჩემი პროფილის გახსნა" },
  ];
}

export function GuidedHelpTour({ organizationId, role, open, onOpenChange }: { organizationId: string; role: TourRole; open: boolean; onOpenChange: (open: boolean) => void }) {
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();
  const steps = useMemo(() => guidedTourSteps(role), [role]);
  const [sessionDismissed, setSessionDismissed] = useState(false);
  const state = trpc.guidedTour.getState.useQuery({ organizationId, tourKey: TOUR_KEY }, { enabled: Boolean(organizationId) });
  const [stepIndex, setStepIndex] = useState(0);
  const save = trpc.guidedTour.saveProgress.useMutation({ onSuccess: () => { void utils.guidedTour.getState.invalidate({ organizationId, tourKey: TOUR_KEY }); } });

  useEffect(() => {
    if (!state.data || sessionDismissed) return;
    setStepIndex(Math.min(state.data.currentStep, Math.max(steps.length - 1, 0)));
    if (!state.data.completed && !state.data.autoShowDisabled && !localStorage.getItem(autoShownKey(organizationId))) {
      localStorage.setItem(autoShownKey(organizationId), "1");
      onOpenChange(true);
    }
  }, [onOpenChange, sessionDismissed, state.data, steps.length]);

  const persist = (nextStep: number, completed: boolean, autoShowDisabled: boolean) => {
    save.mutate({ organizationId, tourKey: TOUR_KEY, currentStep: nextStep, completed, autoShowDisabled });
  };
  const closeForNow = () => {
    setSessionDismissed(true);
    persist(stepIndex, false, false);
    onOpenChange(false);
  };
  const disableAutomatic = () => {
    setSessionDismissed(true);
    persist(stepIndex, false, true);
    onOpenChange(false);
  };
  const previous = () => {
    const next = Math.max(0, stepIndex - 1);
    setStepIndex(next);
    persist(next, false, false);
  };
  const next = () => {
    if (stepIndex >= steps.length - 1) {
      persist(stepIndex, true, false);
      onOpenChange(false);
      return;
    }
    const nextIndex = stepIndex + 1;
    setStepIndex(nextIndex);
    persist(nextIndex, false, false);
  };
  const restart = () => {
    localStorage.removeItem(autoShownKey(organizationId));
    setSessionDismissed(false);
    setStepIndex(0);
    persist(0, false, false);
    onOpenChange(true);
  };
  const step = steps[stepIndex] ?? steps[0];
  if (!step) return null;

  return <Dialog open={open} onOpenChange={value => { if (!value) closeForNow(); else onOpenChange(true); }}>
    <DialogContent className="max-w-md overflow-hidden border-primary/25 p-0" aria-describedby="guided-tour-description">
      <div className="bg-[linear-gradient(135deg,color-mix(in_srgb,var(--sf-violet)_16%,var(--sf-surface)),color-mix(in_srgb,var(--sf-jade)_8%,var(--sf-surface)))] px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4"><span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Sparkles className="size-4" /></span><span className="text-xs font-semibold text-muted-foreground">{stepIndex + 1} / {steps.length}</span></div>
        <DialogHeader className="mt-4 text-left"><DialogTitle className="text-xl">{step.title}</DialogTitle><DialogDescription id="guided-tour-description" className="text-left leading-6">{step.description}</DialogDescription></DialogHeader>
      </div>
      <div className="space-y-4 px-5 pb-5"><Progress value={((stepIndex + 1) / steps.length) * 100} aria-label={`დახმარების ნაბიჯი ${stepIndex + 1} ${steps.length}-დან`} />
        <Button type="button" variant="outline" className="w-full" onClick={() => { setLocation(step.path); closeForNow(); }}><ExternalLink className="mr-2 size-4" />{step.actionLabel}</Button>
        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between"><div className="flex flex-wrap gap-1"><Button type="button" variant="ghost" size="sm" onClick={closeForNow}>ახლა გამოტოვება</Button><Button type="button" variant="ghost" size="sm" onClick={disableAutomatic}><EyeOff className="mr-1.5 size-3.5" />აღარ მაჩვენო</Button></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={previous} disabled={stepIndex === 0 || save.isPending}><ArrowLeft className="mr-1.5 size-3.5" />წინა</Button><Button type="button" size="sm" onClick={next} disabled={save.isPending}>{stepIndex === steps.length - 1 ? <><Check className="mr-1.5 size-3.5" />დასრულება</> : <>შემდეგი<ArrowRight className="ml-1.5 size-3.5" /></>}</Button></div></DialogFooter>
        <button type="button" onClick={restart} className="mx-auto flex min-h-9 items-center gap-1.5 text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"> <CircleHelp className="size-3.5" />დახმარების თავიდან დაწყება</button>
      </div>
    </DialogContent>
  </Dialog>;
}
