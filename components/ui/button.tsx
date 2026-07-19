import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-pill)] px-4 text-sm font-semibold transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_12px_34px_color-mix(in_srgb,var(--primary)_24%,transparent)] hover:brightness-110",
        secondary:
          "border border-[var(--border)] bg-[rgba(255,255,255,0.09)] text-[var(--foreground)] backdrop-blur-xl hover:bg-[rgba(255,255,255,0.14)]",
        ghost:
          "bg-transparent text-[var(--muted-foreground)] hover:bg-[rgba(255,255,255,0.09)] hover:text-[var(--foreground)]",
        danger:
          "border border-[rgba(255,159,184,0.26)] bg-[rgba(255,159,184,0.13)] text-[#ffdbe4] hover:bg-[rgba(255,159,184,0.2)]",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-5 text-base",
        icon: "size-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
