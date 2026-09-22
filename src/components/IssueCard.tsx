import { icons as Icons } from "@/lib/icons";
import type { Issue } from "@/types";

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
}

const issueIcons: Record<string, string> = {
  "hsbc-credit-stolen": "CreditCard",
  "hsbc-online-banking": "Landmark",
  "hsbc-transfer": "ArrowLeftRight",
  "hsbc-mortgage": "Home",
  "hsbc-app": "Smartphone",
  "pccw-internet": "Wifi",
  "pccw-mobile": "Smartphone",
  "pccw-billing": "Receipt",
};

export function IssueCard({ issue, onClick }: IssueCardProps) {
  const iconName = issueIcons[issue.id] ?? "CircleHelp";
  const IconComponent = Icons[iconName] ?? Icons.CircleHelp;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-teal-300 hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <IconComponent className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="text-base font-semibold text-slate-800">{issue.name}</span>
      </div>
      <span className="text-sm font-medium text-teal-600">查看如何轉真人 →</span>
    </button>
  );
}
