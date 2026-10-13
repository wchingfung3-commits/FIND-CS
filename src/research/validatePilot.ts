import { safeActionUrl } from '../lib/catalog';
import type { ResearchCompany, ResearchRoute } from './pilot';
export const researchAction = (route: ResearchRoute) => route.conflict ? undefined : safeActionUrl(route.actionUrl);
export function validatePilot(companies: ResearchCompany[]) {
  const companyIds = new Set<string>(), routeIds = new Set<string>();
  for (const company of companies) {
    if (companyIds.has(company.id) || company.menuComplete !== false) throw new Error('Duplicate company or unobserved menu completion claim');
    companyIds.add(company.id);
    const sourceIds = new Set(company.sources.map(source => source.id));
    if (!company.name || !company.scope || !company.remaining || sourceIds.size !== company.sources.length) throw new Error('Missing scope, research gap or duplicate source');
    for (const source of company.sources) if (!source.label || !source.url.startsWith('https://') || !safeActionUrl(source.url)) throw new Error('Unsafe source');
    if (!company.routes.some(route => route.issue === '其他問題／不確定分類')) throw new Error('Missing general fallback candidate');
    for (const route of company.routes) {
      if (routeIds.has(route.id) || !route.issue || !route.contact || !route.note || !route.sourceIds.length || route.sourceIds.some(id => !sourceIds.has(id))) throw new Error('Invalid route/source linkage');
      routeIds.add(route.id);
      if (!['phone','whatsapp','live_chat'].includes(route.channel)) throw new Error('Unknown channel');
      if (route.conflict && (route.actionUrl || route.sourceIds.length < 2)) throw new Error('Conflicting sources cannot enable contact');
      if (route.actionUrl && !safeActionUrl(route.actionUrl)) throw new Error('Unsafe contact');
      if ('verificationStatus' in route || 'lastVerified' in route || 'fastest' in route || 'evidence' in route) throw new Error('Research cannot claim verification or speed');
    }
  }
}
