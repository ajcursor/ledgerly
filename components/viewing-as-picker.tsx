"use client";

import { viewingAsNavigationHref, type ViewingAsOption } from "@/lib/demo/viewing-as";

export function ViewingAsPicker({
  selectedEmail,
  options,
}: {
  selectedEmail: string;
  options: ViewingAsOption[];
}) {
  const selected = options.find((option) => option.email === selectedEmail);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <label htmlFor="viewing-as" className="shrink-0 text-xs text-muted-foreground max-sm:sr-only">
        Viewing as
      </label>
      <div className="w-[9rem] min-w-0 overflow-hidden sm:w-[12.5rem] md:w-[16.5rem]">
        <select
          id="viewing-as"
          value={selectedEmail}
          title={selected ? `${selected.username} · ${selected.company}` : "Viewing as"}
          onChange={(event) => {
            const email = event.target.value;
            if (email === selectedEmail) return;
            window.location.assign(viewingAsNavigationHref(window.location.href, email));
          }}
          className="h-9 w-full min-w-0 cursor-pointer truncate rounded-lg border border-transparent bg-muted px-2 text-xs text-foreground outline-none focus:border-ring focus:bg-card focus:ring-[3px] focus:ring-ring/20"
        >
          {options.map((option) => (
            <option key={option.email} value={option.email}>
              {option.username} · {option.company}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
