import type { ChannelType, Route, Issue, Company } from "@/types";
import { routes as allRoutes } from "@/lib/catalog";
import { issues as allIssues } from "@/lib/catalog";
import { companies as allCompanies } from "@/lib/catalog";

export interface ChannelMeta {
  type: ChannelType;
  label: string;
  icon: string;
}

export const channelMeta: Record<ChannelType, ChannelMeta> = {
  phone: { type: "phone", label: "電話", icon: "Phone" },
  live_chat: { type: "live_chat", label: "Live Chat", icon: "MessageCircle" },
  whatsapp: { type: "whatsapp", label: "WhatsApp", icon: "MessageSquare" },
  email: { type: "email", label: "Email", icon: "Mail" },
  web_form: { type: "web_form", label: "Web Form", icon: "FileText" },
  branch: { type: "branch", label: "門市 / 分行", icon: "Store" },
  postal: { type: "postal", label: "郵寄", icon: "Send" },
  other: { type: "other", label: "其他", icon: "MoreHorizontal" },
};

export function getRoutesByCompany(companyId: string): Route[] {
  return allRoutes.filter((r) => r.companyId === companyId);
}

export function getHumanRoutes(companyId: string, issueId?: string | null): Route[] {
  return allRoutes.filter(
    (r) => r.companyId === companyId && r.isHumanSupport && (r.issueId ?? null) === (issueId ?? null)
  );
}

export function getOtherRoutes(companyId: string): Route[] {
  return allRoutes.filter((r) => r.companyId === companyId && r.category === "other");
}

export function getIssuesByCompany(companyId: string): Issue[] {
  return allIssues.filter((i) => i.companyId === companyId);
}

export function getRouteById(routeId: string): Route | undefined {
  return allRoutes.find((r) => r.id === routeId);
}

export function getCompanyById(id: string): Company | undefined {
  return allCompanies.find((c) => c.id === id);
}

export function getCompaniesByIndustry(industry: string): Company[] {
  return allCompanies.filter((c) => c.industry === industry);
}

export function getIssueById(issueId: string): Issue | undefined {
  return allIssues.find((i) => i.id === issueId);
}
