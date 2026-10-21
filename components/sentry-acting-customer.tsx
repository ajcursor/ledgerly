"use client";

import { useEffect } from "react";
import { applyActingCustomer } from "@/lib/sentry-user";
import type { SyntheticCustomer } from "@/lib/synthetic-customers";

/** Sets the browser Sentry user from the customer the server already resolved. */
export function SentryActingCustomer({ customer }: { customer: SyntheticCustomer }) {
  useEffect(() => {
    applyActingCustomer(customer);
  }, [customer]);

  return null;
}
