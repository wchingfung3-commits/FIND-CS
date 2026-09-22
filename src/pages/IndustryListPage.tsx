import { BackButton } from "@/components/BackButton";
import { CompanyCard } from "@/components/CompanyCard";
import { Disclaimer } from "@/components/Disclaimer";
import { getCompaniesByIndustry } from "@/lib/data";
import { industries } from "@/lib/catalog";

interface IndustryListPageProps {
  industryId: string;
  navigate: (path: string) => void;
}

export function IndustryListPage({ industryId, navigate }: IndustryListPageProps) {
  const industry = industries.find((i) => i.id === industryId);
  const companyList = getCompaniesByIndustry(industryId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <BackButton onClick={() => navigate("/")} />
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {industry?.name ?? "行業"}客服
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          選擇你需要聯絡的{industry?.name ?? "公司"}
        </p>
      </div>

      {companyList.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-5 py-8 text-center text-slate-500">
          暫時沒有相關公司資料
        </p>
      ) : (
        <div className="space-y-3">
          {companyList.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onClick={() => navigate(`/company/${company.id}`)}
            />
          ))}
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
