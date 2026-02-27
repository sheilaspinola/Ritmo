"use client";

import { Task } from "@/lib/types";

export function TaskRow({
  task,
  starred,
  onToggle,
  onDelete,
  onStar,
  onEdit,
}: {
  task: Task;
  starred: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onStar: () => void;
  onEdit?: () => void;
}) {
  const time = task.startTime
    ? `${task.startTime}${task.endTime ? `–${task.endTime}` : ""}`
    : "Sem horário";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className={[
              "h-5 w-5 rounded border flex items-center justify-center",
              task.done ? "bg-slate-900 border-slate-900" : "border-slate-300",
            ].join(" ")}
            aria-label="Concluir"
          >
            {task.done ? <span className="text-white text-xs">✓</span> : null}
          </button>

          <div className="min-w-0">
            <div
              className={[
                "text-sm font-semibold truncate",
                task.done ? "line-through text-slate-400" : "",
              ].join(" ")}
            >
              {task.title}
            </div>
            <div className="text-xs text-slate-600 mt-0.5">
              {time}
              {task.tag ? ` • ${task.tag}` : ""}
              {task.repeat?.enabled ? " • fixa" : ""}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onStar}
          className={[
            "rounded-xl px-2 py-1 text-sm border",
            starred
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-white border-slate-200 text-slate-700",
          ].join(" ")}
          aria-label="Fixar no Top 3"
        >
          ★
        </button>

        {onEdit && (
          <button
            onClick={onEdit}
            className="rounded-xl px-2 py-1 text-sm border border-slate-200 text-slate-700"
          >
            Editar
          </button>
        )}

        <button
          onClick={onDelete}
          className="rounded-xl px-2 py-1 text-sm border border-slate-200 text-slate-700"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}