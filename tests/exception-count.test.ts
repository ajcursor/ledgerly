import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
}));

import { AppShell } from "@/components/app-shell";
import { defaultActingCustomer } from "@/lib/synthetic-customers";
import { prisma } from "@/lib/prisma";

const BADGE_CLASS =
  "rounded-full bg-indigo px-1.5 text-[11px] leading-5 text-primary-foreground";

describe("open exception count", () => {
  it("badges open and needs-review disputes and leaves closed ones out", async () => {
    const rows = await prisma.dispute.findMany({ select: { id: true, status: true } });
    const openIds = rows
      .filter((row) => row.status === "OPEN" || row.status === "NEEDS_REVIEW")
      .map((row) => row.id)
      .sort();
    expect(openIds).toEqual(["dsp_1041", "dsp_1043", "dsp_1047", "dsp_1049"]);
    expect(rows.some((row) => row.status === "ACCEPTED")).toBe(true);

    const html = renderToStaticMarkup(
      await AppShell({
        actingCustomer: defaultActingCustomer(),
        children: "Book",
      }),
    );

    expect(html).toContain(`${BADGE_CLASS}">4</span>`);
    expect(html).not.toContain(`${BADGE_CLASS}">5</span>`);
    expect(html).toContain('aria-label="Open exceptions"');
    expect(html).toContain("Avery Quinn");
    expect(html).not.toContain("dsp_1050");
  });
});
