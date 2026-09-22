import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "@/types";
import { channelMeta } from "@/lib/data";

interface RouteCardProps {
  route: Route;
  onClick: () => void;
}

export function RouteCard({ route, onClick }: RouteCardProps) {
  const meta = channelMeta[route.channelType];
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[meta.icon] ?? Icons.Phone;

  const statusBadge = {
    verified: { label: "已驗證可轉真人", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    unverified: { label: "未驗證", color: "bg-slate-50 text-slate-500 border-slate-200" },
    needs_review: { label: "需要覆核", color: "bg-amber-50 text-amber-700 border-amber-200" },
  }[route.verificationStatus];

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <IconComponent className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col">
          <span className="text-base font-semibold text-slate-800">{meta.label}</span>
          <span className={`mt-0.5 inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadge.color}`}>
            {statusBadge.label}
          </span>
        </div>
      </div>
      <span className="text-sm font-medium text-teal-600">查看如何轉真人 →</span>
    </button>
  );
}
