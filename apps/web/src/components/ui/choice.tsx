import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export function ChoiceChip({
  selected,
  children,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  selected: boolean;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition",
        selected
          ? "border-primary bg-primary/10 text-primary shadow-sm"
          : "border-border bg-white text-foreground hover:bg-gray-100",
        className,
      )}
    >
      <input className="sr-only" {...props} checked={selected} />
      {children}
    </label>
  );
}
