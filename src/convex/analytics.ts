import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { enforceRateLimit } from "./rateLimit";

const ALLOWED_EVENTS = new Set([
  "page_view",
  "login",
  "sign_up",
  "demo_launch",
  "tracking_started",
  "simulation_started",
  "auto_align_engaged",
  "assistant_opened",
  "documentation_viewed",
  "contact_submitted",
]);

/**
 * Record a product analytics event.
 *
 * The client only calls this after the visitor accepts optional cookies, and
 * only a fixed allow-list of event names is accepted. Anything else is dropped
 * rather than stored, so the table cannot become a dumping ground.
 */
export const logEvent = mutation({
  args: {
    event: v.string(),
    path: v.string(),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!ALLOWED_EVENTS.has(args.event)) return { stored: false as const };

    const bucket = `analytics:${args.event}`;
    const limit = await enforceRateLimit(ctx, bucket, 120, 60 * 1000);
    if (!limit.allowed) return { stored: false as const };

    const userId = await getAuthUserId(ctx);
    await ctx.db.insert("analyticsEvents", {
      userId: userId ?? undefined,
      event: args.event,
      path: args.path.slice(0, 200),
      metadata: args.metadata?.slice(0, 500),
      createdAt: Date.now(),
    });

    return { stored: true as const };
  },
});
