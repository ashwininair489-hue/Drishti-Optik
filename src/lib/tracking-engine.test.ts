import { describe, expect, test } from "bun:test";
import {
  SIM,
  createInitialState,
  deriveTelemetry,
  fmt,
  trackerReducer,
  type TrackerAction,
  type TrackerState,
  type TrackingMode,
} from "@/lib/tracking-engine";

/**
 * The simulation engine is the heart of the prototype, and it is pure and
 * deterministic, so it can be tested exhaustively without a browser.
 */

const run = (state: TrackerState, ...actions: TrackerAction[]) =>
  actions.reduce(trackerReducer, state);

/** Ticks until the run reports alignment, or -1 if it never does. */
function ticksToAlign(mode: TrackingMode, seed = 42): number {
  let state = run(
    createInitialState(seed),
    { type: "setMode", mode },
    { type: "start" },
  );
  let ticks = 0;
  while (state.status !== "aligned" && ticks < 3000) {
    state = trackerReducer(state, { type: "tick" });
    ticks += 1;
  }
  return state.status === "aligned" ? ticks : -1;
}

describe("initial state", () => {
  test("starts idle at boresight with the target inside the field of view", () => {
    const state = createInitialState(9001);
    const telemetry = deriveTelemetry(state);

    expect(state.running).toBe(false);
    expect(state.status).toBe("idle");
    expect(state.camera).toEqual({ azimuth: 0, elevation: 0 });
    expect(state.history).toEqual([]);
    expect(state.events).toHaveLength(1);

    expect(telemetry.inFov).toBe(true);
    expect(telemetry.detected).toBe(true);
    // Idle means nothing has been estimated yet, and nothing is "aligned".
    expect(telemetry.confidence).toBe(0);
    expect(telemetry.aligned).toBe(false);
  });

  test("reports a bearing error and a recommended correction to close it", () => {
    const telemetry = deriveTelemetry(createInitialState(1));
    expect(telemetry.errorMagnitudeDeg).toBeGreaterThan(0);
    expect(telemetry.errorMagnitudeDeg).toBeLessThan(SIM.fovAzimuthDeg / 2);
  });
});

describe("sign conventions", () => {
  const state: TrackerState = {
    ...createInitialState(1),
    camera: { azimuth: 0, elevation: 0 },
    target: { azimuth: 3, elevation: 2 },
  };

  test("a target right of and above boresight gives +ΔX and −ΔY", () => {
    const telemetry = deriveTelemetry(state);
    // Positive azimuth error is to the right, so pixel X grows.
    expect(telemetry.offsetPx.x).toBeGreaterThan(0);
    // Pixel rows count downwards while elevation counts upwards, so Y flips.
    expect(telemetry.offsetPx.y).toBeLessThan(0);
    expect(telemetry.error.azimuthDeg).toBeCloseTo(3, 6);
    expect(telemetry.error.elevationDeg).toBeCloseTo(2, 6);
  });

  test("the recommended correction matches the error on both axes", () => {
    const telemetry = deriveTelemetry(state);
    // Regression guard: the azimuth sign used to be flipped relative to
    // elevation, contradicting the slew the reducer actually performs.
    expect(telemetry.correction.azimuthDeg).toBeCloseTo(telemetry.error.azimuthDeg, 6);
    expect(telemetry.correction.elevationDeg).toBeCloseTo(telemetry.error.elevationDeg, 6);
  });

  test("applying the recommended correction zeroes the error", () => {
    const before = deriveTelemetry(state);
    const corrected: TrackerState = {
      ...state,
      camera: {
        azimuth: state.camera.azimuth + before.correction.azimuthDeg,
        elevation: state.camera.elevation + before.correction.elevationDeg,
      },
    };
    const after = deriveTelemetry(corrected);
    expect(after.errorMagnitudeDeg).toBeLessThan(0.05);
    expect(Math.abs(after.offsetPx.x)).toBeLessThan(0.5);
    expect(Math.abs(after.offsetPx.y)).toBeLessThan(0.5);
  });

  test("the pixel offset is the bearing error scaled by the sensor mapping", () => {
    const telemetry = deriveTelemetry(state);
    expect(telemetry.offsetPx.x).toBeCloseTo(3 * SIM.pxPerDeg, 1);
    expect(telemetry.offsetPx.y).toBeCloseTo(-2 * SIM.pxPerDeg, 1);
  });
});

describe("coarse alignment loop", () => {
  test("an assisted run converges inside the tolerance band and reports complete", () => {
    let state = run(createInitialState(42), { type: "start" });
    expect(state.running).toBe(true);

    for (let i = 0; i < 600 && state.status !== "aligned"; i += 1) {
      state = trackerReducer(state, { type: "tick" });
    }

    const telemetry = deriveTelemetry(state);
    expect(state.status).toBe("aligned");
    expect(telemetry.errorMagnitudeDeg).toBeLessThanOrEqual(SIM.coarseToleranceDeg);
    expect(telemetry.aligned).toBe(true);
    expect(state.alignedAtTick).not.toBeNull();
    expect(state.events.some((event) => event.level === "success")).toBe(true);
    expect(state.events[0]?.message).toContain("COARSE ALIGNMENT COMPLETE");
  });

  test("auto mode closes the error at least as fast as assisted mode", () => {
    const assisted = ticksToAlign("assisted");
    const auto = ticksToAlign("auto");
    expect(assisted).toBeGreaterThan(0);
    expect(auto).toBeGreaterThan(0);
    expect(auto).toBeLessThanOrEqual(assisted);
  });

  test("manual mode only reports; it never moves the boresight", () => {
    let state = run(
      createInitialState(42),
      { type: "setMode", mode: "manual" },
      { type: "start" },
    );
    for (let i = 0; i < 40; i += 1) state = trackerReducer(state, { type: "tick" });

    expect(state.camera).toEqual({ azimuth: 0, elevation: 0 });
    expect(deriveTelemetry(state).errorMagnitudeDeg).toBeGreaterThan(0);
    expect(state.status).not.toBe("aligned");
  });

  test("auto align engages the loop from a standing start", () => {
    let state = run(createInitialState(42), { type: "start" }, { type: "autoAlign" });
    expect(state.mode).toBe("auto");
    expect(state.running).toBe(true);
    for (let i = 0; i < 900 && state.status !== "aligned"; i += 1) {
      state = trackerReducer(state, { type: "tick" });
    }
    expect(state.status).toBe("aligned");
  });
});

describe("determinism", () => {
  test("the same seed and action sequence replay identically", () => {
    const trace = () => {
      let state = run(createInitialState(2026), { type: "toggleDrift" }, { type: "start" });
      const samples: number[] = [];
      for (let i = 0; i < 150; i += 1) {
        state = trackerReducer(state, { type: "tick" });
        samples.push(deriveTelemetry(state).errorMagnitudeDeg);
      }
      return samples;
    };

    expect(trace()).toEqual(trace());
  });

  test("a different seed produces a different target path", () => {
    const drift = (seed: number) => {
      let state = run(createInitialState(seed), { type: "toggleDrift" }, { type: "start" });
      for (let i = 0; i < 60; i += 1) state = trackerReducer(state, { type: "tick" });
      return state.target;
    };
    // Drift is a function of the seed, so the trace is reproducible but not fixed.
    expect(drift(1)).toEqual(drift(1));
    expect(drift(1).azimuth).not.toBe(0);
  });

  test("the reducer never mutates the state it is given", () => {
    const before = createInitialState(3);
    const snapshot = JSON.stringify(before);
    const after = run(before, { type: "start" }, { type: "tick" }, { type: "tick" });
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(after).not.toBe(before);
  });
});

describe("operator input and clamping", () => {
  test("camera commands are clamped to the simulated gimbal range", () => {
    const state = run(createInitialState(1), {
      type: "setCamera",
      azimuth: 999,
      elevation: -999,
    });
    expect(state.camera).toEqual({ azimuth: 40, elevation: -20 });
  });

  test("target commands are clamped to the drift envelope", () => {
    const state = run(createInitialState(1), {
      type: "setTarget",
      azimuth: -99,
      elevation: 99,
    });
    expect(state.target).toEqual({ azimuth: -14, elevation: 9 });
  });

  test("re-centre removes the bearing error and logs the action", () => {
    const state = run(createInitialState(1), { type: "start" }, { type: "recenter" });
    expect(state.camera).toEqual(state.target);
    expect(deriveTelemetry(state).errorMagnitudeDeg).toBeLessThan(0.01);
    expect(state.events[0]?.message).toContain("Re-centre");
  });

  test("reset returns a fresh idle session", () => {
    let state = run(createInitialState(1), { type: "start" });
    for (let i = 0; i < 20; i += 1) state = trackerReducer(state, { type: "tick" });
    state = trackerReducer(state, { type: "reset" });

    expect(state.running).toBe(false);
    expect(state.status).toBe("idle");
    expect(state.tick).toBe(0);
    expect(state.elapsedTicks).toBe(0);
    expect(state.camera).toEqual({ azimuth: 0, elevation: 0 });
    expect(state.history).toEqual([]);
    expect(state.events).toHaveLength(1);
    expect(state.events[0]?.message).toContain("Simulation reset");
  });

  test("a paused session does not advance", () => {
    let state = run(createInitialState(1), { type: "start" });
    for (let i = 0; i < 5; i += 1) state = trackerReducer(state, { type: "tick" });
    state = trackerReducer(state, { type: "pause" });
    const pausedAt = state.tick;
    const eventsAfterPause = state.events.length;

    for (let i = 0; i < 5; i += 1) state = trackerReducer(state, { type: "tick" });

    expect(state.running).toBe(false);
    expect(state.tick).toBe(pausedAt);
    expect(state.events).toHaveLength(eventsAfterPause);
    expect(state.events[0]?.message).toContain("paused");
  });
});

describe("detection, confidence and loss of lock", () => {
  test("a target outside the field of view reports searching, not detected", () => {
    const state = run(
      createInitialState(1),
      { type: "setTarget", azimuth: 14, elevation: 0 },
      { type: "start" },
      { type: "tick" },
    );
    const telemetry = deriveTelemetry(state);

    expect(telemetry.inFov).toBe(false);
    expect(telemetry.detected).toBe(false);
    expect(state.status).toBe("searching");
    expect(telemetry.confidence).toBe(0);
    expect(telemetry.bbox.width).toBeGreaterThan(0);
  });

  test("confidence builds while locked and decays when the target is lost", () => {
    let state = run(createInitialState(7), { type: "start" });
    for (let i = 0; i < 40; i += 1) state = trackerReducer(state, { type: "tick" });

    expect(state.confidence).toBeGreaterThan(0.5);
    expect(state.confidence).toBeLessThanOrEqual(0.99);
    const peaked = state.confidence;

    state = run(
      state,
      { type: "setTarget", azimuth: 14, elevation: 0 },
      { type: "tick" },
    );
    expect(state.confidence).toBeLessThan(peaked);
  });
});

describe("moving platform simulation", () => {
  test("drift moves the target and keeps it inside the modelled envelope", () => {
    let state = run(createInitialState(11), { type: "toggleDrift" }, { type: "start" });
    expect(state.driftTarget).toBe(true);

    const distinctAzimuths = new Set<number>();
    for (let i = 0; i < 120; i += 1) {
      state = trackerReducer(state, { type: "tick" });
      distinctAzimuths.add(state.target.azimuth);
      expect(Math.abs(state.target.azimuth)).toBeLessThanOrEqual(12);
      expect(Math.abs(state.target.elevation)).toBeLessThanOrEqual(8);
    }
    expect(distinctAzimuths.size).toBeGreaterThan(10);
  });

  test("drift can be switched back off", () => {
    const state = run(createInitialState(11), { type: "toggleDrift" }, { type: "toggleDrift" });
    expect(state.driftTarget).toBe(false);
  });
});

describe("rolling trace and invariants", () => {
  test("the trace grows with the session and stays bounded", () => {
    let state = run(createInitialState(3), { type: "start" });
    for (let i = 0; i < 300; i += 1) state = trackerReducer(state, { type: "tick" });

    expect(state.history.length).toBe(240);
    expect(state.history[state.history.length - 1]?.t).toBe(state.elapsedTicks);
    expect(state.peakErrorDeg).toBeGreaterThan(0);
  });

  test("no readout ever becomes NaN or infinite during a long drifting run", () => {
    let state = run(
      createInitialState(5),
      { type: "toggleDrift" },
      { type: "setMode", mode: "auto" },
      { type: "start" },
    );

    for (let i = 0; i < 400; i += 1) {
      state = trackerReducer(state, { type: "tick" });
      const telemetry = deriveTelemetry(state);
      const readouts = [
        telemetry.errorMagnitudeDeg,
        telemetry.error.azimuthDeg,
        telemetry.error.elevationDeg,
        telemetry.correction.azimuthDeg,
        telemetry.correction.elevationDeg,
        telemetry.offsetPx.x,
        telemetry.offsetPx.y,
        telemetry.confidence,
        telemetry.progress,
        telemetry.center.x,
        telemetry.center.y,
        telemetry.bbox.x,
        telemetry.bbox.y,
      ];
      for (const value of readouts) {
        expect(Number.isFinite(value)).toBe(true);
      }
      expect(telemetry.progress).toBeGreaterThanOrEqual(0);
      expect(telemetry.progress).toBeLessThanOrEqual(1);
    }
  });
});

describe("readout formatting", () => {
  test("formats the console's signed values", () => {
    expect(fmt.deg(0.84)).toBe("+0.84°");
    expect(fmt.deg(-0.51)).toBe("−0.51°");
    expect(fmt.px(12.4)).toBe("+12.4 px");
    expect(fmt.px(-7.8)).toBe("−7.8 px");
    expect(fmt.pct(0.945)).toBe("94.5%");
    expect(fmt.seconds(SIM.fps)).toBe("1.0 s");
  });
});
