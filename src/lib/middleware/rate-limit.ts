import { setTimeout as setTimeoutPromise } from "node:timers/promises";

import { redisConnection } from "@/lib/queue/config";
import { emitAlert } from "@/lib/ops/alerts";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export type DistributedRateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

type RedisEvalClient = {
  eval: (
    script: string,
    numberOfKeys: number,
    ...arguments_: Array<string | number>
  ) => Promise<unknown>;
};

const distributedWindowScript = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
local ttl = redis.call('TTL', KEYS[1])
return { current, ttl }
`;

export const getTrustedClientIp = (request: Request, trustedProxyHops: number): string | null => {
  if (!Number.isInteger(trustedProxyHops) || trustedProxyHops < 1) {
    return null;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  // Dev servers run without an ingress; production stays fail-closed.
  const developmentIdentity = process.env.NODE_ENV === "development" ? "development-local" : null;
  if (!forwardedFor) {
    return developmentIdentity;
  }

  const chain = forwardedFor
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (chain.length <= trustedProxyHops) {
    return developmentIdentity;
  }

  return chain[chain.length - trustedProxyHops - 1] ?? null;
};

export const enforceDistributedRateLimit = async (params: {
  redis: RedisEvalClient;
  request: Request;
  trustedProxyHops: number;
  namespace: string;
  maxRequests: number;
  windowSeconds: number;
}): Promise<DistributedRateLimitResult> => {
  const clientIp = getTrustedClientIp(params.request, params.trustedProxyHops);
  if (!clientIp) {
    throw new Error("Trusted client IP could not be established");
  }

  const key = `rate-limit:${params.namespace}:${clientIp}`;
  const result = (await params.redis.eval(
    distributedWindowScript,
    1,
    key,
    params.windowSeconds,
  )) as [number, number];
  const count = Number(result[0]);
  const ttl = Math.max(Number(result[1]), 1);

  return {
    allowed: count <= params.maxRequests,
    remaining: Math.max(params.maxRequests - count, 0),
    retryAfterSeconds: ttl,
  };
};

const REDIS_DEADLINE_MS = 2000;

export const checkPublicRateLimit = async (params: {
  request: Request;
  namespace: string;
  maxRequests: number;
  windowSeconds: number;
}): Promise<DistributedRateLimitResult> => {
  const trustedProxyHops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10);
  const deadline = setTimeoutPromise(REDIS_DEADLINE_MS, undefined, {
    ref: false,
  }).then(() => {
    throw new Error("Rate limit store timed out");
  });
  // Swallow the loser's rejection so a late timeout is never unhandled.
  deadline.catch(() => undefined);
  return Promise.race([
    enforceDistributedRateLimit({ ...params, redis: redisConnection, trustedProxyHops }),
    deadline,
  ]);
};

export const publicRateLimitResponse = async (params: {
  request: Request;
  namespace: string;
  maxRequests: number;
  windowSeconds: number;
}): Promise<Response | null> => {
  try {
    const result = await checkPublicRateLimit(params);
    const headers = new Headers({
      "X-RateLimit-Limit": String(params.maxRequests),
      "X-RateLimit-Remaining": String(result.remaining),
      "Retry-After": String(result.retryAfterSeconds),
    });

    if (!result.allowed) {
      return Response.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests. Please retry later." } },
        { status: 429, headers },
      );
    }

    return null;
  } catch {
    // Fail closed (D8a) and alert; the log never includes client IPs.
    await emitAlert("rate_limit_unavailable", { namespace: params.namespace });
    return Response.json(
      { error: { code: "RATE_LIMIT_UNAVAILABLE", message: "Service is temporarily unavailable" } },
      { status: 503, headers: { "Retry-After": "60" } },
    );
  }
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
