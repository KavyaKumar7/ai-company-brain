import * as React from "react";

import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full resize-y rounded-lg border border-input bg-background/75 px-3 py-2.5 text-sm leading-6 shadow-[0_1px_0_oklch(1_0_0/4%)_inset] transition-[border-color,box-shadow,background-color] outline-none placeholder:text-muted-foreground/65 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      data-slot="textarea"
      {...props}
    />
  );
}
