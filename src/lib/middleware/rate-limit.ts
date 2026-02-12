type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

type RateLimitConfig = {
  windowMs: number;
  maxRequests: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const getBucket = (key: string, windowMs: number): Bucket => {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
    return bucket;
  }

  return existing;
};

export const rateLimit = (params: { key: string; config: RateLimitConfig }): RateLimitResult => {
  const bucket = getBucket(params.key, params.config.windowMs);
  const nextCount = bucket.count + 1;
  const allowed = nextCount <= params.config.maxRequests;

  bucket.count = nextCount;

  return {
    allowed,
    remaining: Math.max(params.config.maxRequests - bucket.count, 0),
    resetAt: bucket.resetAt,
  };
};
