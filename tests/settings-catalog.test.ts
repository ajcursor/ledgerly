import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SettingsPage from "@/app/settings/page";
import { DEMO_OPERATOR } from "@/lib/demo-session";
import { planLabel } from "@/lib/plans";

describe("settings catalog", () => {
  it("shows only the three catalog prices for Fieldnote Workspace", async () => {
    const html = renderToStaticMarkup(await SettingsPage());
    expect(html).toContain("Fieldnote Workspace");
    expect(html).toContain(`${DEMO_OPERATOR.name} · ${DEMO_OPERATOR.role}`);
    expect(html).toContain("Starter");
    expect(html).toContain("Growth");
    expect(html).toContain("Scale");
    expect(html).not.toContain("Enterprise");

    const amounts = html.match(/\$[\d,]+\.\d{2}/g) ?? [];
    expect([...amounts].sort()).toEqual(
      ["$0.00", "$0.00", "$0.00", "$249.00", "$49.00", "$99.00"].sort(),
    );
  });
});

describe("plan labels", () => {
  it("refuses an unknown plan label", () => {
    expect(() => planLabel("ENTERPRISE")).toThrow(/Unknown plan/);
  });
});
