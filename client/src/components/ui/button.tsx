import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "sf-interactive inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--sf-radius-control)] text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-[0_8px_22px_color-mix(in_srgb,var(--primary)_22%,transparent)] hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_color-mix(in_srgb,var(--primary)_28%,transparent)]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-transparent shadow-xs hover:bg-accent dark:bg-transparent dark:border-input dark:hover:bg-input/70",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        public: "bg-[var(--sf-terracotta)] text-[var(--primary-foreground)] shadow-[0_10px_24px_color-mix(in_srgb,var(--sf-terracotta)_28%,transparent)] hover:-translate-y-0.5 hover:bg-[var(--sf-terracotta-strong)] hover:shadow-[0_16px_32px_color-mix(in_srgb,var(--sf-terracotta)_34%,transparent)]",
        publicSecondary: "border border-[var(--sf-line)] bg-[var(--sf-surface-raised)] text-[var(--sf-ink)] shadow-sm hover:-translate-y-0.5 hover:border-[var(--sf-terracotta)] hover:bg-[var(--sf-surface-hover)]",
        publicQuiet: "text-[var(--sf-ink)] hover:bg-[var(--sf-surface-hover)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
