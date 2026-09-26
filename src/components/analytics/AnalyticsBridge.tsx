import { api } from "@/convex/_generated/api";
import { onAnalyticsEvent, track } from "@/lib/analytics";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

/**
 * Forwards consent-gated product events to the backend.
 *
 * This component is the single place where analytics touches the network. It
 * never blocks rendering, never throws, and drops events silently when the
 * backend is unavailable — the app must behave identically without analytics.
 */
export function AnalyticsBridge() {
  const logEvent = useMutation(api.analytics.logEvent);
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    return onAnalyticsEvent((envelope) => {
      void logEvent({
        event: envelope.event,
        path: envelope.path,
        metadata: envelope.metadata ? JSON.stringify(envelope.metadata).slice(0, 500) : undefined,
      }).catch(() => {
        /* analytics is best-effort only */
      });
    });
  }, [logEvent]);

  useEffect(() => {
    if (lastPath.current === location.pathname) return;
    lastPath.current = location.pathname;
    track("page_view", { path: location.pathname });
  }, [location.pathname]);

  return null;
}
