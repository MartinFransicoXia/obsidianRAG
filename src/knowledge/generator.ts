import { Vault, TFile } from "obsidian";
import {
  Document,
  FusedResult,
  KnowledgeUnit,
  DocumentCluster,
  PluginSettings,
  LocalHistory
} from "../types";
import { DocumentClusterer } from "./cluster";
import { ContentMerger } from "./merger";
import { BatchProcessor } from "../cloud/batch-processor";
import { fileToDocument, getIndexCards } from "../utils/file-utils";

/**
 * Knowledge unit generator - orchestrates topic identification,
 * document clustering, and content merging
 */
export class KnowledgeGenerator {
  private vault: Vault;
  private settings: PluginSettings;
  private clusterer: DocumentClusterer;
  private merger: ContentMerger;
  private batchProcessor: BatchProcessor;

  constructor(vault: Vault, settings: PluginSettings) {
    this.vault = vault;
    this.settings = settings;
    this.batchProcessor = new BatchProcessor(settings);
    this.clusterer = new DocumentClusterer();
    this.merger = new ContentMerger(this.batchProcessor);
  }

  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
    this.batchProcessor.updateSettings(settings);
  }

  /**
   * Generate knowledge units from fused results
   */
  async generate(
    fusedResults: FusedResult[],
    query: string,
    history: LocalHistory | null = null
  ): Promise<KnowledgeUnit[]> {
    if (fusedResults.length === 0) return [];

    // Load documents for the top results (limit to prevent overload)
    const topResults = fusedResults.slice(0, 20);
    const documents: Document[] = [];

    for (const result of topResults) {
      const file = this.vault.getAbstractFileByPath(result.path);
      if (file && "stat" in file) {
        const doc = await fileToDocument(file as TFile, this.vault);
        doc.topics = this.extractTopicsFromResult(result);
        documents.push(doc);
      }
    }

    // Load index cards for clustering
    const indexCards = await getIndexCards(this.vault);
    this.clusterer.setIndexCards(indexCards);

    // Identify topics
    let topics: string[];
    try {
      if (this.settings.apiKey) {
        topics = await this.batchProcessor.identifyTopics(documents, query);
      } else {
        topics = this.extractTopicsLocally(documents);
      }
    } catch (error) {
      console.error("[RAG] Topic identification failed, using local fallback:", error);
      topics = this.extractTopicsLocally(documents);
    }

    if (topics.length === 0) {
      topics = [query];
    }

    // Cluster documents
    const clusters = this.clusterer.cluster(documents, topics);

    // Generate knowledge units
    let units: KnowledgeUnit[];
    try {
      if (this.settings.apiKey) {
        units = await this.merger.merge(clusters, query);
      } else {
        units = this.merger.mergeLocally(clusters, query);
      }
    } catch (error) {
      console.error("[RAG] Knowledge unit generation failed, using local fallback:", error);
      units = this.merger.mergeLocally(clusters, query);
    }

    // Apply history boost
    if (history) {
      units = this.applyHistoryBoost(units, history.topicPreferences);
    }

    return units;
  }

  /**
   * Extract topics from search result metadata
   */
  private extractTopicsFromResult(result: FusedResult): string[] {
    const topics: string[] = [];

    // Extract from title
    const titleWords = result.title
      .split(/[\s\-_]+/)
      .filter(w => w.length > 1);
    topics.push(...titleWords);

    return topics;
  }

  /**
   * Local topic extraction (without API)
   */
  private extractTopicsLocally(documents: Document[]): string[] {
    const topicFreq = new Map<string, number>();

    for (const doc of documents) {
      // Use title words as topics
      const words = doc.title
        .split(/[\s\-_]+/)
        .filter(w => w.length > 1);

      for (const word of words) {
        topicFreq.set(word, (topicFreq.get(word) || 0) + 1);
      }

      // Use topics from index cards if available
      if (doc.topics) {
        for (const topic of doc.topics) {
          topicFreq.set(topic, (topicFreq.get(topic) || 0) + 2);
        }
      }
    }

    // Sort by frequency and return top topics
    return [...topicFreq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([topic]) => topic);
  }

  /**
   * Apply history-based boost to knowledge units
   */
  private applyHistoryBoost(
    units: KnowledgeUnit[],
    topicPreferences: Record<string, number>
  ): KnowledgeUnit[] {
    return units.map(unit => {
      let boost = 0;
      const topicLower = unit.topic.toLowerCase();

      for (const [topic, preference] of Object.entries(topicPreferences)) {
        if (topicLower.includes(topic.toLowerCase())) {
          boost += preference * 0.15; // Max 0.15 boost
        }
      }

      return {
        ...unit,
        historyBoost: Math.min(boost, 0.3)
      };
    }).sort((a, b) => {
      const scoreA = a.relevanceScore + a.historyBoost;
      const scoreB = b.relevanceScore + b.historyBoost;
      return scoreB - scoreA;
    });
  }
}
