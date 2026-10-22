import { createElement } from "react";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { ViewingAsPicker } from "@/components/viewing-as-picker";
import { actingCustomerCookieDecision } from "@/lib/acting-customer";
import { isDemoModeEnabled } from "@/lib/demo/mode";
import {
  viewingAsCustomers,
  viewingAsNavigationHref,
  viewingAsOptions,
  viewingAsPickerModel,
} from "@/lib/demo/viewing-as";
import { ACTING_CUSTOMER_COOKIE, defaultActingCustomer, findSyntheticCustomer } from "@/lib/synthetic-customers";
import { proxy } from "@/proxy";

const HUBSPOT = [
  {
    id: "cus_quarrypine",
    username: "Ellis Marlow",
    company: "Cobalt Goods",
    plan: "Scale",
    email: "ellis.marlow@cobaltgoods.brightdesk-demo.co.uk",
  },
  {
    id: "cus_fernway",
    username: "Sam Okafor",
    company: "Fernway Logistics",
    plan: "Growth",
    email: "sam.okafor@fernway.brightdesk-demo.co.uk",
  },
  {
    id: "cus_harborline",
    username: "Jordan Hale",
    company: "Acme North",
    plan: "Growth",
    email: "jordan.hale@acmenorth.brightdesk-demo.co.uk",
  },
  {
    id: "cus_copperleaf",
    username: "Lila Shore",
    company: "Copperleaf Atelier",
    plan: "Growth",
    email: "lila.shore@copperleaf.brightdesk-demo.co.uk",
  },
] as const;

const SKIP_DIRS = new Set(["node_modules", ".git", ".next", "out", "coverage"]);

function filesUnder(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...filesUnder(full));
    else if (/\.(ts|tsx|md|mdc|html|json|example|txt)$/.test(entry.name)) found.push(full);
  }
  return found;
}

describe("viewing-as customer picker", () => {
  it("lists the four HubSpot contacts from the customer catalog", () => {
    expect(viewingAsCustomers().map((customer) => ({
      id: customer.id,
      username: customer.username,
      company: customer.company,
      plan: customer.plan,
      email: customer.email,
    }))).toEqual([...HUBSPOT]);
    expect(defaultActingCustomer().email).toBe(HUBSPOT[0].email);
  });

  it("drops the old .example addresses for these contacts", () => {
    const stale = [
      ["accounts", "cobaltgoods.example"].join("@"),
      ["billing", "acmenorth.example"].join("@"),
      ["studio", "copperleaf.example"].join("@"),
    ];
    for (const email of stale) {
      expect(findSyntheticCustomer(email)).toBeNull();
    }

    const hits: string[] = [];
    for (const file of filesUnder(process.cwd())) {
      const text = readFileSync(file, "utf8");
      for (const email of stale) {
        if (text.includes(email)) hits.push(`${file}: ${email}`);
      }
    }
    expect(hits).toEqual([]);
  });

  it("sets the same cookie as ?as= and refreshes through that query", () => {
    for (const customer of viewingAsCustomers()) {
      const href = viewingAsNavigationHref(
        "http://localhost:43173/disputes/dsp_1043?status=OPEN#note",
        customer.email.toUpperCase(),
      );
      const url = new URL(href);
      expect(url.pathname).toBe("/disputes/dsp_1043");
      expect(url.searchParams.get("status")).toBe("OPEN");
      expect(url.searchParams.get("as")).toBe(customer.email.toUpperCase());
      expect(url.hash).toBe("#note");

      const decision = actingCustomerCookieDecision(url.searchParams.get("as") ?? "", false);
      expect(decision).toEqual({
        action: "set",
        email: customer.email,
        name: ACTING_CUSTOMER_COOKIE,
        value: customer.email,
        path: "/",
        sameSite: "lax",
        httpOnly: false,
        secure: false,
      });

      const response = proxy(new NextRequest(href));
      expect(response.cookies.get(ACTING_CUSTOMER_COOKIE)?.value).toBe(customer.email);
      const setCookie = response.headers.getSetCookie().join("\n");
      expect(setCookie).toContain("Path=/");
      expect(setCookie.toLowerCase()).toContain("samesite=lax");
      expect(setCookie.toLowerCase()).not.toContain("httponly");
      expect(setCookie.toLowerCase()).not.toContain("secure");
    }
  });

  it("marks the cookie secure only on https", () => {
    const email = HUBSPOT[2].email;
    const decision = actingCustomerCookieDecision(email, true);
    expect(decision.action === "set" && decision.secure).toBe(true);

    const response = proxy(new NextRequest(`https://ledgerly.local/invoices?as=${encodeURIComponent(email)}`));
    expect(response.headers.getSetCookie().join("\n").toLowerCase()).toContain("secure");
  });

  it("clears the cookie for an unknown or empty selection", () => {
    for (const email of ["", "   ", "person@realco.com"]) {
      expect(actingCustomerCookieDecision(email, false)).toEqual({
        action: "clear",
        name: ACTING_CUSTOMER_COOKIE,
      });
    }

    const response = proxy(new NextRequest("http://localhost:43173/invoices?as="));
    const setCookie = response.headers.getSetCookie().join("\n");
    expect(setCookie).toContain(ACTING_CUSTOMER_COOKIE);
    expect(setCookie).not.toContain(HUBSPOT[0].email);
    expect(proxy(new NextRequest("http://localhost:43173/invoices")).headers.getSetCookie()).toEqual([]);
  });

  it("shows the current customer and hides the picker unless demo mode is on", () => {
    const ellis = defaultActingCustomer();
    expect(isDemoModeEnabled({})).toBe(false);
    expect(isDemoModeEnabled({ DEMO_MODE: "TRUE" })).toBe(false);
    expect(isDemoModeEnabled({ DEMO_MODE: "true" })).toBe(true);
    expect(viewingAsPickerModel(false, ellis)).toBeNull();

    const model = viewingAsPickerModel(true, ellis);
    expect(model?.selectedEmail).toBe(ellis.email);
    expect(model?.options.map((option) => option.email)).toEqual(HUBSPOT.map((row) => row.email));

    const other = findSyntheticCustomer("hello@riverstone.example");
    if (!other) throw new Error("Riverstone Labs is missing from the catalog.");
    const extended = viewingAsOptions(other);
    expect(extended[0]?.email).toBe(other.email);
    expect(extended).toHaveLength(HUBSPOT.length + 1);

    const html = renderToStaticMarkup(
      createElement(ViewingAsPicker, {
        selectedEmail: ellis.email,
        options: model?.options ?? [],
      }),
    );
    expect(html).toContain("Viewing as");
    expect(html).toContain('for="viewing-as"');
    expect(html).toContain('id="viewing-as"');
    for (const row of HUBSPOT) {
      expect(html).toContain(row.username);
      expect(html).toContain(row.company);
      expect(html).toContain(row.email);
    }
    const selected = html.match(/<option\b[^>]*\bselected\b[^>]*>/)?.[0] ?? "";
    expect(selected).toContain(ellis.email);
  });
});
