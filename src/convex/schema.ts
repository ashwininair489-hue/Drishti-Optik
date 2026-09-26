import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ---------------------------------------------------------------------
    // Drishti-Optik domain tables
    // Only coarse, product-level data is stored. No form contents, no tokens,
    // no credentials are persisted here.
    // ---------------------------------------------------------------------

    /** One row per completed coarse alignment run in the simulation. */
    simulationSessions: defineTable({
      userId: v.optional(v.id("users")),
      startedAt: v.number(),
      durationSeconds: v.number(),
      peakErrorDeg: v.number(),
      finalErrorDeg: v.number(),
      ticks: v.number(),
      mode: v.union(v.literal("manual"), v.literal("assisted"), v.literal("auto")),
      outcome: v.union(v.literal("aligned"), v.literal("aborted")),
      rangeKm: v.number(),
      /** Always true — makes the simulated nature explicit at the data layer. */
      simulated: v.boolean(),
    })
      .index("by_user", ["userId"])
      .index("by_startedAt", ["startedAt"]),

    /** Discrete pipeline events captured during a simulated session. */
    trackingEvents: defineTable({
      sessionId: v.id("simulationSessions"),
      userId: v.optional(v.id("users")),
      type: v.string(),
      message: v.string(),
      createdAt: v.number(),
    })
      .index("by_session", ["sessionId"])
      .index("by_user", ["userId"]),

    /** Contact form submissions. */
    contactMessages: defineTable({
      name: v.string(),
      email: v.string(),
      organisation: v.optional(v.string()),
      topic: v.string(),
      message: v.string(),
      createdAt: v.number(),
      status: v.union(v.literal("new"), v.literal("read"), v.literal("archived")),
    }).index("by_createdAt", ["createdAt"]),

    /** Optional AI assistant transcripts, stored only for signed-in users. */
    aiConversations: defineTable({
      userId: v.id("users"),
      title: v.string(),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_user", ["userId"]),

    aiMessages: defineTable({
      conversationId: v.id("aiConversations"),
      userId: v.id("users"),
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
      /** "ai" when a model answered, "knowledge-base" for the curated fallback. */
      source: v.union(v.literal("ai"), v.literal("knowledge-base")),
      createdAt: v.number(),
    }).index("by_conversation", ["conversationId", "createdAt"]),

    /**
     * Consent-gated product analytics. Only coarse event names and the route
     * they occurred on are stored.
     */
    analyticsEvents: defineTable({
      userId: v.optional(v.id("users")),
      event: v.string(),
      path: v.string(),
      metadata: v.optional(v.string()),
      createdAt: v.number(),
    })
      .index("by_event", ["event"])
      .index("by_createdAt", ["createdAt"]),

    /**
     * Small fixed-window rate limiter used by the public mutation/action
     * endpoints. One row per bucket, replaced when the window rolls over.
     */
    rateLimits: defineTable({
      bucket: v.string(),
      windowStart: v.number(),
      count: v.number(),
    }).index("by_bucket", ["bucket"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
