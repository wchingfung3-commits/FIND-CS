export type SupportModel = "simple" | "router";

export type ChannelType =
  | "phone"
  | "live_chat"
  | "whatsapp"
  | "email"
  | "web_form"
  | "branch"
  | "postal"
  | "other";

export type RouteCategory = "human" | "other";

export type VerificationStatus = "verified" | "unverified" | "needs_review";

export type TestPeriod = "service_hours" | "after_hours";

export type VerificationResult =
  | "human_reached"
  | "human_not_available"
  | "verification_boundary"
  | "failed";

export interface Company {
  id: string;
  name: string;
  industry: string;
  description?: string;
  officialUrl?: string;
  supportModel: SupportModel;
}

export interface Issue {
  id: string;
  companyId: string;
  name: string;
  description?: string;
}

export interface Route {
  id: string;
  companyId: string;
  issueId?: string | null;
  channelType: ChannelType;
  category: RouteCategory;
  isHumanSupport: boolean;
  openingHours?: string;
  steps: string[];
  verificationStatus: VerificationStatus;
  lastVerified?: string;
  verificationBoundary?: string;
  /** Direct action URL or number, e.g. tel:, https://wa.me/, chat link */
  actionUrl?: string;
  /** Display label for the action button */
  actionLabel?: string;
}

export interface Verification {
  id: string;
  routeId: string;
  testDate: string;
  testPeriod: TestPeriod;
  result: VerificationResult;
  evidence?: string;
}

export interface Industry {
  id: string;
  name: string;
  /** lucide-react icon name */
  icon: string;
}
