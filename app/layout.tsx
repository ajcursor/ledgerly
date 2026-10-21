import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies, headers } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { SentryActingCustomer } from "@/components/sentry-acting-customer";
import { resolveActingCustomer } from "@/lib/acting-customer";
import { applyActingCustomer } from "@/lib/sentry-user";
import {
  ACTING_CUSTOMER_COOKIE,
  ACTING_CUSTOMER_HEADER,
  defaultActingCustomer,
} from "@/lib/synthetic-customers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ledgerly",
    template: "%s · Ledgerly",
  },
  description:
    "Fieldnote Workspace — fictional billing operations. Catalog prices are $49, $99, and $249.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/images/logo-mark.svg", type: "image/svg+xml" },
    ],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const resolved = resolveActingCustomer({
    headerEmail: headerStore.get(ACTING_CUSTOMER_HEADER),
    cookieEmail: cookieStore.get(ACTING_CUSTOMER_COOKIE)?.value,
  });
  const customer = "error" in resolved ? defaultActingCustomer() : resolved.customer;
  applyActingCustomer(customer);

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('ledgerly-theme')==='dark'){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();",
          }}
        />
        <SentryActingCustomer customer={customer} />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
