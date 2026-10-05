import { useEffect, useRef, useState } from "react";
import { db } from "./client";
const messages: Record<string, string> = {
  missing_config: "未設定伺服器連線資料", invalid_config: "專案設定格式有誤",
  api_connected: "API 驗證成功（尚未開放執行）", credentials_rejected: "API 密鑰或專案權限被拒絕",
  rate_limited: "服務限制請求，請稍後再試", provider_error: "供應商暫時無法使用",
  invalid_response: "服務回應格式不符", connection_failed: "連線失敗或逾時",
};
type Connection = { provider: "browserbase" | "retell"; state: string; executionEnabled: false };
export function ProviderConnections() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  async function check() {
    if (!db || busy) return;
    const request = ++generation.current;
    setBusy(true); setError(""); setConnections([]);
    try {
      const { data, error: sessionError } = await db.auth.getSession();
      if (sessionError || !data.session?.access_token) throw new Error("登入已失效，請重新登入。");
      const response = await fetch("/api/agent-connections", { method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
        signal: AbortSignal.timeout(25000) });
      if (!response.ok) throw new Error(response.status === 401 ? "登入已失效，請重新登入。" : response.status === 403 ? "此帳戶沒有連線檢查權限。" : "伺服器連線檢查失敗，請稍後再試。");
      const result = await response.json();
      if (!result || typeof result !== "object" || result.executionEnabled !== false || !Array.isArray(result.providers) || result.providers.length !== 2 ||
          !["browserbase", "retell"].every(provider => result.providers.filter((item: Connection) => item?.provider === provider && item.executionEnabled === false && Object.prototype.hasOwnProperty.call(messages, item.state)).length === 1)) {
        throw new Error("連線檢查回應無效，未允許執行。");
      }
      if (request === generation.current) setConnections(result.providers);
    } catch (cause) {
      if (request === generation.current) setError(cause instanceof Error ? cause.message : "連線檢查失敗。");
    } finally { if (request === generation.current) setBusy(false); }
  }
  return <div className="admin-card admin-form">
    <h2>Voice／Browser 服務連線</h2>
    <p className="admin-muted">由伺服器檢查 Browserbase 專案及 Retell API 權限。密鑰只存放於 Vercel Secret；檢查不會建立瀏覽器工作階段或撥打電話。</p>
    <button type="button" disabled={busy} onClick={() => void check()}>{busy ? "檢查連線中…" : "檢查服務連線"}</button>
    {error && <div className="admin-error" role="alert">{error}</div>}
    <div role="status">{connections.map(item => <p key={item.provider}>{item.provider === "browserbase" ? "Browserbase" : "Retell Voice"}：{messages[item.state]}</p>)}</div>
    <p className="admin-muted">Voice 仍需完成外撥 KYC、香港電話服務及費用上限設定；API 驗證成功不代表電話已可使用。</p>
  </div>;
}
