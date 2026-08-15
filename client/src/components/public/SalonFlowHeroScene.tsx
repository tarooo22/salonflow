import { CalendarDays, CheckCircle2, CreditCard, UsersRound } from "lucide-react";
import { useState, type CSSProperties, type PointerEvent } from "react";

type SceneStyle = CSSProperties & { "--scene-x": string; "--scene-y": string };

export function SalonFlowHeroScene() {
  const [depth, setDepth] = useState({ x: 0, y: 0 });
  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    setDepth({ x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2, y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2 });
  };
  const style: SceneStyle = { "--scene-x": String(depth.x), "--scene-y": String(depth.y) };

  return <div className="sf-hero-scene" style={style} onPointerMove={handleMove} onPointerLeave={() => setDepth({ x: 0, y: 0 })} aria-label="SalonFlow-ის სამუშაო სივრცის ვიზუალური მიმოხილვა">
    <div className="sf-hero-scene__glow" aria-hidden="true" />
    <div className="sf-hero-scene__canvas">
      <div className="sf-hero-scene__toolbar"><div className="sf-hero-scene__brand"><span>S</span><p>SalonFlow</p></div><div className="sf-hero-scene__toolbar-pill"><span className="sf-hero-scene__pulse" />სამუშაო დღე</div></div>
      <div className="sf-hero-scene__main">
        <div className="sf-hero-scene__calendar"><div className="sf-hero-scene__calendar-header"><div><p>კალენდარი</p><strong>დღის ხედვა</strong></div><CalendarDays aria-hidden="true" /></div><div className="sf-hero-scene__grid" aria-hidden="true"><span>09:00</span><i /><span>11:00</span><i /><span>13:00</span><i /><span>15:00</span><i /></div><div className="sf-hero-scene__booking-block"><p>სერვისი · სპეციალისტი</p><strong>დადასტურებული ჩაწერა</strong></div></div>
        <div className="sf-hero-scene__side"><SceneCard icon={UsersRound} label="კლიენტები" title="კონტექსტი ერთ სივრცეში" tone="jade" /><SceneCard icon={CreditCard} label="ფინანსები" title="გადახდის სტატუსი" tone="amber" /></div>
      </div>
    </div>
    <div className="sf-hero-scene__float sf-hero-scene__float--booking"><CheckCircle2 aria-hidden="true" /><div><p>ონლაინ ჩაწერა</p><strong>დაცული დადასტურება</strong></div></div>
    <div className="sf-hero-scene__float sf-hero-scene__float--team"><UsersRound aria-hidden="true" /><div><p>გუნდი</p><strong>როლებით დაცული</strong></div></div>
    <p className="sr-only">SalonFlow აერთიანებს კალენდარს, ონლაინ ჩაწერას, კლიენტების კონტექსტს და ფინანსურ სტატუსებს ერთ სამუშაო სივრცეში.</p>
  </div>;
}

function SceneCard({ icon: Icon, label, title, tone }: { icon: typeof UsersRound; label: string; title: string; tone: "jade" | "amber" }) {
  return <div className={`sf-hero-scene__mini sf-hero-scene__mini--${tone}`}><Icon aria-hidden="true" /><p>{label}</p><strong>{title}</strong></div>;
}
