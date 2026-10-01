import assert from "node:assert/strict";
import { createJobPlan, validateAgentResult, readJobCheck } from "../src/agents/contracts";
const route = { id: "route-a", revision: 2, revision_started_at: "2026-09-29T10:00:00Z",
  action_url: "https://support.company.com/chat", channel_type: "live_chat", steps: ["Open chat"] };
const plan = createJobPlan(route, "browser", "job-a");
assert.equal(plan.execution, "not_connected");
assert.equal(plan.publication, "manual_review_required");
const result = { jobId: plan.jobId, routeId: route.id, routeRevision: 2,
  testedAt: "2026-09-29T11:00:00Z", result: "human_reached", humanObserved: true,
  testPeriod: "service_hours", evidence: "Observed staff greeting and archived transcript" };
const now = Date.parse("2026-09-29T12:00:00Z");
assert.equal(validateAgentResult(plan, route, result, now).reviewRequired, true);
let cases = 0;
function rejects(run: () => unknown) { assert.throws(run); cases++; }
for (const patch of [{ jobId: "other" }, { routeId: "other" }, { routeRevision: 1 },
  { testedAt: "2026-09-29T13:00:00Z" }, { testedAt: "2026-09-29T09:00:00Z" },
  { testedAt: "yesterday" }, { testedAt: "2026-02-30T10:00:00Z" }, { evidence: " " }, { result: "verified" },
  { humanObserved: false }, { testPeriod: "unknown" }]) {
  rejects(() => validateAgentResult(plan, route, { ...result, ...patch }, now));
}
rejects(() => validateAgentResult(plan, { ...route, revision: 3 }, result, now));
rejects(() => validateAgentResult(plan, { ...route, revision_started_at: "2026-09-29T11:00:00Z" }, result, now));
rejects(() => validateAgentResult(plan, route, { ...result, result: "verification_boundary" }, now));
for (const action_url of ["http://support.company.com", "https://127.0.0.1", "https://[::1]", "https://user:secret@company.com", "https://company.local", "https://company.com:8443", "javascript:alert(1)"]) {
  rejects(() => createJobPlan({ ...route, action_url }, "browser", "job-a"));
}
rejects(() => createJobPlan(route, "voice", "job-a"));
rejects(() => createJobPlan({ ...route, steps: [false] }, "browser", "job-a"));
const voice = createJobPlan({ ...route, channel_type: "phone", action_url: "tel:+85221234567" }, "voice", "voice-a");
assert.equal(voice.kind, "voice");
rejects(() => createJobPlan({ ...route, channel_type: "phone", action_url: "tel:21234567" }, "voice", "voice-a"));
// PostgreSQL/API timestamps may spell the same instant differently.
const precise = { ...plan, revisionStartedAt: "2026-09-29T10:00:00.123456Z" };
assert.equal(validateAgentResult(precise, { ...route, revision_started_at: "2026-09-29T18:00:00.123456+08:00" }, result, now).reviewRequired, true);
assert.equal(validateAgentResult(plan, { ...route, revision_started_at: "2026-09-29T10:00:00.000000+00:00" }, result, now).reviewRequired, true);
rejects(() => validateAgentResult(precise, { ...route, revision_started_at: "2026-09-29T10:00:00.123457Z" }, result, now));
rejects(() => validateAgentResult(precise, { ...route, revision_started_at: precise.revisionStartedAt }, { ...result, testedAt: "2026-09-29T10:00:00.123455Z" }, now));
rejects(() => validateAgentResult(plan, route, { ...result, testedAt: "2026-09-29T12:00:00.000001Z" }, now));
rejects(() => validateAgentResult(plan, route, { ...result, testedAt: "2026-09-29T24:00:00Z" }, now));
const check = { jobId: "job-a", state: "blocked_provider", runnable: false,
  routeRevision: 2, currentRouteRevision: 2, checkedAt: "2026-09-29T12:00:00+00:00" };
for (const state of ["blocked_provider", "cancelled", "stale_route", "unavailable"]) {
  assert.equal(readJobCheck({ ...check, state }, "job-a").runnable, false);
}
assert.equal(readJobCheck({ ...check, state: "unavailable", routeRevision: null, currentRouteRevision: null }, "job-a").state, "unavailable");
for (const patch of [{ jobId: "wrong-job" }, { state: "ready" }, { runnable: true },
  { routeRevision: 0 }, { currentRouteRevision: null }, { currentRouteRevision: 3 },
  { checkedAt: "invalid" }, { checkedAt: "2026-02-30T12:00:00Z" }]) {
  rejects(() => readJobCheck({ ...check, ...patch }, "job-a"));
}
rejects(() => readJobCheck(null, "job-a"));
console.log(`PASS agent plans and ${cases} rejection cases (no provider execution)`);
