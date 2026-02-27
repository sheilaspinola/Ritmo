export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type TabKey = "hoje" | "semana" | "livre" | "objetivos" | "config";

export type Priority = "baixa" | "media" | "alta";

export type RepeatInfo = {
  enabled: boolean;
  days: DayKey[];
  groupId: string;
};

export type Task = {
  id: string;
  title: string;
  dayKey: DayKey;
  startTime?: string;
  endTime?: string;
  durationMin?: number;
  tag?: string;
  priority: Priority;
  done: boolean;
  notify?: boolean;
  notifyMin?: number;
  repeat?: RepeatInfo;
};

export type Goal = {
  id: string;
  title: string;
  tag?: string;
  durationMin: number;
  notes?: string;
  createdAt?: number; // ✅ agora bate com GoalModal
};

export type Profile = {
  name: string;
  theme: "light" | "dark";
  accent: "orange" | "blue" | "green" | "pink" | "purple";
  quotes?: string[];
};

export type Settings = {
  dayStart: string;
  dayEnd: string;
  defaultNotifyMin: number;
};

export type AppState = {
  profile: Profile;
  settings: Settings;
  tasks: Task[];
  goals: Goal[];
  top3ByDay: Partial<Record<DayKey, string[]>>; // ✅ evita obrigar todos dias
  notificationsEnabled: boolean;
};