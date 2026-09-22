import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function jwtRole(key: string) {
  if (!key.includes(".")) return null;
  try {
    const payload = key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(payload))?.role as unknown;
  } catch { return "invalid"; }
}

function configurationError() {
  if (!supabaseUrl || !supabaseAnonKey) return "尚未設定 Supabase 公開連線資料。";
  try { const url = new URL(supabaseUrl); if (url.protocol !== "https:") return "VITE_SUPABASE_URL 必須使用 HTTPS。"; } catch { return "VITE_SUPABASE_URL 格式不正確。"; }
  if (supabaseAnonKey.startsWith("sb_secret_") || jwtRole(supabaseAnonKey) === "service_role") return "偵測到機密或 service role key；管理後台只可使用公開 anon key。";
  if (!supabaseAnonKey.startsWith("sb_publishable_") && jwtRole(supabaseAnonKey) !== "anon") return "VITE_SUPABASE_ANON_KEY 必須是 publishable key 或 legacy anon key。";
  return "";
}

export const supabaseConfigurationError = configurationError();
export const isSupabaseConfigured = !supabaseConfigurationError;

/** The public, RLS-protected browser client. Never put a service-role key here. */
export const db = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;
