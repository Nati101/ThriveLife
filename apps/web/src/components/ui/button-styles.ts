import { cn } from "./cn";

export const buttonVariants = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:opacity-90",
  outline:
    "border border-border bg-white text-foreground hover:bg-gray-100",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-gray-100",
  ghost:
    "text-muted-foreground hover:bg-gray-100 hover:text-foreground",
} as const;

export const buttonSizes = {
  sm: "min-h-9 px-3 py-1.5 text-xs",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-12 px-5 py-3 text-sm",
} as const;

export type ButtonVariant = keyof typeof buttonVariants;
export type ButtonSize = keyof typeof buttonSizes;

export function buttonClassName({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    buttonVariants[variant],
    buttonSizes[size],
    className,
  );
}
