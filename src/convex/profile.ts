import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

/** Update the display name for the signed-in user. */
export const updateDisplayName = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("You must be signed in to update your profile.");
    }
    const name = args.name.trim();
    if (name.length < 2 || name.length > 80) {
      throw new Error("Display name must be between 2 and 80 characters.");
    }
    await ctx.db.patch(userId, { name });
    return { ok: true as const };
  },
});

/**
 * Delete the signed-in user's simulation history.
 *
 * Account deletion itself is intentionally out of scope for a prototype where
 * accounts are created by one-time email code.
 */
export const clearHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("You must be signed in to clear history.");
    }

    const sessions = await ctx.db
      .query("simulationSessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const session of sessions) {
      const events = await ctx.db
        .query("trackingEvents")
        .withIndex("by_session", (q) => q.eq("sessionId", session._id))
        .collect();
      for (const event of events) await ctx.db.delete(event._id);
      await ctx.db.delete(session._id);
    }

    return { deleted: sessions.length };
  },
});
