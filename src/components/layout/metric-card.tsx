import type { ComponentType } from "react";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ComponentType<{ className?: string }>;
  tone?: "blue" | "mint" | "amber" | "rose";
};

const toneStyles = {
  blue: "bg-blue-400/10 text-blue-300",
  mint: "bg-emerald-400/10 text-emerald-300",
  amber: "bg-amber-400/10 text-amber-300",
  rose: "bg-rose-400/10 text-rose-300",
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon = ArrowUpRight,
  tone = "blue",
}: MetricCardProps) {
  return (
    <Card className="animate-card-in hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lg hover:shadow-black/10">
      <CardContent>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-2 text-[1.75rem] font-semibold leading-none tracking-normal">{value}</p>
          </div>
          <div className={cn("flex size-8 items-center justify-center rounded-lg", toneStyles[tone])}>
            <Icon className="size-4" />
          </div>
        </div>
        {helper ? <p className="mt-3 text-xs text-muted-foreground/75">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}
