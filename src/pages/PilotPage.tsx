import { useState } from 'react';
import { pilotCompanies, sourceCheckedOn, type ResearchRoute } from '../research/pilot';
import { researchAction } from '../research/validatePilot';
const channels = { phone: '電話', whatsapp: 'WhatsApp', live_chat: '網上聊天' };
export function PilotPage({ navigate }: { navigate: (path: string) => void }) {
  const [companyId, setCompanyId] = useState('csl'); const [issue, setIssue] = useState('其他問題／不確定分類');
  const company = pilotCompanies.find(item => item.id === companyId)!;
  const issues = [...new Set(company.routes.map(route => route.issue))];
  const selected = company.routes.filter(route => route.issue === issue);
  const fallback = issue === '其他問題／不確定分類' ? [] : company.routes.filter(route => route.issue === '其他問題／不確定分類');
  const card = (route: ResearchRoute) => {
    const action = researchAction(route);
    return <article key={route.id} className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-bold text-teal-800">{channels[route.channel]} · {route.conflict ? '來源不一致，暫停聯絡連結' : '官方列出，未實測到真人'}</p>
      <h3 className="mt-2 break-words text-lg font-bold">{route.contact}</h3>
      {route.hours && <p className="mt-2 text-sm text-slate-600">{route.hours}</p>}
      <p className="mt-3 text-sm leading-6 text-slate-700">{route.note}</p>
      {route.officialSteps && <div className="mt-3 rounded bg-amber-50 p-3 text-sm"><p className="font-bold">官方按鍵指引（未實測）</p><ol className="ml-5 list-decimal">{route.officialSteps.map(step => <li key={step}>{step}</li>)}</ol></div>}
      <div className="mt-4 flex flex-wrap gap-3">{route.sourceIds.map(id => { const source = company.sources.find(item => item.id === id)!; return <a key={id} href={source.url} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-800 underline">{source.label}</a>; })}</div>
      {action && <a href={action} className="mt-4 inline-block rounded-lg bg-teal-700 px-4 py-2 text-sm text-white">{route.channel === 'phone' ? '開啟撥號' : route.channel === 'whatsapp' ? '開啟官方 WhatsApp' : '前往官方客服入口'}</a>}
    </article>;
  };
  return <main className="mx-auto max-w-4xl px-4 py-8 text-slate-900">
    <button onClick={() => navigate('/')} className="text-sm text-teal-800">返回 FIND CS</button>
    <h1 className="mt-5 text-2xl font-bold">首批公司客服研究預覽</h1>
    <p role="status" className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6">這是官方來源研究，與開發示範資料分開。尚未完成電話／聊天實測，沒有最快渠道排名，也未涵蓋完整按鍵選單。來源核對日期：{sourceCheckedOn}（香港時間）。</p>
    <nav aria-label="研究公司" className="mb-6 flex flex-wrap gap-2">{pilotCompanies.map(item => <button key={item.id} aria-pressed={company.id === item.id} className={`rounded-lg border px-4 py-2 text-sm ${company.id === item.id ? 'bg-teal-700 text-white' : 'bg-white text-slate-700'}`} onClick={() => { setCompanyId(item.id); setIssue('其他問題／不確定分類'); }}>{item.name}</button>)}</nav>
    <h2 className="text-xl font-bold">{company.name}</h2><p className="mt-2 text-sm text-slate-600">{company.scope}</p>
    <label className="my-5 block text-sm font-bold">你想查詢甚麼？<select className="mt-2 block w-full rounded-lg border border-slate-300 bg-white p-3" value={issue} onChange={e => setIssue(e.target.value)}>{issues.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
    <p className="mb-4 text-sm text-slate-600">目前分類來自官方服務範圍／專線，不代表每項都有已確認的按鍵分支。</p>
    <div className="grid gap-4 sm:grid-cols-2">{selected.map(card)}</div>
    {!!fallback.length && <section className="mt-7"><h2 className="mb-2 text-lg font-bold">通用候選渠道</h2><p className="mb-4 text-sm text-slate-600">尚未確認通用客服能處理你選的問題；可作其他聯絡入口參考。</p><div className="grid gap-4 sm:grid-cols-2">{fallback.map(card)}</div></section>}
    <aside className="mt-7 rounded-lg bg-slate-100 p-4"><h2 className="text-base font-bold">仍需驗證</h2><p className="mt-2 text-sm leading-6">{company.remaining}</p></aside>
  </main>;
}
