import { track } from "@/lib/analytics";
import {
  SIM,
  createInitialState,
  deriveTelemetry,
  trackerReducer,
  type TrackingMode,
} from "@/lib/tracking-engine";
import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";

export interface SessionSummary {
  startedAt: number;
  durationSeconds: number;
  peakErrorDeg: number;
  finalErrorDeg: number;
  ticks: number;
  mode: TrackingMode;
  outcome: "aligned" | "aborted";
}

interface UseTrackerOptions {
  seed?: number;
  /** Skip backend persistence (used by the public landing demo). */
  persist?: boolean;
  /** Called once per session when coarse alignment completes. */
  onSessionComplete?: (summary: SessionSummary) => void;
}

/**
 * Drives the coarse alignment simulation.
 *
 * The reducer is pure and clock-free; this hook only owns the interval that
 * advances it, so the same state machine can be unit tested or replayed.
 */
export function useTracker({
  seed = 20260926,
  persist = true,
  onSessionComplete,
}: UseTrackerOptions = {}) {
  const [state, dispatch] = useReducer(trackerReducer, seed, createInitialState);
  // Stamped when a session starts rather than during render, so render stays pure.
  const startedAtRef = useRef<number>(0);
  const completionFiredRef = useRef(false);

  const telemetry = useMemo(() => deriveTelemetry(state), [state]);

  // Advance the simulation on a fixed cadence while the session is running.
  useEffect(() => {
    if (!state.running) return;
    const id = window.setInterval(() => dispatch({ type: "tick" }), 1000 / SIM.fps);
    return () => window.clearInterval(id);
  }, [state.running]);

  // Stable identity on purpose: pages mount this in an effect to auto-start a
  // preview, and a changing identity would restart the session every render.
  const start = useCallback(() => {
    startedAtRef.current = Date.now();
    completionFiredRef.current = false;
    dispatch({ type: "start" });
    track("tracking_started");
  }, []);

  const pause = useCallback(() => dispatch({ type: "pause" }), []);

  const reset = useCallback(() => {
    completionFiredRef.current = false;
    dispatch({ type: "reset" });
  }, []);

  const recenter = useCallback(() => dispatch({ type: "recenter" }), []);

  const toggleDrift = useCallback(() => dispatch({ type: "toggleDrift" }), []);

  const setMode = useCallback((mode: TrackingMode) => dispatch({ type: "setMode", mode }), []);

  const setCamera = useCallback(
    (azimuth: number, elevation: number) => dispatch({ type: "setCamera", azimuth, elevation }),
    [],
  );

  const setTarget = useCallback(
    (azimuth: number, elevation: number) => dispatch({ type: "setTarget", azimuth, elevation }),
    [],
  );

  const nudgeTarget = useCallback(
    (azimuth?: number, elevation?: number) =>
      dispatch({ type: "nudgeTarget", azimuth, elevation }),
    [],
  );

  const autoAlign = useCallback(() => {
    startedAtRef.current = Date.now();
    completionFiredRef.current = false;
    dispatch({ type: "autoAlign" });
    track("auto_align_engaged");
  }, []);

  // Report the completed session once, then let the operator keep exploring.
  useEffect(() => {
    if (state.status !== "aligned" || completionFiredRef.current) return;
    completionFiredRef.current = true;
    const startedAt = startedAtRef.current || Date.now();
    const summary: SessionSummary = {
      startedAt,
      durationSeconds: Math.round((Date.now() - startedAt) / 100) / 10,
      peakErrorDeg: state.peakErrorDeg,
      finalErrorDeg: telemetry.errorMagnitudeDeg,
      ticks: state.elapsedTicks,
      mode: state.mode,
      outcome: "aligned",
    };
    if (persist) onSessionComplete?.(summary);
  }, [
    state.status,
    state.peakErrorDeg,
    state.elapsedTicks,
    state.mode,
    telemetry.errorMagnitudeDeg,
    persist,
    onSessionComplete,
  ]);

  return {
    state,
    telemetry,
    controls: {
      start,
      pause,
      reset,
      recenter,
      toggleDrift,
      setMode,
      setCamera,
      setTarget,
      nudgeTarget,
      autoAlign,
    },
  };
}
