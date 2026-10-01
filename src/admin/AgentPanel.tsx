import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { db } from "./client";
import { createJobPlan } from "../agents/contracts";
import type { AgentKind, JobPlan, RouteSnapshot } from "../agents/contracts";

export function AgentPanel() {
  const [kind, setKind] = useState<AgentKind>("browser");
  const [routeId, setRouteId] = useState("");
  const [plan, setPlan] = useState<JobPlan | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  async function prepare(event: FormEvent) {
    event.preventDefault(); if (!db || busy) return;
    const request = ++generation.current;
    setBusy(true); setError(""); setPlan(null);
    try {
      const { data, error: queryError } = await db.from("routes")
        .select("id,revision,revision_started_at,action_url,channel_type,steps")
        .eq("id", routeId.trim()).maybeSingle();
      if (request !== generation.current) return;
      if (queryError) throw queryError;
      if (!data) throw new Error("找不到路線或沒有讀取權限。請先在內容目錄建立路線。");
      setPlan(createJobPlan(data as RouteSnapshot, kind, crypto.randomUUID()));
    } catch (cause) {
      if (request === generation.current) setError(cause instanceof Error ? cause.message : "無法準備任務，請重試。");
    } finally { if (request === generation.current) setBusy(false); }
  }
  return <section className="admin-panel">
    <div className="admin-warning" role="status">Browser Agent 及 Voice Agent 尚未連接。此頁只準備規格，不會開啟客服對話、撥打電話或建立驗證紀錄。</div>
    <div className="admin-grid">
      <form className="admin-card admin-form" onSubmit={prepare}>
        <h2>準備 Agent 驗證</h2>
        <label>驗證方式<select disabled={busy} value={kind} onChange={event => { setKind(event.target.value as AgentKind); setPlan(null); setError(""); }}><option value="browser">Browser：Live Chat／WhatsApp</option><option value="voice">Voice：電話／IVR</option></select></label>
        <label>路線 ID<input required disabled={busy} value={routeId} onChange={event => { setRouteId(event.target.value); setPlan(null); setError(""); }} /></label>
        <p className="admin-muted">從「內容目錄 → 聯絡路線」取得 ID。規格會鎖定目前路線版本；路線修改後須重新準備。</p>
        <button disabled={busy}>{busy ? "讀取路線中…" : "產生待執行規格"}</button>
        {error && <div className="admin-error" role="alert">{error}</div>}
      </form>
      <div className="admin-card admin-form"><h2>連接及審核要求</h2>
        <p>Browser：需選定執行服務、核准官方網站範圍及證據保存方式。</p>
        <p>Voice：需開通電話服務、設定香港通話支援、費用上限及停止條件。</p>
        <p>到達真人、帳戶驗證、付款或 CAPTCHA 時停止。收到 Agent 結果後仍需檢查證據及人工審核，才可發布。</p>
        {plan ? <><h3>待執行規格（未執行）</h3><pre className="admin-job-plan">{JSON.stringify(plan, null, 2)}</pre></> : <p className="admin-muted">未有待執行規格。</p>}
      </div>
    </div>
  </section>;
}
