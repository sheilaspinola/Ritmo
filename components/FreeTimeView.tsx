"use client";

import { useMemo, useState } from "react";
import { DayKey, Task } from "@/lib/types";
import { DAYS, computeFreeSlots, minutesLabel, toMinutes } from "@/lib/utils";

type Period = "all" | "morning" | "afternoon" | "night";

function fmt(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function inPeriod(startMin: number, period: Period) {
  if (period === "all") return true;
  // manhã: < 12:00, tarde: 12:00–17:59, noite: >= 18:00
  if (period === "morning") return startMin < 12 * 60;
  if (period === "afternoon") return startMin >= 12 * 60 && startMin < 18 * 60;
  return startMin >= 18 * 60;
}

export function FreeTimeView({
  tasks,
  dayStart,
  dayEnd,
  onSchedule,
}: {
  tasks: Task[];
  dayStart: string;
  dayEnd: string;
  onSchedule: (day: DayKey, startTime: string) => void;
}) {
  const [minDuration, setMinDuration] = useState(30);
  const [period, setPeriod] = useState<Period>("all");

  const startMin = toMinutes(dayStart);
  const endMin = toMinutes(dayEnd);

  const slots = useMemo(() => {
    const all: { day: DayKey; s: number; e: number }[] = [];

    for (const d of DAYS) {
      const free = computeFreeSlots(tasks, d.key, startMin, endMin);
      for (const [s, e] of free) {
        const dur = e - s;
        if (dur < minDuration) continue;
        if (!inPeriod(s, period)) continue;
        all.push({ day: d.key, s, e });
      }
    }

    // “melhores” = maior duração, depois mais cedo
    all.sort((a, b) => {
      const da = a.e - a.s;
      const db = b.e - b.s;
      if (db !== da) return db - da;
      return a.s - b.s;
    });

    return all.slice(0, 16);
  }, [tasks, startMin, endMin, minDuration, period]);

  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Tempo livre inteligente</div>
        <div className="text-xs text-slate-600 mt-1">
          Filtre e encaixe tarefas no melhor espaço.
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <select
            className="border border-slate-200 rounded-2xl p-2 text-sm bg-white"
            value={minDuration}
            onChange={(e) => setMinDuration(Number(e.target.value))}
          >
            <option value={15}>Mín. 15min</option>
            <option value={30}>Mín. 30min</option>
            <option value={45}>Mín. 45min</option>
            <option value={60}>Mín. 1h</option>
            <option value={90}>Mín. 1h30</option>
            <option value={120}>Mín. 2h</option>
          </select>

          <select
            className="border border-slate-200 rounded-2xl p-2 text-sm bg-white"
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
          >
            <option value="all">Qualquer período</option>
            <option value="morning">Manhã</option>
            <option value="afternoon">Tarde</option>
            <option value="night">Noite</option>
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="text-sm font-semibold">Sugestões de encaixe</div>
        <div className="text-xs text-slate-600 mt-1">
          Toque em “Agendar aqui” para abrir o modal com o horário preenchido.
        </div>

        <div className="mt-3 space-y-2">
          {slots.length === 0 ? (
            <div className="text-sm text-slate-500">
              Nada encontrado com esses filtros.
            </div>
          ) : (
            slots.map((x, i) => {
              const dayLabel = DAYS.find((d) => d.key === x.day)?.label ?? x.day;
              const dur = x.e - x.s;

              return (
                <div
                  key={`${x.day}-${x.s}-${i}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{dayLabel}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {fmt(x.s)}–{fmt(x.e)} · {minutesLabel(dur)}
                      </div>
                    </div>

                    <button
                      onClick={() => onSchedule(x.day, fmt(x.s))}
                      className="rounded-2xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white"
                    >
                      Agendar aqui
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}