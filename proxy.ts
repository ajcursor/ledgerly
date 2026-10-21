import { NextResponse, type NextRequest } from "next/server";
import {
  ACTING_CUSTOMER_COOKIE,
  ACTING_CUSTOMER_HEADER,
  findSyntheticCustomer,
} from "@/lib/synthetic-customers";

/**
 * `?as=<customer email>` selects the acting customer for Sentry.
 * The email is forwarded on this request and stored for the next one.
 * An unknown or empty value clears the selection.
 */
export function proxy(request: NextRequest) {
  const asParam = request.nextUrl.searchParams.get("as");
  if (asParam === null) return NextResponse.next();

  const customer = findSyntheticCustomer(asParam);
  const requestHeaders = new Headers(request.headers);
  if (customer) {
    requestHeaders.set(ACTING_CUSTOMER_HEADER, customer.email);
  } else {
    requestHeaders.delete(ACTING_CUSTOMER_HEADER);
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (customer) {
    response.cookies.set(ACTING_CUSTOMER_COOKIE, customer.email, {
      path: "/",
      sameSite: "lax",
      httpOnly: false,
      secure: request.nextUrl.protocol === "https:",
    });
  } else {
    response.cookies.delete(ACTING_CUSTOMER_COOKIE);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!sentry-tunnel|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
