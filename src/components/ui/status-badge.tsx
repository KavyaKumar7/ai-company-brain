import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active:
    "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  archived: "border-slate-400/30 bg-slate-400/10 text-slate-200",
  assigned: "border-blue-400/30 bg-blue-400/10 text-blue-200",
  cancelled: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  completed:
    "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  disabled: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  draft: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  in_progress:
    "border-violet-400/30 bg-violet-400/10 text-violet-200",
  overdue: "border-red-400/30 bg-red-400/10 text-red-200",
  published:
    "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        statusStyles[status] ?? "border-muted bg-muted text-muted-foreground",
        className
      )}
    >
      {formatStatus(status)}
    </span>
  );
}
