import type { Row } from './useRows';
import { safeActionUrl } from '../lib/catalog';
export type CatalogTable = 'companies' | 'industries' | 'issues' | 'routes';
export const CATALOG = {
  companies: { label: '公司', sample: { id: '', name: '', industry: '', description: '', official_url: '' } },
  industries: { label: '行業', sample: { id: '', name: '', icon: 'Building2' } },
  issues: { label: '問題', sample: { id: '', company_id: '', name: '', description: '' } },
  routes: { label: '聯絡路線', sample: { id: '', company_id: '', issue_id: null, channel_type: 'phone', category: 'human', is_human_support: true, opening_hours: '', steps: [], action_url: '', action_label: '', published: false } },
} satisfies Record<CatalogTable, { label: string; sample: Row }>;
export const CHANNELS: Record<string, string> = { phone: '電話', live_chat: 'Live Chat', whatsapp: 'WhatsApp', email: '電郵', web_form: '網上表格', branch: '門市／分行', postal: '郵寄', other: '其他' };
const requiredText = (row: Row, key: string, label: string) => {
  if (typeof row[key] !== 'string' || !row[key].trim()) throw new Error(`請填寫${label}。`);
  return row[key].trim();
};
const optionalText = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : null;
// Only allow writable columns. Browser forms do not author verification or revisions.
export function catalogPayload(table: CatalogTable, source: Row, editing: boolean): Row {
  const id = requiredText(source, 'id', '記錄 ID');
  if (!/^[a-z0-9][a-z0-9_-]*$/.test(id)) throw new Error('ID 只可使用小寫英文字母、數字、底線及連字號。');
  let payload: Row;
  if (table === 'industries') payload = { id, name: requiredText(source, 'name', '行業名稱'), icon: requiredText(source, 'icon', '圖示名稱') };
  else if (table === 'companies') {
    const url = optionalText(source.official_url);
    if (url && !/^https:\/\//i.test(url)) throw new Error('官方網站須使用完整 https 網址。');
    if (url && !safeActionUrl(url)) throw new Error('官方網站網址無效。');
    payload = { id, name: requiredText(source, 'name', '公司名稱'), industry: requiredText(source, 'industry', '所屬行業'), description: optionalText(source.description), official_url: url };
  } else if (table === 'issues') payload = { id, name: requiredText(source, 'name', '問題名稱'), company_id: requiredText(source, 'company_id', '所屬公司'), description: optionalText(source.description) };
  else {
    if (typeof source.channel_type !== 'string' || !Object.prototype.hasOwnProperty.call(CHANNELS, source.channel_type)) throw new Error('請選擇有效渠道。');
    if (!['human', 'other'].includes(String(source.category))) throw new Error('請選擇有效用途。');
    if (!Array.isArray(source.steps) || source.steps.some(step => typeof step !== 'string')) throw new Error('接駁步驟格式無效。');
    const url = optionalText(source.action_url);
    if (url && !safeActionUrl(url)) throw new Error('聯絡網址無效；只接受 https、tel、mailto。');
    payload = { id, company_id: requiredText(source, 'company_id', '所屬公司'), issue_id: optionalText(source.issue_id), channel_type: source.channel_type,
      category: source.category, is_human_support: source.category === 'human', opening_hours: optionalText(source.opening_hours),
      steps: source.steps.map(step => (step as string).trim()).filter(Boolean), action_url: url, action_label: optionalText(source.action_label),
      published: editing && source.published === true };
  }
  if (editing) delete payload.id;
  return payload;
}
