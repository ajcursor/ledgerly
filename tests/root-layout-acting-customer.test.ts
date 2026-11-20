import { renderToReadableStream } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans" }),
  Geist_Mono: () => ({ variable: "font-mono" }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/",
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  setUser: vi.fn(),
  setTag: vi.fn(),
  captureException: vi.fn(),
  init: vi.fn(),
}));

vi.mock("@/lib/data", () => ({
  getOpenDisputeCount: vi.fn(async () => 0),
  getOpenDisputeNotices: vi.fn(async () => []),
}));

import * as Sentry from "@sentry/nextjs";
import { cookies, headers } from "next/headers";
import RootLayout from "@/app/layout";
import {
  ACTING_CUSTOMER_COOKIE,
  ACTING_CUSTOMER_HEADER,
  defaultActingCustomer,
  findSyntheticCustomer,
  type SyntheticCustomer,
} from "@/lib/synthetic-customers";

const jordan = findSyntheticCustomer("jordan.hale@acmenorth.brightdesk-demo.co.uk");
const lila = findSyntheticCustomer("lila.shore@copperleaf.brightdesk-demo.co.uk");
if (!jordan || !lila) {
  throw new Error("Acme North and Copperleaf Atelier are missing from the catalog.");
}

function prime(headerEmail: string | null, cookieEmail: string | null) {
  vi.mocked(headers).mockResolvedValue({
    get: (name: string) => (name === ACTING_CUSTOMER_HEADER ? headerEmail : null),
  } as Awaited<ReturnType<typeof headers>>);
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) =>
      name === ACTING_CUSTOMER_COOKIE && cookieEmail ? { value: cookieEmail } : undefined,
  } as Awaited<ReturnType<typeof cookies>>);
}

async function renderLayout() {
  const element = await RootLayout({ children: "Folio" });
  const stream = await renderToReadableStream(element);
  await stream.allReady;
  return new Response(stream).text();
}

function expectCustomer(customer: SyntheticCustomer) {
  expect(Sentry.setUser).toHaveBeenCalledTimes(1);
  expect(Sentry.setUser).toHaveBeenCalledWith({
    id: customer.id,
    email: customer.email,
    username: customer.username,
  });
  expect(Sentry.setTag).toHaveBeenCalledWith("company", customer.company);
  expect(Sentry.setTag).toHaveBeenCalledWith("customer.company", customer.company);
  expect(Sentry.setTag).toHaveBeenCalledWith("plan", customer.plan);
}

describe("root layout acting customer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attributes the request header ahead of the acting-customer cookie", async () => {
    prime(jordan.email, null);
    const html = await renderLayout();
    expectCustomer(jordan);
    expect(html).toContain("Folio");

    vi.clearAllMocks();
    prime(jordan.email, lila.email);
    await renderLayout();
    expectCustomer(jordan);
  });

  it("uses the cookie when the header is blank or outside the catalog", async () => {
    prime("   ", lila.email);
    await renderLayout();
    expectCustomer(lila);

    vi.clearAllMocks();
    prime("person@realco.com", lila.email);
    await renderLayout();
    expectCustomer(lila);
  });

  it("attributes the default customer when the selection is missing or unknown", async () => {
    const ellis = defaultActingCustomer();
    prime(null, null);
    const html = await renderLayout();
    expectCustomer(ellis);
    expect(html).toContain("Folio");
    expect(html).toContain("localStorage.getItem('ledgerly-theme')==='dark'");

    vi.clearAllMocks();
    prime(null, "person@realco.com");
    await renderLayout();
    expectCustomer(ellis);
  });
});
