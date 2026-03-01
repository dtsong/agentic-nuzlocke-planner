import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-accent text-surface",
        secondary: "border-transparent bg-surface-overlay text-text-body",
        destructive: "border-transparent bg-state-death text-text-primary",
        outline: "border-text-muted/30 text-text-body",
        alive: "border-transparent bg-state-alive/20 text-state-alive",
        fainted: "border-transparent bg-state-death/20 text-state-death",
        boxed: "border-transparent bg-state-boxed/20 text-state-boxed",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
