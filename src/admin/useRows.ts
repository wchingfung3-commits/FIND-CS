import { useCallback, useEffect, useState } from "react";
import { db } from "./client";

export type Row = Record<string, unknown>;
export const PAGE_SIZE = 50;
type PageResult = { rows: Row[]; count: number };
export type PageLoader = (table: string, orderBy: string, page: number) => Promise<PageResult>;

export async function loadPageWithClient(client: NonNullable<typeof db>, table: string, orderBy: string, page: number): Promise<PageResult> {
  let query = client.from(table).select("*", { count: "exact" }).order(orderBy, { ascending: false });
  if (orderBy !== "id") query = query.order("id", { ascending: false });
  const { data, count, error } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  if (count === null) throw new Error("無法取得記錄總數，請重試。");
  return { rows: (data ?? []) as Row[], count };
}

export const loadPage: PageLoader = (table, orderBy, page) => {
  if (!db) throw new Error("資料庫尚未連接。");
  return loadPageWithClient(db, table, orderBy, page);
};

export function useRows(table: string, orderBy = "updated_at", loader: PageLoader = loadPage) {
  const [position, setPosition] = useState({ table, page: 0 });
  const page = position.table === table ? position.page : 0;
  const [revision, setRevision] = useState(0);
  const key = `${table}:${orderBy}:${page}:${revision}`;
  const [result, setResult] = useState<{ key: string; rows: Row[]; count: number; error: string } | null>(null);
  const [manualError, setManualError] = useState<{ key: string; message: string } | null>(null);
  const reload = useCallback(() => { setRevision(value => value + 1); }, []);
  const setError = (message: string) => setManualError({ key, message });
  const setPage = (nextPage: number) => {
    setPosition({ table, page: nextPage });
    setRevision(value => value + 1);
  };

  useEffect(() => {
    setPosition(current => current.table === table ? current : { table, page: 0 });
  }, [table]);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { rows, count } = await loader(table, orderBy, page);
        if (!active) return;
        if (page > 0 && page * PAGE_SIZE >= count) {
          setPosition({ table, page: Math.max(0, Math.ceil(count / PAGE_SIZE) - 1) });
          return;
        }
        setResult({ key, rows, count, error: "" });
      } catch (error) {
        if (active) setResult({ key, rows: [], count: 0, error: error instanceof Error ? error.message : "無法載入記錄，請重試。" });
      }
    })();
    return () => { active = false; };
  }, [table, orderBy, page, revision, key, loader]);

  const current = result?.key === key ? result : null;
  return { rows: current?.rows ?? [], count: current?.count ?? 0, page, loading: !current,
    error: manualError?.key === key && manualError.message ? manualError.message : current?.error ?? "",
    setError, setPage, reload };
}
