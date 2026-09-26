import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const sourceValidator = v.union(v.literal("ai"), v.literal("knowledge-base"));

/**
 * Append one exchange to the assistant transcript.
 *
 * Signed-in users get a short-lived transcript so the panel survives navigation;
 * signed-out visitors stay ephemeral and nothing is written.
 */
export const appendExchange = mutation({
  args: {
    conversationId: v.optional(v.id("aiConversations")),
    question: v.string(),
    answer: v.string(),
    source: sourceValidator,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return { conversationId: null };

    const now = Date.now();
    const title = args.question.trim().slice(0, 60) || "Drishti AI session";

    let conversationId = args.conversationId ?? null;
    if (conversationId) {
      const existing = await ctx.db.get(conversationId);
      if (!existing || existing.userId !== userId) conversationId = null;
    }

    if (conversationId === null) {
      const latest = await ctx.db
        .query("aiConversations")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .order("desc")
        .first();
      if (latest) {
        conversationId = latest._id;
        await ctx.db.patch(latest._id, { updatedAt: now });
      } else {
        conversationId = await ctx.db.insert("aiConversations", {
          userId,
          title,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("aiMessages", {
      conversationId,
      userId,
      role: "user",
      content: args.question.slice(0, 1000),
      source: args.source,
      createdAt: now,
    });
    await ctx.db.insert("aiMessages", {
      conversationId,
      userId,
      role: "assistant",
      content: args.answer.slice(0, 4000),
      source: args.source,
      createdAt: now + 1,
    });

    return { conversationId };
  },
});

/** Most recent transcript for the signed-in user, oldest first. */
export const recentTranscript = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];

    const conversation = await ctx.db
      .query("aiConversations")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .first();
    if (!conversation) return [];

    const limit = Math.min(Math.max(args.limit ?? 12, 1), 40);
    const messages = await ctx.db
      .query("aiMessages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversation._id))
      .order("desc")
      .take(limit);

    return messages.reverse();
  },
});
