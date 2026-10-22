import { NextResponse, type NextRequest } from "next/server";
import { actingCustomerCookieDecision } from "@/lib/acting-customer";
import { ACTING_CUSTOMER_HEADER } from "@/lib/synthetic-customers";

/**
 * `?as=<customer email>` selects the acting customer for Sentry.
 * The email is forwarded on this request and stored for the next one.
 * An unknown or empty value clears the selection.
 */
export function proxy(request: NextRequest) {
  const asParam = request.nextUrl.searchParams.get("as");
  if (asParam === null) return NextResponse.next();

  const decision = actingCustomerCookieDecision(asParam, request.nextUrl.protocol === "https:");
  const requestHeaders = new Headers(request.headers);
  if (decision.action === "set") {
    requestHeaders.set(ACTING_CUSTOMER_HEADER, decision.email);
  } else {
    requestHeaders.delete(ACTING_CUSTOMER_HEADER);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (decision.action === "set") {
    response.cookies.set(decision.name, decision.value, {
      path: decision.path,
      sameSite: decision.sameSite,
      httpOnly: decision.httpOnly,
      secure: decision.secure,
    });
  } else {
    response.cookies.delete(decision.name);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!sentry-tunnel|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
