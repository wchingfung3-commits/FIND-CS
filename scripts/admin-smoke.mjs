/** Browser smoke tests with mocked Supabase HTTP responses; this never contacts a live project. */
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { chromium } from "/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs";

const cwd = new URL("..", import.meta.url).pathname;
async function server(port, configured) {
  const env = { ...process.env };
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
  if (String(error).includes("Executable doesn't exist")) { console.log("SKIP admin browser smoke: Playwright Chromium is not installed in this runtime"); process.exit(0); }
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

  const admin = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await admin.addInitScript(value => localStorage.setItem("sb-mocked-auth-token", JSON.stringify(value)), session);
  let inserted = null; let failNextInsert = false;
  await admin.route("https://mocked.supabase.co/**", async route => {
    const request = route.request(); const url = request.url();
    if (url.includes("/auth/v1/user")) return json(route, user);
    if (url.includes("/rest/v1/rpc/is_admin")) return json(route, true);
    if (url.includes("/rest/v1/tasks") && request.method() === "GET") return json(route, []);
    if (url.includes("/rest/v1/tasks") && request.method() === "POST") { inserted = request.postDataJSON(); if (failNextInsert) return json(route, { message: "mock write failure" }, 400); return route.fulfill({ status: 201, body: "" }); }
    return json(route, []);
  });
  await admin.goto("http://127.0.0.1:4176/#/admin");
  await admin.getByRole("heading", { name: "新增維護任務" }).waitFor();
  await admin.getByLabel("標題").fill("Smoke task"); await admin.getByRole("button", { name: "新增任務" }).click();
  await admin.getByLabel("標題").waitFor(); assert.equal(inserted.notes, null, "blank optional notes should be normalized to null");
  failNextInsert = true; await admin.getByLabel("標題").fill("Fail task"); await admin.getByRole("button", { name: "新增任務" }).click();
  await admin.getByRole("alert").waitFor(); assert.match(await admin.getByRole("alert").innerText(), /mock write failure/);
  assert.equal(await admin.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, "admin tasks screen overflows narrow viewport");
  console.log("PASS admin browser smoke (mocked Supabase; no live writes)");
} finally {
  await browser.close(); plain?.kill(); mocked?.kill();
}
