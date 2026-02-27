import { supabase } from "./supabaseClient";
import { AppState } from "./types";

const TABLE = "ritmo_states"; // sua tabela

export async function getAuthEmail(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignora
  }
}

export async function loadRemoteState(): Promise<AppState | null> {
  try {
    const { data: u } = await supabase.auth.getUser();
    const user = u.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from(TABLE)
      .select("state")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) return null;
    return (data?.state as AppState) ?? null;
  } catch {
    return null;
  }
}

export async function saveRemoteState(state: AppState): Promise<boolean> {
  try {
    const { data: u } = await supabase.auth.getUser();
    const user = u.user;
    if (!user) return false;

    const payload = {
      user_id: user.id,
      email: user.email ?? null,
      state,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from(TABLE).upsert(payload, {
      onConflict: "user_id",
    });

    return !error;
  } catch {
    return false;
  }
}