import React from "react";
import { Link, useLocation } from "wouter";
import "./panel.css";

const TABS = [
  { href: "/app/marketplace", label: "კატალოგში გამოჩენა" },
  { href: "/app/media", label: "ფოტოები და აღწერა" },
  { href: "/app/feedback", label: "შეფასებები" },
] as const;

/** Sub-navigation shared by the three online-page screens; the current route is marked with aria-current. */
export function OnlinePageTabs({ className }: { className?: string }) {
  const [location] = useLocation();
  const path = location.split(/[?#]/)[0];
  return (
    <nav aria-label="ონლაინ გვერდის განყოფილებები" className={`cwk-pagetabs${className ? ` ${className}` : ""}`}>
      <ul>
        {TABS.map(tab => (
          <li key={tab.href}>
            <Link href={tab.href} className="cwk-pagetab" aria-current={path === tab.href ? "page" : undefined}>{tab.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
