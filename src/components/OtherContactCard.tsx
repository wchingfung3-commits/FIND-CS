import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Route } from "@/types";
import { channelMeta } from "@/lib/data";

interface OtherContactCardProps {
  route: Route;
}

export function OtherContactCard({ route }: OtherContactCardProps) {
  const meta = channelMeta[route.channelType];
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[meta.icon] ?? Icons.Mail;

  return (
    <a
      href={route.actionUrl ?? "#"}
      target={route.actionUrl?.startsWith("http") ? "_blank" : undefined}
      rel={route.actionUrl?.startsWith("http") ? "noopener noreferrer" : undefined}
      className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <IconComponent className="h-4.5 w-4.5" strokeWidth={1.75} />
        </span>
        <span className="text-sm font-medium text-slate-700">{meta.label}</span>
      </div>
      <span className="text-sm text-slate-400">→</span>
    </a>
  );
}
