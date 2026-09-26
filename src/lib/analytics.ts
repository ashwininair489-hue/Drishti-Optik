/**
 * Consent-aware, privacy-conscious product analytics.
 *
 * Design goals:
 *  - Optional analytics never load before the visitor consents.
 *  - The site works identically when analytics is disabled or the backend call
 *    fails — every failure path is swallowed silently.
 *  - Only coarse product events are collected, never form contents or tokens.
 */

export type ConsentValue = "all" | "essential";

export type AnalyticsEventName =
  | "page_view"
  | "login"
  | "sign_up"
  | "demo_launch"
  | "tracking_started"
  | "simulation_started"
  | "auto_align_engaged"
  | "assistant_opened"
  | "documentation_viewed"
  | "contact_submitted";

export interface AnalyticsEnvelope {
  event: AnalyticsEventName;
  path: string;
  metadata?: Record<string, string | number | boolean>;
}

const CONSENT_KEY = "drishti-optik.cookie-consent";

/**
 * Reads a Vite build flag without assuming Vite is present, so this module can
 * also be imported by the test runner or any non-bundled context.
 */
function readBuildFlag(name: string, fallback: boolean): boolean {
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    const raw = env?.[name];
    return raw === undefined ? fallback : raw !== "false";
  } catch {
    return fallback;
  }
}

/** Analytics must be explicitly enabled at build time to be wired up at all. */
export const ANALYTICS_SUPPORTED = readBuildFlag("VITE_ANALYTICS_ENABLED", true);

type ConsentListener = (value: ConsentValue | null) => void;
const consentListeners = new Set<ConsentListener>();

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return raw === "all" || raw === "essential" ? raw : null;
  } catch {
    return null;
  }
}

export function setConsent(value: ConsentValue) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, value);
  } catch {
    /* storage unavailable — treated as "no consent yet" */
  }
  consentListeners.forEach((listener) => listener(value));
}

/** Clear the stored choice so the banner is shown again. */
export function clearConsent() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CONSENT_KEY);
  } catch {
    /* storage unavailable */
  }
  consentListeners.forEach((listener) => listener(null));
}

export function subscribeConsent(listener: ConsentListener) {
  consentListeners.add(listener);
  // Notify on the next frame so the banner animates in after mount.
  const id = setTimeout(() => listener(getConsent()), 0);
  return () => {
    clearTimeout(id);
    consentListeners.delete(listener);
  };
}

type EventListener = (envelope: AnalyticsEnvelope) => void;
const eventListeners = new Set<EventListener>();

/** Called by the AnalyticsBridge component that owns the Convex mutation. */
export function onAnalyticsEvent(listener: EventListener) {
  eventListeners.add(listener);
  return () => {
    eventListeners.delete(listener);
  };
}

/**
 * Emit a product event. A no-op for visitors who accepted essential cookies
 * only, since these events are strictly optional.
 */
export function track(
  event: AnalyticsEventName,
  metadata?: AnalyticsEnvelope["metadata"],
) {
  if (!ANALYTICS_SUPPORTED) return;
  if (getConsent() !== "all") return;
  const envelope: AnalyticsEnvelope = {
    event,
    path: typeof window === "undefined" ? "/" : window.location.pathname,
    metadata,
  };
  eventListeners.forEach((listener) => {
    try {
      listener(envelope);
    } catch {
      /* analytics must never break the app */
    }
  });
}
