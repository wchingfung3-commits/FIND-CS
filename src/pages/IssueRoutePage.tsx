import { BackButton } from "@/components/BackButton";
import { RouteCard } from "@/components/RouteCard";
import { Disclaimer } from "@/components/Disclaimer";
import { getCompanyById, getIssueById, getHumanRoutes } from "@/lib/data";
import type { ChannelType } from "@/types";

interface IssueRoutePageProps {
  companyId: string;
  issueId: string;
  navigate: (path: string) => void;
}

const humanChannelOrder: ChannelType[] = ["phone", "live_chat", "whatsapp"];

export function IssueRoutePage({ companyId, issueId, navigate }: IssueRoutePageProps) {
  const company = getCompanyById(companyId);
  const issue = getIssueById(issueId);

  if (!company || !issue || issue.companyId !== companyId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BackButton onClick={() => navigate(`/company/${companyId}`)} />
        <p className="mt-6 text-slate-500">找不到這個問題。</p>
      </div>
    );
  }

  const issueRoutes = getHumanRoutes(companyId, issueId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <BackButton onClick={() => navigate(`/company/${companyId}`)} />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{issue.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{company.name}</p>
      </div>

      <section className="mb-8">
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-700">
          <span>👤</span> 聯絡真人客服
        </h2>

        {issueRoutes.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-center text-sm text-slate-500">
            此問題暫時沒有專屬真人客服路線，請使用一般客服渠道。
          </p>
        ) : (
          <div className="space-y-2.5">
            {humanChannelOrder.map((channelType) => {
              const route = issueRoutes.find((r) => r.channelType === channelType);
              if (!route) return null;
              return (
                <RouteCard
                  key={route.id}
                  route={route}
                  onClick={() => navigate(`/company/${companyId}/route/${route.id}`)}
                />
              );
            })}
            {issueRoutes
              .filter((r) => !humanChannelOrder.includes(r.channelType))
              .map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onClick={() => navigate(`/company/${companyId}/route/${route.id}`)}
                />
              ))}
          </div>
        )}
      </section>

      <Disclaimer />
    </div>
  );
}
