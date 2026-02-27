"use client";

import { Profile } from "@/lib/types";

export function HeaderCard({
  profile,
  quote,
  onNew,
}: {
  profile: Profile;
  quote: string;
  onNew: () => void;
}) {
  const name = profile.name?.trim();

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">Ritmo</div>
          <div className="text-xl font-semibold leading-tight">
            {name ? `Bom dia, ${name}` : "Bom dia"}
          </div>
          <div className="mt-1 text-sm text-slate-600">{quote}</div>
        </div>

        <button
          onClick={onNew}
          className="rounded-2xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white"
        >
          + Nova
        </button>
      </div>
    </div>
  );
}