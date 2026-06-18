import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border-slate-200 bg-slate-50 text-slate-700",
  assigned: "border-blue-200 bg-blue-50 text-blue-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  disabled: "border-slate-200 bg-slate-50 text-slate-600",
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  in_progress: "border-violet-200 bg-violet-50 text-violet-700",
  overdue: "border-red-200 bg-red-50 text-red-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
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
