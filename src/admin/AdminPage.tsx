import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { db, isSupabaseConfigured, supabaseConfigurationError } from "./client";
import "./admin.css";

type Tab = "tasks" | "catalog" | "verification" | "audit";
type Row = Record<string, unknown>;
type CatalogTable = "companies" | "industries" | "issues" | "routes";

const CATALOG: Record<CatalogTable, { label: string; fields: readonly string[]; sample: Row }> = {
  companies: {
    label: "公司",
    fields: ["id", "name", "industry", "description", "official_url"],
    sample: { id: "", name: "", industry: "", description: "", official_url: "" },
  },
  industries: {
    label: "行業",
    fields: ["id", "name", "icon"],
    sample: { id: "", name: "", icon: "Building2" },
  },
  issues: {
    label: "問題",
    fields: ["id", "company_id", "name", "description"],
    sample: { id: "", company_id: "", name: "", description: "" },
  },
  routes: {
    label: "聯絡路線",
    fields: ["id", "company_id", "issue_id", "channel_type", "category", "is_human_support", "opening_hours", "steps", "action_url", "action_label", "published"],
    sample: { id: "", company_id: "", issue_id: null, channel_type: "phone", category: "human", is_human_support: true, opening_hours: "", steps: [], action_url: "", action_label: "", published: false },
  },
};

const formatDate = (value: unknown) => value ? new Date(String(value)).toLocaleString("zh-HK") : "—";
const asText = (value: unknown) => typeof value === "string" ? value : "";
const shortId = (value: unknown) => asText(value).slice(0, 10) || "—";
const NULLABLE_TEXT_FIELDS = new Set(["description", "official_url", "issue_id", "opening_hours", "action_url", "action_label"]);

export function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(isSupabaseConfigured);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!db) return;
    let active = true;
    void (async () => { try { const { data } = await db.auth.getSession(); if (active) setSession(data.session); } catch { if (active) { setAuthError("無法連接認證服務，請稍後再試。"); setChecking(false); } } })();
    const { data: listener } = db.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!db || !session) { setIsAdmin(false); setChecking(false); return; }
    let active = true; setChecking(true);
    void (async () => { try {
      const { data, error } = await db.rpc("is_admin"); if (!active) return;
      setIsAdmin(!error && data === true); setAuthError(error ? `無法驗證管理員權限：${error.message}` : data === true ? "" : "此帳戶沒有管理員權限。"); setChecking(false);
    } catch { if (active) { setIsAdmin(false); setAuthError("無法連接權限服務，請稍後再試。"); setChecking(false); } } })();
    return () => { active = false; };
  }, [session]);

  if (!isSupabaseConfigured) return <SetupNotice reason={supabaseConfigurationError} />;
  if (!session) return <SignIn error={authError} setError={setAuthError} />;
  if (checking) return <main className="admin-shell"><div className="admin-state">正在驗證管理員權限…</div></main>;
  if (!isAdmin) return <AccessDenied message={authError} />;
  return <Dashboard email={session.user.email ?? "管理員"} />;
}

function SetupNotice({ reason }: { reason: string }) {
  return <main className="admin-shell"><section className="admin-card admin-setup">
    <span className="admin-kicker">FIND CS 管理後台</span><h1>尚未連接資料庫</h1>
    <div className="admin-error" role="alert">{reason}</div><p>此頁不會以瀏覽器假資料模擬儲存。請在部署環境設定以下公開環境變數，並重新啟動應用程式。</p>
    <code>VITE_SUPABASE_URL</code><code>VITE_SUPABASE_ANON_KEY</code>
    <p className="admin-muted">請勿在前端加入 service role key。資料寫入權限應由 Supabase RLS 及 <code>is_admin</code> RPC 控制。</p>
  </section></main>;
}

function SignIn({ error, setError }: { error: string; setError: (value: string) => void }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!db) return; setBusy(true); setError("");
    const { error: signInError } = await db.auth.signInWithPassword({ email, password });
    if (signInError) setError(`登入失敗：${signInError.message}`); setBusy(false);
  }
  return <main className="admin-shell"><form className="admin-card admin-login" onSubmit={submit}>
    <span className="admin-kicker">FIND CS 管理後台</span><h1>管理員登入</h1><p className="admin-muted">只接受已建立並獲授權的帳戶。</p>
    <label>電郵<input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></label>
    <label>密碼<input type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /></label>
    {error && <div className="admin-error" role="alert">{error}</div>}<button disabled={busy}>{busy ? "登入中…" : "登入"}</button>
  </form></main>;
}

function AccessDenied({ message }: { message: string }) {
  return <main className="admin-shell"><section className="admin-card admin-login"><h1>無法進入管理後台</h1><div className="admin-error" role="alert">{message || "此帳戶沒有管理員權限。"}</div><button onClick={() => db?.auth.signOut()}>登出</button></section></main>;
}

function Dashboard({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>("tasks");
  const tabs: Array<[Tab, string]> = [["tasks", "任務"], ["catalog", "內容目錄"], ["verification", "驗證紀錄"], ["audit", "稽核紀錄"]];
  return <main className="admin-shell admin-wide"><header className="admin-header"><div><span className="admin-kicker">FIND CS</span><h1>維護工作台</h1></div><div className="admin-account"><span>{email}</span><button className="admin-secondary" onClick={() => db?.auth.signOut()}>登出</button></div></header>
    <nav className="admin-tabs" aria-label="管理功能">{tabs.map(([id, label]) => <button key={id} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>
    {tab === "tasks" && <TasksPanel />}{tab === "catalog" && <CatalogPanel />}{tab === "verification" && <VerificationPanel />}{tab === "audit" && <AuditPanel />}
  </main>;
}

function useRows(table: string, orderBy = "updated_at") {
  const [rows, setRows] = useState<Row[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const requestId = useRef(0);
  const reload = useCallback(async () => {
    if (!db) return; const currentRequest = ++requestId.current; setRows([]); setLoading(true); setError("");
    const { data, error: queryError } = await db.from(table).select("*").order(orderBy, { ascending: false }).limit(250);
    if (currentRequest !== requestId.current) return;
    if (queryError) setError(queryError.message); else setRows((data ?? []) as Row[]); setLoading(false);
  }, [table, orderBy]);
  useEffect(() => { void reload(); }, [reload]);
  return { rows, loading, error, setError, reload };
}

function PanelState({ loading, error }: { loading: boolean; error: string }) {
  if (loading) return <div className="admin-state" role="status">載入中…</div>;
  if (error) return <div className="admin-error" role="alert">{error}</div>;
  return null;
}

function TasksPanel() {
  const state = useRows("tasks"); const [busy, setBusy] = useState(false);
  const overdueCount = state.rows.filter(row => row.due_at && new Date(String(row.due_at)) < new Date() && row.status !== "done").length;
  const [form, setForm] = useState({ title: "", route_id: "", status: "todo", priority: "normal", due_at: "", notes: "" });
  const save = async (event: FormEvent) => { event.preventDefault(); if (!db) return; setBusy(true); state.setError("");
    const { error } = await db.from("tasks").insert({ ...form, route_id: form.route_id || null, due_at: form.due_at ? new Date(form.due_at).toISOString() : null, notes: form.notes.trim() || null });
    if (error) state.setError(error.message); else { setForm({ title: "", route_id: "", status: "todo", priority: "normal", due_at: "", notes: "" }); await state.reload(); } setBusy(false);
  };
  const updateStatus = async (row: Row, status: string) => { if (!db) return; let query = db.from("tasks").update({ status }).eq("id", row.id); if (row.updated_at) query = query.eq("updated_at", row.updated_at); const { data, error } = await query.select("id"); if (error) state.setError(error.message); else if (!data?.length) state.setError("任務已被其他管理員更新或刪除，請重新載入後再試。"); else await state.reload(); };
  const remove = async (row: Row) => { if (!db || !confirm(`確定刪除任務「${String(row.title)}」？此動作無法復原。`)) return; let query = db.from("tasks").delete().eq("id", row.id); if (row.updated_at) query = query.eq("updated_at", row.updated_at); const { data, error } = await query.select("id"); if (error) state.setError(error.message); else if (!data?.length) state.setError("任務已被其他管理員更新或刪除，請重新載入後再試。"); else await state.reload(); };
  return <section className="admin-panel"><div className="admin-grid"><form className="admin-card admin-form" onSubmit={save}><h2>新增維護任務</h2>
    <label>標題<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label><label>路線 ID（選填）<input value={form.route_id} onChange={e => setForm({ ...form, route_id: e.target.value })} /></label>
    <div className="admin-two"><label>狀態<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="todo">待辦</option><option value="in_progress">進行中</option><option value="blocked">受阻</option><option value="done">完成</option></select></label><label>優先度<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}><option value="low">低</option><option value="normal">一般</option><option value="high">高</option></select></label></div>
    <label>期限（選填）<input type="datetime-local" value={form.due_at} onChange={e => setForm({ ...form, due_at: e.target.value })} /></label><label>備註<textarea rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label><button disabled={busy}>{busy ? "儲存中…" : "新增任務"}</button></form>
    <div><div className="admin-section-title"><h2>任務清單</h2><button className="admin-secondary" onClick={() => state.reload()}>重新載入</button></div>{!state.loading && overdueCount > 0 && <div className="admin-warning" role="status">有 {overdueCount} 項未完成任務已逾期。</div>}{state.rows.length === 250 && <LimitNotice />}<PanelState loading={state.loading} error={state.error} />{!state.loading && !state.error && state.rows.length === 0 && <div className="admin-state">未有任務。</div>}
      <div className="admin-list">{state.rows.map(row => <article className="admin-card admin-item" key={String(row.id)}><div className="admin-item-head"><div><span className={`admin-badge priority-${asText(row.priority)}`}>{asText(row.priority)}</span><h3>{asText(row.title)}</h3></div><button className="admin-danger-text" onClick={() => remove(row)}>刪除</button></div><p>{asText(row.notes) || "沒有備註"}</p><div className="admin-meta">路線：{shortId(row.route_id)} · 期限：{formatDate(row.due_at)}</div><label className="admin-inline">狀態<select value={asText(row.status)} onChange={e => updateStatus(row, e.target.value)}><option value="todo">待辦</option><option value="in_progress">進行中</option><option value="blocked">受阻</option><option value="done">完成</option></select></label></article>)}</div>
    </div></div></section>;
}

function CatalogPanel() {
  const [table, setTable] = useState<CatalogTable>("companies"); const state = useRows(table, table === "routes" ? "updated_at" : "id");
  const config = CATALOG[table]; const [selectedId, setSelectedId] = useState<string | null>(null); const [selectedVersion, setSelectedVersion] = useState<string | null>(null); const [json, setJson] = useState(JSON.stringify(config.sample, null, 2)); const [busy, setBusy] = useState(false);
  useEffect(() => { setSelectedId(null); setSelectedVersion(null); setJson(JSON.stringify(CATALOG[table].sample, null, 2)); }, [table]);
  const select = (row: Row) => { setSelectedId(String(row.id)); setSelectedVersion(asText(row.updated_at) || null); const allowed = Object.fromEntries(config.fields.map(key => [key, row[key] ?? null])); setJson(JSON.stringify(allowed, null, 2)); };
  const fresh = () => { setSelectedId(null); setSelectedVersion(null); setJson(JSON.stringify(config.sample, null, 2)); };
  const save = async (event: FormEvent) => { event.preventDefault(); if (!db) return; const requestTable = table; state.setError(""); let parsed: unknown; try { parsed = JSON.parse(json); } catch { state.setError("JSON 格式不正確。"); return; }
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") { state.setError("內容必須是 JSON 物件。"); return; }
    const source = parsed as Row; const unknown = Object.keys(source).filter(key => !config.fields.includes(key)); if (unknown.length) { state.setError(`不允許的欄位：${unknown.join(", ")}`); return; }
    if (selectedId && String(source.id) !== selectedId) { state.setError("編輯時不可更改主 ID；如需新 ID，請新增記錄。"); return; }
    const payload = Object.fromEntries(config.fields.filter(key => key in source && (!selectedId || key !== "id")).map(key => [key, NULLABLE_TEXT_FIELDS.has(key) && source[key] === "" ? null : source[key]])); setBusy(true);
    let query = selectedId ? db.from(requestTable).update(payload).eq("id", selectedId) : db.from(requestTable).insert(payload);
    if (selectedId && selectedVersion) query = query.eq("updated_at", selectedVersion);
    const { data, error } = await query.select("id");
    if (error) state.setError(error.message); else if (selectedId && (!data || data.length === 0)) state.setError("記錄已被其他管理員更新或刪除，請重新載入後再試。"); else { fresh(); await state.reload(); } setBusy(false);
  };
  const remove = async () => { if (!db || !selectedId || !confirm(`確定刪除 ${config.label}「${selectedId}」？相關資料可能令刪除失敗。`)) return; const requestTable = table; setBusy(true); let query = db.from(requestTable).delete().eq("id", selectedId); if (selectedVersion) query = query.eq("updated_at", selectedVersion); const { data, error } = await query.select("id"); if (error) state.setError(error.message); else if (!data || data.length === 0) state.setError("記錄已被其他管理員更新或刪除，請重新載入後再試。"); else { fresh(); await state.reload(); } setBusy(false); };
  return <section className="admin-panel"><div className="admin-toolbar"><label>資料類型<select disabled={busy || state.loading} value={table} onChange={e => setTable(e.target.value as CatalogTable)}>{Object.entries(CATALOG).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}</select></label><button className="admin-secondary" disabled={busy || state.loading} onClick={fresh}>新增{config.label}</button></div>{state.rows.length === 250 && <LimitNotice />}<PanelState loading={state.loading} error={state.error} />
    <div className="admin-grid catalog-grid"><div className="admin-card admin-table-wrap"><table><thead><tr><th>ID</th><th>名稱／類型</th><th></th></tr></thead><tbody>{state.rows.map(row => <tr key={String(row.id)} className={selectedId === String(row.id) ? "selected" : ""}><td>{shortId(row.id)}</td><td>{asText(row.name) || asText(row.channel_type) || "—"}</td><td><button className="admin-link" disabled={busy || state.loading} onClick={() => select(row)}>編輯</button></td></tr>)}</tbody></table>{!state.loading && state.rows.length === 0 && <div className="admin-state">未有資料。</div>}</div>
    <form className="admin-card admin-form" onSubmit={save}><h2>{selectedId ? `編輯 ${selectedId}` : `新增${config.label}`}</h2><p className="admin-muted">只接受：{config.fields.join("、")}</p><label>JSON 內容<textarea className="admin-code" rows={20} value={json} onChange={e => setJson(e.target.value)} spellCheck={false} /></label><div className="admin-actions"><button disabled={busy}>{busy ? "儲存中…" : "儲存"}</button>{selectedId && <button type="button" className="admin-danger" onClick={remove} disabled={busy}>刪除</button>}</div></form></div></section>;
}

function VerificationPanel() {
  const state = useRows("verifications", "test_date"); const [busy, setBusy] = useState(false); const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ route_id: "", test_date: today, test_period: "service_hours", result: "human_reached", evidence: "" });
  const save = async (event: FormEvent) => { event.preventDefault(); if (!db) return; if (form.result === "human_reached" && !form.evidence.trim()) { state.setError("成功聯絡真人的紀錄必須提供證據或測試備註。"); return; } setBusy(true); state.setError(""); const { error } = await db.from("verifications").insert({ ...form, evidence: form.evidence.trim() || null }); if (error) state.setError(error.message); else { setForm({ ...form, route_id: "", evidence: "" }); await state.reload(); } setBusy(false); };
  return <section className="admin-panel"><div className="admin-grid"><form className="admin-card admin-form" onSubmit={save}><h2>記錄路線驗證</h2><p className="admin-muted">驗證紀錄只可新增。需要更正時請另建紀錄；如須移除錯誤資料，請交由資料庫擁有人處理。</p><label>路線 ID<input required value={form.route_id} onChange={e => setForm({ ...form, route_id: e.target.value })} /></label><label>測試日期<input type="date" max={today} required value={form.test_date} onChange={e => setForm({ ...form, test_date: e.target.value })} /></label><label>測試時段<select value={form.test_period} onChange={e => setForm({ ...form, test_period: e.target.value })}><option value="service_hours">服務時間</option><option value="after_hours">非服務時間</option></select></label><label>結果<select value={form.result} onChange={e => setForm({ ...form, result: e.target.value })}><option value="human_reached">成功聯絡真人</option><option value="human_not_available">未能聯絡真人</option><option value="verification_boundary">達驗證邊界</option><option value="failed">失敗</option></select></label><label>證據／備註{form.result === "human_reached" ? "（必填）" : ""}<textarea required={form.result === "human_reached"} rows={5} value={form.evidence} onChange={e => setForm({ ...form, evidence: e.target.value })} /></label><button disabled={busy}>{busy ? "儲存中…" : "新增紀錄"}</button></form>
    <div><h2>最近驗證</h2>{state.rows.length === 250 && <LimitNotice />}<PanelState loading={state.loading} error={state.error} /><div className="admin-list">{state.rows.map(row => <article className="admin-card admin-item" key={String(row.id)}><div className="admin-item-head"><div><span className="admin-badge">{asText(row.result)}</span><h3>{asText(row.route_id)}</h3></div></div><p>{asText(row.evidence) || "沒有備註"}</p><div className="admin-meta">{asText(row.test_date)} · {asText(row.test_period)}</div></article>)}</div>{!state.loading && !state.error && state.rows.length === 0 && <div className="admin-state">未有驗證紀錄。</div>}</div></div></section>;
}

function AuditPanel() {
  const state = useRows("audit_logs", "created_at");
  return <section className="admin-panel"><div className="admin-section-title"><div><h2>稽核紀錄</h2><p className="admin-muted">只讀，顯示最近 250 項資料變更。</p></div><button className="admin-secondary" onClick={() => state.reload()}>重新載入</button></div>{state.rows.length === 250 && <LimitNotice />}<PanelState loading={state.loading} error={state.error} /><div className="admin-card admin-table-wrap"><table><thead><tr><th>時間</th><th>操作</th><th>資料表</th><th>記錄 ID</th><th>操作者</th></tr></thead><tbody>{state.rows.map(row => <tr key={String(row.id)}><td>{formatDate(row.created_at)}</td><td><span className="admin-badge">{asText(row.operation)}</span></td><td>{asText(row.table_name)}</td><td>{asText(row.record_id)}</td><td>{shortId(row.actor_id)}</td></tr>)}</tbody></table></div></section>;
}

function LimitNotice() { return <div className="admin-warning" role="status">只顯示最近 250 項記錄；如需較舊資料，請使用資料庫管理工具查閱。</div>; }
