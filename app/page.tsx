"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { WeekView } from "@/components/WeekView";
import { FreeTimeView } from "@/components/FreeTimeView";
import { ConfigView } from "@/components/ConfigView";
import { HeaderCard } from "@/components/HeaderCard";
import { DayChips } from "@/components/DayChips";
import { Tabs } from "@/components/Tabs";
import { AgendaMini } from "@/components/AgendaMini";
import { TaskRow } from "@/components/TaskRow";
import { TaskModal } from "@/components/TaskModal";
import { GoalsView } from "@/components/GoalsView";

import { AppState, DayKey, TabKey, Task, Goal } from "@/lib/types";
import {
  DEFAULT_QUOTES,
  todayKey,
  sortByTime,
  computeFreeSlots,
  toMinutes,
  minutesLabel,
  dayLabelLong,
} from "@/lib/utils";
import { defaultState, loadState, saveState } from "@/lib/storage";
import { supabase } from "@/lib/supabaseClient";
import {
  getAuthEmail,
  loadRemoteState,
  saveRemoteState,
  signOut,
} from "@/lib/remoteState";
import { uid } from "@/lib/utils";

export default function Home() {
  const [state, setState] = useState<AppState>(defaultState());
  const [selectedDay, setSelectedDay] = useState<DayKey>(todayKey());
  const [tab, setTab] = useState<TabKey>("hoje");
  const [modalOpen, setModalOpen] = useState(false);
  const [presetStartTime, setPresetStartTime] = useState<string | null>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const loadedOnceRef = useRef(false);
  const syncTimerRef = useRef<any>(null);

  useEffect(() => {
    async function check() {
      const email = await getAuthEmail();
      setAuthEmail(email);
      setAuthChecked(true);
    }

    check();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const local = loadState();
    if (local) setState(local);

    (async () => {
      const remote = await loadRemoteState();
      if (remote) {
        setState(remote);
        saveState(remote);
      } else {
        const current = local ?? defaultState();
        const hasSomething =
          (current.tasks?.length ?? 0) > 0 ||
          (current.profile?.name ?? "").trim().length > 0 ||
          (current.profile?.quotes?.length ?? 0) > 0 ||
          (current.goals?.length ?? 0) > 0;

        if (hasSomething) {
          await saveRemoteState(current);
        }
      }

      loadedOnceRef.current = true;
    })();
  }, []);

  useEffect(() => {
    saveState(state);
    if (!loadedOnceRef.current) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      saveRemoteState(state);
    }, 900);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [state]);

  const quote = useMemo(() => {
    const quotes = state.profile.quotes?.length
      ? state.profile.quotes
      : DEFAULT_QUOTES;
    const seed = new Date()
      .toDateString()
      .split("")
      .reduce((a, c) => a + c.charCodeAt(0), 0);
    return quotes[seed % quotes.length];
  }, [state.profile.quotes]);

  const tasksToday = state.tasks
    .filter((t) => t.dayKey === selectedDay)
    .sort(sortByTime);

  const freeSlots = computeFreeSlots(
    state.tasks,
    selectedDay,
    toMinutes(state.settings.dayStart),
    toMinutes(state.settings.dayEnd)
  );

  const topIds = state.top3ByDay?.[selectedDay] || [];
  const topTasks = topIds
    .map((id) => state.tasks.find((t) => t.id === id))
    .filter(Boolean);

  const dayLabel = dayLabelLong(selectedDay);

  function openNewTask() {
    setPresetStartTime(null);
    setEditingTask(null);
    setModalOpen(true);
  }

  function scheduleAt(day: DayKey, startTime: string) {
    setSelectedDay(day);
    setPresetStartTime(startTime);
    setEditingTask(null);
    setModalOpen(true);
  }

  async function syncNow() {
    return await saveRemoteState(state);
  }

  function openEditTask(t: Task) {
    setPresetStartTime(null);
    setEditingTask(t);
    setModalOpen(true);
  }

  function handleSaveTasks(
    tasks: Task[],
    opts?: { editAllGroup?: boolean; groupId?: string; baseId?: string }
  ) {
    setState((prev) => {
      // ✅ EDITAR TODAS AS FIXAS DO GRUPO
      if (opts?.editAllGroup && opts.groupId) {
        const groupId = opts.groupId as string; // garante para o TS
        const patch = tasks[0];

        const updatedTasks = prev.tasks.map((t) => {
          if (t.repeat?.groupId !== groupId) return t;

          return {
            ...t,
            title: patch.title,
            startTime: patch.startTime,
            endTime: patch.endTime,
            durationMin: patch.durationMin,
            tag: patch.tag,
            notify: patch.notify,
            notifyMin: patch.notifyMin,
            repeat: patch.repeat
              ? {
                  enabled: true,
                  groupId, // ✅ string garantida
                  days: patch.repeat.days,
                }
              : undefined,
          };
        });

        const newDays = patch.repeat?.enabled ? patch.repeat.days : null;

        if (!newDays) {
          return { ...prev, tasks: updatedTasks };
        }

        const still = updatedTasks.filter((t) => t.repeat?.groupId !== groupId);
        const groupTasks = updatedTasks.filter((t) => t.repeat?.groupId === groupId);

        const haveDays = new Set(groupTasks.map((t) => t.dayKey));
        const wantDays = new Set(newDays);

        const filteredGroup = groupTasks.filter((t) => wantDays.has(t.dayKey));

        // ✅ cria tarefas que faltam, mantendo repeat.groupId como string
        const template = groupTasks[0];
        const missing = newDays
          .filter((d) => !haveDays.has(d))
          .map((d) => ({
            ...template,
            id: uid(),
            dayKey: d,
            repeat: template.repeat
              ? { ...template.repeat, groupId } // ✅ força string
              : undefined,
          }));

        return { ...prev, tasks: [...missing, ...filteredGroup, ...still] };
      }

      // ✅ EDITAR UMA TAREFA
      if (tasks.length === 1 && opts?.baseId) {
        const updated = tasks[0];
        return {
          ...prev,
          tasks: prev.tasks.map((x) => (x.id === opts.baseId ? updated : x)),
        };
      }

      // ✅ ADICIONAR NOVAS
      return {
        ...prev,
        tasks: [...tasks, ...prev.tasks],
      };
    });

    setEditingTask(null);
  }

  // ✅ Objetivos handlers
  function addGoal(g: Goal) {
    setState((prev) => ({
      ...prev,
      goals: [g, ...(prev.goals || [])],
    }));
  }

  function deleteGoal(id: string) {
    setState((prev) => ({
      ...prev,
      goals: (prev.goals || []).filter((g) => g.id !== id),
    }));
  }

  function allocateGoal(goal: Goal, dayKey: DayKey, startTime?: string) {
    const task: Task = {
      id: uid(),
      title: goal.title,
      dayKey,
      startTime: startTime || undefined,
      durationMin: startTime ? goal.durationMin : undefined,
      tag: goal.tag || "Pessoal",
      priority: "media",
      done: false,
      notify: true,
      notifyMin: state.settings.defaultNotifyMin,
    };

    setState((prev) => ({
      ...prev,
      tasks: [task, ...prev.tasks],
      goals: (prev.goals || []).filter((g) => g.id !== goal.id),
    }));

    setSelectedDay(dayKey);
    setTab("hoje");
  }

  if (!authChecked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-slate-100 p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-sm">
          <div className="text-xl font-bold">Ritmo</div>
          <div className="text-sm text-slate-600 mt-2">Carregando...</div>
        </div>
      </main>
    );
  }

  if (!authEmail) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-slate-50 to-slate-100 p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-sm">
          <div className="text-xs text-slate-500">Ritmo</div>
          <div className="mt-1 text-2xl font-bold">Organize sua semana</div>
          <div className="text-sm text-slate-600 mt-2">
            Entre para salvar e sincronizar seu cronograma.
          </div>

          <button
            onClick={() => (window.location.href = "/auth")}
            className="mt-6 w-full rounded-2xl px-4 py-3 bg-slate-900 text-white font-semibold"
          >
            Entrar / Criar conta
          </button>

          <div className="mt-3 text-xs text-slate-500">
            * Você poderá acessar do celular e do PC com a mesma conta.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen text-slate-900 bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <div className="mx-auto max-w-5xl min-h-screen px-4 py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* COLUNA ESQUERDA */}
          <div>
            <HeaderCard profile={state.profile} quote={quote} onNew={openNewTask} />

            <div className="mt-3 rounded-3xl border border-slate-200 bg-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500">Dia selecionado</div>
                  <div className="text-sm font-semibold">{dayLabel}</div>
                </div>
                <div className="text-xs text-slate-500">
                  {state.settings.dayStart}–{state.settings.dayEnd}
                </div>
              </div>

              <DayChips selected={selectedDay} onSelect={setSelectedDay} />
            </div>

            <Tabs tab={tab} onChange={setTab} />

            {/* MOBILE */}
            <div className="lg:hidden">
              <section className="mt-3 space-y-3">
                {tab === "hoje" && (
                  <>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold">Top 3 do dia</div>
                      <div className="text-xs text-slate-600 mt-1">
                        Toque ★ nas tarefas para fixar.
                      </div>

                      <div className="mt-3 space-y-2">
                        {topTasks.length === 0 ? (
                          <div className="text-sm text-slate-500">
                            Nenhuma fixa ainda.
                          </div>
                        ) : (
                          topTasks.map((t) => (
                            <div key={t!.id} className="text-sm font-semibold">
                              • {t!.title}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <AgendaMini
                      tasks={tasksToday}
                      dayStart={state.settings.dayStart}
                      dayEnd={state.settings.dayEnd}
                    />

                    <div className="rounded-3xl bg-white border border-slate-200 p-4">
                      <div className="text-sm font-semibold">
                        Espaços livres (top 3)
                      </div>
                      <div className="mt-2 space-y-2 text-sm text-slate-600">
                        {freeSlots.length === 0 && "Sem espaço livre"}
                        {freeSlots.slice(0, 3).map(([s, e], i) => (
                          <div
                            key={i}
                            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 flex justify-between"
                          >
                            <span>
                              {String(Math.floor(s / 60)).padStart(2, "0")}:
                              {String(s % 60).padStart(2, "0")}–
                              {String(Math.floor(e / 60)).padStart(2, "0")}:
                              {String(e % 60).padStart(2, "0")}
                            </span>
                            <span className="text-slate-500">
                              {minutesLabel(e - s)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-white border border-slate-200 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold">Tarefas do dia</div>
                          <div className="text-xs text-slate-600 mt-1">
                            Com horário e sem horário.
                          </div>
                        </div>

                        <button
                          onClick={openNewTask}
                          className="rounded-2xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white"
                        >
                          + Nova
                        </button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {tasksToday.length === 0 ? (
                          <div className="text-sm text-slate-500">
                            Nenhuma tarefa ainda.
                          </div>
                        ) : (
                          tasksToday.map((t) => (
                            <TaskRow
                              key={t.id}
                              task={t}
                              starred={topIds.includes(t.id)}
                              onToggle={() =>
                                setState((prev) => ({
                                  ...prev,
                                  tasks: prev.tasks.map((x) =>
                                    x.id === t.id ? { ...x, done: !x.done } : x
                                  ),
                                }))
                              }
                              onDelete={() =>
                                setState((prev) => ({
                                  ...prev,
                                  tasks: prev.tasks.filter((x) => x.id !== t.id),
                                  top3ByDay: {
                                    ...prev.top3ByDay,
                                    [selectedDay]: (prev.top3ByDay?.[selectedDay] || []).filter(
                                      (id) => id !== t.id
                                    ),
                                  },
                                }))
                              }
                              onStar={() => {
                                setState((prev) => {
                                  const list = prev.top3ByDay?.[selectedDay] || [];
                                  const updated = list.includes(t.id)
                                    ? list.filter((id) => id !== t.id)
                                    : [t.id, ...list].slice(0, 3);

                                  return {
                                    ...prev,
                                    top3ByDay: {
                                      ...prev.top3ByDay,
                                      [selectedDay]: updated,
                                    },
                                  };
                                });
                              }}
                              onEdit={() => openEditTask(t)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}

                {tab === "semana" && (
                  <WeekView
                    tasks={state.tasks}
                    dayStart={state.settings.dayStart}
                    dayEnd={state.settings.dayEnd}
                    onSelectDay={(d) => {
                      setSelectedDay(d);
                      setTab("hoje");
                    }}
                  />
                )}

                {tab === "livre" && (
                  <FreeTimeView
                    tasks={state.tasks}
                    dayStart={state.settings.dayStart}
                    dayEnd={state.settings.dayEnd}
                    onSchedule={scheduleAt}
                  />
                )}

                {tab === "objetivos" && (
                  <GoalsView
                    goals={state.goals || []}
                    onAdd={addGoal}
                    onDelete={deleteGoal}
                    onAllocate={allocateGoal}
                  />
                )}

                {tab === "config" && (
                  <ConfigView
                    profile={state.profile}
                    settings={state.settings}
                    defaultQuotes={DEFAULT_QUOTES}
                    onUpdateProfile={(patch) =>
                      setState((prev) => ({
                        ...prev,
                        profile: { ...prev.profile, ...patch },
                      }))
                    }
                    onUpdateSettings={(patch) =>
                      setState((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, ...patch },
                      }))
                    }
                    onResetAll={() => {
                      const s = defaultState();
                      setState(s);
                      setSelectedDay(todayKey());
                      setTab("hoje");
                      saveRemoteState(s);
                    }}
                    authEmail={authEmail}
                    onGoAuth={() => (window.location.href = "/auth")}
                    onSignOut={async () => {
                      await signOut();
                    }}
                    onSyncNow={syncNow}
                  />
                )}
              </section>
            </div>
          </div>

          {/* DESKTOP */}
          <div className="hidden lg:block">
            <section className="space-y-3">
              {tab === "hoje" && (
                <>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold">Top 3 do dia</div>
                    <div className="text-xs text-slate-600 mt-1">
                      Toque ★ nas tarefas para fixar.
                    </div>

                    <div className="mt-3 space-y-2">
                      {topTasks.length === 0 ? (
                        <div className="text-sm text-slate-500">
                          Nenhuma fixa ainda.
                        </div>
                      ) : (
                        topTasks.map((t) => (
                          <div key={t!.id} className="text-sm font-semibold">
                            • {t!.title}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <AgendaMini
                    tasks={tasksToday}
                    dayStart={state.settings.dayStart}
                    dayEnd={state.settings.dayEnd}
                  />

                  <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="text-sm font-semibold">
                      Espaços livres (top 3)
                    </div>
                    <div className="mt-2 space-y-2 text-sm text-slate-600">
                      {freeSlots.length === 0 && "Sem espaço livre"}
                      {freeSlots.slice(0, 3).map(([s, e], i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 flex justify-between"
                        >
                          <span>
                            {String(Math.floor(s / 60)).padStart(2, "0")}:
                            {String(s % 60).padStart(2, "0")}–
                            {String(Math.floor(e / 60)).padStart(2, "0")}:
                            {String(e % 60).padStart(2, "0")}
                          </span>
                          <span className="text-slate-500">
                            {minutesLabel(e - s)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold">Tarefas do dia</div>
                        <div className="text-xs text-slate-600 mt-1">
                          Com horário e sem horário.
                        </div>
                      </div>

                      <button
                        onClick={openNewTask}
                        className="rounded-2xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white"
                      >
                        + Nova
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {tasksToday.length === 0 ? (
                        <div className="text-sm text-slate-500">
                          Nenhuma tarefa ainda.
                        </div>
                      ) : (
                        tasksToday.map((t) => (
                          <TaskRow
                            key={t.id}
                            task={t}
                            starred={topIds.includes(t.id)}
                            onToggle={() =>
                              setState((prev) => ({
                                ...prev,
                                tasks: prev.tasks.map((x) =>
                                  x.id === t.id ? { ...x, done: !x.done } : x
                                ),
                              }))
                            }
                            onDelete={() =>
                              setState((prev) => ({
                                ...prev,
                                tasks: prev.tasks.filter((x) => x.id !== t.id),
                                top3ByDay: {
                                  ...prev.top3ByDay,
                                  [selectedDay]: (prev.top3ByDay?.[selectedDay] || []).filter(
                                    (id) => id !== t.id
                                  ),
                                },
                              }))
                            }
                            onStar={() => {
                              setState((prev) => {
                                const list = prev.top3ByDay?.[selectedDay] || [];
                                const updated = list.includes(t.id)
                                  ? list.filter((id) => id !== t.id)
                                  : [t.id, ...list].slice(0, 3);

                                return {
                                  ...prev,
                                  top3ByDay: {
                                    ...prev.top3ByDay,
                                    [selectedDay]: updated,
                                  },
                                };
                              });
                            }}
                            onEdit={() => openEditTask(t)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {tab === "semana" && (
                <WeekView
                  tasks={state.tasks}
                  dayStart={state.settings.dayStart}
                  dayEnd={state.settings.dayEnd}
                  onSelectDay={(d) => {
                    setSelectedDay(d);
                    setTab("hoje");
                  }}
                />
              )}

              {tab === "livre" && (
                <FreeTimeView
                  tasks={state.tasks}
                  dayStart={state.settings.dayStart}
                  dayEnd={state.settings.dayEnd}
                  onSchedule={scheduleAt}
                />
              )}

              {tab === "objetivos" && (
                <GoalsView
                  goals={state.goals || []}
                  onAdd={addGoal}
                  onDelete={deleteGoal}
                  onAllocate={allocateGoal}
                />
              )}

              {tab === "config" && (
                <ConfigView
                  profile={state.profile}
                  settings={state.settings}
                  defaultQuotes={DEFAULT_QUOTES}
                  onUpdateProfile={(patch) =>
                    setState((prev) => ({
                      ...prev,
                      profile: { ...prev.profile, ...patch },
                    }))
                  }
                  onUpdateSettings={(patch) =>
                    setState((prev) => ({
                      ...prev,
                      settings: { ...prev.settings, ...patch },
                    }))
                  }
                  onResetAll={() => {
                    const s = defaultState();
                    setState(s);
                    setSelectedDay(todayKey());
                    setTab("hoje");
                    saveRemoteState(s);
                  }}
                  authEmail={authEmail}
                  onGoAuth={() => (window.location.href = "/auth")}
                  onSignOut={async () => {
                    await signOut();
                  }}
                  onSyncNow={syncNow}
                />
              )}
            </section>
          </div>
        </div>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPresetStartTime(null);
          setEditingTask(null);
        }}
        selectedDay={selectedDay}
        defaultNotifyMin={state.settings.defaultNotifyMin}
        presetStartTime={presetStartTime}
        allTasks={state.tasks}
        editingTask={editingTask}
        onSaveTasks={handleSaveTasks}
      />
    </main>
  );
}