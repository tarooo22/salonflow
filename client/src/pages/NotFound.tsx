import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full bg-background px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <Card className="w-full border-border bg-card shadow-[var(--sf-shadow-md)]">
          <CardContent className="p-7 text-center sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Compass className="h-8 w-8" aria-hidden="true" /></div>
            <p className="mt-6 text-sm font-semibold text-primary">404 · გზა ვერ მოიძებნა</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">ეს გვერდი აღარ არის ხელმისაწვდომი</h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">მისამართი შეიძლება არასწორია, შეიცვალა ან აღარ არსებობს. შეგიძლიათ დაბრუნდეთ SalonFlow-ის მთავარ გვერდზე და უსაფრთხოდ გააგრძელოთ.</p>
            <div id="not-found-button-group" className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button onClick={handleGoHome}><Home className="mr-2 h-4 w-4" />მთავარ გვერდზე დაბრუნება</Button>
              <Button variant="outline" onClick={() => window.history.back()}><ArrowLeft className="mr-2 h-4 w-4" />წინა გვერდი</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
