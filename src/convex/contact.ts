import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { enforceRateLimit } from "./rateLimit";

const TOPICS = [
  "Technical question",
  "Prototype feedback",
  "Collaboration / review",
  "Documentation correction",
  "Other",
] as const;

const topicValidator = v.union(
  v.literal("Technical question"),
  v.literal("Prototype feedback"),
  v.literal("Collaboration / review"),
  v.literal("Documentation correction"),
  v.literal("Other"),
);

/**
 * Store a contact message.
 *
 * Server-side validation mirrors the client-side Zod schema: an invalid or
 * oversized payload is rejected here even if the form is bypassed.
 */
export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    organisation: v.optional(v.string()),
    topic: topicValidator,
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const email = args.email.trim().toLowerCase();
    const message = args.message.trim();
    const organisation = args.organisation?.trim() ?? "";

    if (name.length < 2 || name.length > 80) {
      throw new Error("Please provide a name between 2 and 80 characters.");
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(email) || email.length > 160) {
      throw new Error("Please provide a valid email address.");
    }
    if (message.length < 20 || message.length > 4000) {
      throw new Error("Please write a message between 20 and 4000 characters.");
    }
    if (organisation.length > 120) {
      throw new Error("Organisation name is too long.");
    }
    if (!TOPICS.includes(args.topic)) {
      throw new Error("Please choose a valid topic.");
    }

    const limit = await enforceRateLimit(ctx, `contact:${email}`, 3, 10 * 60 * 1000);
    if (!limit.allowed) {
      throw new Error(
        `Too many submissions. Please try again in ${limit.retryAfterSeconds} seconds.`,
      );
    }

    await ctx.db.insert("contactMessages", {
      name,
      email,
      organisation: organisation || undefined,
      topic: args.topic,
      message,
      createdAt: Date.now(),
      status: "new",
    });

    return { ok: true as const };
  },
});
