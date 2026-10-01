export type AgentKind = "browser" | "voice";
export type JobPlan = {
  schemaVersion: 1; jobId: string; kind: AgentKind; routeId: string;
  routeRevision: number; revisionStartedAt: string; target: string;
  steps: string[]; timeoutSeconds: number; maxAttempts: 1;
  stopAt: readonly ["human_reached", "account_verification", "payment", "captcha"];
  execution: "not_connected"; publication: "manual_review_required";
};
export type RouteSnapshot = {
  id: unknown; revision: unknown; revision_started_at: unknown;
  action_url: unknown; channel_type: unknown; steps: unknown;
};
const validTime = (value: unknown): value is string => typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?(Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(`${value.slice(0, 10)}T00:00:00Z`).toISOString().slice(0, 10) === value.slice(0, 10);

/** Planning only. No network access, database writes or verification claims. */
export function createJobPlan(route: RouteSnapshot, kind: AgentKind, jobId: string): JobPlan {
  if (!["browser", "voice"].includes(kind)) throw new Error("未支援的 Agent 類型。");
  if (!jobId.trim() || typeof route.id !== "string" || !route.id.trim()) throw new Error("缺少任務或路線 ID。");
  if (!Number.isInteger(route.revision) || Number(route.revision) < 1 || !validTime(route.revision_started_at)) throw new Error("路線版本或版本時間無效。");
  if (!Array.isArray(route.steps) || !route.steps.every(item => typeof item === "string")) throw new Error("聯絡步驟必須是文字陣列。");
  if (typeof route.action_url !== "string") throw new Error("路線未有可執行的聯絡網址。");
  const target = route.action_url.trim();
  if (kind === "voice") {
    if (route.channel_type !== "phone" || !/^tel:\+[1-9]\d{7,14}$/.test(target)) throw new Error("Voice 任務需要電話路線及完整國際電話號碼，例如 tel:+852…。");
  } else {
    if (!["live_chat", "whatsapp"].includes(String(route.channel_type))) throw new Error("Browser 任務只接受 Live Chat 或 WhatsApp 路線。");
    let url: URL;
    try { url = new URL(target); } catch { throw new Error("聯絡網址格式不正確。"); }
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
        !url.hostname.includes(".") || /^[\d.]+$/.test(url.hostname) || url.hostname.startsWith("[") ||
        /(^|\.)(localhost|local|internal|test|invalid|example)$/.test(url.hostname)) throw new Error("Browser 目標必須是公開 HTTPS 網址。");
  }
  return { schemaVersion: 1, jobId, kind, routeId: route.id, routeRevision: Number(route.revision),
    revisionStartedAt: route.revision_started_at, target, steps: [...route.steps], timeoutSeconds: 180,
    maxAttempts: 1, stopAt: ["human_reached", "account_verification", "payment", "captcha"],
    execution: "not_connected", publication: "manual_review_required" };
}

/** Validate untrusted provider output before a future server-side review queue. */
export function validateAgentResult(plan: JobPlan, current: RouteSnapshot, value: unknown, now = Date.now()) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Agent 結果必須是物件。");
  const result = value as Record<string, unknown>;
  if (result.jobId !== plan.jobId || result.routeId !== plan.routeId || result.routeRevision !== plan.routeRevision ||
      current.id !== plan.routeId || current.revision !== plan.routeRevision || current.revision_started_at !== plan.revisionStartedAt) throw new Error("任務或路線版本已變更，必須重新驗證。");
  if (!validTime(result.testedAt) || Date.parse(result.testedAt) > now || Date.parse(result.testedAt) < Date.parse(plan.revisionStartedAt)) throw new Error("驗證時間無效、在未來或早於路線版本。");
  if (!["human_reached", "human_not_available", "verification_boundary", "failed"].includes(String(result.result))) throw new Error("未支援的驗證結果。");
  if (!["service_hours", "after_hours"].includes(String(result.testPeriod))) throw new Error("缺少有效測試時段。");
  if (typeof result.evidence !== "string" || !result.evidence.trim()) throw new Error("Agent 結果必須附有證據／測試說明。");
  if (result.result === "human_reached" && result.humanObserved !== true) throw new Error("真人聯絡成功需要實際觀察，不能從按鈕或頁面文字推斷。");
  if (result.result === "verification_boundary" && (typeof result.boundary !== "string" || !result.boundary.trim())) throw new Error("必須記錄停止驗證的邊界。");
  return { jobId: plan.jobId, routeId: plan.routeId, routeRevision: plan.routeRevision,
    testedAt: result.testedAt, result: result.result, testPeriod: result.testPeriod,
    evidence: result.evidence.trim(), reviewRequired: true as const };
}
