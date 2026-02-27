"use client";

import { useEffect, useState } from "react";
import type { Goal } from "@/lib/types";
import { uid } from "@/lib/utils";

export function GoalModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (goal: Goal) => void;
}) {
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("Pessoal");
  const [durationMin, setDurationMin] = useState(30);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setTag("Pessoal");
    setDurationMin(30);
    setNotes("");
  }, [open]);

  if (!open) return null;

  function save() {
    const t = title.trim();
    if (!t) return;

    onSave({
      id: uid(),
      title: t,
      tag: tag || undefined,
      durationMin,
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
    });

    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-t-3xl p-4 border border-slate-200">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Novo objetivo</div>
            <div className="text-xs text-slate-500">
              Depois você aloca na agenda quando tiver espaço.
            </div>
          </div>
          <button onClick={onClose} className="text-sm text-slate-600">
            Fechar
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          <input
            className="w-full border border-slate-200 rounded-xl p-2 text-sm"
            placeholder="Título (ex.: Ler 10 páginas)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2">
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

            <select
              className="border border-slate-200 rounded-xl p-2 text-sm"
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
          </div>

          <textarea
            className="w-full border border-slate-200 rounded-xl p-2 text-sm"
            placeholder="Notas (opcional)"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
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