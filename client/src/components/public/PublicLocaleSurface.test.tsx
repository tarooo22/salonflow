import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PublicLocaleProvider } from "@/contexts/PublicLocaleContext";
import { PublicHeader } from "./PublicPrimitives";

vi.mock("wouter", () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>, useLocation: () => ["/", vi.fn()] }));

describe("public multilingual navigation", () => {
  it("renders English and Russian tourist-facing labels without changing the Georgian default", () => {
    const english = renderToStaticMarkup(<PublicLocaleProvider initialLocale="en"><PublicHeader /></PublicLocaleProvider>);
    const russian = renderToStaticMarkup(<PublicLocaleProvider initialLocale="ru"><PublicHeader /></PublicLocaleProvider>);

    expect(english).toContain("Online booking");
    expect(english).toContain("Sign in");
    expect(russian).toContain("Онлайн-запись");
    expect(russian).toContain("Войти");
  });
});
