import { App } from "obsidian";
import { LocalHistory, QueryRecord, DocumentInteraction, KnowledgeUnit } from "../types";
import { HistoryStorage } from "./storage";
import { HistoryAnalyzer } from "./analyzer";
import { generateId } from "../utils/file-utils";

/**
 * History manager - manages user interaction history
 */
export class HistoryManager {
  private app: App;
  private storage: HistoryStorage;
  private analyzer: HistoryAnalyzer;
  private history: LocalHistory;
  private retentionDays: number;
  private pluginDir: string;

  constructor(app: App, pluginDir: string, retentionDays: number = 30) {
    this.app = app;
    this.pluginDir = pluginDir;
    this.retentionDays = retentionDays;
    this.storage = new HistoryStorage(app, pluginDir);
    this.analyzer = new HistoryAnalyzer();
    this.history = {
      queries: [],
      documentInteractions: [],
      topicPreferences: {},
      mergeCache: {}
    };
  }

  /**
   * Initialize and load history
   */
  async init(): Promise<void> {
    this.history = await this.storage.load();
    this.history = this.storage.cleanup(this.history, this.retentionDays);
    this.history.topicPreferences = this.analyzer.calculateTopicPreferences(this.history);
    console.log(`[RAG] History loaded: ${this.history.queries.length} queries, ${this.history.documentInteractions.length} interactions`);
  }

  /**
   * Record a search query
   */
  async recordQuery(text: string, knowledgeUnits: KnowledgeUnit[]): Promise<void> {
    const record: QueryRecord = {
      id: generateId(),
      text,
      timestamp: Date.now(),
      retrievedCount: knowledgeUnits.length,
      usedKnowledgeUnits: knowledgeUnits.map(u => u.id)
    };

    this.history.queries.push(record);

    // Keep only last 100
    if (this.history.queries.length > 100) {
      this.history.queries = this.history.queries.slice(-100);
    }

    await this.save();
  }

  /**
   * Record a document interaction
   */
  async recordInteraction(docId: string, action: "click" | "copy" | "save", queryId?: string): Promise<void> {
    const interaction: DocumentInteraction = {
      docId,
      timestamp: Date.now(),
      action,
      queryId
    };

    this.history.documentInteractions.push(interaction);

    // Keep only last 500
    if (this.history.documentInteractions.length > 500) {
      this.history.documentInteractions = this.history.documentInteractions.slice(-500);
    }

    // Update topic preferences
    this.history.topicPreferences = this.analyzer.calculateTopicPreferences(this.history);

    await this.save();
  }

  /**
   * Get current history
   */
  getHistory(): LocalHistory {
    return this.history;
  }

  /**
   * Get topic preferences
   */
  getTopicPreferences(): Record<string, number> {
    return this.history.topicPreferences;
  }

  /**
   * Get recent queries
   */
  getRecentQueries(limit: number = 20): QueryRecord[] {
    return this.history.queries.slice(-limit).reverse();
  }

  /**
   * Find related queries
   */
  findRelatedQueries(query: string, limit: number = 5): QueryRecord[] {
    return this.analyzer.findRelatedQueries(this.history, query, limit);
  }

  /**
   * Get merge cache entry
   */
  getMergeCache(key: string): string | null {
    const entry = this.history.mergeCache[key];
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      delete this.history.mergeCache[key];
      return null;
    }

    return entry.synthesizedContent;
  }

  /**
   * Set merge cache entry
   */
  async setMergeCache(key: string, topic: string, content: string, sourceHashes: string[]): Promise<void> {
    this.history.mergeCache[key] = {
      topic,
      synthesizedContent: content,
      timestamp: Date.now(),
      sourceHashes,
      ttl: this.retentionDays * 24 * 60 * 60 * 1000
    };

    // Limit cache size
    const keys = Object.keys(this.history.mergeCache);
    if (keys.length > 100) {
      const sorted = keys.sort((a, b) =>
        this.history.mergeCache[a].timestamp - this.history.mergeCache[b].timestamp
      );
      for (const key of sorted.slice(0, keys.length - 100)) {
        delete this.history.mergeCache[key];
      }
    }

    await this.save();
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    this.history = {
      queries: [],
      documentInteractions: [],
      topicPreferences: {},
      mergeCache: {}
    };
    await this.save();
  }

  /**
   * Export history data
   */
  async exportData(): Promise<string> {
    return this.storage.export(this.history);
  }

  /**
   * Import history data
   */
  async importData(json: string): Promise<void> {
    this.history = await this.storage.import(json);
    this.history.topicPreferences = this.analyzer.calculateTopicPreferences(this.history);
    await this.save();
  }

  /**
   * Save history to disk
   */
  private async save(): Promise<void> {
    try {
      await this.storage.save(this.history);
    } catch (error) {
      console.error("[RAG] Failed to save history:", error);
    }
  }
}
