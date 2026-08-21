import type { ReactNode } from "react";
import { Card } from "./card";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted-foreground">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <Card className="border-red-200" role="alert">
      <p className="text-sm text-red-700">{message}</p>
    </Card>
  );
}

export function SkeletonBlock({ className = "h-24 w-full" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="p-8 text-center">
      <p className="text-lg font-semibold text-gray-800">{title}</p>
      {children ? (
        <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </Card>
  );
}
