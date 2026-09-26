import React, { type ReactNode } from "react";

interface RootErrorBoundaryDebugProps {
  children: ReactNode;
}

export class RootErrorBoundaryDebug extends React.Component<
  RootErrorBoundaryDebugProps,
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }

  componentDidCatch(error: Error) {
    console.error("[Drishti-Optik] Runtime crash surfaced by RootErrorBoundaryDebug:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
          <div className="clay max-w-lg p-8 text-center">
            <p className="hud-label">Runtime error</p>
            <p className="mt-3 text-lg font-semibold">Something interrupted the interface</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Reloading the page usually clears it, and no simulation data is lost.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="clay-sm clay-press mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Reload the console
            </button>
            <pre className="mt-4 max-w-full overflow-auto rounded-xl bg-muted p-3 text-left text-[11px] leading-5 text-muted-foreground">
              {this.state.message}
              {this.state.stack ? `\n${this.state.stack}` : ""}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
