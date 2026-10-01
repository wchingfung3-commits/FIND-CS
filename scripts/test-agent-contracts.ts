import assert from "node:assert/strict";
import { createJobPlan, validateAgentResult } from "../src/agents/contracts";
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
console.log(`PASS agent plans and ${cases} rejection cases (no provider execution)`);
