import { createRequire } from "node:module";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as getDispute } from "@/app/api/disputes/[id]/route";
import { POST as resolveDisputeRoute } from "@/app/api/disputes/[id]/resolve/route";
import { GET as listDisputes } from "@/app/api/disputes/route";
import { GET as getInvoice } from "@/app/api/invoices/[id]/route";
import { GET as listInvoices } from "@/app/api/invoices/route";
import { GET as suggestedCreditV1 } from "@/app/api/v1/disputes/[id]/suggested-credit/route";
import { GET as suggestedCreditV2 } from "@/app/api/v2/disputes/[id]/suggested-credit/route";
import { prisma } from "@/lib/prisma";
import { ACTING_CUSTOMER_COOKIE } from "@/lib/synthetic-customers";
import { config as proxyConfig, proxy } from "@/proxy";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setTag: vi.fn(),
  setUser: vi.fn(),
}));

/**
 * Composes proxy.ts and the route the way Next.js 16.3.2 does.
 * Matcher compilation: node_modules/next/dist/build/analysis/get-page-static-info.js:333-372
 * Match: node_modules/next/dist/shared/lib/router/utils/middleware-route-matcher.js:12-28
 * Terminal vs continue: node_modules/next/dist/server/lib/router-utils/resolve-routes.js:411-521
 * A terminal proxy response (no x-middleware-next, rewrite, or location) is the
 * client response. The route handler is not called. NextResponse.next() continues
 * into the handler with the overridden request headers.
 *
 * Untested surfaces that also have no operator session: the server pages
 * app/page.tsx, app/invoices/page.tsx, app/invoices/[id]/page.tsx,
 * app/disputes/page.tsx, app/disputes/[id]/page.tsx, app/collections/page.tsx,
 * and app/settings/page.tsx. app/api/demo/job, app/api/mock/nudge, and
 * app/api/mock/pulse do not read the customer book or post a credit.
 * app/api/demo/trigger-error and app/api/demo/suggested-credit-over-refund
 * return 404 unless DEMO_MODE is the string "true".
 */

const require = createRequire(import.meta.url);
const { getMiddlewareMatchers } = require("next/dist/build/analysis/get-page-static-info.js") as {
  getMiddlewareMatchers: (
    matcher: unknown,
    nextConfig: { basePath?: string; i18n?: unknown },
  ) => { regexp: string; originalSource?: string }[];
};
const { getMiddlewareRouteMatcher } = require("next/dist/shared/lib/router/utils/middleware-route-matcher.js") as {
  getMiddlewareRouteMatcher: (
    matchers: { regexp: string }[],
  ) => (pathname: string, req: { headers: Record<string, string> }, query: Record<string, string>) => boolean;
};
const { toNodeOutgoingHttpHeaders } = require("next/dist/server/web/utils.js") as {
  toNodeOutgoingHttpHeaders: (headers: Headers) => Record<string, string | string[] | undefined>;
};
const { filterReqHeaders, ipcForbiddenHeaders } = require("next/dist/server/lib/server-ipc/utils.js") as {
  filterReqHeaders: (
    headers: Record<string, string | string[] | undefined>,
    forbidden: string[],
  ) => Record<string, string | string[] | undefined>;
  ipcForbiddenHeaders: string[];
};
const { getRelativeURL } = require("next/dist/shared/lib/router/utils/relativize-url.js") as {
  getRelativeURL: (url: string, base: string) => string;
};
const { parseUrl } = require("next/dist/shared/lib/router/utils/parse-url.js") as {
  parseUrl: (url: string) => { pathname: string; search: string; protocol?: string };
};

const proxyMatches = getMiddlewareRouteMatcher(getMiddlewareMatchers(proxyConfig.matcher, {}));

const ORIGIN = "http://127.0.0.1:43173";

type DisputeRow = {
  id: string;
  status: string;
  suggestedCreditCents: number;
  reviewerNote: string | null;
  disputedAmountCents: number;
  invoiceId: string;
};

type InvoiceRow = {
  id: string;
  status: string;
  totalCents: number;
  customerId: string;
};

const HEADER_SKIP = new Set([
  "content-length",
  "x-middleware-rewrite",
  "x-middleware-redirect",
  "x-middleware-refresh",
]);

function nodeHeadersFrom(request: Request): Record<string, string | undefined> {
  const headers: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return headers;
}

function headersFromNode(headers: Record<string, string | string[] | undefined>): Headers {
  const out = new Headers();
  for (const [key, value] of Object.entries(headers)) {
    if (typeof value === "string") out.set(key, value);
    else if (Array.isArray(value)) {
      for (const entry of value) out.append(key, entry);
    }
  }
  return out;
}

function handlerFor(method: string, pathname: string): ((request: Request) => Promise<Response>) | null {
  if (method === "GET" && pathname === "/api/invoices") {
    return (request) => listInvoices(request);
  }
  if (method === "GET" && pathname === "/api/disputes") {
    return (request) => listDisputes(request);
  }
  const invoice = pathname.match(/^\/api\/invoices\/([^/]+)$/);
  if (method === "GET" && invoice) {
    const id = decodeURIComponent(invoice[1]);
    return (request) => getInvoice(request, { params: Promise.resolve({ id }) });
  }
  const dispute = pathname.match(/^\/api\/disputes\/([^/]+)$/);
  if (method === "GET" && dispute) {
    const id = decodeURIComponent(dispute[1]);
    return (request) => getDispute(request, { params: Promise.resolve({ id }) });
  }
  const resolve = pathname.match(/^\/api\/disputes\/([^/]+)\/resolve$/);
  if (method === "POST" && resolve) {
    const id = decodeURIComponent(resolve[1]);
    return (request) => resolveDisputeRoute(request, { params: Promise.resolve({ id }) });
  }
  const v1 = pathname.match(/^\/api\/v1\/disputes\/([^/]+)\/suggested-credit$/);
  if (method === "GET" && v1) {
    const id = decodeURIComponent(v1[1]);
    return (request) => suggestedCreditV1(request, { params: Promise.resolve({ id }) });
  }
  const v2 = pathname.match(/^\/api\/v2\/disputes\/([^/]+)\/suggested-credit$/);
  if (method === "GET" && v2) {
    const id = decodeURIComponent(v2[1]);
    return (request) => suggestedCreditV2(request, { params: Promise.resolve({ id }) });
  }
  return null;
}

/**
 * Apply the proxy decision from Next.js 16.3.2 resolve-routes.js, then call the
 * route only when that decision continues.
 */
async function dispatch(
  method: string,
  path: string,
  init?: { body?: string; headers?: Record<string, string> },
): Promise<Response> {
  const url = new URL(path, ORIGIN);
  const headers = new Headers(init?.headers);
  if (init?.body !== undefined && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const original = new Request(url, {
    method,
    headers,
    body: init?.body,
  });
  let pathname = url.pathname;
  let search = url.search;
  const reqHeaders = nodeHeadersFrom(original);

  if (proxyMatches(pathname, { headers: {} }, {})) {
    const proxyResponse = proxy(new NextRequest(original.clone()));
    const middlewareHeaders = toNodeOutgoingHttpHeaders(proxyResponse.headers);
    const override = middlewareHeaders["x-middleware-override-headers"];
    if (override) {
      const overridden = new Set(
        (Array.isArray(override) ? override : override.split(",")).map((key) => key.trim()),
      );
      delete middlewareHeaders["x-middleware-override-headers"];
      for (const key of Object.keys(reqHeaders)) {
        if (!overridden.has(key)) delete reqHeaders[key];
      }
      for (const key of overridden) {
        const valueKey = "x-middleware-request-" + key;
        const newValue = middlewareHeaders[valueKey];
        const oldValue = reqHeaders[key];
        if (oldValue !== newValue) {
          reqHeaders[key] = newValue === null || newValue === undefined ? undefined : String(newValue);
        }
        delete middlewareHeaders[valueKey];
      }
    }
    if (
      !middlewareHeaders["x-middleware-rewrite"] &&
      !middlewareHeaders["x-middleware-next"] &&
      !middlewareHeaders["location"]
    ) {
      middlewareHeaders["x-middleware-refresh"] = "1";
    }
    delete middlewareHeaders["x-middleware-next"];
    filterReqHeaders(middlewareHeaders, ipcForbiddenHeaders);
    for (const [key, value] of Object.entries(middlewareHeaders)) {
      if (HEADER_SKIP.has(key)) continue;
      if (key === "x-middleware-set-cookie") {
        reqHeaders[key] = Array.isArray(value) ? value.join(",") : value;
        continue;
      }
      if (value) reqHeaders[key] = Array.isArray(value) ? value.join(",") : value;
    }
    if (middlewareHeaders["location"] || middlewareHeaders["x-middleware-refresh"]) {
      return proxyResponse;
    }
    const rewrite = middlewareHeaders["x-middleware-rewrite"];
    if (typeof rewrite === "string") {
      const destination = getRelativeURL(rewrite, url.toString());
      const parsed = parseUrl(destination);
      if (parsed.protocol) return proxyResponse;
      pathname = parsed.pathname;
      search = parsed.search;
    }
  }

  const handler = handlerFor(method, pathname);
  if (!handler) {
    return new Response(JSON.stringify({ error: `no route for ${method} ${pathname}` }), { status: 500 });
  }
  const continued = new Request(`${ORIGIN}${pathname}${search}`, {
    method,
    headers: headersFromNode(reqHeaders),
    body: init?.body,
  });
  return handler(continued);
}

async function book(): Promise<{ disputes: DisputeRow[]; invoices: InvoiceRow[]; secrets: string[] }> {
  const [disputes, invoices, customers] = await Promise.all([
    prisma.dispute.findMany({ orderBy: { id: "asc" } }),
    prisma.invoice.findMany({ orderBy: { id: "asc" } }),
    prisma.customer.findMany({ orderBy: { id: "asc" } }),
  ]);
  const disputeRows: DisputeRow[] = disputes.map((row) => ({
    id: row.id,
    status: row.status,
    suggestedCreditCents: row.suggestedCreditCents,
    reviewerNote: row.reviewerNote,
    disputedAmountCents: row.disputedAmountCents,
    invoiceId: row.invoiceId,
  }));
  const invoiceRows: InvoiceRow[] = invoices.map((row) => ({
    id: row.id,
    status: row.status,
    totalCents: row.totalCents,
    customerId: row.customerId,
  }));
  const secrets = [
    ...customers.flatMap((customer) => [customer.email, customer.name, customer.contactName]),
    ...disputes.map((dispute) => dispute.reason),
  ].filter((value) => value.length > 3);
  return { disputes: disputeRows, invoices: invoiceRows, secrets };
}

async function restore(snapshot: { disputes: DisputeRow[]; invoices: InvoiceRow[] }) {
  for (const row of snapshot.disputes) {
    await prisma.dispute.update({
      where: { id: row.id },
      data: {
        status: row.status,
        suggestedCreditCents: row.suggestedCreditCents,
        reviewerNote: row.reviewerNote,
        disputedAmountCents: row.disputedAmountCents,
        invoiceId: row.invoiceId,
      },
    });
  }
  for (const row of snapshot.invoices) {
    await prisma.invoice.update({
      where: { id: row.id },
      data: {
        status: row.status,
        totalCents: row.totalCents,
        customerId: row.customerId,
      },
    });
  }
}

let snapshot: { disputes: DisputeRow[]; invoices: InvoiceRow[] } | undefined;

afterEach(async () => {
  if (snapshot) await restore(snapshot);
  snapshot = undefined;
});

async function expectRejected(
  response: Response,
  before: { disputes: DisputeRow[]; invoices: InvoiceRow[]; secrets: string[] },
) {
  const text = await response.text();
  const after = await book();
  const leaked = before.secrets.filter((secret) => text.includes(secret));
  const rejected = response.status === 401 || response.status === 403;
  expect({
    status: rejected ? "rejected" : response.status,
    leaked,
    disputes: after.disputes,
    invoices: after.invoices,
    body: rejected ? "" : text.slice(0, 500),
  }).toEqual({
    status: "rejected",
    leaked: [],
    disputes: before.disputes,
    invoices: before.invoices,
    body: "",
  });
}

describe("anonymous billing API", () => {
  it("rejects an unauthenticated accept and leaves every dispute and invoice unchanged", async () => {
    snapshot = await book();
    const response = await dispatch("POST", "/api/disputes/dsp_1043/resolve", {
      body: JSON.stringify({
        action: "accept",
        reviewerNote: "anonymous accept",
        disputeId: "dsp_1047",
      }),
    });
    await expectRejected(response, snapshot);
  });

  it("rejects an unauthenticated decline and does not write the reviewer note", async () => {
    snapshot = await book();
    const response = await dispatch("POST", "/api/disputes/dsp_1047/resolve", {
      body: JSON.stringify({
        action: "decline",
        reviewerNote: "anonymous decline",
        disputeId: "dsp_1043",
      }),
    });
    await expectRejected(response, snapshot);
  });

  it("does not treat the acting-customer cookie or ?as= as an operator session", async () => {
    snapshot = await book();
    const otherCustomer = "hello@riverstone.example";
    const response = await dispatch(
      "POST",
      `/api/disputes/dsp_1043/resolve?as=${encodeURIComponent(otherCustomer)}`,
      {
        headers: { cookie: `${ACTING_CUSTOMER_COOKIE}=${encodeURIComponent(otherCustomer)}` },
        body: JSON.stringify({ action: "accept", reviewerNote: "cookie is not a session" }),
      },
    );
    await expectRejected(response, snapshot);
  });

  it("does not treat a placeholder Authorization header as an operator session", async () => {
    snapshot = await book();
    const response = await dispatch("POST", "/api/disputes/dsp_1049/resolve", {
      headers: { authorization: "Bearer placeholder" },
      body: JSON.stringify({ action: "accept", reviewerNote: "placeholder token" }),
    });
    await expectRejected(response, snapshot);
  });

  it("rejects an anonymous invoice list", async () => {
    snapshot = await book();
    const response = await dispatch("GET", "/api/invoices");
    await expectRejected(response, snapshot);
  });

  it("rejects an anonymous invoice read", async () => {
    snapshot = await book();
    const response = await dispatch("GET", "/api/invoices/inv_1043");
    await expectRejected(response, snapshot);
  });

  it("rejects an anonymous dispute list", async () => {
    snapshot = await book();
    const response = await dispatch("GET", "/api/disputes");
    await expectRejected(response, snapshot);
  });

  it("rejects an anonymous dispute read", async () => {
    snapshot = await book();
    const response = await dispatch("GET", "/api/disputes/dsp_1043");
    await expectRejected(response, snapshot);
  });

  it("rejects an anonymous v1 suggested-credit read", async () => {
    snapshot = await book();
    const response = await dispatch("GET", "/api/v1/disputes/dsp_1043/suggested-credit");
    await expectRejected(response, snapshot);
  });

  it("rejects an anonymous v2 suggested-credit read", async () => {
    snapshot = await book();
    const response = await dispatch("GET", "/api/v2/disputes/dsp_1043/suggested-credit");
    await expectRejected(response, snapshot);
  });
});
