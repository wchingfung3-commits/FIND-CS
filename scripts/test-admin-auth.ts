import assert from "node:assert/strict";
import React from "react";
import renderer from "react-test-renderer";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useAdminAuth } from "../src/admin/useAdminAuth";
const { act, create } = renderer;
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const session = (id: string) => ({ user: { id, email: `${id}@example.com` } }) as Session;
type SessionResult = { data: { session: Session | null }; error: Error | null };
type PermissionResult = { data: boolean | null; error: { message: string } | null };
const snapshots: ReturnType<typeof deferred<SessionResult>>[] = [];
const permissions: ReturnType<typeof deferred<PermissionResult>>[] = [];
let event!: (name: string, next: Session | null) => void;
let unsubscribed = 0;
const client = {
  auth: {
    getSession() { const request = deferred<SessionResult>(); snapshots.push(request); return request.promise; },
    onAuthStateChange(callback: typeof event) { event = callback; return { data: { subscription: { unsubscribe() { unsubscribed++; } } } }; },
  },
  rpc() { const request = deferred<PermissionResult>(); permissions.push(request); return request.promise; },
} as unknown as SupabaseClient;
let current!: ReturnType<typeof useAdminAuth>;
function Probe() { current = useAdminAuth(client); return null; }
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function run() {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => { tree = create(React.createElement(Probe)); });
  assert.equal(current.checking, true, "initial session restoration must stay loading");
  await act(async () => { event("SIGNED_IN", session("a")); await tick(); });
  await act(async () => { snapshots[0].resolve({ data: { session: null }, error: null }); });
  assert.equal(current.session?.user.id, "a", "stale initial snapshot cannot undo a login");
  await act(async () => { event("SIGNED_OUT", null); });
  await act(async () => { permissions[0].resolve({ data: true, error: null }); });
  assert.equal(current.session, null);
  assert.equal(current.isAdmin, false, "late admin response cannot resurrect signed-out state");
  await act(async () => { event("SIGNED_IN", session("a")); await tick(); });
  await act(async () => { event("SIGNED_IN", session("b")); await tick(); });
  await act(async () => { permissions[1].resolve({ data: true, error: null }); });
  assert.equal(current.isAdmin, false, "old user's admin result cannot authorize the next user");
  await act(async () => { permissions[2].resolve({ data: false, error: null }); });
  assert.match(current.error, /沒有管理員權限/);
  await act(async () => { current.retry(); });
  assert.equal(current.checking, true);
  await act(async () => { snapshots[1].resolve({ data: { session: session("b") }, error: null }); await tick(); });
  await act(async () => { permissions[3].reject(new Error("offline")); });
  assert.equal(current.isAdmin, false);
  assert.match(current.error, /無法連接權限服務/);
  await act(async () => { current.retry(); });
  await act(async () => { snapshots[2].resolve({ data: { session: null }, error: new Error("auth offline") }); });
  assert.equal(current.checking, false);
  assert.match(current.error, /無法連接認證服務/);
  await act(async () => { current.retry(); });
  await act(async () => { snapshots[3].resolve({ data: { session: session("b") }, error: null }); await tick(); });
  await act(async () => { permissions[4].resolve({ data: true, error: null }); });
  assert.equal(current.isAdmin, true, "successful retry restores authorized access");
  await act(async () => { tree.unmount(); });
  assert.equal(unsubscribed, 4);
  console.log("PASS auth restoration, stale login/logout responses, account switching, denial, failures, retry and cleanup");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
