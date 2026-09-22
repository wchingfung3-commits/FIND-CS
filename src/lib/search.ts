import type { Company } from "@/types";
import { companies } from "@/lib/catalog";

function normalize(str: string): string {
  return str.toLowerCase().trim();
}

/**
 * Fuzzy search over companies by name.
 * Matches prefix, substring, and token-initial characters.
 * Returns ranked results (exact > prefix > substring > token).
 */
export function searchCompanies(query: string): Company[] {
  const q = normalize(query);
  if (!q) return [];

  const exact: Company[] = [];
  const prefix: Company[] = [];
  const substring: Company[] = [];

  for (const company of companies) {
    const name = normalize(company.name);
    if (name === q) {
      exact.push(company);
    } else if (name.startsWith(q)) {
      prefix.push(company);
    } else if (name.includes(q)) {
      substring.push(company);
    }
  }

  return [...exact, ...prefix, ...substring];
}

/**
 * Find a single exact match by name (case-insensitive).
 */
export function findCompanyByName(name: string): Company | undefined {
  const q = normalize(name);
  return companies.find((c) => normalize(c.name) === q);
}

export function getCompanyById(id: string): Company | undefined {
  return companies.find((c) => c.id === id);
}
