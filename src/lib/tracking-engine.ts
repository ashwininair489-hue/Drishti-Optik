/**
 * Drishti-Optik coarse alignment simulation engine.
 *
 * A deterministic, pure-function model of a virtual camera tracking pipeline.
 * It exists so the console can demonstrate the coarse alignment workflow
 * without any physical optical hardware.
 *
 * IMPORTANT: every number this module produces is a SIMULATED value — a
 * demonstration of the workflow, not a measurement. It never controls a real
 * terminal.
 */

export const SIM = {
  /** Virtual sensor resolution in pixels (SIMULATED). */
  frameWidth: 640,
  frameHeight: 360,
  /** Simulation tick rate. Labeled SIMULATED FPS in the UI. */
  fps: 30,
  /** Angular field of view used by the virtual camera (ASSUMPTION). */
  fovAzimuthDeg: 12,
  fovElevationDeg: 7,
  /** Pixel-per-degree mapping of the virtual sensor (SIMULATED). */
  pxPerDeg: 42,
  /** Coarse alignment is declared complete inside this error (ASSUMPTION). */
  coarseToleranceDeg: 0.35,
  /**
   * Maximum camera slew per tick during assisted/auto alignment (SIMULATED).
   * Tuned so a full acquisition takes a few seconds on screen — slow enough to
   * watch, fast enough not to be tedious during a review.
   */
  slewDegPerTick: 0.09,
  /** Target drift amplitude when "simulate target movement" is enabled. */
  driftAmplitudeDeg: 1.9,
  /** Range band of the virtual link (SIMULATED). */
  distanceKm: 2.4,
  /** Nominal detection confidence at boresight (SIMULATED). */
  confidenceBase: 0.945,
  /** Confidence the tracker must rebuild before a loss counts as re-acquired. */
  reacquireConfidence: 0.55,
  /** Modelled end-to-end pipeline latency (SIMULATED — never a measurement). */
  baseLatencyMs: 42,
  latencyPerDegreeMs: 7,
  latencyConfidenceMs: 18,
  /** Reported frame rate loses a few frames while the estimate is unstable. */
  fpsConfidencePenalty: 4,
} as const;

export type TrackingStatus =
  | "idle"
  | "searching"
  | "acquiring"
  | "tracking"
  | "lost"
  | "reacquiring"
  | "aligned";

/** Direction the operator should slew a single axis. */
export type Guidance = "increase" | "decrease" | "hold";

export type TrackingMode = "manual" | "assisted" | "auto";

export type LogLevel = "info" | "warn" | "success" | "error";

export interface LogEntry {
  id: number;
  tick: number;
  level: LogLevel;
  message: string;
}

/** One sample of the rolling telemetry trace drawn by the console chart. */
export interface HistoryPoint {
  t: number;
  errorDeg: number;
  confidence: number;
  /** Simulated sensor frame rate at that tick. */
  fps: number;
  /** Simulated end-to-end latency at that tick (milliseconds). */
  latencyMs: number;
}

export interface TrackerState {
  running: boolean;
  status: TrackingStatus;
  mode: TrackingMode;
  tick: number;
  elapsedTicks: number;
  /** Elapsed ticks spend in the active session, used for the duration readout. */
  camera: { azimuth: number; elevation: number };
  target: { azimuth: number; elevation: number };
  driftTarget: boolean;
  confidence: number;
  seed: number;
  events: LogEntry[];
  eventSeq: number;
  peakErrorDeg: number;
  alignedAtTick: number | null;
  /** True once a lock has been held in this session, so loss is distinguishable. */
  hadLock: boolean;
  /** How many times a held lock was lost. */
  lossCount: number;
  /** How many times a lost target was re-acquired. */
  reacquireCount: number;
  /** Rolling trace of the alignment error, used by the console chart. */
  history: HistoryPoint[];
}

export interface Telemetry {
  status: TrackingStatus;
  detected: boolean;
  inFov: boolean;
  aligned: boolean;
  /** Pixel offset of the target centre from the frame centre (SIMULATED). */
  offsetPx: { x: number; y: number };
  /** Angular separation between camera boresight and target (SIMULATED). */
  error: { azimuthDeg: number; elevationDeg: number };
  errorMagnitudeDeg: number;
  /**
   * Recommended coarse correction, expressed as the slew the terminal must
   * apply. Convention: `error = target - boresight`, so the correction equals
   * the error itself and applying it drives the error to zero. (The pixel
   * readout flips sign on Y because pixel rows increase downwards while
   * elevation increases upwards.)
   */
  correction: { azimuthDeg: number; elevationDeg: number };
  confidence: number;
  /** Axis-aligned bounding box in virtual frame pixels. */
  bbox: { x: number; y: number; width: number; height: number };
  center: { x: number; y: number };
  fovDeg: { azimuth: number; elevation: number };
  distanceKm: number;
  progress: number;
  /** Which way the operator should slew each axis to close the error. */
  guidance: { azimuth: Guidance; elevation: Guidance };
  /** Simulated sensor frame rate. Not a measured throughput figure. */
  simulatedFps: number;
  /** Simulated end-to-end pipeline latency in milliseconds. Not measured. */
  simulatedLatencyMs: number;
}

export type TrackerAction =
  | { type: "tick" }
  | { type: "start" }
  | { type: "pause" }
  | { type: "reset" }
  | { type: "recenter" }
  | { type: "toggleDrift" }
  | { type: "setMode"; mode: TrackingMode }
  | { type: "nudgeTarget"; azimuth?: number; elevation?: number }
  | { type: "setCamera"; azimuth: number; elevation: number }
  | { type: "setTarget"; azimuth: number; elevation: number }
  | { type: "autoAlign" };

/** Deterministic PRNG so a simulation session is reproducible from its seed. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const round = (value: number, digits = 2) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function createInitialState(seed = 20260926): TrackerState {
  return {
    running: false,
    status: "idle",
    mode: "assisted",
    tick: 0,
    elapsedTicks: 0,
    camera: { azimuth: 0, elevation: 0 },
    target: { azimuth: 3.1, elevation: -2.2 },
    driftTarget: false,
    confidence: 0,
    seed,
    events: [
      {
        id: 1,
        tick: 0,
        level: "info",
        message: "Virtual camera ready. Sensor online, target not yet acquired.",
      },
    ],
    eventSeq: 1,
    peakErrorDeg: 0,
    alignedAtTick: null,
    hadLock: false,
    lossCount: 0,
    reacquireCount: 0,
    history: [],
  };
}

function makeEntry(
  state: TrackerState,
  level: LogLevel,
  message: string,
): { events: LogEntry[]; eventSeq: number } {
  const eventSeq = state.eventSeq + 1;
  const events = [
    { id: eventSeq, tick: state.tick, level, message },
    ...state.events,
  ].slice(0, 40);
  return { events, eventSeq };
}

export function deriveTelemetry(state: TrackerState): Telemetry {
  const errorAz = state.target.azimuth - state.camera.azimuth;
  const errorEl = state.target.elevation - state.camera.elevation;
  const errorMagnitudeDeg = Math.hypot(errorAz, errorEl);
  const fovAz = SIM.fovAzimuthDeg;
  const fovEl = SIM.fovElevationDeg;
  const inFov =
    Math.abs(errorAz) <= fovAz / 2 && Math.abs(errorEl) <= fovEl / 2;

  const centerX = SIM.frameWidth / 2 + errorAz * SIM.pxPerDeg;
  const centerY = SIM.frameHeight / 2 - errorEl * SIM.pxPerDeg;
  const boxW = 108;
  const boxH = 76;

  const aligned =
    state.status === "aligned" ||
    (inFov && errorMagnitudeDeg <= SIM.coarseToleranceDeg && state.running);

  // A tight band around boresight reads as "hold": issuing a slew command for a
  // few hundredths of a degree would be noise, not guidance.
  const holdBand = SIM.coarseToleranceDeg / 4;
  const guidance: { azimuth: Guidance; elevation: Guidance } = {
    azimuth: Math.abs(errorAz) <= holdBand ? "hold" : errorAz > 0 ? "increase" : "decrease",
    elevation: Math.abs(errorEl) <= holdBand ? "hold" : errorEl > 0 ? "increase" : "decrease",
  };

  return {
    status: state.status,
    detected: inFov,
    inFov,
    aligned,
    offsetPx: {
      x: round(errorAz * SIM.pxPerDeg, 1),
      y: round(-errorEl * SIM.pxPerDeg, 1),
    },
    error: { azimuthDeg: round(errorAz, 2), elevationDeg: round(errorEl, 2) },
    errorMagnitudeDeg: round(errorMagnitudeDeg, 3),
    // Slew the camera must perform: identical to the error, on both axes.
    // (`offsetPx.y` is negated only because pixel rows grow downwards.)
    correction: { azimuthDeg: round(errorAz, 2), elevationDeg: round(errorEl, 2) },
    confidence: state.confidence,
    bbox: {
      x: clamp(centerX - boxW / 2, -boxW, SIM.frameWidth),
      y: clamp(centerY - boxH / 2, -boxH, SIM.frameHeight),
      width: boxW,
      height: boxH,
    },
    center: { x: round(centerX, 1), y: round(centerY, 1) },
    fovDeg: { azimuth: fovAz, elevation: fovEl },
    distanceKm: SIM.distanceKm,
    progress: clamp(1 - errorMagnitudeDeg / (fovAz / 2), 0, 1),
    guidance,
    simulatedFps: round(
      SIM.fps - (1 - state.confidence) * SIM.fpsConfidencePenalty,
      1,
    ),
    simulatedLatencyMs: round(
      SIM.baseLatencyMs +
        errorMagnitudeDeg * SIM.latencyPerDegreeMs +
        (1 - state.confidence) * SIM.latencyConfidenceMs,
      1,
    ),
  };
}

/** Reduce one simulation step. Pure: no clocks, no randomness outside the seed. */
export function trackerReducer(
  state: TrackerState,
  action: TrackerAction,
): TrackerState {
  switch (action.type) {
    case "start": {
      const telemetry = deriveTelemetry(state);
      const { events, eventSeq } = makeEntry(
        state,
        "info",
        telemetry.inFov
          ? "Tracking session started. Target candidate inside field of view."
          : "Tracking session started. Scanning field of view for target.",
      );
      return {
        ...state,
        running: true,
        status: telemetry.inFov ? "acquiring" : "searching",
        elapsedTicks: 0,
        alignedAtTick: null,
        events,
        eventSeq,
      };
    }

    case "pause": {
      if (!state.running) return state;
      const { events, eventSeq } = makeEntry(
        state,
        "warn",
        "Tracking paused by operator. Last computed offset retained.",
      );
      return { ...state, running: false, events, eventSeq };
    }

    case "reset": {
      const fresh = createInitialState(state.seed + 1);
      return {
        ...fresh,
        events: [
          {
            id: 1,
            tick: 0,
            level: "info",
            message: "Simulation reset. Camera returned to boresight origin.",
          },
        ],
      };
    }

    case "recenter": {
      const { events, eventSeq } = makeEntry(
        state,
        "info",
        "Re-centre command issued: camera boresight moved to the target estimate.",
      );
      return {
        ...state,
        camera: { ...state.target },
        confidence: clamp(state.confidence + 0.05, 0, 0.99),
        events,
        eventSeq,
      };
    }

    case "toggleDrift": {
      const driftTarget = !state.driftTarget;
      const { events, eventSeq } = makeEntry(
        state,
        "info",
        driftTarget
          ? "Target movement simulation enabled. The virtual platform is now drifting."
          : "Target movement simulation disabled. Target is stationary.",
      );
      return { ...state, driftTarget, events, eventSeq };
    }

    case "setMode": {
      const { events, eventSeq } = makeEntry(
        state,
        "info",
        `Tracking mode set to ${action.mode.toUpperCase()}.`,
      );
      return { ...state, mode: action.mode, events, eventSeq };
    }

    case "autoAlign": {
      const { events, eventSeq } = makeEntry(
        state,
        "info",
        "Auto-align engaged. Camera slewing toward the estimated target bearing.",
      );
      return { ...state, mode: "auto", running: true, events, eventSeq };
    }

    case "setCamera": {
      return {
        ...state,
        camera: {
          azimuth: clamp(action.azimuth, -40, 40),
          elevation: clamp(action.elevation, -20, 20),
        },
      };
    }

    case "setTarget": {
      return {
        ...state,
        target: {
          azimuth: clamp(action.azimuth, -14, 14),
          elevation: clamp(action.elevation, -9, 9),
        },
      };
    }

    case "nudgeTarget": {
      return {
        ...state,
        target: {
          azimuth: clamp(action.azimuth ?? state.target.azimuth, -14, 14),
          elevation: clamp(action.elevation ?? state.target.elevation, -9, 9),
        },
      };
    }

    case "tick": {
      if (!state.running) return state;
      const tick = state.tick + 1;
      const rand = mulberry32(state.seed + tick);
      let target = { ...state.target };

      if (state.driftTarget) {
        const phase = tick / 44;
        target = {
          azimuth: clamp(
            SIM.driftAmplitudeDeg * Math.sin(phase) + 1.1,
            -12,
            12,
          ),
          elevation: clamp(
            -SIM.driftAmplitudeDeg * 0.62 * Math.cos(phase * 0.9) - 0.6,
            -8,
            8,
          ),
        };
      }

      const errorAz = target.azimuth - state.camera.azimuth;
      const errorEl = target.elevation - state.camera.elevation;
      const dist = Math.hypot(errorAz, errorEl);
      const inFov =
        Math.abs(errorAz) <= SIM.fovAzimuthDeg / 2 &&
        Math.abs(errorEl) <= SIM.fovElevationDeg / 2;

      let camera = { ...state.camera };
      if ((state.mode === "auto" || state.mode === "assisted") && inFov && dist > 1e-3) {
        const gain = state.mode === "auto" ? 1 : 0.55;
        const step = Math.min(SIM.slewDegPerTick * gain, dist * 0.5);
        camera = {
          azimuth: camera.azimuth + (errorAz / dist) * step,
          elevation: camera.elevation + (errorEl / dist) * step,
        };
      }

      const remaining = Math.hypot(
        target.azimuth - camera.azimuth,
        target.elevation - camera.elevation,
      );

      const targetConfidence = inFov
        ? clamp(
            SIM.confidenceBase -
              (remaining / (SIM.fovAzimuthDeg / 2)) * 0.22 +
              (rand() - 0.5) * 0.012,
            0.2,
            0.99,
          )
        : 0;

      const previous = state.confidence;
      const confidence = inFov
        ? round(
            previous === 0
              ? targetConfidence
              : previous + (targetConfidence - previous) * 0.18,
            3,
          )
        : round(previous * 0.82, 3);

      // Losing a held lock and losing the target before any lock are different
      // events, and re-acquisition has hysteresis: confidence has to rebuild
      // past a threshold before tracking is declared again.
      const wasDisrupted = state.status === "lost" || state.status === "reacquiring";

      let status: TrackingStatus;
      if (!inFov) {
        status = state.hadLock ? "lost" : "searching";
      } else if (remaining <= SIM.coarseToleranceDeg) {
        status = "aligned";
      } else if (wasDisrupted) {
        status =
          confidence >= SIM.reacquireConfidence
            ? remaining <= SIM.fovAzimuthDeg / 2.4
              ? "tracking"
              : "acquiring"
            : "reacquiring";
      } else if (remaining <= SIM.fovAzimuthDeg / 2.4) {
        status = "tracking";
      } else {
        status = "acquiring";
      }

      const lockedNow = status === "tracking" || status === "aligned";
      const hadLock = state.hadLock || lockedNow;
      const lossCount =
        state.lossCount + (status === "lost" && state.status !== "lost" ? 1 : 0);
      const reacquireCount =
        state.reacquireCount + (wasDisrupted && lockedNow ? 1 : 0);

      let events = state.events;
      let eventSeq = state.eventSeq;
      if (status !== state.status) {
        const messages: Record<TrackingStatus, { level: LogLevel; text: string }> = {
          idle: { level: "info", text: "Tracking idle." },
          searching: {
            level: "warn",
            text: "Target outside field of view. Coarse re-point required.",
          },
          lost: {
            level: "error",
            text: "TRACKING LOST — target left the field of view. Re-centre or auto align to re-acquire.",
          },
          reacquiring: {
            level: "warn",
            text: "Re-acquisition in progress: target back in view, rebuilding tracking confidence.",
          },
          acquiring: {
            level: "info",
            text: "Target detected. Building confidence on the estimated bearing.",
          },
          tracking: {
            level: "info",
            text: "Target lock established. Continuous offset estimation active.",
          },
          aligned: {
            level: "success",
            text: "COARSE ALIGNMENT COMPLETE — handover ready for fine acquisition.",
          },
        };
        const message = messages[status];
        const next = makeEntry(state, message.level, message.text);
        events = next.events;
        eventSeq = next.eventSeq;
      }

      const elapsedTicks = state.elapsedTicks + 1;

      // Modelled throughput for the live telemetry chart. Latency grows with the
      // bearing error and shrinks as confidence builds — never a measurement.
      const fps = round(SIM.fps - (1 - confidence) * SIM.fpsConfidencePenalty, 1);
      const latencyMs = round(
        SIM.baseLatencyMs +
          remaining * SIM.latencyPerDegreeMs +
          (1 - confidence) * SIM.latencyConfidenceMs,
        1,
      );

      return {
        ...state,
        tick,
        camera,
        target,
        status,
        confidence,
        hadLock,
        lossCount,
        reacquireCount,
        elapsedTicks,
        peakErrorDeg: Math.max(state.peakErrorDeg, round(remaining, 3)),
        alignedAtTick:
          state.alignedAtTick ?? (status === "aligned" ? elapsedTicks : null),
        events,
        eventSeq,
        history: [
          ...state.history.slice(-239),
          { t: elapsedTicks, errorDeg: round(remaining, 3), confidence, fps, latencyMs },
        ],
      };
    }

    default:
      return state;
  }
}

/** Human-readable formatting helpers shared by the console panels. */
export const fmt = {
  deg: (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(2)}°`,
  px: (value: number) => `${value >= 0 ? "+" : "−"}${Math.abs(value).toFixed(1)} px`,
  pct: (value: number) => `${(value * 100).toFixed(1)}%`,
  seconds: (ticks: number) => `${(ticks / SIM.fps).toFixed(1)} s`,
};

export const STATUS_COPY: Record<
  TrackingStatus,
  { label: string; tone: "idle" | "busy" | "ok" | "warn" | "error" }
> = {
  idle: { label: "Idle", tone: "idle" },
  searching: { label: "Searching", tone: "warn" },
  acquiring: { label: "Acquiring", tone: "busy" },
  tracking: { label: "Tracking", tone: "busy" },
  lost: { label: "Tracking lost", tone: "error" },
  reacquiring: { label: "Re-acquiring", tone: "warn" },
  aligned: { label: "Coarse alignment complete", tone: "ok" },
};
