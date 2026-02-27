"use client";

import { useEffect, useMemo, useState } from "react";

type Profile = {
  name?: string;
  quotes?: string[];
};

type Settings = {
  dayStart: string;
  dayEnd: string;
  defaultNotifyMin: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function ConfigView({
  profile,
  settings,
  defaultQuotes,
  onUpdateProfile,
  onUpdateSettings,
  onResetAll,

  authEmail,
  onGoAuth,
  onSignOut,
  onSyncNow,
}: {
  profile: Profile;
  settings: Settings;
  defaultQuotes: string[];
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onUpdateSettings: (patch: Partial<Settings>) => void;
  onResetAll: () => void;

  authEmail: string | null;
  onGoAuth: () => void;
  onSignOut: () => Promise<void>;
  onSyncNow: () => Promise<boolean>;
}) {
  const [name, setName] = useState(profile?.name ?? "");
  const [dayStart, setDayStart] = useState(settings.dayStart);
  const [dayEnd, setDayEnd] = useState(settings.dayEnd);
  const [defaultNotifyMin, setDefaultNotifyMin] = useState(
    settings.defaultNotifyMin
  );

  const initialQuotesText = useMemo(() => {
    const q = profile?.quotes?.length ? profile.quotes : defaultQuotes;
    return q.join("\n");
  }, [profile?.quotes, defaultQuotes]);

  const [quotesText, setQuotesText] = useState(initialQuotesText);

  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    setName(profile?.name ?? "");
  }, [profile?.name]);

  useEffect(() => {
    setDayStart(settings.dayStart);
    setDayEnd(settings.dayEnd);
    setDefaultNotifyMin(settings.defaultNotifyMin);
  }, [settings.dayStart, settings.dayEnd, settings.defaultNotifyMin]);

  useEffect(() => {
    setQuotesText(initialQuotesText);
  }, [initialQuotesText]);

  const quotesCount = useMemo(() => {
    return quotesText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean).length;
  }, [quotesText]);

  const previewQuote = useMemo(() => {
    const list = quotesText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    if (list.length === 0) return "Você está construindo ritmo. Um passo por vez.";
    const seed = new Date().toDateString().length + list.length;
    return list[seed % list.length];
  }, [quotesText]);

  function saveBasics() {
    onUpdateProfile({ name: name.trim() || undefined });
    onUpdateSettings({
      dayStart,
      dayEnd,
      defaultNotifyMin: clamp(Number(defaultNotifyMin) || 0, 0, 240),
    });
    setSyncMsg("Salvo no dispositivo ✅ (sync automático em segundos)");
  }

  function saveQuotes() {
    const list = quotesText
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

    onUpdateProfile({ quotes: list.length ? list : [] });
    setSyncMsg("Frases salvas ✅ (sync automático em segundos)");
  }

  function useDefaultQuotes() {
    setQuotesText(defaultQuotes.join("\n"));
    onUpdateProfile({ quotes: [] });
    setSyncMsg("Voltou para frases padrão ✅");
  }

  async function syncNow() {
    setSyncMsg(null);
    setSyncLoading(true);
    try {
      if (!authEmail) {
        setSyncMsg("Você precisa entrar para sincronizar.");
        return;
      }
      const ok = await onSyncNow();
      setSyncMsg(ok ? "Sincronizado com Supabase ✅" : "Falhou ao sincronizar ❌");
    } finally {
      setSyncLoading(false);
    }
  }

  async function doSignOut() {
    setSyncMsg(null);
    setSyncLoading(true);
    try {
      await onSignOut();
      setSyncMsg("Você saiu da conta ✅");
    } finally {
      setSyncLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Preview Premium */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-slate-500">Preview</div>
            <div className="mt-1 text-lg font-bold">
              {name.trim() ? `Olá, ${name.trim()} 👋` : "Olá 👋"}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500">Conta</div>
            {authEmail ? (
              <div className="text-sm font-semibold">{authEmail}</div>
            ) : (
              <div className="text-sm font-semibold text-slate-600">Não logada</div>
            )}
          </div>
        </div>

        <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <div className="text-xs text-slate-500">Frase do dia</div>
          <div className="text-sm font-semibold mt-1">{previewQuote}</div>
        </div>

        <div className="mt-3 flex gap-2">
          {!authEmail ? (
            <button
              onClick={onGoAuth}
              className="flex-1 rounded-2xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white"
            >
              Entrar / Criar conta
            </button>
          ) : (
            <>
              <button
                onClick={syncNow}
                disabled={syncLoading}
                className="flex-1 rounded-2xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white disabled:opacity-60"
              >
                {syncLoading ? "Sincronizando..." : "Sincronizar agora"}
              </button>
              <button
                onClick={doSignOut}
                disabled={syncLoading}
                className="flex-1 rounded-2xl px-3 py-2 text-sm border border-slate-200"
              >
                Sair
              </button>
            </>
          )}
        </div>

        {syncMsg && (
          <div className="mt-2 text-sm rounded-2xl border border-slate-200 bg-white p-3">
            {syncMsg}
          </div>
        )}
      </div>

      {/* Básico */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Seu básico</div>
            <div className="text-xs text-slate-600 mt-1">
              Nome e janela diária (pra calcular tempo livre).
            </div>
          </div>
          <button
            onClick={saveBasics}
            className="rounded-2xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white"
          >
            Salvar
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          <input
            className="w-full border border-slate-200 rounded-2xl p-2 text-sm"
            placeholder="Seu nome (ex.: Sheila)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="text-xs text-slate-500">Início do dia</div>
              <input
                type="time"
                className="mt-1 w-full border border-slate-200 rounded-xl p-2 text-sm"
                value={dayStart}
                onChange={(e) => setDayStart(e.target.value)}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 p-3">
              <div className="text-xs text-slate-500">Fim do dia</div>
              <input
                type="time"
                className="mt-1 w-full border border-slate-200 rounded-xl p-2 text-sm"
                value={dayEnd}
                onChange={(e) => setDayEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-3">
            <div className="text-xs text-slate-500">Lembrete padrão</div>
            <div className="text-sm font-semibold mt-1">
              {defaultNotifyMin} min antes
            </div>
            <input
              type="range"
              min={0}
              max={120}
              step={5}
              className="mt-2 w-full"
              value={defaultNotifyMin}
              onChange={(e) => setDefaultNotifyMin(Number(e.target.value))}
            />
            <div className="text-xs text-slate-500 mt-1">
              (Push real vem com PWA + permissões.)
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 p-3 bg-slate-50">
            <div className="text-sm font-semibold">Tema</div>
            <div className="text-xs text-slate-600 mt-1">
              Tema claro por enquanto (como você pediu). Depois adicionamos Claro/Escuro.
            </div>
          </div>
        </div>
      </div>

      {/* Frases */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">Frases motivadoras</div>
            <div className="text-xs text-slate-600 mt-1">
              1 frase por linha · Total: {quotesCount}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={useDefaultQuotes}
              className="rounded-2xl px-3 py-2 text-sm border border-slate-200"
              title="Voltar para as frases padrão do app"
            >
              Padrão
            </button>

            <button
              onClick={saveQuotes}
              className="rounded-2xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white"
            >
              Salvar
            </button>
          </div>
        </div>

        <textarea
          className="mt-3 w-full min-h-[180px] border border-slate-200 rounded-2xl p-3 text-sm"
          value={quotesText}
          onChange={(e) => setQuotesText(e.target.value)}
          placeholder={"Exemplo:\nFoco no essencial.\nUm passo por vez.\nHoje eu construo ritmo."}
        />
      </div>

      {/* Perigoso */}
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
        <div className="text-sm font-semibold text-rose-900">Zona perigosa</div>
        <div className="text-xs text-rose-800 mt-1">
          Limpa tarefas, Top 3 e preferências salvas neste dispositivo.
        </div>

        <button
          onClick={onResetAll}
          className="mt-3 w-full rounded-2xl px-3 py-2 text-sm font-semibold bg-rose-600 text-white"
        >
          Resetar tudo
        </button>
      </div>
    </div>
  );
}