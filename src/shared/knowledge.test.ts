import { describe, expect, test } from "bun:test";
import {
  KB_DISCLAIMER,
  KB_LIMITS,
  KB_PROMPTS,
  KNOWLEDGE_BASE,
  answerFromKnowledge,
  describeSimulation,
  type SimulationContext,
} from "@/shared/knowledge";

/**
 * The assistant is the part of the product most likely to mislead a reviewer, so
 * these tests pin down both its matching behaviour and its honesty guard rails.
 */

const SNAPSHOT: SimulationContext = {
  statusLabel: "Tracking",
  mode: "assisted",
  errorDeg: 0.82,
  offsetX: 34.4,
  offsetY: -12.1,
  confidencePct: 88.4,
  running: true,
  distanceKm: 2.4,
};

describe("knowledge base integrity", () => {
  test("every entry is complete and uniquely identified", () => {
    expect(KNOWLEDGE_BASE.length).toBeGreaterThanOrEqual(10);

    const ids = new Set<string>();
    for (const entry of KNOWLEDGE_BASE) {
      expect(entry.id).not.toBe("");
      expect(ids.has(entry.id)).toBe(false);
      ids.add(entry.id);
      expect(entry.title.length).toBeGreaterThan(0);
      expect(entry.answer.length).toBeGreaterThan(40);
      expect(entry.keywords.length).toBeGreaterThan(0);
    }
  });

  test("no entry claims ISRO development, endorsement or hardware access", () => {
    const forbidden = [
      /developed,? (?:and )?(?:certified )?by ISRO/i,
      /ISRO uses/i,
      /endorsed by ISRO/i,
      /this prototype controls (?:a |the )?(?:real|physical)/i,
    ];

    for (const entry of KNOWLEDGE_BASE) {
      for (const pattern of forbidden) {
        expect(pattern.test(entry.answer)).toBe(false);
      }
    }
  });

  test("the ISRO entry explicitly denies any official affiliation", () => {
    const result = answerFromKnowledge("is this an ISRO product?");
    expect(result.matchedId).toBe("isro");
    expect(result.answer).toMatch(/not developed, endorsed, certified or deployed by ISRO/i);
  });

  test("the measurement entry states that values are simulated, not measured", () => {
    const result = answerFromKnowledge("are these numbers measured or real hardware data?");
    expect(result.matchedId).toBe("measured");
    expect(result.answer).toMatch(/simulated/i);
    expect(result.answer).toMatch(/hardware/i);
  });
});

describe("curated matching", () => {
  test("known questions map to the expected entries", () => {
    expect(answerFromKnowledge("What is coarse alignment?").matchedId).toBe("coarse-alignment");
    expect(answerFromKnowledge("what is free space optical communication?").matchedId).toBe("fsoc");
    expect(answerFromKnowledge("What does tracking confidence mean?").matchedId).toBe("confidence");
    expect(
      answerFromKnowledge("What is the difference between coarse and fine alignment?").matchedId,
    ).toBe("coarse-vs-fine");
    expect(answerFromKnowledge("Why is the target offset positive?").matchedId).toBe("offset-sign");
    expect(answerFromKnowledge("what is a realistic tolerance?").matchedId).toBe("tolerance");
  });

  test("a workflow question reaches a pipeline-related entry", () => {
    // The lexical matcher may reasonably pick either of the two workflow entries.
    const result = answerFromKnowledge("Explain the FSOC workflow.");
    expect(["fsoc", "pipeline"]).toContain(result.matchedId as string);
    expect(result.answer.length).toBeGreaterThan(40);
  });

  test("matched answers carry follow-up suggestions", () => {
    const result = answerFromKnowledge("What is coarse alignment?");
    expect(result.suggested.length).toBeGreaterThan(0);
    expect(result.suggested.length).toBeLessThanOrEqual(3);
  });

  test("declines unknown questions instead of inventing an answer", () => {
    const result = answerFromKnowledge("what is the weather in paris tomorrow?");
    expect(result.matchedId).toBeNull();
    expect(result.answer).toMatch(/won't guess/i);
    expect(result.suggested.length).toBeGreaterThan(0);
  });

  test("empty input asks for a topic rather than matching an entry", () => {
    const result = answerFromKnowledge("   ");
    expect(result.matchedId).toBeNull();
    expect(result.answer).toContain(KB_LIMITS);
  });
});

describe("live simulation answers", () => {
  test("answers 'what is happening now' from the supplied snapshot", () => {
    const result = answerFromKnowledge("What is happening in the current simulation?", SNAPSHOT);

    expect(result.matchedId).toBe("simulation-state");
    expect(result.answer).toContain(KB_DISCLAIMER);
    expect(result.answer).toContain("Tracking");
    expect(result.answer).toContain("0.82°");
    expect(result.answer).toContain("88.4%");
    expect(result.answer).toMatch(/outside the prototype tolerance band/i);
  });

  test("reports completion once the error is inside the tolerance band", () => {
    const result = answerFromKnowledge("what is the current state?", {
      ...SNAPSHOT,
      errorDeg: 0.2,
    });
    expect(result.answer).toMatch(/inside the prototype tolerance band/i);
    expect(result.answer).toMatch(/coarse alignment reads as complete/i);
  });

  test("says so when no session is running", () => {
    const result = describeSimulation({ ...SNAPSHOT, running: false });
    expect(result).toContain(KB_DISCLAIMER);
    expect(result).toMatch(/no session is running/i);
  });
});

describe("starter prompts", () => {
  test("every prompt resolves, either from the base or from the live snapshot", () => {
    expect(KB_PROMPTS.length).toBeGreaterThanOrEqual(6);

    for (const prompt of KB_PROMPTS) {
      if (/current simulation/i.test(prompt)) {
        // This one is answered from the published live snapshot.
        expect(answerFromKnowledge(prompt, SNAPSHOT).matchedId).toBe("simulation-state");
      } else {
        const result = answerFromKnowledge(prompt);
        expect(result.matchedId).not.toBeNull();
        expect(result.answer.length).toBeGreaterThan(40);
      }
    }
  });

  test("greets a visitor and keeps to its scope", () => {
    const result = answerFromKnowledge("hello, who are you?");
    expect(result.matchedId).toBe("greeting");
    expect(result.answer).toContain("Drishti AI");
    expect(result.answer).toContain(KB_LIMITS);
  });
});
