import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { RouteCard } from "@/components/RouteCard";
import { Disclaimer } from "@/components/Disclaimer";
import { getCompanyById, getRouteById, getHumanRoutes, channelMeta } from "@/lib/data";
import type { Route } from "@/types";

interface RoutePageProps {
  companyId: string;
  routeId: string;
  navigate: (path: string) => void;
}

function RouteDetail({ route }: { route: Route }) {
  const meta = channelMeta[route.channelType];
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[meta.icon] ?? Icons.Phone;

  const statusInfo = {
    verified: { label: "已驗證可轉真人", dot: "bg-emerald-500", text: "text-emerald-700" },
    unverified: { label: "未驗證", dot: "bg-slate-400", text: "text-slate-500" },
    needs_review: { label: "需要覆核", dot: "bg-amber-500", text: "text-amber-700" },
  }[route.verificationStatus];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <IconComponent className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h3 className="text-base font-semibold text-slate-800">{meta.label}</h3>
      </div>

      <p className="mb-3 text-sm font-medium text-slate-600">如何聯絡真人客服</p>
      <ol className="mb-4 space-y-2.5">
        {route.steps.map((step, idx) => (
          <li key={idx} className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-bold text-teal-700">
              {idx + 1}
            </span>
            <span className="text-sm leading-relaxed text-slate-700">{step}</span>
          </li>
        ))}
      </ol>

      <div className="mb-4 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
        <span className={`text-sm font-medium ${statusInfo.text}`}>{statusInfo.label}</span>
      </div>

      <div className="mb-4 space-y-1 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
        {route.openingHours && (
          <div className="flex justify-between">
            <span className="text-slate-400">服務時間</span>
            <span className="font-medium text-slate-700">{route.openingHours}</span>
          </div>
        )}
        {route.lastVerified && (
          <div className="flex justify-between">
            <span className="text-slate-400">最後驗證</span>
            <span className="font-medium text-slate-700">{route.lastVerified}</span>
          </div>
        )}
      </div>

      {route.actionUrl && (
        <a
          href={route.actionUrl}
          target={route.actionUrl.startsWith("http") ? "_blank" : undefined}
          rel={route.actionUrl.startsWith("http") ? "noopener noreferrer" : undefined}
          className="flex w-full items-center justify-center rounded-xl bg-teal-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
        >
          {route.actionLabel ?? "前往"}
        </a>
      )}
    </div>
  );
}

export function RoutePage({ companyId, routeId, navigate }: RoutePageProps) {
  const company = getCompanyById(companyId);
  const route = getRouteById(routeId);

  if (!company || !route) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BackButton onClick={() => navigate(`/company/${companyId}`)} />
        <p className="mt-6 text-slate-500">找不到這條客服路線。</p>
      </div>
    );
  }

  const meta = channelMeta[route.channelType];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <BackButton onClick={() => navigate(`/company/${companyId}`)} />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{meta.label}</h1>
        <p className="mt-1 text-sm text-slate-500">{company.name}</p>
      </div>

      <RouteDetail route={route} />

      <Disclaimer />
    </div>
  );
}
