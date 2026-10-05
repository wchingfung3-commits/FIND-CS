/** Browser smoke tests with mocked Supabase HTTP responses; this never contacts a live project. */
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { expect } from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/test.mjs";
import { chromium } from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const cwd = new URL("..", import.meta.url).pathname;
async function server(port, configured) {
  const env = { ...process.env };
  env.VITE_CATALOG_MODE = "demo";
  delete env.VITE_SUPABASE_URL; delete env.VITE_SUPABASE_ANON_KEY;
  if (configured) { env.VITE_SUPABASE_URL = "https://mocked.supabase.co"; env.VITE_SUPABASE_ANON_KEY = "sb_publishable_mock_for_browser_smoke"; }
  const child = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", String(port)], { cwd, env, stdio: "ignore" });
  for (let attempt = 0; attempt < 60; attempt++) { try { const response = await fetch(`http://127.0.0.1:${port}`); if (response.ok) return child; } catch {} await new Promise(resolve => setTimeout(resolve, 200)); }
  child.kill(); throw new Error(`Vite did not start on ${port}`);
}

const user = { id: "11111111-1111-1111-1111-111111111111", aud: "authenticated", role: "authenticated", email: "admin@example.com", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const session = { access_token: "mock-access", refresh_token: "mock-refresh", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, token_type: "bearer", user };
const json = (route, body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });

let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
} catch (error) {
  if (String(error).includes("Executable doesn't exist") && !process.argv.includes("--require-browser")) { console.log("SKIP admin browser smoke: Playwright Chromium is not installed in this runtime"); process.exit(0); }
  throw error;
}
let plain; let mocked;
try {
  plain = await server(4175, false);
  const setup = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await setup.goto("http://127.0.0.1:4175/#/admin");
  await setup.getByRole("heading", { name: "尚未連接資料庫" }).waitFor();
  assert.equal(await setup.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "setup screen overflows narrow viewport");

  mocked = await server(4176, true);
  const denied = await browser.newPage();
  await denied.route("https://mocked.supabase.co/**", route => route.request().url().includes("/auth/v1/token") ? json(route, { message: "Invalid login credentials" }, 400) : json(route, {}));
  await denied.goto("http://127.0.0.1:4176/#/admin");
  await denied.getByLabel("電郵").fill("nope@example.com"); await denied.getByLabel("密碼").fill("wrong-password"); await denied.getByRole("button", { name: "登入", exact: true }).click();
  await denied.getByRole("alert").waitFor(); assert.match(await denied.getByRole("alert").innerText(), /登入失敗/);

  const nonAdmin = await browser.newPage();
  await nonAdmin.addInitScript(value => localStorage.setItem("sb-mocked-auth-token", JSON.stringify(value)), session);
  let unauthorizedDataRequests = 0;
  await nonAdmin.route("https://mocked.supabase.co/**", route => {
    const url = route.request().url();
    if (url.includes("/auth/v1/user")) return json(route, user);
    if (url.includes("/rest/v1/rpc/is_admin")) return json(route, false);
    if (url.includes("/rest/v1/")) unauthorizedDataRequests++;
    return json(route, {});
  });
  await nonAdmin.goto("http://127.0.0.1:4176/#/admin");
  await nonAdmin.getByRole("heading", { name: "無法進入管理後台" }).waitFor();
  assert.equal(await nonAdmin.getByRole("button", { name: "Agent 驗證", exact: true }).count(), 0);
  assert.equal(unauthorizedDataRequests, 0, "non-admin UI requested private data");
  const admin = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await admin.addInitScript(value => localStorage.setItem("sb-mocked-auth-token", JSON.stringify(value)), session);
  const pageErrors = [];
  admin.on("pageerror", error => pageErrors.push(error.message));
  let inserted = null; let failNextInsert = false;
  const jobId = "30000000-0000-0000-0000-000000000003";
  const routeId = "browser-route-with-a-long-id-for-mobile-layout-regression-testing";
  const plan = { schemaVersion: 1, jobId, kind: "browser", routeId, routeRevision: 1,
    revisionStartedAt: "2026-10-01T00:00:00.000000Z", target: "https://support.vendor.com/chat",
    steps: ["Open chat"], timeoutSeconds: 180, maxAttempts: 1,
    stopAt: ["human_reached", "account_verification", "payment", "captcha"],
    execution: "not_connected", publication: "manual_review_required" };
  let mockJobs = []; let savedJob = null; let cancelRequest = null;
  let checkState = "blocked_provider"; let failCheck = false; let failCancel = false;
  let emptyCancel = false; let failList = false;
  await admin.route("https://mocked.supabase.co/**", async route => {
    const request = route.request(); const url = request.url();
    if (url.includes("/auth/v1/user")) return json(route, user);
    if (url.includes("/rest/v1/rpc/is_admin")) return json(route, true);
    if (url.includes("/rest/v1/tasks") && request.method() === "GET") return route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-expose-headers": "content-range", "content-range": "*/0" }, body: "[]" });
    if (url.includes("/rest/v1/tasks") && request.method() === "POST") { inserted = request.postDataJSON(); if (failNextInsert) return json(route, { message: "mock write failure" }, 400); return route.fulfill({ status: 201, body: "" }); }
    if (url.includes("/rest/v1/agent_jobs") && request.method() === "GET") {
      if (failList) return json(route, { message: "mock list failure" }, 500);
      return route.fulfill({ status: 200, contentType: "application/json",
        headers: { "access-control-expose-headers": "content-range", "content-range": mockJobs.length ? `0-${mockJobs.length - 1}/${mockJobs.length}` : "*/0" }, body: JSON.stringify(mockJobs) });
    }
    if (url.includes("/rest/v1/agent_jobs") && request.method() === "POST") {
      savedJob = request.postDataJSON();
      if (mockJobs.length) return json(route, { code: "23505", message: "duplicate" }, 409);
      mockJobs = [{ id: jobId, route_id: routeId, kind: "browser", route_revision: 1, plan,
        status: "blocked_provider", created_at: "2026-10-01T12:00:00Z", updated_at: "2026-10-01T12:00:00Z" }];
      return json(route, { plan }, 201);
    }
    if (url.includes("/rest/v1/agent_jobs") && request.method() === "PATCH") {
      cancelRequest = { body: request.postDataJSON(), url };
      if (failCancel) return json(route, { message: "mock cancel failure" }, 403);
      if (emptyCancel) return json(route, []);
      mockJobs = mockJobs.map(job => ({ ...job, status: "cancelled" }));
      return json(route, [{ id: jobId }]);
    }
    if (url.includes("/rest/v1/rpc/check_agent_job")) {
      assert.deepEqual(request.postDataJSON(), { p_job_id: jobId });
      if (failCheck) return json(route, { message: "mock check failure" }, 403);
      return json(route, { jobId, state: checkState, runnable: checkState === "ready",
        routeRevision: 1, currentRouteRevision: checkState === "stale_route" ? 2 : 1,
        checkedAt: "2026-10-05T08:00:00+00:00" });
    }
    return json(route, []);
  });
  await admin.goto("http://127.0.0.1:4176/#/admin");
  await admin.getByRole("heading", { name: "新增維護任務" }).waitFor();
  assert.equal(await admin.getByRole("button", { name: "FIND CS", exact: true }).count(), 0, "public sticky header rendered in admin");
  await admin.getByLabel("標題").fill("Smoke task"); await admin.getByRole("button", { name: "新增任務" }).click();
  await expect(admin.getByLabel("標題")).toHaveValue(""); assert.equal(inserted.notes, null, "blank optional notes should be normalized to null");
  failNextInsert = true; await admin.getByLabel("標題").fill("Fail task"); await admin.getByRole("button", { name: "新增任務" }).click();
  await admin.getByRole("alert").waitFor(); assert.match(await admin.getByRole("alert").innerText(), /mock write failure/);
  assert.equal(await admin.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "admin tasks screen overflows narrow viewport");
  await admin.getByRole("button", { name: "Agent 驗證", exact: true }).click();
  await admin.getByText("未有任務紀錄。", { exact: true }).waitFor();
  await admin.getByLabel("路線 ID").fill(` ${routeId} `);
  await admin.getByRole("button", { name: "儲存待接駁任務", exact: true }).click();
  await admin.getByRole("button", { name: "查看規格", exact: true }).waitFor();
  assert.deepEqual(savedJob, { route_id: routeId, kind: "browser" }, "client must not send authoritative snapshot fields");
  await admin.getByRole("heading", { name: "已儲存規格（未執行）" }).waitFor();
  await admin.getByRole("button", { name: "儲存待接駁任務", exact: true }).click();
  await admin.getByText("這條路線的同一版本已有待接駁任務，請查看下方列表。", { exact: true }).waitFor();
  await admin.getByRole("button", { name: "查看規格", exact: true }).click();
  await admin.getByRole("heading", { name: "已儲存規格（未執行）" }).waitFor();
  for (const [state, message] of [
    ["blocked_provider", "路線版本一致；仍未接駁執行服務，不能執行。"],
    ["stale_route", "路線版本已改動；請取消舊任務並重新建立。"],
    ["cancelled", "任務已取消，不能執行。"],
    ["unavailable", "任務或路線已不存在或無法讀取，不能執行。"],
  ]) {
    checkState = state;
    await admin.getByRole("button", { name: "檢查任務", exact: true }).click();
    await admin.getByText(message, { exact: true }).waitFor();
  }
  checkState = "ready";
  await admin.getByRole("button", { name: "檢查任務", exact: true }).click();
  await admin.getByText("任務檢查回應無效，未允許執行。", { exact: true }).waitFor();
  failCheck = true;
  await admin.getByRole("button", { name: "檢查任務", exact: true }).click();
  await admin.getByText("mock check failure", { exact: true }).waitFor();
  failCheck = false;
  failList = true;
  await admin.getByRole("button", { name: "重新載入", exact: true }).click();
  await admin.getByText("mock list failure", { exact: true }).waitFor();
  failList = false;
  await admin.getByRole("button", { name: "重新載入", exact: true }).click();
  await admin.getByRole("button", { name: "取消任務", exact: true }).waitFor();
  failCancel = true;
  await admin.getByRole("button", { name: "取消任務", exact: true }).click();
  await admin.getByText("mock cancel failure", { exact: true }).waitFor();
  failCancel = false; emptyCancel = true;
  await admin.getByRole("button", { name: "取消任務", exact: true }).click();
  await admin.getByText("任務已變更或没有修改權限，請重新載入。", { exact: true }).waitFor();
  emptyCancel = false;
  await admin.getByRole("button", { name: "取消任務", exact: true }).click();
  await admin.getByText("已取消", { exact: true }).waitFor();
  assert.deepEqual(cancelRequest.body, { status: "cancelled" });
  const cancelUrl = new URL(cancelRequest.url);
  assert.equal(cancelUrl.searchParams.get("id"), `eq.${jobId}`);
  assert.equal(cancelUrl.searchParams.get("status"), "eq.blocked_provider");
  assert.equal(await admin.getByRole("button", { name: "取消任務", exact: true }).count(), 0);
  assert.equal(await admin.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "Agent screen overflows narrow viewport");
  assert.deepEqual(pageErrors, [], "Admin UI raised runtime errors");
  if (process.env.ADMIN_SMOKE_SCREENSHOT) await admin.screenshot({ path: process.env.ADMIN_SMOKE_SCREENSHOT, fullPage: true });
  const publicPage = await browser.newPage();
  await publicPage.goto("http://127.0.0.1:4176/#/");
  await publicPage.getByRole("button", { name: "FIND CS", exact: true }).waitFor();
  assert.equal(await publicPage.getByRole("link", { name: /後台/ }).count(), 0);
  console.log("PASS admin + Agent browser flows (mocked Supabase; no live writes)");
} finally {
  await browser.close(); plain?.kill(); mocked?.kill();
}
