import type { Company, Industry, Issue, Route, Verification } from "../types";

export interface DataSet { companies: Company[]; industries: Industry[]; issues: Issue[]; routes: Route[]; verifications: Verification[] }

export function validateData({companies, industries, issues, routes, verifications}: DataSet) {
const errors: string[] = [];
const warnings: string[] = [];

function reportDuplicateIds(label: string, values: Array<{ id: string }>) {
  const seen = new Set<string>();

  for (const value of values) {
    if (seen.has(value.id)) {
      errors.push(`${label} has duplicate id "${value.id}"`);
    }
    seen.add(value.id);
  }
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

reportDuplicateIds("companies", companies);
reportDuplicateIds("industries", industries);
reportDuplicateIds("issues", issues);
reportDuplicateIds("routes", routes);
reportDuplicateIds("verifications", verifications);

const companyById = new Map(companies.map((company) => [company.id, company]));
const industryIds = new Set(industries.map((industry) => industry.id));
const issueById = new Map(issues.map((issue) => [issue.id, issue]));
const routeById = new Map(routes.map((route) => [route.id, route]));

for (const company of companies) {
  if (!industryIds.has(company.industry)) {
    warnings.push(
      `company "${company.id}" references missing industry "${company.industry}"`,
    );
  }

  const companyIssues = issues.filter((issue) => issue.companyId === company.id);
  const issueRoutes = routes.filter(
    (route) => route.companyId === company.id && route.issueId != null,
  );

  if (company.supportModel === "router" && companyIssues.length === 0) {
    errors.push(`router company "${company.id}" has no issues`);
  }

  if (companyIssues.length > 0 && company.supportModel !== "router") {
    errors.push(`company "${company.id}" has issues but is not a router`);
  }

  if (company.supportModel === "simple" && issueRoutes.length > 0) {
    errors.push(`simple company "${company.id}" has issue-specific routes`);
  }

  for (const issue of companyIssues) {
    const hasRoute = issueRoutes.some((route) => route.issueId === issue.id);
    if (!hasRoute) {
      errors.push(`issue "${issue.id}" has no route`);
    }
  }
}

for (const issue of issues) {
  if (!companyById.has(issue.companyId)) {
    errors.push(
      `issue "${issue.id}" references missing company "${issue.companyId}"`,
    );
  }
}

for (const route of routes) {
  if (!companyById.has(route.companyId)) {
    errors.push(
      `route "${route.id}" references missing company "${route.companyId}"`,
    );
  }

  if (route.issueId != null) {
    const issue = issueById.get(route.issueId);
    if (!issue) {
      errors.push(
        `route "${route.id}" references missing issue "${route.issueId}"`,
      );
    } else if (issue.companyId !== route.companyId) {
      errors.push(
        `route "${route.id}" and issue "${issue.id}" belong to different companies`,
      );
    }
  }

  if (route.category === "human" && !route.isHumanSupport) {
    errors.push(`human route "${route.id}" must set isHumanSupport to true`);
  }

  if (route.category === "other" && route.isHumanSupport) {
    errors.push(`other route "${route.id}" must set isHumanSupport to false`);
  }
}

for (const verification of verifications) {
  if (verification.result === "human_reached" && !verification.evidence?.trim()) {
    errors.push(`verification "${verification.id}" is successful but has no evidence text`);
  }
  if (!routeById.has(verification.routeId)) {
    errors.push(
      `verification "${verification.id}" references missing route "${verification.routeId}"`,
    );
  }

  if (!isIsoDate(verification.testDate)) {
    errors.push(
      `verification "${verification.id}" has invalid testDate "${verification.testDate}"`,
    );
  }
}

for (const route of routes) {
  const successfulEvidence = verifications
    .filter(
      (verification) =>
        verification.routeId === route.id &&
        verification.result === "human_reached" && Boolean(verification.evidence?.trim()),
    )
    .sort((a, b) => a.testDate.localeCompare(b.testDate));

  const latestSuccess = successfulEvidence[successfulEvidence.length - 1];
  const hasNewerProblem = verifications.some(v => v.routeId === route.id &&
    v.result !== "human_reached" && (!latestSuccess || v.testDate >= latestSuccess.testDate));

  if (route.verificationStatus === "verified" && !latestSuccess) {
    errors.push(`verified route "${route.id}" has no successful evidence`);
  }

  if (latestSuccess && !hasNewerProblem && route.verificationStatus === "unverified") {
    errors.push(
      `route "${route.id}" has successful evidence but is not verified`,
    );
  }

  if (route.verificationStatus === "verified" && hasNewerProblem) {
    errors.push(`verified route "${route.id}" has a newer or same-day unsuccessful test`);
  }

  if (route.verificationStatus === "verified") {
    if (!route.lastVerified) {
      errors.push(`verified route "${route.id}" has no lastVerified date`);
    } else if (!isIsoDate(route.lastVerified)) {
      errors.push(
        `route "${route.id}" has invalid lastVerified "${route.lastVerified}"`,
      );
    } else if (latestSuccess && route.lastVerified !== latestSuccess.testDate) {
      errors.push(
        `route "${route.id}" lastVerified "${route.lastVerified}" does not match latest successful evidence "${latestSuccess.testDate}"`,
      );
    }
  } else if (route.lastVerified) {
    errors.push(
      `non-verified route "${route.id}" must not have lastVerified`,
    );
  }
}


return {errors, warnings};
}
