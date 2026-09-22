import { SearchBar } from "@/components/SearchBar";
import { IndustryCard } from "@/components/IndustryCard";
import { Disclaimer } from "@/components/Disclaimer";
import { industries } from "@/data/industries";
import { companies } from "@/data/companies";

interface HomePageProps {
  navigate: (path: string) => void;
}

const commonSearchIds = ["hsbc", "cathay", "klook", "sf", "hktvmall"];

export function HomePage({ navigate }: HomePageProps) {
  const commonSearches = companies.filter((c) => commonSearchIds.includes(c.id));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-2xl font-bold text-slate-800 sm:text-3xl">
          搵公司客服
        </h1>
        <p className="text-sm text-slate-500">
          幫你找到實際可以聯絡真人客服的方法
        </p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <SearchBar onSelectCompany={(id) => navigate(`/company/${id}`)} />
      </div>

      {/* Common searches */}
      <div className="mb-10 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400">常見搜尋：</span>
        {commonSearches.map((company) => (
          <button
            key={company.id}
            type="button"
            onClick={() => navigate(`/company/${company.id}`)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-600 transition hover:border-teal-300 hover:text-teal-600 active:scale-[0.98]"
          >
            {company.name}
          </button>
        ))}
      </div>

      {/* Industries */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-700">行業分類</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {industries.map((industry) => (
            <IndustryCard
              key={industry.id}
              name={industry.name}
              icon={industry.icon}
              onClick={() => navigate(`/industry/${industry.id}`)}
            />
          ))}
        </div>
      </div>

      <Disclaimer />
    </div>
  );
}
