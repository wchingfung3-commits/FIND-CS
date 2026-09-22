import type { Company, Industry, Issue, Route } from '@/types';
import { companies as demoCompanies } from '@/data/companies';
import { industries as demoIndustries } from '@/data/industries';
import { issues as demoIssues } from '@/data/issues';
import { routes as demoRoutes } from '@/data/routes';

// These bindings are replaced atomically before public pages mount.
export let companies: Company[] = demoCompanies;
export let industries: Industry[] = demoIndustries;
export let issues: Issue[] = demoIssues;
export let routes: Route[] = demoRoutes;

export interface Catalog { companies: Company[]; industries: Industry[]; issues: Issue[]; routes: Route[] }

export function replaceCatalog(catalog: Catalog) {
  for (const key of ['companies', 'industries', 'issues', 'routes'] as const) {
    if (!Array.isArray(catalog?.[key])) throw new Error('API returned an invalid catalog');
  }
  companies = catalog.companies;
  industries = catalog.industries;
  issues = catalog.issues;
  routes = catalog.routes;
}

export function safeActionUrl(value?: string): string | undefined {
  if (!value || [...value].some(char => char.charCodeAt(0) <= 32)) return undefined;
  try {
    const url = new URL(value);
    return ['https:', 'tel:', 'mailto:'].includes(url.protocol) ? value : undefined;
  } catch { return undefined; }
}
