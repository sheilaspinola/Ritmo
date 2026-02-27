"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit() {
    setMsg(null);
    setLoading(true);
    try {
      if (!email.trim() || !pass) {
        setMsg("Preencha email e senha.");
        return;
      }

      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: pass,
        });
        if (error) throw error;

        setMsg(
          "Conta criada! Se o projeto exigir confirmação de email, desative isso no Supabase (Auth → Email)."
        );
        setMode("login");
        setPass("");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error) throw error;

      setMsg("Logado! Pode voltar para a home.");
    } catch (e: any) {
      setMsg(e?.message ?? "Erro ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    setLoading(true);
    setMsg(null);
    try {
      await supabase.auth.signOut();
      setMsg("Saiu da conta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-500">Ritmo</div>
          <div className="mt-1 text-xl font-bold">
            {mode === "login" ? "Entrar" : "Criar conta"}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            Login para sincronizar suas tarefas no banco.
          </div>

          {userEmail && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Logado como</div>
              <div className="text-sm font-semibold">{userEmail}</div>

              <div className="mt-2 flex gap-2">
                <a
                  href="/"
                  className="flex-1 text-center rounded-2xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white"
                >
                  Voltar pro app
                </a>
                <button
                  onClick={logout}
                  disabled={loading}
                  className="flex-1 rounded-2xl px-3 py-2 text-sm border border-slate-200"
                >
                  Sair
                </button>
              </div>
            </div>
          )}

          {!userEmail && (
            <>
              <div className="mt-4 grid gap-2">
                <input
                  className="w-full border border-slate-200 rounded-2xl p-2 text-sm"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
                <input
                  type="password"
                  className="w-full border border-slate-200 rounded-2xl p-2 text-sm"
                  placeholder="Senha"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />

                <button
                  onClick={submit}
                  disabled={loading}
                  className="mt-1 rounded-2xl px-3 py-2 text-sm font-semibold bg-slate-900 text-white disabled:opacity-60"
                >
                  {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
                </button>

                <div className="flex items-center justify-between mt-2">
                  <button
                    className="text-sm text-slate-700 underline"
                    onClick={() => {
                      setMsg(null);
                      setMode((m) => (m === "login" ? "signup" : "login"));
                    }}
                  >
                    {mode === "login"
                      ? "Não tenho conta (criar)"
                      : "Já tenho conta (entrar)"}
                  </button>

                  <a className="text-sm text-slate-700 underline" href="/">
                    Ir para Home
                  </a>
                </div>

                {msg && (
                  <div className="mt-2 text-sm rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    {msg}
                  </div>
                )}

                <div className="mt-2 text-xs text-slate-500">
                  Dica: em dev, desative confirmação de email no Supabase para não travar o login.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}