import { describe, expect, test } from "bun:test";
import { STAGE_LABEL, STAGE_TONE, deriveStages } from "@/lib/pipeline-stages";
import {
  createInitialState,
  deriveTelemetry,
  trackerReducer,
  type TrackerState,
} from "@/lib/tracking-engine";

/**
 * The pipeline diagram is the console's most visible claim about what the
 * system is doing, so its stage states are derived from the real state machine
 * and verified here against it.
 */

const STAGE_IDS = [
  "input",
  "preprocess",
  "detect",
  "features",
  "track",
  "offset",
  "command",
  "confirm",
] as const;

const stagesOf = (state: TrackerState) => deriveStages(state.status, deriveTelemetry(state));

const tick = (state: TrackerState, times: number) => {
  let next = state;
  for (let i = 0; i < times; i += 1) next = trackerReducer(next, { type: "tick" });
  return next;
};

describe("stage derivation", () => {
  test("an idle console reports every stage as waiting", () => {
    const states = stagesOf(createInitialState(1));
    for (const id of STAGE_IDS) expect(states[id]).toBe("waiting");
  });

  test("a running session reports capture and preprocessing complete", () => {
    const state = tick(trackerReducer(createInitialState(1), { type: "start" }), 1);
    const states = stagesOf(state);

    expect(states.input).toBe("completed");
    expect(states.preprocess).toBe("completed");
    expect(states.confirm).toBe("waiting");
  });

  test("stages complete progressively until alignment confirms", () => {
    let state = trackerReducer(createInitialState(1), { type: "start" });
    for (let i = 0; i < 600 && state.status !== "aligned"; i += 1) {
      state = trackerReducer(state, { type: "tick" });
    }

    expect(state.status).toBe("aligned");
    const states = stagesOf(state);
    for (const id of STAGE_IDS) expect(states[id]).toBe("completed");
  });

  test("a target outside the field of view stalls detection", () => {
    const state = trackerReducer(
      trackerReducer(createInitialState(1), { type: "setTarget", azimuth: 14, elevation: 0 }),
      { type: "start" },
    );
    const states = stagesOf(state);

    expect(states.input).toBe("completed");
    expect(states.detect).toBe("processing");
    expect(states.features).toBe("waiting");
    expect(states.track).toBe("waiting");
    expect(states.offset).toBe("waiting");
    expect(states.command).toBe("waiting");
    expect(states.confirm).toBe("waiting");
  });

  test("detection completes before tracking locks", () => {
    const state = tick(trackerReducer(createInitialState(1), { type: "start" }), 1);
    const states = stagesOf(state);

    expect(states.detect).toBe("completed");
    expect(states.offset).toBe("completed");
    expect(["processing", "completed"]).toContain(states.track);
    expect(["processing", "completed"]).toContain(states.command);
  });
});

describe("stage metadata", () => {
  test("every stage state has a label and a tone", () => {
    const all = ["waiting", "processing", "completed", "error"] as const;
    for (const state of all) {
      expect(STAGE_LABEL[state].length).toBeGreaterThan(0);
      expect(STAGE_TONE[state].length).toBeGreaterThan(0);
    }
    expect(STAGE_LABEL.completed).toBe("Completed");
    expect(STAGE_TONE.completed).toBe("ok");
  });

  test("the derived map always covers every stage id", () => {
    const states = stagesOf(createInitialState(1));
    expect(Object.keys(states).sort()).toEqual([...STAGE_IDS].sort());
  });
});
