import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick: () => void;
  label?: string;
}

export function BackButton({ onClick, label = "返回" }: BackButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-teal-600 active:scale-[0.98]"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}
