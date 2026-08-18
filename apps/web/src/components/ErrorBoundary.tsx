import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Tiny error boundary. Optional VITE_SENTRY_DSN only beacons — no SDK that
 * breaks when the DSN is missing.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[ThriveLife]", error, info.componentStack);
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    if (typeof dsn === "string" && dsn.startsWith("https://")) {
      void fetch(dsn, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: info.componentStack,
        }),
      }).catch(() => undefined);
    }
  }

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto max-w-lg p-8 text-foreground">
        <h1 className="text-3xl font-bold text-gray-800">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The screen failed to render. Your data is still on the server. Reload
          to try again, or open Support if you need help.
        </p>
        {import.meta.env.DEV ? (
          <pre className="mt-4 overflow-auto rounded-xl border border-border bg-white p-3 text-xs shadow-sm">
            {this.state.error.message}
          </pre>
        ) : null}
        <button
          type="button"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          onClick={() => this.setState({ error: null })}
        >
          Try again
        </button>
      </main>
    );
  }
}
