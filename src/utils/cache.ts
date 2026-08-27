import { cacheData, deleteCacheByPattern, getCachedData } from "../infra/redis/redis.js";

export const DEFAULT_CACHE_TTL_SECONDS = 300;

type CacheKeyPart = string | number | boolean | null | undefined;
type CacheKeyEntry = readonly [name: string, value: CacheKeyPart];

function isCacheDisabled() {
  return process.env.NODE_ENV === "test";
}

function serializeCacheKeyPart(value: CacheKeyPart): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  return encodeURIComponent(String(value));
}

function logCacheError(action: string, error: unknown) {
  console.warn(`[cache] ${action} failed`, error);
}

export function buildCacheKey(namespace: string, parts: readonly CacheKeyEntry[] = []): string {
  return parts.reduce((key, [name, value]) => `${key}:${name}:${serializeCacheKeyPart(value)}`, namespace);
}

export async function getOrSetCached<T>(params: {
  key: string;
  load: () => Promise<T>;
  ttlSeconds?: number;
}): Promise<T> {
  const { key, load, ttlSeconds = DEFAULT_CACHE_TTL_SECONDS } = params;

  if (!isCacheDisabled()) {
    try {
      const cached = (await getCachedData(key)) as T | null;
      if (cached !== null) return cached;
    } catch (error) {
      logCacheError(`read ${key}`, error);
    }
  }

  const fresh = await load();

  if (!isCacheDisabled()) {
    try {
      await cacheData(key, fresh, ttlSeconds);
    } catch (error) {
      logCacheError(`write ${key}`, error);
    }
  }

  return fresh;
}

export async function invalidateCachePatterns(patterns: readonly string[]) {
  if (isCacheDisabled()) return;

  for (const pattern of new Set(patterns)) {
    try {
      await deleteCacheByPattern(pattern);
    } catch (error) {
      logCacheError(`invalidate ${pattern}`, error);
    }
  }
}
