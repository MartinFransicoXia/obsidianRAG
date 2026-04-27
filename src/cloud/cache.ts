import { LRUCache, hashString } from "../utils/cache-utils";
import { CachedResponse } from "../types";

/**
 * Cloud API response cache with LRU eviction
 */
export class CloudCache {
  private cache: LRUCache<string, CachedResponse>;
  private readonly maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
    this.cache = new LRUCache<string, CachedResponse>(maxSize);
  }

  /**
   * Get cached response for a query
   */
  get(query: string, model: string): string | null {
    const key = this.generateKey(query, model);
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check TTL (30 days)
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - entry.timestamp > thirtyDaysMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.response;
  }

  /**
   * Store a response in cache
   */
  set(query: string, model: string, response: string): void {
    const key = this.generateKey(query, model);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      queryHash: key
    });
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  private generateKey(query: string, model: string): string {
    return `${model}:${hashString(query)}`;
  }
}
