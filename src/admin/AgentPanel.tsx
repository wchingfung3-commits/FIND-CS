import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { db } from "./client";
import { PAGE_SIZE, useRows } from "./useRows";
import type { AgentKind, JobPlan } from "../agents/contracts";

export function AgentPanel() {
  const [kind, setKind] = useState<AgentKind>("browser");
  const [routeId, setRouteId] = useState("");
  const [plan, setPlan] = useState<JobPlan | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const jobs = useRows("agent_jobs", "created_at");
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  async function prepare(event: FormEvent) {
    event.preventDefault(); if (!db || busy) return;
    const request = ++generation.current;
    setBusy(true); setError(""); setPlan(null);
    try {
      const { data, error: queryError } = await db.from("agent_jobs")
        .insert({ route_id: routeId.trim(), kind }).select("plan").single();
      if (request !== generation.current) return;
      if (queryError) throw new Error(queryError.code === "23505"
        ? "這條路線的同一版本已有待接駁任務，請查看下方列表。"
        : queryError.message);
      if (!data) throw new Error("未收到儲存確認，請重新載入列表確認後再試。");
      setPlan(data.plan as JobPlan);
      jobs.setPage(0);
    } catch (cause) {
      if (request === generation.current) setError(cause instanceof Error ? cause.message : "無法準備任務，請重試。");
    } finally { if (request === generation.current) setBusy(false); }
  }
  async function cancel(id: string) {
    if (!db || busy) return;
    const request = ++generation.current;
    setBusy(true); setError("");
    try {
      const { data, error: mutationError } = await db.from("agent_jobs")
        .update({ status: "cancelled" }).eq("id", id).eq("status", "blocked_provider").select("id");
      if (request !== generation.current) return;
      if (mutationError) throw new Error(mutationError.message);
      if (!data?.length) throw new Error("任務已變更或没有修改權限，請重新載入。");
      setPlan(null); jobs.reload();
    } catch (cause) {
      if (request === generation.current) setError(cause instanceof Error ? cause.message : "取消失敗，請重試。");
    } finally { if (request === generation.current) setBusy(false); }
  }
  return <section className="admin-panel">
    <div className="admin-warning" role="status">Browser Agent 及 Voice Agent 尚未連接。此頁儲存待接駁任務，不會開啟客服對話、撥打電話或建立驗證紀錄。</div>
    <div className="admin-grid">
      <form className="admin-card admin-form" onSubmit={prepare}>
        <h2>建立待接駁任務</h2>
        <label>驗證方式<select disabled={busy} value={kind} onChange={event => { setKind(event.target.value as AgentKind); setPlan(null); setError(""); }}><option value="browser">Browser：Live Chat／WhatsApp</option><option value="voice">Voice：電話／IVR</option></select></label>
        <label>路線 ID<input required disabled={busy} value={routeId} onChange={event => { setRouteId(event.target.value); setPlan(null); setError(""); }} /></label>
        <p className="admin-muted">從「內容目錄 → 聯絡路線」取得 ID。規格會鎖定目前路線版本；路線修改後須重新準備。</p>
        <button disabled={busy}>{busy ? "儲存中…" : "儲存待接駁任務"}</button>
        {error && <div className="admin-error" role="alert">{error}</div>}
      </form>
      <div className="admin-card admin-form"><h2>連接及審核要求</h2>
        <p>Browser：需選定執行服務、核准官方網站範圍及證據保存方式。</p>
        <p>Voice：需開通電話服務、設定香港通話支援、費用上限及停止條件。</p>
        <p>到達真人、帳戶驗證、付款或 CAPTCHA 時停止。收到 Agent 結果後仍需檢查證據及人工審核，才可發布。</p>
        {plan ? <><h3>已儲存規格（未執行）</h3><pre className="admin-job-plan">{JSON.stringify(plan, null, 2)}</pre></> : <p className="admin-muted">選擇下方任務可查看已儲存規格。</p>}
      </div>
    </div>
    <div className="admin-card admin-form">
      <h2>待接駁任務紀錄</h2>
      <p className="admin-muted">這是儲存的準備紀錄，尚未排程執行。路線修改後，舊規格不能用於執行，須取消並重新建立。</p>
      <button type="button" disabled={busy || jobs.loading} onClick={jobs.reload}>重新載入</button>
      {jobs.error && <div className="admin-error" role="alert">{jobs.error}</div>}
      {jobs.loading ? <p role="status">載入中…</p> : !jobs.error && jobs.rows.length === 0 ? <p>未有任務紀錄。</p> : jobs.rows.map(job => <div className="admin-card admin-form" key={String(job.id)}>
        <strong>{job.kind === "voice" ? "Voice" : "Browser"} · {String(job.route_id)} · v{String(job.route_revision)}</strong>
        <span>{job.status === "cancelled" ? "已取消" : "待接駁服務（未執行）"}</span>
        <time dateTime={String(job.created_at)}>{new Date(String(job.created_at)).toLocaleString("zh-HK", { timeZone: "Asia/Hong_Kong" })}（香港時間）</time>
        <button type="button" disabled={busy} onClick={() => setPlan(job.plan as JobPlan)}>查看規格</button>
        {job.status === "blocked_provider" && <button type="button" disabled={busy} onClick={() => void cancel(String(job.id))}>取消任務</button>}
      </div>)}
      <div>
        <button type="button" disabled={busy || jobs.loading || jobs.page === 0} onClick={() => jobs.setPage(jobs.page - 1)}>上一頁</button>
        <span> 第 {jobs.page + 1} 頁 · 共 {jobs.count} 項 </span>
        <button type="button" disabled={busy || jobs.loading || (jobs.page + 1) * PAGE_SIZE >= jobs.count} onClick={() => jobs.setPage(jobs.page + 1)}>下一頁</button>
      </div>
    </div>
  </section>;
}
