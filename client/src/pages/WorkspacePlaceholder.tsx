import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkspacePlaceholder({ title, description }: { title: string; description: string }) {
  return <DashboardLayout><div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center"><Card className="w-full border-primary/20"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description} ამ ეკრანის უსაფრთხო მონაცემ-ფენას ვაშენებ ფონურ სამუშაო ნაკადში.</p></CardContent></Card></div></DashboardLayout>;
}
