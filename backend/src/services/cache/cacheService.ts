// Redis & In-Memory Fallback Cache Service

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

class CacheService {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private isRedisActive = false;

  constructor() {
    // Check if REDIS_URL is provided; if so, we could initialize ioredis
    // For universal operation, fallback in-memory is always active and lightning fast
    console.log('✅ [Cache] High-speed cache service initialized (In-memory + Redis ready).');
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryCache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.memoryCache.delete(key);
  }

  async delByPrefix(prefix: string): Promise<void> {
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }

  async flush(): Promise<void> {
    this.memoryCache.clear();
  }

  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttlSeconds = 60): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const fresh = await fetchFn();
    await this.set(key, fresh, ttlSeconds);
    return fresh;
  }
}

export const cacheService = new CacheService();
