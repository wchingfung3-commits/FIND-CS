import { BackButton } from "@/components/BackButton";
import { RouteCard } from "@/components/RouteCard";
import { IssueCard } from "@/components/IssueCard";
import { OtherContactCard } from "@/components/OtherContactCard";
import { Disclaimer } from "@/components/Disclaimer";
import { getCompanyById, getHumanRoutes, getOtherRoutes, getIssuesByCompany } from "@/lib/data";
import type { ChannelType } from "@/types";

interface CompanyPageProps {
  companyId: string;
  navigate: (path: string) => void;
}

const humanChannelOrder: ChannelType[] = ["phone", "live_chat", "whatsapp"];

export function CompanyPage({ companyId, navigate }: CompanyPageProps) {
  const company = getCompanyById(companyId);

  if (!company) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6">
        <BackButton onClick={() => navigate("/")} />
        <p className="mt-6 text-slate-500">找不到這間公司。</p>
      </div>
    );
  }

  const generalHumanRoutes = getHumanRoutes(companyId, null);
  const otherRoutes = getOtherRoutes(companyId);
  const companyIssues = getIssuesByCompany(companyId);

  const isRouter = company.supportModel === "router";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <BackButton onClick={() => navigate("/")} />
      </div>

      {/* Company header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">{company.name}</h1>
        <p className="mt-1 text-sm text-slate-500">{company.description}</p>
      </div>

      {/* Simple: General Human Support */}
      {!isRouter && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-700">
            <span>👤</span> 聯絡真人客服
          </h2>
          <div className="space-y-2.5">
            {humanChannelOrder.map((channelType) => {
              const route = generalHumanRoutes.find((r) => r.channelType === channelType);
              if (!route) return null;
              return (
                <RouteCard
                  key={route.id}
                  route={route}
                  onClick={() => navigate(`/company/${companyId}/route/${route.id}`)}
                />
              );
            })}
            {generalHumanRoutes
              .filter((r) => !humanChannelOrder.includes(r.channelType))
              .map((route) => (
                <RouteCard
                  key={route.id}
                  route={route}
                  onClick={() => navigate(`/company/${companyId}/route/${route.id}`)}
                />
              ))}
          </div>
        </section>
      )}

      {/* Router: Section A — Channels + Section B — Issues */}
      {isRouter && (
        <>
          <section className="mb-8">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-700">
              <span>👤</span> 一般查詢
            </h2>
            <div className="space-y-2.5">
              {humanChannelOrder.map((channelType) => {
                const route = generalHumanRoutes.find((r) => r.channelType === channelType);
                if (!route) return null;
                return (
                  <RouteCard
                    key={route.id}
                    route={route}
                    onClick={() => navigate(`/company/${companyId}/route/${route.id}`)}
                  />
                );
              })}
              {generalHumanRoutes
                .filter((r) => !humanChannelOrder.includes(r.channelType))
                .map((route) => (
                  <RouteCard
                    key={route.id}
                    route={route}
                    onClick={() => navigate(`/company/${companyId}/route/${route.id}`)}
                  />
                ))}
            </div>
          </section>

          {companyIssues.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-base font-semibold text-slate-700">
                按問題選擇
              </h2>
              <div className="space-y-2.5">
                {companyIssues.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onClick={() => navigate(`/company/${companyId}/issue/${issue.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Other contact methods */}
      {otherRoutes.length > 0 && (
        <section className="mb-4">
          <h2 className="mb-3 text-base font-semibold text-slate-700">
            其他聯絡方法
          </h2>
          <div className="space-y-2">
            {otherRoutes.map((route) => (
              <OtherContactCard key={route.id} route={route} />
            ))}
          </div>
        </section>
      )}

      <Disclaimer />
    </div>
  );
}
