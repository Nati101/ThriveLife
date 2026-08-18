import { Link } from "react-router-dom";

export function SupportFooter({ note }: { note?: string }) {
  return (
    <aside className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-muted-foreground">
      <p>
        {note ??
          "ThriveLife is a wellness tool, not a diagnosis or emergency service. Support is always available — it is never triggered by a score."}
      </p>
      <Link
        to="/support"
        className="mt-2 inline-block font-medium text-primary underline-offset-2 hover:underline"
      >
        Always-available support
      </Link>
      {" · "}
      <Link
        to="/privacy-policy"
        className="inline-block font-medium text-primary underline-offset-2 hover:underline"
      >
        Privacy policy (draft)
      </Link>
      {" · "}
      <Link
        to="/terms"
        className="inline-block font-medium text-primary underline-offset-2 hover:underline"
      >
        Terms (draft)
      </Link>
    </aside>
  );
}
