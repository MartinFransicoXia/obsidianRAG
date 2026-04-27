import { Vault } from "obsidian";
import { Document, SearchResult, PluginSettings } from "../types";
import { CloudAPIClient } from "../cloud/api";
import { LRUCache, hashString } from "../utils/cache-utils";
import { fileToDocument, getAllMarkdownFiles } from "../utils/file-utils";

/**
 * Vector-based retriever using cloud embeddings + local similarity
 */
export class VectorRetriever {
  private vault: Vault;
  private settings: PluginSettings;
  private client: CloudAPIClient;
  private documents: Map<string, Document> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  private embeddingCache: LRUCache<string, number[]>;
  private loaded = false;

  constructor(vault: Vault, settings: PluginSettings) {
    this.vault = vault;
    this.settings = settings;
    this.client = new CloudAPIClient(settings);
    this.embeddingCache = new LRUCache<string, number[]>(100);
  }

  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
    this.client.updateSettings(settings);
  }

  /**
   * Build vector index by computing embeddings for all documents
   */
  async buildIndex(): Promise<void> {
    if (!this.settings.apiKey) {
      console.warn("[RAG] Vector search disabled: no API key");
      this.loaded = true;
      return;
    }

    this.documents.clear();
    this.embeddings.clear();

    const files = getAllMarkdownFiles(this.vault);

    // Build document map
    for (const file of files) {
      const doc = await fileToDocument(file, this.vault);
      this.documents.set(doc.id, doc);
    }

    console.log(`[RAG] Vector index building for ${this.documents.size} documents...`);

    // Compute embeddings in batches to avoid rate limits
    const docEntries = [...this.documents.entries()];
    const batchSize = 5;

    for (let i = 0; i < docEntries.length; i += batchSize) {
      const batch = docEntries.slice(i, i + batchSize);
      const promises = batch.map(async ([docId, doc]) => {
        const text = `${doc.title}\n${doc.summary || doc.content.substring(0, 500)}`;
        const hashKey = hashString(text);

        // Check cache
        const cached = this.embeddingCache.get(hashKey);
        if (cached) {
          this.embeddings.set(docId, cached);
          return;
        }

        try {
          const embedding = await this.client.embed(text);
          this.embeddings.set(docId, embedding);
          this.embeddingCache.set(hashKey, embedding);
        } catch (error) {
          console.warn(`[RAG] Failed to embed ${docId}:`, error);
        }
      });

      await Promise.all(promises);

      // Small delay between batches to respect rate limits
      if (i + batchSize < docEntries.length) {
        await this.sleep(200);
      }
    }

    this.loaded = true;
    console.log(`[RAG] Vector index built: ${this.embeddings.size} embeddings`);
  }

  /**
   * Search using vector similarity
   */
  async search(query: string, options: { limit: number } = { limit: 30 }): Promise<SearchResult[]> {
    if (!this.settings.apiKey) {
      return [];
    }

    if (!this.loaded) {
      await this.buildIndex();
    }

    if (this.embeddings.size === 0) {
      return [];
    }

    // Get query embedding
    let queryEmbedding: number[];
    const queryHash = hashString(query);
    const cachedQuery = this.embeddingCache.get(`query:${queryHash}`);
    if (cachedQuery) {
      queryEmbedding = cachedQuery;
    } else {
      try {
        queryEmbedding = await this.client.embed(query);
        this.embeddingCache.set(`query:${queryHash}`, queryEmbedding);
      } catch (error) {
        console.error("[RAG] Failed to embed query:", error);
        return [];
      }
    }

    // Compute similarities
    const similarities: Array<{ docId: string; similarity: number }> = [];
    for (const [docId, embedding] of this.embeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      similarities.push({ docId, similarity });
    }

    // Sort by similarity
    similarities.sort((a, b) => b.similarity - a.similarity);
    const top = similarities.slice(0, options.limit);

    // Normalize scores
    const maxScore = top.length > 0 ? top[0].similarity : 1;

    const results: SearchResult[] = [];
    for (const { docId, similarity } of top) {
      const doc = this.documents.get(docId);
      if (!doc) continue;

      results.push({
        docId,
        title: doc.title,
        path: doc.path,
        score: similarity / maxScore,
        snippet: doc.summary || doc.content.substring(0, 200),
        source: "vector"
      });
    }

    return results;
  }

  /**
   * Vector search with neighbor expansion
   *
   * 1. Standard search to get top-N
   * 2. Take top-K seeds, find nearest neighbors via embedding similarity
   * 3. Merge and deduplicate, expansion results get 0.7x score
   */
  async searchWithExpansion(
    query: string,
    limit: number = 20,
    expandTopK: number = 3,
    expandNeighbors: number = 5
  ): Promise<SearchResult[]> {
    const initial = await this.search(query, { limit });
    if (!initial.length || expandTopK <= 0) return initial;

    const seenIds = new Set(initial.map(r => r.docId));
    const expanded = [...initial];

    // Take top-K as expansion seeds
    const seeds = initial.slice(0, expandTopK);
    for (const seed of seeds) {
      const seedDoc = this.documents.get(seed.docId);
      if (!seedDoc) continue;

      // Use seed content as query to find neighbors
      const seedText = seedDoc.summary || seedDoc.content.substring(0, 200);
      const neighbors = await this.search(seedText, {
        limit: expandNeighbors + seenIds.size
      });

      for (const n of neighbors) {
        if (!seenIds.has(n.docId)) {
          seenIds.add(n.docId);
          n.score *= 0.7; // Downweight expansion results
          expanded.push(n);
        }
      }
    }

    expanded.sort((a, b) => b.score - a.score);
    return expanded;
  }

  /**
   * Compute cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  /**
   * Get statistics
   */
  getStats(): { documentCount: number; embeddingCount: number; loaded: boolean } {
    return {
      documentCount: this.documents.size,
      embeddingCount: this.embeddings.size,
      loaded: this.loaded
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
