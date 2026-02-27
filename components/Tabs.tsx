"use client";
import { TabKey } from "@/lib/types";

const TABS: { k: TabKey; label: string }[] = [
  { k: "hoje", label: "Hoje" },
  { k: "semana", label: "Semana" },
  { k: "livre", label: "Tempo livre" },
  { k: "objetivos", label: "Objetivos" },
  { k: "config", label: "Config" },
];

export function Tabs({
  tab,
  onChange,
}: {
  tab: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <div className="mt-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const active = tab === t.k;
          return (
            <button
              key={t.k}
              onClick={() => onChange(t.k)}
              className={[
                "shrink-0 rounded-2xl px-4 py-2 text-sm border transition",
                active
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}