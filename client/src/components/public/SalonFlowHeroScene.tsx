import { CalendarDays, CheckCircle2, ShieldCheck, UsersRound } from "lucide-react";
import { useState, type CSSProperties, type PointerEvent } from "react";

type SceneStyle = CSSProperties & { "--scene-x": string; "--scene-y": string };

const appointments = [
  { time: "10:30", name: "სტუმრის ჩანაწერი", service: "არჩეული სერვისი", tone: "fuchsia" },
  { time: "12:00", name: "შემდეგი დრო", service: "კალენდრის კონტექსტი", tone: "violet" },
  { time: "14:15", name: "დღის ბლოკი", service: "სპეციალისტის განრიგი", tone: "teal" },
];

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
    <span className="sf-orb sf-hero-scene__orb sf-hero-scene__orb--a" aria-hidden="true" />
    <span className="sf-orb sf-hero-scene__orb sf-hero-scene__orb--b" aria-hidden="true" />
    <div className="sf-hero-scene__canvas sf-grain">
      <div className="sf-hero-scene__toolbar">
        <div className="sf-hero-scene__brand"><span>S</span><p>SalonFlow</p></div>
        <div className="sf-hero-scene__toolbar-pill"><span className="sf-hero-scene__pulse" />ცოცხალი დღე</div>
      </div>
      <div className="sf-hero-scene__main">
        <div className="sf-hero-scene__revenue" aria-hidden="true">
          <p>დღის რიტმი</p>
          <strong>თქვენი მონაცემები</strong>
          <div className="sf-hero-scene__spark"><i style={{ height: "42%" }} /><i style={{ height: "66%" }} /><i style={{ height: "52%" }} /><i style={{ height: "84%" }} /><i style={{ height: "70%" }} /><i style={{ height: "96%" }} /></div>
        </div>
        <div className="sf-hero-scene__calendar">
          <div className="sf-hero-scene__calendar-header"><div><p>კალენდარი</p><strong>დღის ხედვა</strong></div><CalendarDays aria-hidden="true" /></div>
          <div className="sf-hero-scene__agenda" aria-hidden="true">
            {appointments.map(item => <div key={item.time} className={`sf-hero-scene__slot sf-hero-scene__slot--${item.tone}`}><span className="sf-hero-scene__slot-time">{item.time}</span><span className="sf-hero-scene__slot-body"><strong>{item.name}</strong><small>{item.service}</small></span></div>)}
          </div>
        </div>
      </div>
    </div>
    <div className="sf-hero-scene__float sf-hero-scene__float--booking"><span className="sf-hero-scene__float-icon sf-hero-scene__float-icon--jade"><CheckCircle2 aria-hidden="true" /></span><div><p>ონლაინ ჩაწერა</p><strong>დაცული დადასტურება</strong></div></div>
    <div className="sf-hero-scene__float sf-hero-scene__float--team"><span className="sf-hero-scene__float-icon sf-hero-scene__float-icon--violet"><UsersRound aria-hidden="true" /></span><div><p>გუნდი</p><strong>როლზე მორგებული წვდომა</strong></div></div>
    <div className="sf-hero-scene__float sf-hero-scene__float--growth"><span className="sf-hero-scene__float-icon sf-hero-scene__float-icon--pink"><ShieldCheck aria-hidden="true" /></span><div><p>ოპერაციები</p><strong>სერვერზე დაცული შემოწმება</strong></div></div>
    <p className="sr-only">ილუსტრაციული ხედვა: SalonFlow აერთიანებს კალენდარს, ონლაინ ჩაწერას, კლიენტების კონტექსტს და ფინანსურ სტატუსებს ერთ სამუშაო სივრცეში. მონაცემები არ წარმოადგენს რეალურ სალონის სტატისტიკას.</p>
  </div>;
}
