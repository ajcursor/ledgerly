"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";

/** Invoice queue URL. Pages read `status` and `q`; ALL and a blank query add nothing. */
export function invoiceSearchHref(status: string | undefined, query: string): string {
  const params = new URLSearchParams();
  if (status && status !== "ALL") params.set("status", status);
  const trimmed = query.trim();
  if (trimmed) params.set("q", trimmed);
  const search = params.toString();
  return search ? `/invoices?${search}` : "/invoices";
}

export function SearchField({
  defaultValue,
  status,
  placeholder,
}: {
  defaultValue?: string;
  status?: string;
  placeholder: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function go(next: string) {
    const href = invoiceSearchHref(status, next);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <form
      className="flex w-full gap-2 sm:max-w-xs"
      onSubmit={(event) => {
        event.preventDefault();
        go(value);
      }}
    >
      {status && status !== "ALL" ? <input type="hidden" name="status" value={status} /> : null}
      <Input
        name="q"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          setValue(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => go(next), 220);
        }}
      />
    </form>
  );
}
