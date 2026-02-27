import { DayKey, Task } from "./types";

export const DAYS: { key: DayKey; label: string; long: string }[] = [
  { key: "mon", label: "Seg", long: "Segunda-feira" },
  { key: "tue", label: "Ter", long: "Terça-feira" },
  { key: "wed", label: "Qua", long: "Quarta-feira" },
  { key: "thu", label: "Qui", long: "Quinta-feira" },
  { key: "fri", label: "Sex", long: "Sexta-feira" },
  { key: "sat", label: "Sáb", long: "Sábado" },
  { key: "sun", label: "Dom", long: "Domingo" },
];

export function dayLabelLong(day: DayKey) {
  return DAYS.find((d) => d.key === day)?.long ?? "Dia";
}

export const DEFAULT_QUOTES = [
  "Devagar e sempre.",
  "Um passo por vez.",
  "Consistência vence.",
  "Hoje é um bom dia.",
  "Priorize o essencial.",
];

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function todayKey(): DayKey {
  const d = new Date().getDay(); // 0=dom ... 6=sab
  const map: Record<number, DayKey> = {
    0: "sun",
    1: "mon",
    2: "tue",
    3: "wed",
    4: "thu",
    5: "fri",
    6: "sat",
  };
  return map[d] ?? "mon";
}

export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

export function minutesLabel(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function taskStartMin(t: Task) {
  if (!t.startTime) return 9999;
  return toMinutes(t.startTime);
}

export function sortByTime(a: Task, b: Task) {
  return taskStartMin(a) - taskStartMin(b);
}

export function computeTaskRange(t: Task): [number, number] | null {
  if (!t.startTime) return null;
  const start = toMinutes(t.startTime);
  if (t.endTime) return [start, toMinutes(t.endTime)];
  if (t.durationMin) return [start, start + t.durationMin];
  return [start, start + 30];
}

export function overlaps(a: [number, number], b: [number, number]) {
  return a[0] < b[1] && b[0] < a[1];
}

export function computeFreeSlots(
  tasks: Task[],
  day: DayKey,
  dayStartMin: number,
  dayEndMin: number
): [number, number][] {
  const ranges = tasks
    .filter((t) => t.dayKey === day)
    .map(computeTaskRange)
    .filter(Boolean) as [number, number][];

  const sorted = ranges.sort((x, y) => x[0] - y[0]);

  const merged: [number, number][] = [];
  for (const r of sorted) {
    if (!merged.length) merged.push([...r]);
    else {
      const last = merged[merged.length - 1];
      if (r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([...r]);
    }
  }

  const slots: [number, number][] = [];
  let cur = dayStartMin;
  for (const [s, e] of merged) {
    if (s > cur) slots.push([cur, Math.min(s, dayEndMin)]);
    cur = Math.max(cur, e);
    if (cur >= dayEndMin) break;
  }
  if (cur < dayEndMin) slots.push([cur, dayEndMin]);

  return slots.filter(([s, e]) => e - s >= 10);
}

export function computeBusyMinutes(
  tasks: Task[],
  day: DayKey,
  dayStartMin?: number,
  dayEndMin?: number
): number {
  const ranges = tasks
    .filter((t) => t.dayKey === day)
    .map(computeTaskRange)
    .filter(Boolean) as [number, number][];

  if (ranges.length === 0) return 0;

  ranges.sort((a, b) => a[0] - b[0]);

  const merged: [number, number][] = [];
  for (const r of ranges) {
    if (!merged.length) merged.push([...r]);
    else {
      const last = merged[merged.length - 1];
      if (r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([...r]);
    }
  }

  const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

  let total = 0;
  for (let [s, e] of merged) {
    if (dayStartMin != null && dayEndMin != null) {
      s = clamp(s, dayStartMin, dayEndMin);
      e = clamp(e, dayStartMin, dayEndMin);
    }
    if (e > s) total += e - s;
  }

  return total;
}