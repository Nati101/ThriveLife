import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { buttonClassName } from "@/components/ui/button-styles";

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  level = 1,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="mb-1 text-sm font-medium text-primary">{eyebrow}</p>
        ) : null}
        <Heading
          className={
            level === 1
              ? "text-3xl font-bold text-gray-800"
              : "text-xl font-semibold text-gray-700"
          }
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

export function PlaceholderPanel({
  title,
  children,
  href,
  linkLabel,
}: {
  title: string;
  children: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
      {href && linkLabel ? (
        <Link to={href} className={`${buttonClassName({ size: "sm" })} mt-4`}>
          {linkLabel}
        </Link>
      ) : null}
    </section>
  );
}
