"use client";

import { useMemo, useState } from "react";
import { DayKey, Goal } from "@/lib/types";
import { DAYS, uid } from "@/lib/utils";

export function GoalsView({
  goals,
  onAdd,
  onDelete,
  onAllocate,
}: {
  goals: Goal[];
  onAdd: (g: Goal) => void;
  onDelete: (id: string) => void;
  onAllocate: (goal: Goal, dayKey: DayKey, startTime?: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Pessoal");
  const [durationMin, setDurationMin] = useState(30);

  const [allocDay, setAllocDay] = useState<DayKey>("mon");
  const [allocTime, setAllocTime] = useState<string>("");

  const empty = useMemo(() => goals.length === 0, [goals.length]);

  function add() {
    const t = title.trim();
    if (!t) return;
    onAdd({
      id: uid(),
      title: t,
      tag,
      durationMin,
      createdAt: Date.now(),
    });
    setTitle("");
    setTag("Pessoal");
    setDurationMin(30);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Objetivos</div>
          <div className="text-xs text-slate-600 mt-1">
            Jogue aqui ideias/tarefas que você quer fazer. Depois você agenda.
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        <input
          className="w-full border border-slate-200 rounded-2xl p-2 text-sm"
          placeholder="Novo objetivo (ex.: Alongar 3x semana)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid grid-cols-3 gap-2">
          <select
            className="border border-slate-200 rounded-2xl p-2 text-sm"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            {["Trabalho", "Casa", "Saúde", "Família", "Admin", "Pessoal"].map(
              (x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              )
            )}
          </select>

          <select
            className="border border-slate-200 rounded-2xl p-2 text-sm"
            value={durationMin}
            onChange={(e) => setDurationMin(Number(e.target.value))}
          >
            <option value={15}>15min</option>
            <option value={30}>30min</option>
            <option value={45}>45min</option>
            <option value={60}>1h</option>
            <option value={90}>1h30</option>
            <option value={120}>2h</option>
          </select>

          <button
            onClick={add}
            className="rounded-2xl bg-slate-900 text-white text-sm font-semibold"
          >
            + Adicionar
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
        <div className="text-xs text-slate-600 font-semibold">
          Agendar objetivo
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <select
            className="border border-slate-200 rounded-2xl p-2 text-sm bg-white"
            value={allocDay}
            onChange={(e) => setAllocDay(e.target.value as DayKey)}
          >
            {DAYS.map((d) => (
              <option key={d.key} value={d.key}>
                {d.label}
              </option>
            ))}
          </select>

          <input
            type="time"
            className="border border-slate-200 rounded-2xl p-2 text-sm bg-white"
            value={allocTime}
            onChange={(e) => setAllocTime(e.target.value)}
          />

          <div className="text-xs text-slate-500 flex items-center">
            (horário opcional)
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {empty ? (
          <div className="text-sm text-slate-500">
            Nenhum objetivo ainda. Adicione acima 👆
          </div>
        ) : (
          goals.map((g) => (
            <div
              key={g.id}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{g.title}</div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {g.tag ?? "Pessoal"} • {g.durationMin}min
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onAllocate(g, allocDay, allocTime || undefined)}
                  className="rounded-xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white"
                >
                  Agendar
                </button>

                <button
                  onClick={() => onDelete(g.id)}
                  className="rounded-xl px-3 py-2 text-sm border border-slate-200 text-slate-700"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}