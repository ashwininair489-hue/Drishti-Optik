import { describe, expect, test } from "bun:test";
import {
  ANALYTICS_SUPPORTED,
  clearConsent,
  getConsent,
  onAnalyticsEvent,
  setConsent,
  track,
  type AnalyticsEnvelope,
} from "@/lib/analytics";

/**
 * Consent gating is a stated privacy requirement, and the whole point is that
 * nothing is collected without an explicit opt-in. These tests exercise the
 * module with a minimal in-memory `window` so the browser paths run for real.
 */
function withBrowserWindow<T>(run: () => T): T {
  const store = new Map<string, string>();
  const target = globalThis as unknown as { window?: unknown };
  const previous = target.window;

  target.window = {
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
    location: { pathname: "/console" },
  };

  try {
    return run();
  } finally {
    if (previous === undefined) delete target.window;
    else target.window = previous;
  }
}

describe("consent state", () => {
  test("consent is unset until the visitor chooses", () => {
    withBrowserWindow(() => {
      expect(getConsent()).toBeNull();
    });
  });

  test("a choice is persisted and readable", () => {
    withBrowserWindow(() => {
      setConsent("all");
      expect(getConsent()).toBe("all");
      setConsent("essential");
      expect(getConsent()).toBe("essential");
    });
  });

  test("clearing the choice resets the visitor to undecided", () => {
    withBrowserWindow(() => {
      setConsent("all");
      clearConsent();
      expect(getConsent()).toBeNull();
    });
  });

  test("consent without a browser window is undefined rather than an error", () => {
    expect(getConsent()).toBeNull();
    expect(() => setConsent("all")).not.toThrow();
    expect(() => clearConsent()).not.toThrow();
  });
});

describe("event gating", () => {
  test("no event is emitted before consent is given", () => {
    withBrowserWindow(() => {
      const received: AnalyticsEnvelope[] = [];
      const unsubscribe = onAnalyticsEvent((event) => received.push(event));

      track("page_view");
      track("tracking_started", { mode: "assisted" });

      expect(received).toEqual([]);
      unsubscribe();
    });
  });

  test("accepting analytics emits events with the route they happened on", () => {
    withBrowserWindow(() => {
      const received: AnalyticsEnvelope[] = [];
      const unsubscribe = onAnalyticsEvent((event) => received.push(event));

      setConsent("all");
      track("page_view", { route: "/console" });

      expect(received).toHaveLength(1);
      expect(received[0]?.event).toBe("page_view");
      expect(received[0]?.path).toBe("/console");
      expect(received[0]?.metadata).toEqual({ route: "/console" });
      unsubscribe();
    });
  });

  test("rejecting optional analytics keeps collection off", () => {
    withBrowserWindow(() => {
      const received: AnalyticsEnvelope[] = [];
      const unsubscribe = onAnalyticsEvent((event) => received.push(event));

      setConsent("all");
      track("login");
      setConsent("essential");
      track("login");

      expect(received).toHaveLength(1);
      unsubscribe();
    });
  });

  test("clearing the choice stops collection again", () => {
    withBrowserWindow(() => {
      const received: AnalyticsEnvelope[] = [];
      const unsubscribe = onAnalyticsEvent((event) => received.push(event));

      setConsent("all");
      clearConsent();
      track("sign_up");

      expect(received).toEqual([]);
      unsubscribe();
    });
  });

  test("unsubscribing stops delivery", () => {
    withBrowserWindow(() => {
      const received: AnalyticsEnvelope[] = [];
      const unsubscribe = onAnalyticsEvent((event) => received.push(event));

      setConsent("all");
      track("page_view");
      unsubscribe();
      track("page_view");

      expect(received).toHaveLength(1);
    });
  });

  test("tracking without a browser window is a silent no-op", () => {
    const received: AnalyticsEnvelope[] = [];
    const unsubscribe = onAnalyticsEvent((event) => received.push(event));

    expect(() => track("page_view")).not.toThrow();
    expect(received).toEqual([]);

    unsubscribe();
  });
});

describe("build flag", () => {
  test("analytics is enabled unless the build explicitly disables it", () => {
    // The flag is read through a fallback, so this passes under the test runner
    // (no Vite env) as well as in a default Vite build.
    expect(ANALYTICS_SUPPORTED).toBe(true);
  });
});
