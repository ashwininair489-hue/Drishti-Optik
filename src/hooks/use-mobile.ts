import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

function subscribe(onChange: () => void) {
  const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getSnapshot() {
  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
}

/**
 * Reports whether the viewport is narrower than the mobile breakpoint.
 *
 * Uses `useSyncExternalStore` so the value is read during render rather than
 * pushed in from an effect, which avoids a cascading re-render on mount.
 */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
