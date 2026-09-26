import { SIM } from "../lib/tracking-engine";

/**
 * Drishti AI knowledge base.
 *
 * Imported by the browser assistant *and* by the Convex action, so it must stay
 * free of `window`, React and Node APIs. Its only dependency is the simulation
 * engine, and only so the assistant quotes the same tolerance the console
 * enforces. It is the fallback whenever no AI key is configured, and the guard
 * rail that keeps the assistant honest about what it can and cannot know.
 */
export interface KnowledgeEntry {
  id: string;
  title: string;
  keywords: string[];
  answer: string;
  followUps?: string[];
}

export const KB_DISCLAIMER =
  "This response is based on the Drishti-Optik simulation environment.";

export const KB_LIMITS =
  "Drishti AI has no connection to ISRO systems, real optical terminals or any satellite telemetry.";

export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: "fsoc",
    title: "What is free-space optical communication?",
    keywords: [
      "fsoc",
      "free space optical",
      "free-space optical",
      "what is fso",
      "laser link",
      "optical communication",
    ],
    answer:
      "Free-space optical communication (FSOC) transmits data as a modulated optical beam through free space instead of a fibre. The benefit is a very narrow, high-bandwidth beam; the cost is that the beam must stay pointed at a small receiver. Published surveys describe a pointing, acquisition and tracking (PAT) — sometimes ATP — sequence where the terminal is first brought close to the line of sight and then refined. Drishti-Optik only addresses the first, coarse stage.",
    followUps: ["What is coarse alignment?", "What is the difference between coarse and fine alignment?"],
  },
  {
    id: "coarse-alignment",
    title: "What is coarse alignment?",
    keywords: ["coarse alignment", "what is coarse", "coarse pointing", "align"],
    answer:
      "Coarse alignment is the first pointing stage: bringing the optical terminal close enough to the partner terminal's bearing that a narrow-beam acquisition sensor or camera can see the target at all. It is deliberately tolerant — the goal is to get inside the field of view, not to hold micrometers. Fine pointing, beam steering and tracking then take over with much tighter tolerances. In the Drishti-Optik simulation the coarse stage is declared complete when the estimated bearing error falls inside the configured tolerance.",
    followUps: ["What is the difference between coarse and fine alignment?", "What does alignment error represent?"],
  },
  {
    id: "coarse-vs-fine",
    title: "Coarse versus fine alignment",
    keywords: [
      "difference between coarse and fine",
      "coarse vs fine",
      "fine alignment",
      "fine pointing",
    ],
    answer:
      "Coarse alignment moves the whole terminal or its outer gimbal over degrees of travel using a wide field of view — that is where a camera-based estimator helps. Fine alignment operates once the link is roughly acquired: the residual error is compensated with fast steering mirrors or fine pointing assemblies over arcseconds, where the optical beam itself is used as the sensor. Drishti-Optik demonstrates only the coarse half, and never claims to replace the fine stage.",
    followUps: ["What is coarse alignment?", "Why is a wide field of view important?"],
  },
  {
    id: "target-detection",
    title: "What does target detection mean here?",
    keywords: ["target detection", "detect", "detection", "bounding box", "object detection"],
    answer:
      "In this prototype, target detection is the stage that finds the partner terminal or its beacon inside the camera frame and localises it as a bounding box. A real system would use a classical detector, a trained network, or a passive beacon with a threshold on a bright marker. In the simulation the detector is modelled directly: the box is placed from the modelled target bearing, and confidence falls as the bearing error grows.",
    followUps: ["How does visual tracking work?", "What does tracking confidence mean?"],
  },
  {
    id: "visual-tracking",
    title: "How does visual tracking work?",
    keywords: ["visual tracking", "tracking work", "how does tracking", "track", "kalman"],
    answer:
      "After detection, the tracker keeps the target association frame-to-frame so the estimated bearing stays continuous instead of flickering between detections. Practical implementations combine a correlation or feature tracker with a filter — a Kalman filter is the common choice — to smooth the estimate and predict through brief occlusions. Drishti-Optik represents this as a stable reported confidence and a steadily decreasing bearing error once lock is declared.",
    followUps: ["What does tracking confidence mean?", "Why does the offset flicker?"],
  },
  {
    id: "offset-sign",
    title: "Why is the target offset positive?",
    keywords: ["positive", "negative", "sign", "why is the offset", "offset sign", "delta x"],
    answer:
      "The sign tells you which way to move. In the virtual frame, positive ΔX means the target centre lies right of the frame centre, so the camera must rotate in the positive azimuth direction to close the gap. Positive ΔY corresponds to the target sitting below the frame centre, because pixel rows are counted downwards while elevation is counted upwards. The recommended correction is the slew to apply: it matches the bearing error on both axes, which is why the ΔY readout and the elevation correction can show opposite signs.",
    followUps: ["What does alignment error represent?", "What is happening in the current simulation?"],
  },
  {
    id: "confidence",
    title: "What does tracking confidence mean?",
    keywords: ["confidence", "conf", "how confident", "tracking confidence"],
    answer:
      "Tracking confidence is the pipeline's own belief that the reported target estimate is reliable — it is a quality signal, not a physical measurement. It drops when the target is far from boresight, when the estimate is noisy, or when detection is intermittent, and it holds near its ceiling at stable lock. In this simulation confidence is a modelled quantity; it is not calibrated against hardware.",
    followUps: ["What does the dashboard show?", "How does visual tracking work?"],
  },
  {
    id: "alignment-error",
    title: "What does alignment error represent?",
    keywords: ["alignment error", "error represent", "bearing error", "what does error"],
    answer:
      "Alignment error is the angular separation between where the terminal is currently pointed (the boresight) and the estimated direction of the partner terminal. It is reported as an azimuth and an elevation component plus a combined magnitude. Coarse alignment is complete when that magnitude falls inside the tolerance band, meaning the target is inside the narrow acquisition field and the fine stage has something to work with.",
    followUps: ["What is coarse alignment?", "What is a realistic tolerance?"],
  },
  {
    id: "tolerance",
    title: "What is a realistic alignment tolerance?",
    keywords: ["tolerance", "how accurate", "accuracy", "realistic", "arcsecond", "urad"],
    answer:
      "Real systems quote tolerances well below a degree — often in milliradians down to microradians for the fine stage — because the beam is narrow. The tolerance of 0.35° used here is a prototype design assumption chosen to make the simulation legible, not a hardware figure. Treat every threshold in this console as a demonstration value.",
    followUps: ["What is coarse alignment?", "Are the numbers measured?"],
  },
  {
    id: "measured",
    title: "Are the numbers measured or simulated?",
    keywords: [
      "measured",
      "real",
      "hardware",
      "is this real",
      "simulated",
      "fake",
      "actual data",
      "does this control",
    ],
    answer:
      "Simulated. Every reading in the console — pixel offset, bearing error, confidence, FPS — is produced by the Drishti-Optik software model from a deterministic seed. Nothing is read from hardware, and nothing here commands a real terminal. Where a value appears, it is labelled SIMULATED or tagged as a prototype assumption.",
    followUps: ["What is the simulation showing right now?", "Is this an ISRO product?"],
  },
  {
    id: "isro",
    title: "Is this an ISRO product?",
    keywords: ["isro", "official", "government", "endorsed", "who made", "developed by"],
    answer:
      "No. Drishti-Optik is an independent prototype software concept developed around a stated ISRO problem statement on the Smart India Hackathon problem list. It is not developed, endorsed, certified or deployed by ISRO, and nothing in this site should be read as an official ISRO statement. ISRO's own public pages remain the authority for anything about ISRO's programmes.",
    followUps: ["Where can I read the sources?", "Who is this demo for?"],
  },
  {
    id: "sources",
    title: "Where do the technical claims come from?",
    keywords: ["source", "sources", "reference", "references", "citation", "where can i read"],
    answer:
      "Each factual claim in the technical pages carries a label: VERIFIED (backed by a listed source), SIMULATED (produced by this demo), ASSUMPTION (a prototype design choice) or PROPOSED (a future idea). The References section on the Technology page links the public sources used, including peer-reviewed PAT surveys and public terminal standards. Anything not listed there is a prototype assumption.",
    followUps: ["What is the difference between coarse and fine alignment?", "Is this an ISRO product?"],
  },
  {
    id: "pipeline",
    title: "How does the AI pipeline work?",
    keywords: ["pipeline", "workflow", "architecture", "how does it work", "stages", "system architecture"],
    answer:
      "The pipeline runs image input, preprocessing, target detection, feature extraction, target tracking, relative offset estimation, a coarse alignment command, then alignment confirmation. Each stage reports Completed, Processing, Waiting or Error so a reviewer can see where the estimate came from. The architecture page opens each block with a short explanation, and the console animates the same stages live.",
    followUps: ["What is the simulation showing right now?", "What does target detection mean here?"],
  },
  {
    id: "dashboard",
    title: "What do the dashboard indicators mean?",
    keywords: ["dashboard", "indicators", "status cards", "what does the dashboard show", "health"],
    answer:
      "The dashboard summarises the session: system health, camera state, tracking state, detection, alignment status, confidence and the timestamp of the last update. The camera feed, detection, alignment vector, confidence, event log and alignment history cards mirror the console at a glance. Every tile carries a SIMULATED or DEMO tag because the values come from the software model.",
    followUps: ["What does tracking confidence mean?", "What is the simulation showing right now?"],
  },
  {
    id: "fov",
    title: "Why is a wide field of view important?",
    keywords: ["field of view", "fov", "wide", "narrow beam", "why wide"],
    answer:
      "Coarse alignment has to cope with the largest uncertainty, so it works with the widest sensor available — a camera with a few degrees of coverage rather than the microradian beam. That is precisely why a vision-based estimator is attractive at this stage: it can see a large sky area, identify a candidate, and hand a good bearing to the fine stage. Once inside the narrow beam the optical sensor takes over.",
    followUps: ["What is coarse alignment?", "How does visual tracking work?"],
  },
  {
    id: "mobile",
    title: "Why 'mobile' terminals?",
    keywords: ["mobile", "moving platform", "vehicle", "drone", "why mobile", "vibration"],
    answer:
      "A mobile terminal is mounted on a platform that moves — a vehicle, an aircraft, or another satellite. Platform motion changes the bearing faster than a static mount, so the estimator must track continuously rather than point once. The 'simulate target movement' control in the console models exactly that: a drifting bearing the tracker has to keep up with.",
    followUps: ["How does visual tracking work?", "What is the simulation showing right now?"],
  },
  {
    id: "status-map",
    title: "What do the tracking statuses mean?",
    keywords: ["status", "searching", "acquiring", "idle", "complete", "statuses mean"],
    answer:
      "Idle means no session is running. Searching means a session is running but the target is outside the virtual field of view, so a coarse re-point is needed. Acquiring means a candidate is detected and confidence is still building. Tracking means lock is held and offsets are being estimated continuously. Coarse alignment complete means the estimated error is inside the tolerance band and the run is ready for a fine-acquisition handover.",
    followUps: ["What is coarse alignment?", "What does tracking confidence mean?"],
  },
];

/** Cheap lexical scoring — no model required, deterministic and explainable. */
function score(entry: KnowledgeEntry, query: string): number {
  const q = ` ${query.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ")} `;
  let total = 0;
  for (const keyword of entry.keywords) {
    const k = keyword.toLowerCase();
    if (q.includes(` ${k} `)) total += k.split(" ").length * 3 + 2;
    else if (q.includes(k)) total += k.split(" ").length + 1;
  }
  const title = entry.title.toLowerCase();
  for (const word of q.trim().split(" ")) {
    if (word.length > 4 && title.includes(word)) total += 1;
  }
  return total;
}

export const KB_PROMPTS = [
  "What is coarse alignment?",
  "Why is the target offset positive?",
  "What does tracking confidence mean?",
  "Explain the FSOC workflow.",
  "What is the difference between coarse and fine alignment?",
  "What is happening in the current simulation?",
];

export interface SimulationContext {
  statusLabel: string;
  mode: string;
  errorDeg: number;
  offsetX: number;
  offsetY: number;
  confidencePct: number;
  running: boolean;
  distanceKm: number;
}

export function describeSimulation(ctx: SimulationContext): string {
  if (!ctx.running) {
    return `${KB_DISCLAIMER} No session is running at the moment. Start tracking and the console will begin estimating a bearing for the virtual target.`;
  }
  return [
    `${KB_DISCLAIMER}`,
    `The source is in the ${ctx.statusLabel} state using ${ctx.mode.toUpperCase()} mode at a modelled range of ${ctx.distanceKm} km.`,
    `The virtual frame centre offset is ΔX ${ctx.offsetX.toFixed(1)} px and ΔY ${ctx.offsetY.toFixed(1)} px, and the modelled bearing error is ${ctx.errorDeg.toFixed(2)}°.`,
    // Read the tolerance from the engine so the assistant can never disagree
    // with the console it is describing.
    ctx.errorDeg <= SIM.coarseToleranceDeg
      ? "That is inside the prototype tolerance band, so coarse alignment reads as complete."
      : "That is outside the prototype tolerance band, so the console keeps recommending a correction.",
    `Reported tracking confidence is ${ctx.confidencePct.toFixed(1)}%.`,
  ].join(" ");
}

export interface KnowledgeAnswer {
  answer: string;
  matchedId: string | null;
  suggested: string[];
}

/**
 * Deterministic fallback answer. Always available, even with no AI key, so the
 * assistant degrades gracefully instead of failing.
 */
export function answerFromKnowledge(
  query: string,
  context?: SimulationContext | null,
): KnowledgeAnswer {
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const suggested = KB_PROMPTS.slice(0, 3);

  if (!trimmed) {
    return {
      answer: `Ask about coarse alignment, FSOC, tracking confidence, the pipeline or the current simulation. ${KB_LIMITS}`,
      matchedId: null,
      suggested,
    };
  }

  if (
    context &&
    /(current simulation|right now|current state|what.*happening|this run)/.test(lower)
  ) {
    return {
      answer: describeSimulation(context),
      matchedId: "simulation-state",
      suggested: ["What does tracking confidence mean?", "What is coarse alignment?"],
    };
  }

  if (/(hello|hi |hey|who are you|your name)/.test(` ${lower} `)) {
    return {
      answer: `I'm Drishti AI, the in-app guide for this prototype console. I can explain coarse alignment, the computer-vision pipeline and every readout on screen. ${KB_LIMITS}`,
      matchedId: "greeting",
      suggested,
    };
  }

  const ranked = KNOWLEDGE_BASE.map((entry) => ({
    entry,
    score: score(entry, trimmed),
  })).sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score <= 2) {
    return {
      answer: `I don't have a curated answer for that yet, so I won't guess. Try one of the topics below, or read the Technology and Architecture pages. ${KB_LIMITS}`,
      matchedId: null,
      suggested: KB_PROMPTS.slice(0, 4),
    };
  }

  return {
    answer: best.entry.answer,
    matchedId: best.entry.id,
    suggested: best.entry.followUps ?? suggested,
  };
}
