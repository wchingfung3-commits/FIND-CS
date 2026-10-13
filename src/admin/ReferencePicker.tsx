import { useEffect, useState } from 'react';
import { db } from './client';
type Option = { id: string; name: string };
// Bounded, searchable parent lookup; never silently truncate the catalog to 50.
export function ReferencePicker({ table, label, value, onChange, companyId, optional = false }: {
  table: 'companies' | 'industries' | 'issues'; label: string; value: string;
  onChange: (value: string) => void; companyId?: string; optional?: boolean;
}) {
  const [search, setSearch] = useState(''); const [page, setPage] = useState(0); const [retry, setRetry] = useState(0);
  const key = `${table}:${companyId}:${search}:${page}:${retry}`;
  const [result, setResult] = useState<{ key: string; rows: Option[]; count: number; error: string } | null>(null);
  const current = result?.key === key ? result : null;
  const waitingForCompany = table === 'issues' && !companyId;
  useEffect(() => {
    if (!db || waitingForCompany) return;
    const controller = new AbortController(); let active = true;
    void (async () => {
      try {
        let query = db.from(table).select('id,name', { count: 'exact' }).order('name').order('id');
        if (table === 'issues') query = query.eq('company_id', companyId);
        if (search.trim()) query = query.ilike('name', `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`);
        const { data, count, error } = await query.range(page * 50, page * 50 + 49).abortSignal(controller.signal);
        if (error) throw new Error(error.message);
        if (count === null) throw new Error('無法取得選項總數。');
        if (active) setResult({ key, rows: data ?? [], count, error: '' });
      } catch { if (active) setResult({ key, rows: [], count: 0, error: '選項載入失敗，請重試。' }); }
    })();
    return () => { active = false; controller.abort(); };
  }, [table, companyId, search, page, retry, key, waitingForCompany]);
  return <div className="admin-reference">
    <label>{label}搜尋<input type="search" value={search} disabled={waitingForCompany} onChange={e => { setSearch(e.target.value); setPage(0); }} placeholder="輸入名稱搜尋" /></label>
    <label>{label}<select aria-label={label} required={!optional} value={value} disabled={waitingForCompany || !current || !!current.error} onChange={e => onChange(e.target.value)}>
      <option value="">{optional ? '公司通用（不限定問題）' : '請選擇'}</option>
      {value && !current?.rows.some(row => row.id === value) && <option value={value}>目前：{value}</option>}
      {current?.rows.map(row => <option key={row.id} value={row.id}>{row.name} · {row.id}</option>)}
    </select></label>
    {waitingForCompany ? <p className="admin-muted">請先選擇公司。</p> : !current ? <p role="status" className="admin-muted">載入選項中…</p> : current.error ? <div role="alert">{current.error}<button type="button" className="admin-secondary" onClick={() => setRetry(v => v + 1)}>重試選項</button></div> : <div className="admin-actions admin-muted">
      <span>共 {current.count} 項 · 第 {page + 1} 頁</span>
      <button type="button" className="admin-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}>上一批選項</button>
      <button type="button" className="admin-secondary" disabled={(page + 1) * 50 >= current.count} onClick={() => setPage(p => p + 1)}>下一批選項</button>
    </div>}
  </div>;
}
