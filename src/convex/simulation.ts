import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const modeValidator = v.union(
  v.literal("manual"),
  v.literal("assisted"),
  v.literal("auto"),
);

/**
 * Persist one completed coarse alignment run.
 *
 * Requires a signed-in user: session history is scoped to the account and is
 * never shared between visitors.
 */
export const recordSession = mutation({
  args: {
    startedAt: v.number(),
    durationSeconds: v.number(),
    peakErrorDeg: v.number(),
    finalErrorDeg: v.number(),
    ticks: v.number(),
    mode: modeValidator,
    outcome: v.union(v.literal("aligned"), v.literal("aborted")),
    rangeKm: v.number(),
    events: v.optional(
      v.array(
        v.object({
          type: v.string(),
          message: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      // Signed-out visitors can still use the simulation; it is simply not saved.
      return { saved: false as const, sessionId: null };
    }

    const sessionId = await ctx.db.insert("simulationSessions", {
      userId,
      startedAt: args.startedAt,
      durationSeconds: args.durationSeconds,
      peakErrorDeg: args.peakErrorDeg,
      finalErrorDeg: args.finalErrorDeg,
      ticks: args.ticks,
      mode: args.mode,
      outcome: args.outcome,
      rangeKm: args.rangeKm,
      simulated: true,
    });

    const now = Date.now();
    for (const event of (args.events ?? []).slice(0, 12)) {
      await ctx.db.insert("trackingEvents", {
        sessionId,
        userId,
        type: event.type.slice(0, 60),
        message: event.message.slice(0, 240),
        createdAt: now,
      });
    }

    return { saved: true as const, sessionId };
  },
});

/** Most recent runs for the signed-in operator. */
export const recentSessions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const limit = Math.min(Math.max(args.limit ?? 8, 1), 50);
    return await ctx.db
      .query("simulationSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);
  },
});

/** Aggregate counters for the dashboard summary tiles. */
export const sessionStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return { total: 0, aligned: 0, averageFinalErrorDeg: 0, bestFinalErrorDeg: 0 };
    }
    const sessions = await ctx.db
      .query("simulationSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(100);

    if (sessions.length === 0) {
      return { total: 0, aligned: 0, averageFinalErrorDeg: 0, bestFinalErrorDeg: 0 };
    }

    const aligned = sessions.filter((s) => s.outcome === "aligned");
    const finals = aligned.map((s) => s.finalErrorDeg);
    return {
      total: sessions.length,
      aligned: aligned.length,
      averageFinalErrorDeg:
        finals.length > 0
          ? Math.round((finals.reduce((a, b) => a + b, 0) / finals.length) * 1000) / 1000
          : 0,
      bestFinalErrorDeg: finals.length > 0 ? Math.round(Math.min(...finals) * 1000) / 1000 : 0,
    };
  },
});
