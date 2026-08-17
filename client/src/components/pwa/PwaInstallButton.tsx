import { Download } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export function PwaInstallButton({ compact = false }: { compact?: boolean }) {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (event: Event) => { event.preventDefault(); setInstallPrompt(event as InstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onBeforeInstall); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (!installPrompt || installed) return null;
  return <Button type="button" variant="publicQuiet" size={compact ? "icon" : "sm"} aria-label="SalonFlow აპის დაყენება" title="SalonFlow აპის დაყენება" onClick={async () => { await installPrompt.prompt(); const choice = await installPrompt.userChoice; if (choice.outcome === "accepted") setInstallPrompt(null); }}><Download className={compact ? "size-4" : "mr-1.5 size-3.5"} aria-hidden="true" />{compact ? null : "აპის დაყენება"}</Button>;
}
