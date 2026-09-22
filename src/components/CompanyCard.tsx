import type { Company } from "@/types";

interface CompanyCardProps {
  company: Company;
  onClick: () => void;
}

export function CompanyCard({ company, onClick }: CompanyCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-teal-300 hover:bg-teal-50/30 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700">
          {company.name.charAt(0)}
        </span>
        <span className="text-base font-semibold text-slate-800">{company.name}</span>
      </div>
    </button>
  );
}
