"use client";

import { Task, DayKey } from "@/lib/types";
import { DAYS, computeBusyMinutes, toMinutes, minutesLabel } from "@/lib/utils";

export function WeekView({
  tasks,
  dayStart,
  dayEnd,
  onSelectDay,
}: {
  tasks: Task[];
  dayStart: string;
  dayEnd: string;
  onSelectDay: (d: DayKey) => void;
}) {
  const startMin = toMinutes(dayStart);
  const endMin = toMinutes(dayEnd);
  const totalDay = Math.max(1, endMin - startMin);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold">Semana</div>
      <div className="text-xs text-slate-600 mt-1">
        Toque em um dia para abrir em “Hoje”.
      </div>

      <div className="mt-3 grid gap-2">
        {DAYS.map((d) => {
          const busy = computeBusyMinutes(tasks, d.key, startMin, endMin);
          const pct = Math.max(0, Math.min(100, Math.round((busy / totalDay) * 100)));

          return (
            <button
              key={d.key}
              onClick={() => onSelectDay(d.key)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left hover:bg-slate-50 transition"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{d.long}</div>
                <div className="text-xs text-slate-600">{minutesLabel(busy)}</div>
              </div>

              <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-2 bg-slate-900" style={{ width: `${pct}%` }} />
              </div>

              <div className="mt-1 text-xs text-slate-500">{pct}% ocupado</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}