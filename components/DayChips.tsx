"use client";

import { DayKey } from "@/lib/types";
import { DAYS } from "@/lib/utils";

export function DayChips({
  selected,
  onSelect,
}: {
  selected: DayKey;
  onSelect: (d: DayKey) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {DAYS.map((d) => {
        const active = selected === d.key;
        return (
          <button
            key={d.key}
            onClick={() => onSelect(d.key)}
            className={[
              "rounded-2xl px-3 py-2 text-sm border transition",
              active
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
            ].join(" ")}
            title={d.long}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}