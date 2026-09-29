import assert from "node:assert/strict";
import React from "react";
import renderer from "react-test-renderer";
import { loadPageWithClient, useRows } from "../src/admin/useRows";
import type { PageLoader } from "../src/admin/useRows";

const { act, create } = renderer;

async function queryContract() {
  const calls: unknown[] = [];
  const chain = {
    select: (columns: string, options: unknown) => { calls.push(["select", columns, options]); return chain; },
    order: (column: string, options: unknown) => { calls.push(["order", column, options]); return chain; },
    range: async (from: number, to: number) => {
      calls.push(["range", from, to]); return { data: [{ id: "a" }], count: 101, error: null };
    },
  };
  const client = { from: (table: string) => { calls.push(["from", table]); return chain; } } as Parameters<typeof loadPageWithClient>[0];
  const result = await loadPageWithClient(client, "tasks", "updated_at", 2);
  assert.deepEqual(result, { rows: [{ id: "a" }], count: 101 });
  assert.deepEqual(calls, [["from", "tasks"], ["select", "*", { count: "exact" }],
    ["order", "updated_at", { ascending: false }], ["order", "id", { ascending: false }], ["range", 100, 149]]);
  calls.length = 0;
  await loadPageWithClient(client, "companies", "id", 0);
  assert.deepEqual(calls.filter(call => (call as string[])[0] === "order"), [["order", "id", { ascending: false }]]);
}

type Result = { rows: Record<string, unknown>[]; count: number };
function deferred() {
  let resolve!: (result: Result) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<Result>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function hookContract() {
  const pending: Array<{ table: string; page: number; request: ReturnType<typeof deferred> }> = [];
  const loader: PageLoader = (table, _orderBy, page) => {
    const request = deferred(); pending.push({ table, page, request }); return request.promise;
  };
  let current!: ReturnType<typeof useRows>;
  const Probe = ({ table }: { table: string }) => { current = useRows(table, "updated_at", loader); return null; };
  let tree!: renderer.ReactTestRenderer;
  await act(async () => { tree = create(React.createElement(Probe, { table: "tasks" })); });
  assert.deepEqual(pending.map(item => [item.table, item.page]), [["tasks", 0]]);

  await act(async () => { tree.update(React.createElement(Probe, { table: "routes" })); });
  assert.equal(current.loading, true);
  await act(async () => { pending[0].request.resolve({ rows: [{ id: "stale" }], count: 1 }); });
  assert.deepEqual(current.rows, []);
  await act(async () => { pending[1].request.resolve({ rows: [{ id: "route" }], count: 51 }); });
  assert.deepEqual(current.rows, [{ id: "route" }]);
  await act(async () => { current.setPage(1); });
  assert.equal(current.loading, true);
  assert.equal(pending[2].page, 1);
  await act(async () => { pending[2].request.resolve({ rows: [], count: 50 }); });
  assert.equal(current.loading, true);
  assert.equal(pending[3].page, 0);
  await act(async () => { pending[3].request.resolve({ rows: [{ id: "remaining" }], count: 50 }); });
  assert.equal(current.page, 0);
  assert.equal(current.count, 50);
  assert.deepEqual(current.rows, [{ id: "remaining" }]);

  await act(async () => { current.setPage(1); });
  await act(async () => { pending[4].request.reject(new Error("permission denied")); });
  assert.equal(current.error, "permission denied");
  assert.deepEqual(current.rows, []);
  await act(async () => { current.reload(); });
  assert.equal(current.loading, true);
  await act(async () => { pending[5].request.resolve({ rows: [{ id: "recovered" }], count: 51 }); });
  assert.deepEqual(current.rows, [{ id: "recovered" }]);

  // Returning to a previously viewed page must requery, rather than expose the old response.
  await act(async () => { current.setPage(0); });
  assert.equal(current.loading, true);
  await act(async () => { tree.update(React.createElement(Probe, { table: "tasks" })); });
  assert.equal(current.page, 0);
  await act(async () => { tree.update(React.createElement(Probe, { table: "routes" })); });
  assert.equal(current.page, 0, "table changes must reset an earlier page selection");
  assert.equal(current.loading, true);
  await act(async () => { tree.unmount(); });
}

void (async () => {
  await queryContract();
  await hookContract();
  console.log("PASS admin pagination range/order, stale requests, page recovery, errors and retry");
})().catch(error => { console.error(error); process.exitCode = 1; });
