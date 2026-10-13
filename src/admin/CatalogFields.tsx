import type { Row } from './useRows';
import { CHANNELS, type CatalogTable } from './catalogForm';
import { ReferencePicker } from './ReferencePicker';
const text = (value: unknown) => typeof value === 'string' ? value : '';
export function CatalogFields({ table, value, onChange, editing }: { table: CatalogTable; value: Row; onChange: (row: Row) => void; editing: boolean }) {
  const set = (key: string, next: unknown) => onChange({ ...value, [key]: next });
  return <>
    <label>記錄 ID<input required disabled={editing} pattern="[a-z0-9][a-z0-9_-]*" value={text(value.id)} onChange={e => set('id', e.target.value)} placeholder="例如 hsbc-card-dispute-phone" /></label>
    {table !== 'routes' && <label>{table === 'companies' ? '公司名稱' : table === 'issues' ? '問題名稱' : '行業名稱'}<input required value={text(value.name)} onChange={e => set('name', e.target.value)} /></label>}
    {table === 'industries' && <label>圖示名稱<input required value={text(value.icon)} onChange={e => set('icon', e.target.value)} /></label>}
    {table === 'companies' && <><ReferencePicker table="industries" label="所屬行業" value={text(value.industry)} onChange={next => set('industry', next)} />
      <label>官方網站<input type="url" value={text(value.official_url)} onChange={e => set('official_url', e.target.value)} placeholder="https://…" /></label></>}
    {(table === 'issues' || table === 'routes') && <ReferencePicker table="companies" label="所屬公司" value={text(value.company_id)} onChange={next => onChange({ ...value, company_id: next, ...(table === 'routes' ? { issue_id: null } : {}) })} />}
    {table !== 'routes' && table !== 'industries' && <label>說明<textarea rows={3} value={text(value.description)} onChange={e => set('description', e.target.value)} /></label>}
    {table === 'routes' && <>
      <ReferencePicker key={text(value.company_id)} table="issues" companyId={text(value.company_id)} label="適用問題" optional value={text(value.issue_id)} onChange={next => set('issue_id', next || null)} />
      <label>客服渠道<select value={text(value.channel_type)} onChange={e => set('channel_type', e.target.value)}>{Object.entries(CHANNELS).map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
      <label>用途<select value={text(value.category)} onChange={e => onChange({ ...value, category: e.target.value, is_human_support: e.target.value === 'human' })}><option value="human">尋找真人客服（未代表已驗證）</option><option value="other">其他／後備聯絡方式</option></select></label>
      <label>開放時間<input value={text(value.opening_hours)} onChange={e => set('opening_hours', e.target.value)} placeholder="例如 星期一至五 09:00–18:00；未知可留空" /></label>
      <label>接駁步驟（每行一個步驟）<textarea rows={6} value={Array.isArray(value.steps) ? value.steps.join('\n') : ''} onChange={e => set('steps', e.target.value.split('\n'))} placeholder={'撥打官方熱線\n選擇語言\n選擇相關問題'} /></label>
      <label>聯絡網址／電話連結<input value={text(value.action_url)} onChange={e => set('action_url', e.target.value)} placeholder="tel:+852… 或 https://…" /></label>
      <label>聯絡按鈕文字<input value={text(value.action_label)} onChange={e => set('action_label', e.target.value)} placeholder="例如 致電客服" /></label>
      <div className="admin-warning">官方列出渠道與實測到真人是不同證據。此表單不會新增驗證紀錄；新路線一律存成未發布草稿。</div>
      {editing && <label className="admin-check"><input type="checkbox" checked={value.published === true} onChange={e => set('published', e.target.checked)} />發布到前端（修改接駁內容後，資料庫會先撤回發布，須重新審核）</label>}
    </>}
  </>;
}
