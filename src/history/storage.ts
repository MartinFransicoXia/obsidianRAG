import { App } from "obsidian";
import { LocalHistory, MergeCacheEntry } from "../types";

const DATA_VERSION = 1;
const DEFAULT_HISTORY: LocalHistory = {
  queries: [],
  documentInteractions: [],
  topicPreferences: {},
  mergeCache: {}
};

/**
 * History storage manager - handles persistence of history data
 */
export class HistoryStorage {
  private app: App;
  private pluginDir: string;

  constructor(app: App, pluginDir: string) {
    this.app = app;
    this.pluginDir = pluginDir;
  }

  /**
   * Load history from disk
   */
  async load(): Promise<LocalHistory> {
    try {
      const adapter = this.app.vault.adapter;
      const dataPath = `${this.pluginDir}/history.json`;

      if (await adapter.exists(dataPath)) {
        const raw = await adapter.read(dataPath);
        const data = JSON.parse(raw);

        // Version check and migration
        if (data.version !== DATA_VERSION) {
          return this.migrate(data);
        }

        return {
          queries: data.queries || [],
          documentInteractions: data.documentInteractions || [],
          topicPreferences: data.topicPreferences || {},
          mergeCache: data.mergeCache || {}
        };
      }
    } catch (error) {
      console.error("[RAG] Failed to load history:", error);
    }

    return { ...DEFAULT_HISTORY };
  }

  /**
   * Save history to disk
   */
  async save(history: LocalHistory): Promise<void> {
    try {
      const adapter = this.app.vault.adapter;

      // Ensure directory exists
      if (!await adapter.exists(this.pluginDir)) {
        await adapter.mkdir(this.pluginDir);
      }

      const data = {
        version: DATA_VERSION,
        ...history
      };

      await adapter.write(
        `${this.pluginDir}/history.json`,
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error("[RAG] Failed to save history:", error);
      throw error;
    }
  }

  /**
   * Clean up old data based on retention policy
   */
  cleanup(history: LocalHistory, retentionDays: number): LocalHistory {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

    // Clean old queries (keep max 100)
    const cleanQueries = history.queries
      .filter(q => q.timestamp > cutoff)
      .slice(-100);

    // Clean old interactions (keep max 500)
    const cleanInteractions = history.documentInteractions
      .filter(i => i.timestamp > cutoff)
      .slice(-500);

    // Clean old merge cache (keep max 100)
    const cleanMergeCache: Record<string, MergeCacheEntry> = {};
    let cacheCount = 0;
    const entries = Object.entries(history.mergeCache)
      .sort((a, b) => b[1].timestamp - a[1].timestamp);

    for (const [key, entry] of entries) {
      if (cacheCount >= 100) break;
      if (entry.timestamp > cutoff) {
        cleanMergeCache[key] = entry;
        cacheCount++;
      }
    }

    return {
      queries: cleanQueries,
      documentInteractions: cleanInteractions,
      topicPreferences: history.topicPreferences,
      mergeCache: cleanMergeCache
    };
  }

  /**
   * Export history as JSON
   */
  async export(history: LocalHistory): Promise<string> {
    return JSON.stringify({
      version: DATA_VERSION,
      exportDate: new Date().toISOString(),
      ...history
    }, null, 2);
  }

  /**
   * Import history from JSON
   */
  async import(jsonString: string): Promise<LocalHistory> {
    const data = JSON.parse(jsonString);
    return {
      queries: data.queries || [],
      documentInteractions: data.documentInteractions || [],
      topicPreferences: data.topicPreferences || {},
      mergeCache: data.mergeCache || {}
    };
  }

  /**
   * Migrate old data format
   */
  private migrate(data: Record<string, unknown>): LocalHistory {
    console.log("[RAG] Migrating history data...");
    // For now, just return default if version mismatch
    return { ...DEFAULT_HISTORY };
  }
}
