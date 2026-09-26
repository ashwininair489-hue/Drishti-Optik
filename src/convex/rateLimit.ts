import type { MutationCtx } from "./_generated/server";

/**
 * Fixed-window rate limiter backed by the `rateLimits` table.
 *
 * Deliberately small: it exists so the public endpoints (contact, analytics,
 * AI assistant) cannot be hammered, without pulling in another dependency.
 * It is intentionally best-effort — a rare race just allows one extra request.
 */
export async function enforceRateLimit(
  ctx: MutationCtx,
  bucket: string,
  limit: number,
  windowMs: number,
): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = Date.now();
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_bucket", (q) => q.eq("bucket", bucket))
    .unique();

  if (!existing || now - existing.windowStart >= windowMs) {
    if (existing) {
      await ctx.db.patch(existing._id, { windowStart: now, count: 1 });
    } else {
      await ctx.db.insert("rateLimits", { bucket, windowStart: now, count: 1 });
    }
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((existing.windowStart + windowMs - now) / 1000),
    };
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
  return { allowed: true, retryAfterSeconds: 0 };
}
