import { createClient, type RedisClientType } from "redis";
import { env } from "../../core/config/env.js";

const redisUrl = env.REDIS_URL;

let redisClient: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType | null> | null = null;

export function getRedisClient() {
  if (!redisUrl) return null;

  if (!redisClient) {
    redisClient = createClient({ url: redisUrl }) as RedisClientType;

    redisClient.on("error", (err) => {
      console.error("Redis Client Error", err);
    });
  }

  return redisClient;
}

export async function getStrictRedisClient(): Promise<RedisClientType> {
  const client = getRedisClient();
  if (!client) throw new Error("Redis is not configured");
  if (client.isReady || client.isOpen) return client;

  connectPromise ??= client
    .connect()
    .then(() => client)
    .finally(() => {
      connectPromise = null;
    });

  const connected = await connectPromise;
  if (!connected) throw new Error("Redis connection failed");
  return connected;
}

async function getConnectedRedisClient() {
  try {
    return await getStrictRedisClient();
  } catch (error) {
    console.error("Redis connection failed. Cache will be skipped.", error);
    return null;
  }
}

/**
 * Cache data with a specific key and optional expiration time.
 * @param key - The cache key.
 * @param value - The value to cache.
 * @param ttl - Time-to-live in seconds (default: 3600 seconds).
 */
export const cacheData = async (key: string, value: unknown, ttl: number = 3600) => {
  const client = await getConnectedRedisClient();
  if (!client) return;

  await client.set(key, JSON.stringify(value), { EX: ttl });
};

/**
 * Retrieve cached data by key.
 * @param key - The cache key.
 * @returns The cached value or null if not found.
 */
export const getCachedData = async (key: string) => {
  const client = await getConnectedRedisClient();
  if (!client) return null;

  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
};

/**
 * Delete cache keys.
 * @param keys - An array of keys to delete.
 */
export const deleteCacheKeys = async (keys: string[]) => {
  const client = await getConnectedRedisClient();
  if (!client || keys.length === 0) return;

  await client.del(keys);
};

/**
 * Delete cache keys matching a pattern.
 * @param pattern - The pattern to match keys.
 */
export const deleteCacheByPattern = async (pattern: string) => {
  const client = await getConnectedRedisClient();
  if (!client) return;

  const keys = await client.keys(pattern);
  if (keys.length > 0) {
    await client.del(keys);
  }
};

export default redisClient;
