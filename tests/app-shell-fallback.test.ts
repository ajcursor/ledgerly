import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("@/lib/data", () => ({
  getOpenDisputeCount: vi.fn(async () => {
    throw new Error("dispute count unavailable");
  }),
  getOpenDisputeNotices: vi.fn(async () => {
    throw new Error("dispute notices unavailable");
  }),
}));

import { AppShell } from "@/components/app-shell";
import { getOpenDisputeCount, getOpenDisputeNotices } from "@/lib/data";
import { defaultActingCustomer } from "@/lib/synthetic-customers";

const BADGE_CLASS =
  "rounded-full bg-indigo px-1.5 text-[11px] leading-5 text-primary-foreground";

describe("app shell notice fallback", () => {
  it("keeps the book on screen when the open-dispute queries throw", async () => {
    const html = renderToStaticMarkup(
      await AppShell({
        actingCustomer: defaultActingCustomer(),
        children: "Book",
      }),
    );

    expect(getOpenDisputeCount).toHaveBeenCalledOnce();
    expect(getOpenDisputeNotices).toHaveBeenCalledOnce();
    expect(html).toContain("Book");
    expect(html).toContain('aria-label="Open exceptions"');
    expect(html).not.toContain(BADGE_CLASS);
  });
});
