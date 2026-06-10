type UsageBucket = {
  usedTokens: number;
  resetAt: number;
};

const usageBuckets = new Map<string, UsageBucket>();

export function checkUsageQuota(key: string, estimatedTokens: number, limit = 60_000, windowMs = 24 * 60 * 60_000) {
  const now = Date.now();
  const existing = usageBuckets.get(key);

  if (!existing || existing.resetAt < now) {
    usageBuckets.set(key, { usedTokens: estimatedTokens, resetAt: now + windowMs });
    return { allowed: estimatedTokens <= limit, remainingTokens: Math.max(0, limit - estimatedTokens) };
  }

  if (existing.usedTokens + estimatedTokens > limit) {
    return { allowed: false, remainingTokens: Math.max(0, limit - existing.usedTokens) };
  }

  existing.usedTokens += estimatedTokens;
  return { allowed: true, remainingTokens: limit - existing.usedTokens };
}

export function recordActualUsage(key: string, actualTokens: number, estimatedTokens: number) {
  const existing = usageBuckets.get(key);

  if (!existing) {
    return;
  }

  existing.usedTokens = Math.max(0, existing.usedTokens - estimatedTokens + actualTokens);
}
