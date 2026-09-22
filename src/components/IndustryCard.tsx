import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface IndustryCardProps {
  name: string;
  icon: string;
  onClick: () => void;
}

export function IndustryCard({ name, icon, onClick }: IndustryCardProps) {
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[icon] ?? Icons.Building2;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md active:scale-[0.98]"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 transition group-hover:bg-teal-100">
        <IconComponent className="h-8 w-8" strokeWidth={1.75} />
      </span>
      <span className="text-base font-semibold text-slate-800">{name}</span>
    </button>
  );
}
