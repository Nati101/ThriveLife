import { useEffect, useState } from "react";
import { NO_SCREENING_RATIONALE } from "@thrivelife/shared";
import { PageHeader } from "@/components/PageHeader";
import { fetchSupport } from "@/lib/member-api";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/states";

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
      {!data ? (
        <LoadingState label="Loading support resources…" />
      ) : (
        <>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {data.disclaimer}
          </p>
          <ul className="space-y-3">
            {data.resources.map((row) => (
              <li key={row.name}>
                <Card>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {row.region}
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">{row.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{row.detail}</p>
                  {row.url ? (
                    <a
                      href={row.url}
                      className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline-offset-2 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open resource
                    </a>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="text-xs text-muted-foreground">{NO_SCREENING_RATIONALE}</p>
    </div>
  );
}
