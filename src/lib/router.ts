import { useEffect, useState, useCallback } from "react";

/**
 * Minimal hash-based router (no external dependency).
 * Routes:
 *   #/                              Home
 *   #/industry/:industryId           Industry company list
 *   #/company/:companyId             Company page
 *   #/company/:companyId/route/:routeId   Exact human contact route
 */
export function useHashRoute(): [string, (path: string) => void] {
  const [hash, setHash] = useState<string>(() => window.location.hash.slice(1) || "/");

  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  const navigate = useCallback((path: string) => {
    const target = path.startsWith("/") ? path : `/${path}`;
    const url = `#${target}`;
    if (window.location.hash !== url) {
      history.pushState(null, "", url);
      setHash(target);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return [hash, navigate];
}

export function parseRoute(hash: string): {
  page: "home" | "industry" | "company" | "route" | "issue";
  industryId?: string;
  companyId?: string;
  routeId?: string;
  issueId?: string;
} {
  const parts = hash.split("/").filter(Boolean);
  if (parts.length === 0) return { page: "home" };
  if (parts[0] === "industry" && parts[1]) {
    return { page: "industry", industryId: parts[1] };
  }
  if (parts[0] === "company" && parts[1]) {
    if (parts[2] === "route" && parts[3]) {
      return { page: "route", companyId: parts[1], routeId: parts[3] };
    }
    if (parts[2] === "issue" && parts[3]) {
      return { page: "issue", companyId: parts[1], issueId: parts[3] };
    }
    return { page: "company", companyId: parts[1] };
  }
  return { page: "home" };
}
