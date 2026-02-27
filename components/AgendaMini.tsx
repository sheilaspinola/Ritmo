"use client";

import { Task } from "@/lib/types";
import { toMinutes, minutesLabel } from "@/lib/utils";

export function AgendaMini({
  tasks,
  dayStart,
  dayEnd,
}: {
  tasks: Task[];
  dayStart: string;
  dayEnd: string;
}) {
  const startMin = toMinutes(dayStart);
  const endMin = toMinutes(dayEnd);
  const totalMin = Math.max(1, endMin - startMin);

  const blocks = tasks
    .filter((t) => t.startTime)
    .map((t) => {
      const s = toMinutes(t.startTime!);
      const e = t.endTime ? toMinutes(t.endTime) : s + (t.durationMin || 0);
      return { task: t, s, e };
    })
    .filter((b) => b.e > b.s)
    .sort((a, b) => a.s - b.s);

  const hours: number[] = [];
  for (let m = startMin; m <= endMin; m += 60) hours.push(m);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-sm font-semibold">Agenda (visual)</div>
          <div className="text-xs text-slate-600">Blocos por horário.</div>
        </div>
        <div className="text-xs text-slate-500">
          {dayStart}–{dayEnd}
        </div>
      </div>

      <div className="mt-3 relative h-[320px] rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
        {/* Linhas de hora */}
        {hours.map((m) => {
          const top = ((m - startMin) / totalMin) * 100;
          return (
            <div
              key={m}
              className="absolute left-0 right-0 flex items-center gap-2 px-2"
              style={{ top: `${top}%` }}
            >
              <div className="w-10 text-[10px] text-slate-400">
                {String(Math.floor(m / 60)).padStart(2, "0")}:00
              </div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
          );
        })}

        {/* Blocos */}
        {blocks.map(({ task, s, e }) => {
          const top = ((s - startMin) / totalMin) * 100;
          const height = Math.max(7, ((e - s) / totalMin) * 100);
          return (
            <div
              key={task.id}
              className="absolute left-12 right-2 rounded-xl border border-slate-300 bg-slate-900 text-white text-xs px-2 py-1 overflow-hidden"
              style={{ top: `${top}%`, height: `${height}%` }}
              title={task.title}
            >
              <div className="font-semibold truncate">{task.title}</div>
              <div className="text-[10px] opacity-80">
                {task.startTime} · {minutesLabel(e - s)}
              </div>
            </div>
          );
        })}

        {blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
            Sem tarefas com horário
          </div>
        )}
      </div>
    </div>
  );
}