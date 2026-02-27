"use client";

import { useEffect, useMemo, useState } from "react";
import { DayKey, Task } from "@/lib/types";
import { DAYS, computeTaskRange, overlaps, uid } from "@/lib/utils";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function rangeLabel(r: [number, number]) {
  const sH = Math.floor(r[0] / 60);
  const sM = r[0] % 60;
  const eH = Math.floor(r[1] / 60);
  const eM = r[1] % 60;
  return `${pad2(sH)}:${pad2(sM)}–${pad2(eH)}:${pad2(eM)}`;
}

export function TaskModal({
  open,
  onClose,
  selectedDay,
  defaultNotifyMin,
  presetStartTime,
  allTasks,
  editingTask,
  onSaveTasks,
}: {
  open: boolean;
  onClose: () => void;
  selectedDay: DayKey;
  defaultNotifyMin: number;
  presetStartTime?: string | null;
  allTasks: Task[];
  editingTask: Task | null;
  onSaveTasks: (
    tasks: Task[],
    opts?: { editAllGroup?: boolean; groupId?: string; baseId?: string }
  ) => void;
}) {
  const [title, setTitle] = useState("");
  const [dayKey, setDayKey] = useState<DayKey>(selectedDay);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMin, setDurationMin] = useState(30);
  const [tag, setTag] = useState("Trabalho");
  const [notify, setNotify] = useState(true);
  const [notifyMin, setNotifyMin] = useState(defaultNotifyMin);

  // fixa
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatDays, setRepeatDays] = useState<DayKey[]>([]);
  const [editAllGroup, setEditAllGroup] = useState(false);

  const isEditing = !!editingTask;
  const isEditingFixed = !!editingTask?.repeat?.enabled;

  useEffect(() => {
    if (!open) return;

    setNotifyMin(defaultNotifyMin);
    setEditAllGroup(false);

    if (editingTask) {
      setTitle(editingTask.title);
      setDayKey(editingTask.dayKey);
      setStartTime(editingTask.startTime ?? "");
      setEndTime(editingTask.endTime ?? "");
      setDurationMin(editingTask.durationMin ?? 30);
      setTag(editingTask.tag ?? "Trabalho");
      setNotify(!!editingTask.notify);
      setNotifyMin(editingTask.notifyMin ?? defaultNotifyMin);

      const rep = editingTask.repeat;
      setRepeatEnabled(!!rep?.enabled);
      setRepeatDays(rep?.days?.length ? rep.days : [editingTask.dayKey]);
      return;
    }

    // novo
    setTitle("");
    setDayKey(selectedDay);
    setStartTime(presetStartTime ?? "");
    setEndTime("");
    setDurationMin(30);
    setTag("Trabalho");
    setNotify(true);
    setNotifyMin(defaultNotifyMin);

    setRepeatEnabled(false);
    setRepeatDays([]);
  }, [open, editingTask, selectedDay, presetStartTime, defaultNotifyMin]);

  // quando liga repeat no modo "novo", já coloca o dia selecionado como padrão (mas deixa desmarcar)
  useEffect(() => {
    if (!open) return;
    if (editingTask) return;
    if (!repeatEnabled) return;
    if (repeatDays.length === 0) setRepeatDays([selectedDay]);
  }, [open, repeatEnabled, repeatDays.length, selectedDay, editingTask]);

  const newRange = useMemo(() => {
    if (!startTime) return null;
    const base: Task = {
      id: "x",
      title: "x",
      dayKey,
      startTime,
      endTime: endTime || undefined,
      durationMin: endTime ? undefined : durationMin,
      priority: "media",
      done: false,
    };
    return computeTaskRange(base);
  }, [dayKey, startTime, endTime, durationMin]);

  const conflicts = useMemo(() => {
    if (!newRange) return [];
    const sameDay = allTasks.filter((t) => t.dayKey === dayKey);

    const filtered = isEditing
      ? sameDay.filter((t) => t.id !== editingTask!.id)
      : sameDay;

    const hits: { task: Task; range: [number, number] }[] = [];
    for (const t of filtered) {
      const r = computeTaskRange(t);
      if (!r) continue;
      if (overlaps(newRange, r)) hits.push({ task: t, range: r });
    }
    return hits.sort((a, b) => a.range[0] - b.range[0]);
  }, [newRange, allTasks, dayKey, isEditing, editingTask]);

  if (!open) return null;

  function toggleRepeatDay(d: DayKey) {
    setRepeatDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function buildTaskForDay(d: DayKey, groupId?: string, daysList?: DayKey[]): Task {
    const days = daysList ?? [];
    return {
      id: uid(),
      title: title.trim(),
      dayKey: d,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      durationMin: endTime ? undefined : startTime ? durationMin : undefined,
      tag: tag || undefined,
      priority: "media",
      done: false,
      notify,
      notifyMin: notify ? notifyMin : undefined,
      repeat:
        repeatEnabled && groupId
          ? {
              enabled: true,
              days,
              groupId,
            }
          : undefined,
    };
  }

  function save() {
    const t = title.trim();
    if (!t) return;

    // EDIÇÃO
    if (editingTask) {
      const updated: Task = {
        ...editingTask,
        title: t,
        dayKey,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        durationMin: endTime ? undefined : startTime ? durationMin : undefined,
        tag: tag || undefined,
        notify,
        notifyMin: notify ? notifyMin : undefined,
      };

      // se for fixa e usuário quer editar dias, mantém repeatDays atualizado
      if (isEditingFixed && editingTask.repeat?.groupId) {
        const daysList = repeatEnabled
          ? Array.from(new Set(repeatDays))
          : []; // se desligar repeat, vira normal

        const patch = {
          ...updated,
          repeat: repeatEnabled
            ? { enabled: true, days: daysList, groupId: editingTask.repeat.groupId }
            : undefined,
        };

        if (editAllGroup) {
          onSaveTasks([patch], { editAllGroup: true, groupId: editingTask.repeat.groupId });
        } else {
          onSaveTasks([patch], { baseId: editingTask.id });
        }

        onClose();
        return;
      }

      // tarefa normal
      onSaveTasks([updated], { baseId: editingTask.id });
      onClose();
      return;
    }

    // NOVA FIXA
    if (repeatEnabled) {
      const daysList = Array.from(new Set(repeatDays));
      if (daysList.length === 0) return; // precisa selecionar ao menos 1 dia

      const groupId = uid();
      const tasks = daysList.map((d) => buildTaskForDay(d, groupId, daysList));
      onSaveTasks(tasks);
      onClose();
      return;
    }

    // NOVA NORMAL
    const task: Task = {
      id: uid(),
      title: t,
      dayKey,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      durationMin: endTime ? undefined : startTime ? durationMin : undefined,
      tag: tag || undefined,
      priority: "media",
      done: false,
      notify,
      notifyMin: notify ? notifyMin : undefined,
    };

    onSaveTasks([task]);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-4 border border-slate-200">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">
              {editingTask ? "Editar tarefa" : "Nova tarefa"}
            </div>
            <div className="text-xs text-slate-500">
              Pode deixar sem horário. Se tiver horário, avisamos conflito.
            </div>
          </div>
          <button onClick={onClose} className="text-sm text-slate-600">
            Fechar
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          <input
            className="w-full border border-slate-200 rounded-xl p-2 text-sm"
            placeholder="Título (ex.: Almoço)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              className="border border-slate-200 rounded-xl p-2 text-sm"
              value={dayKey}
              onChange={(e) => setDayKey(e.target.value as DayKey)}
              disabled={repeatEnabled && !editingTask} // evita confusão (fixa define pelos botões)
            >
              {DAYS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.long}
                </option>
              ))}
            </select>

            <select
              className="border border-slate-200 rounded-xl p-2 text-sm"
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
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              className="border border-slate-200 rounded-xl p-2 text-sm"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <input
              type="time"
              className="border border-slate-200 rounded-xl p-2 text-sm"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="border border-slate-200 rounded-xl p-2 text-sm"
              value={durationMin}
              onChange={(e) => setDurationMin(Number(e.target.value))}
              disabled={!startTime || !!endTime}
            >
              <option value={15}>15min</option>
              <option value={30}>30min</option>
              <option value={45}>45min</option>
              <option value={60}>1h</option>
              <option value={90}>1h30</option>
              <option value={120}>2h</option>
            </select>

            <label className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-xl px-3">
              <input
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />
              Lembrete
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              max={240}
              className="border border-slate-200 rounded-xl p-2 text-sm"
              value={notifyMin}
              onChange={(e) => setNotifyMin(Number(e.target.value))}
              disabled={!notify}
              placeholder="min antes"
            />
            <div className="text-xs text-slate-500 flex items-center">
              * Push real vem com PWA
            </div>
          </div>

          {/* FIXA (novo e edição) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(e) => {
                  const v = e.target.checked;
                  setRepeatEnabled(v);
                  if (v && repeatDays.length === 0) setRepeatDays([selectedDay]);
                }}
              />
              Tarefa fixa (repete na semana)
            </label>

            {repeatEnabled && (
              <>
                <div className="text-xs text-slate-600 mt-2">
                  Selecione os dias (você pode marcar/desmarcar qualquer um).
                </div>

                <div className="mt-2 grid grid-cols-7 gap-1">
                  {DAYS.map((d) => {
                    const active = repeatDays.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => toggleRepeatDay(d.key)}
                        className={[
                          "rounded-xl border text-xs py-2",
                          active
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white text-slate-700 border-slate-200",
                        ].join(" ")}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>

                {repeatDays.length === 0 && (
                  <div className="mt-2 text-xs text-red-600">
                    Selecione pelo menos 1 dia.
                  </div>
                )}
              </>
            )}
          </div>

          {/* EDITAR GRUPO (fixas) */}
          {isEditingFixed && (
            <label className="flex items-center gap-2 text-sm text-slate-700 border border-slate-200 rounded-xl px-3 py-2">
              <input
                type="checkbox"
                checked={editAllGroup}
                onChange={(e) => setEditAllGroup(e.target.checked)}
              />
              Aplicar mudanças em todas as fixas desse grupo
            </label>
          )}

          {/* CONFLITO */}
          {conflicts.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
              <div className="text-sm font-semibold text-amber-800">
                Atenção: horário ocupado
              </div>
              <div className="text-xs text-amber-800 mt-1">
                {newRange ? `Você está tentando salvar ${rangeLabel(newRange)}.` : null}
              </div>
              <div className="mt-2 space-y-1">
                {conflicts.slice(0, 3).map((c) => (
                  <div key={c.task.id} className="text-xs text-amber-900">
                    • {c.task.title} ({rangeLabel(c.range)})
                  </div>
                ))}
                {conflicts.length > 3 && (
                  <div className="text-xs text-amber-900">
                    +{conflicts.length - 3} conflito(s)
                  </div>
                )}
              </div>
              <div className="text-xs text-amber-900 mt-2">
                Você pode salvar mesmo assim, ou ajustar o horário.
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 rounded-xl py-2 text-sm"
          >
            Cancelar
          </button>

          <button
            onClick={save}
            className="flex-1 bg-slate-900 text-white rounded-xl py-2 text-sm font-semibold"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}