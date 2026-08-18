import { useEffect, useState } from "react";
import { apiFetch, isStaticHost } from "@/lib/api-fetch";

export function FixtureBanner() {
  const [staticHost, setStaticHost] = useState(false);

  useEffect(() => {
    void apiFetch<{ ok?: boolean }>("/api/health")
      .then(() => setStaticHost(isStaticHost()))
      .catch(() => setStaticHost(true));
  }, []);

  return (
    <div className="border-b border-amber-200/80 bg-warn-soft px-4 py-2 text-center text-sm text-fixture">
      Fixture content active — placeholder wording until Joel’s content package
      arrives. Not clinical claims.
      {staticHost ? (
        <span>
          {" "}
          This GitHub Pages demo stores data in your browser. Full Node{" "}
          <code className="font-mono text-xs">/api</code> needs{" "}
          <code className="font-mono text-xs">npm run dev</code> or a Node host.
        </span>
      ) : null}
    </div>
  );
}
