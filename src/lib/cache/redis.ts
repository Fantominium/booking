import { Redis } from "ioredis";
import { env } from "@/lib/config/env";

// Create Redis client instance
const redis = new Redis(env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

export type CacheKey = {
  availability: (serviceId: string, date: string) => string;
  businessHours: () => string;
  services: () => string;
  bookingConflicts: (serviceId: string, date: string) => string;
};

export const cacheKeys: CacheKey = {
  availability: (serviceId: string, date: string) => `availability:${serviceId}:${date}`,
  businessHours: () => "business-hours",
  services: () => "services:active",
  bookingConflicts: (serviceId: string, date: string) => `conflicts:${serviceId}:${date}`,
};

// Cache durations in seconds
export const CACHE_TTL = {
  AVAILABILITY: 300, // 5 minutes
  BUSINESS_HOURS: 3600, // 1 hour
  SERVICES: 1800, // 30 minutes
  BOOKING_CONFLICTS: 60, // 1 minute
} as const;

/**
 * Get cached data
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export async function setCached<T>(key: string, data: T, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.error(`Cache set error for key ${key}:`, error);
    // Don't throw - cache failures shouldn't break the app
  }
}

/**
 * Delete cached data
 */
export async function deleteCached(key: string | string[]): Promise<void> {
  try {
    if (Array.isArray(key)) {
      await redis.del(...key);
    } else {
      await redis.del(key);
    }
  } catch (error) {
    console.error(`Cache delete error for key ${key}:`, error);
  }
}

/**
 * Delete cached data by pattern
 */
export async function deleteCachedByPattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Cache delete by pattern error for ${pattern}:`, error);
  }
}

/**
 * Get or set cached data with fallback function
 */
export async function getOrSetCached<T>(
  key: string,
  ttl: number,
  fallback: () => Promise<T>,
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, get fresh data
  const fresh = await fallback();

  // Cache the fresh data (don't await to avoid slowing down response)
  setCached(key, fresh, ttl).catch(() => {
    // Ignore cache set errors
  });

  return fresh;
}

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  availability: async (serviceId?: string, date?: string): Promise<void> => {
    if (serviceId && date) {
      await deleteCached(cacheKeys.availability(serviceId, date));
    } else if (serviceId) {
      await deleteCachedByPattern(`availability:${serviceId}:*`);
    } else {
      await deleteCachedByPattern("availability:*");
    }
  },

  bookingConflicts: async (serviceId?: string, date?: string): Promise<void> => {
    if (serviceId && date) {
      await deleteCached(cacheKeys.bookingConflicts(serviceId, date));
    } else if (serviceId) {
      await deleteCachedByPattern(`conflicts:${serviceId}:*`);
    } else {
      await deleteCachedByPattern("conflicts:*");
    }
  },

  businessHours: async (): Promise<void> => {
    await deleteCached(cacheKeys.businessHours());
  },

  services: async (): Promise<void> => {
    await deleteCached(cacheKeys.services());
  },

  all: async (): Promise<void> => {
    await redis.flushall();
  },
};

export { redis };
