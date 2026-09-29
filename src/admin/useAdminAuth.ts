import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

type AuthState = { session: Session | null; checking: boolean; isAdmin: boolean; error: string };
const empty: AuthState = { session: null, checking: false, isAdmin: false, error: "" };

/** UI gate only: every database operation must still be authorized by RLS. */
export function useAdminAuth(client: SupabaseClient | null) {
  const [state, setState] = useState<AuthState>({ ...empty, checking: !!client });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!client) return;
    let active = true;
    let generation = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const acceptSession = (session: Session | null) => {
      const request = ++generation;
      clearTimeout(timer);
      setState({ ...empty, session, checking: !!session });
      if (!session) return;
      // Leave the synchronous auth callback before invoking another Supabase API.
      timer = setTimeout(() => {
        void (async () => {
          try {
            const { data, error } = await client.rpc("is_admin");
            if (!active || request !== generation) return;
            setState({ session, checking: false, isAdmin: !error && data === true,
              error: error ? `無法驗證管理員權限：${error.message}` : data === true ? "" : "此帳戶沒有管理員權限。" });
          } catch {
            if (active && request === generation) setState({ ...empty, session, error: "無法連接權限服務，請稍後再試。" });
          }
        })();
      }, 0);
    };
    setState({ ...empty, checking: true });
    const initial = generation;
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (active) acceptSession(session);
    });
    void (async () => {
      try {
        const { data, error } = await client.auth.getSession();
        if (!active || initial !== generation) return;
        if (error) throw error;
        acceptSession(data.session);
      } catch {
        if (active && initial === generation) setState({ ...empty, error: "無法連接認證服務，請重試。" });
      }
    })();
    return () => { active = false; generation++; clearTimeout(timer); listener.subscription.unsubscribe(); };
  }, [client, attempt]);
  return { ...state, retry: () => setAttempt(value => value + 1) };
}
