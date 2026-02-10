type AvailabilityCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type AvailabilityCacheKeyParams = {
  serviceId: string;
  startDate?: string | null;
  endDate?: string | null;
  date?: string | null;
};

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const availabilityCache = new Map<string, AvailabilityCacheEntry<unknown>>();

export const buildAvailabilityCacheKey = (params: AvailabilityCacheKeyParams): string => {
  const rangeKey = params.date
    ? `date:${params.date}`
    : `range:${params.startDate ?? ""}:${params.endDate ?? ""}`;
  return `availability:${params.serviceId}:${rangeKey}`;
};

export const getAvailabilityCache = <T>(key: string): T | null => {
  const entry = availabilityCache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    availabilityCache.delete(key);
    return null;
  }

  return entry.value as T;
};

export const setAvailabilityCache = <T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void => {
  availabilityCache.set(key, { expiresAt: Date.now() + ttlMs, value });
};

export const invalidateAvailabilityCache = (): void => {
  availabilityCache.clear();
};

export const invalidateAvailabilityCacheForService = (serviceId: string): void => {
  Array.from(availabilityCache.keys()).forEach((key) => {
    if (key.startsWith(`availability:${serviceId}:`)) {
      availabilityCache.delete(key);
    }
  });
};
