import { Vault } from "obsidian";
import { Document, SearchResult, PluginSettings } from "../types";
import { CloudAPIClient } from "../cloud/api";
import { LRUCache, hashString } from "../utils/cache-utils";
import { fileToDocument, getAllMarkdownFiles } from "../utils/file-utils";
import { chunkMarkdown } from "./chunker";

interface ChunkInfo {
  docId: string;
  title: string;
  path: string;
  scope: string;
}

const CHUNK_TARGET = 420;
const CHUNK_OVERLAP = 64;
const CHUNK_MAX = 520;

/**
 * Vector-based retriever with token-level chunking (420/64/520)
 * Chunks for embedding, merges back to document-level results.
 */
export class VectorRetriever {
  private vault: Vault;
  private settings: PluginSettings;
  private client: CloudAPIClient;
  private documents: Map<string, Document> = new Map();
  private embeddings: Map<string, number[]> = new Map();   // chunkId → embedding
  private chunkInfo: Map<string, ChunkInfo> = new Map();   // chunkId → doc info
  private embeddingCache: LRUCache<string, number[]>;
  private loaded = false;

  constructor(vault: Vault, settings: PluginSettings) {
    this.vault = vault;
    this.settings = settings;
    this.client = new CloudAPIClient(settings);
    this.embeddingCache = new LRUCache<string, number[]>(200);
  }

  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
    this.client.updateSettings(settings);
  }

  /**
   * Build vector index — chunk documents → embed each chunk
   */
  async buildIndex(): Promise<void> {
    if (!this.settings.apiKey) {
      console.warn("[RAG] Vector search disabled: no API key");
      this.loaded = true;
      return;
    }

    this.documents.clear();
    this.embeddings.clear();
    this.chunkInfo.clear();

    const files = getAllMarkdownFiles(this.vault);
    let totalChunks = 0;

    // Build document map
    for (const file of files) {
      const doc = await fileToDocument(file, this.vault);
      this.documents.set(doc.id, doc);
    }

    console.log(`[RAG] Vector index building for ${this.documents.size} documents...`);

    // Chunk and embed in batches
    const batchSize = 5;
    const embedJobs: Array<{ chunkId: string; text: string; info: ChunkInfo }> = [];

    for (const [docId, doc] of this.documents) {
      const chunks = chunkMarkdown(doc.content, CHUNK_TARGET, CHUNK_OVERLAP, CHUNK_MAX);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = `${docId}#chunk_${i}`;
        const text = `${doc.title}\n${chunk.text}`;
        embedJobs.push({
          chunkId,
          text,
          info: { docId, title: doc.title, path: doc.path, scope: "mainline" },
        });
      }
      totalChunks += chunks.length;
    }

    console.log(`[RAG] ${totalChunks} chunks to embed`);

    for (let i = 0; i < embedJobs.length; i += batchSize) {
      const batch = embedJobs.slice(i, i + batchSize);
      const promises = batch.map(async ({ chunkId, text, info }) => {
        const hashKey = hashString(text);
        const cached = this.embeddingCache.get(hashKey);
        if (cached) {
          this.embeddings.set(chunkId, cached);
          this.chunkInfo.set(chunkId, info);
          return;
        }
        try {
          const embedding = await this.client.embed(text);
          this.embeddings.set(chunkId, embedding);
          this.chunkInfo.set(chunkId, info);
          this.embeddingCache.set(hashKey, embedding);
        } catch (error) {
          console.warn(`[RAG] Failed to embed chunk ${chunkId}:`, error);
        }
      });
      await Promise.all(promises);
      if (i + batchSize < embedJobs.length) {
        await this.sleep(200);
      }
    }

    this.loaded = true;
    console.log(`[RAG] Vector index built: ${this.embeddings.size} chunk embeddings`);
  }

  /**
   * Search using vector similarity — chunk-level → merge to document-level
   */
  async search(query: string, options: { limit: number } = { limit: 30 }): Promise<SearchResult[]> {
    if (!this.settings.apiKey || !this.loaded || this.embeddings.size === 0) {
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

    // Compute chunk-level similarities
    const similarities: Array<{ chunkId: string; similarity: number }> = [];
    for (const [chunkId, embedding] of this.embeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      similarities.push({ chunkId, similarity });
    }

    similarities.sort((a, b) => b.similarity - a.similarity);

    // Merge to document-level: keep best similarity per docId
    const docBest = new Map<string, { similarity: number; title: string; path: string; scope: string; chunkId: string }>();
    for (const { chunkId, similarity } of similarities) {
      const info = this.chunkInfo.get(chunkId);
      if (!info) continue;
      const existing = docBest.get(info.docId);
      if (!existing || similarity > existing.similarity) {
        docBest.set(info.docId, {
          similarity, title: info.title, path: info.path, scope: info.scope, chunkId,
        });
      }
    }

    // Sort by doc-level score
    const topDocs = [...docBest.entries()]
      .sort((a, b) => b[1].similarity - a[1].similarity)
      .slice(0, options.limit);

    if (!topDocs.length) return [];

    const maxScore = topDocs[0][1].similarity;
    const results: SearchResult[] = [];
    for (const [docId, { similarity, title, path, scope }] of topDocs) {
      const doc = this.documents.get(docId);
      const snippet = doc?.summary || "";
      results.push({
        docId, title, path,
        score: similarity / maxScore,
        snippet: snippet || "",
        source: "vector",
      });
    }

    return results;
  }

  /**
   * Vector search with neighbor expansion
   * Uses document-level results for neighbor discovery.
   */
  async searchWithExpansion(
    query: string,
    limit: number = 20,
    expandTopK: number = 3,
    expandNeighbors: number = 5,
  ): Promise<SearchResult[]> {
    const initial = await this.search(query, { limit });
    if (!initial.length || expandTopK <= 0) return initial;

    const seenIds = new Set(initial.map(r => r.docId));
    const expanded = [...initial];

    const seeds = initial.slice(0, expandTopK);
    for (const seed of seeds) {
      const seedDoc = this.documents.get(seed.docId);
      if (!seedDoc) continue;

      // Use first 300 chars as query for neighbor search
      const seedText = seedDoc.summary || seedDoc.content.substring(0, 300);
      const neighbors = await this.search(seedText, {
        limit: expandNeighbors + seenIds.size,
      });

      for (const n of neighbors) {
        if (!seenIds.has(n.docId)) {
          seenIds.add(n.docId);
          n.score *= 0.7;
          expanded.push(n);
        }
      }
    }

    expanded.sort((a, b) => b.score - a.score);
    return expanded;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    return dotProduct / denominator;
  }

  getStats(): { documentCount: number; embeddingCount: number; loaded: boolean } {
    return {
      documentCount: this.documents.size,
      embeddingCount: this.embeddings.size,
      loaded: this.loaded,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
