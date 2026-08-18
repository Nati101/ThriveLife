import { useEffect, useState } from "react";
import { NO_SCREENING_RATIONALE } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { fetchSupport } from "@/lib/member-api";

export function SupportPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchSupport>> | null>(
    null,
  );

  useEffect(() => {
    void fetchSupport().then(setData);
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Support"
        title="Always available"
        description="This list is here for everyone, all the time. It is never shown because of a score, and it is never framed as a response to your answers."
      />
      <p className="text-sm leading-relaxed text-muted-foreground">
        {data?.disclaimer}
      </p>
      <ul className="space-y-3">
        {(data?.resources ?? []).map((row) => (
          <li key={row.name} className="rounded-xl border border-border bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {row.region}
            </p>
            <p className="font-semibold text-gray-800">{row.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>
            {row.url ? (
              <a
                href={row.url}
                className="mt-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Open resource
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{NO_SCREENING_RATIONALE}</p>
    </div>
  );
}
