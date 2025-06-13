// Simple extensible cache layer for TerraFusionTheory server
import NodeCache from 'node-cache';

export interface CacheProvider {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlSeconds?: number): void;
  del(key: string): void;
  flush(): void;
}

export class InMemoryCache implements CacheProvider {
  private cache: NodeCache;
  constructor(options?: NodeCache.Options) {
    this.cache = new NodeCache(options);
  }
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }
  set<T>(key: string, value: T, ttlSeconds?: number): void {
    this.cache.set<T>(key, value, ttlSeconds);
  }
  del(key: string): void {
    this.cache.del(key);
  }
  flush(): void {
    this.cache.flushAll();
  }
}

export const cache = new InMemoryCache({ stdTTL: 300, checkperiod: 60 });
