import Link from "next/link";
import { isDemoBugEnabled } from "@/lib/demo/bugs";
import { cn } from "@/lib/utils";

/** Pages read `status`. The planted filter bug still writes `state`. */
export function statusFilterQueryKey(): "state" | "status" {
  return isDemoBugEnabled("filter_state") ? "state" : "status";
}

export function filterPillHref(
  pathname: string,
  itemId: string,
  extra?: { q?: string },
): string {
  const params = new URLSearchParams();
  if (itemId !== "ALL") params.set(statusFilterQueryKey(), itemId);
  if (extra?.q) params.set("q", extra.q);
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function FilterPills({
  pathname,
  value,
  extra,
  items,
}: {
  pathname: string;
  value: string;
  extra?: Record<string, string | undefined>;
  items: { id: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const href = filterPillHref(pathname, item.id, extra?.q ? { q: extra.q } : undefined);
        const active = value === item.id;
        return (
          <Link
            key={item.id}
            href={href}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              active
                ? "border-indigo bg-indigo text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
