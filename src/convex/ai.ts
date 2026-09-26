"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import {
  KB_DISCLAIMER,
  KB_LIMITS,
  answerFromKnowledge,
  describeSimulation,
  type SimulationContext,
} from "../shared/knowledge";

/**
 * Drishti AI — server-side question answering.
 *
 * The model key never reaches the browser: the request is made from this Node
 * action only. If no key is configured, or the gateway call fails for any
 * reason, the curated knowledge base answers instead so the assistant always
 * responds. It has no access to ISRO systems or real hardware.
 */

const SYSTEM_PROMPT = [
  "You are Drishti AI, the in-app guide for Drishti-Optik, an educational prototype that demonstrates coarse alignment of mobile free-space optical communication (FSOC) terminals.",
  "Rules you must never break:",
  "1. Never invent technical facts, performance figures, ranges, latencies, accuracies or mission details.",
  "2. This software is a simulation. Every value you discuss is simulated, never measured, and it controls no hardware.",
  "3. Drishti-Optik is not an ISRO product. Never claim ISRO endorsement, certification, development or deployment.",
  "4. Be concise: at most four short sentences, plain technical language, no marketing copy.",
  "5. If asked something outside this project, say so and redirect to the topic.",
].join(" ");

const contextValidator = v.optional(
  v.object({
    statusLabel: v.string(),
    mode: v.string(),
    errorDeg: v.number(),
    offsetX: v.number(),
    offsetY: v.number(),
    confidencePct: v.number(),
    running: v.boolean(),
    distanceKm: v.number(),
  }),
);

export const ask = action({
  args: {
    question: v.string(),
    context: contextValidator,
  },
  handler: async (_ctx, args) => {
    const question = args.question.trim().slice(0, 1000);
    const context: SimulationContext | null = args.context ?? null;

    // The curated answer is always computed: it is the guaranteed fallback and
    // also grounds the model with a factual, project-specific anchor.
    const grounded = context
      ? answerFromKnowledge(question, context)
      : answerFromKnowledge(question, null);

    const fallback = {
      reply: grounded.answer,
      source: "knowledge-base" as const,
      matchedId: grounded.matchedId,
      suggested: grounded.suggested,
    };

    const token = process.env.VLY_INTEGRATION_KEY;
    if (!token) {
      return {
        ...fallback,
        notice:
          "No AI key is configured, so Drishti AI is answering from its curated knowledge base.",
      };
    }

    try {
      const { createVlyIntegrations } = await import("@vly-ai/integrations");
      const vly = createVlyIntegrations({ deploymentToken: token });

      const simulationNote = context
        ? `Live simulation state: ${describeSimulation(context)}`
        : "No simulation session is currently running.";

      const response = await vly.ai.completion(
        {
          model: "gpt-4o-mini",
          temperature: 0.25,
          maxTokens: 320,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "system",
              content: `Curated, project-approved reference answer (use it, do not contradict it): ${grounded.answer}`,
            },
            { role: "system", content: simulationNote },
            { role: "user", content: question },
          ],
        },
        { timeout: 15000, retries: 1 },
      );

      const content = response.success
        ? response.data?.choices?.[0]?.message?.content?.trim()
        : undefined;

      if (!content) return fallback;

      return {
        reply: `${content} ${KB_DISCLAIMER}`,
        source: "ai" as const,
        matchedId: grounded.matchedId,
        suggested: grounded.suggested,
      };
    } catch {
      // A model or network failure must never surface as an error to the user.
      return {
        ...fallback,
        notice: `The AI service is unavailable right now, so Drishti AI is answering from its curated knowledge base. ${KB_LIMITS}`,
      };
    }
  },
});
