import { AppState } from "./types";
import { DEFAULT_QUOTES, uid } from "./utils";

export const STORAGE_KEY = "ritmo_next_v1";

export function defaultState(): AppState {
  return {
    profile: {
      name: "",
      theme: "light",
      accent: "orange",
      quotes: DEFAULT_QUOTES,
    },
    settings: {
      dayStart: "06:00",
      dayEnd: "22:00",
      defaultNotifyMin: 10,
    },
    tasks: [
      {
        id: uid(),
        title: "Conferir pedidos",
        dayKey: "mon",
        startTime: "10:00",
        durationMin: 30,
        tag: "Trabalho",
        priority: "media",
        done: false,
        notify: true,
        notifyMin: 10,
      },
    ],
    goals: [],
    top3ByDay: {},
    notificationsEnabled: false,
  };
}

export function loadState(): AppState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

export function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}