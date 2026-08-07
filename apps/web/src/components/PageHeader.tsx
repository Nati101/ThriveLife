import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
}) {
  return (
    <header className="mb-8 max-w-2xl">
      {eyebrow ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 text-base leading-relaxed text-muted">{description}</p>
      ) : null}
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
    <section className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
      {href && linkLabel ? (
        <Link
          to={href}
          className="mt-4 inline-flex rounded-md bg-brand px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          {linkLabel}
        </Link>
      ) : null}
    </section>
  );
}
