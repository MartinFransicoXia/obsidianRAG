import { Vault } from "obsidian";
import { Document, SearchResult, PluginSettings } from "../types";
import { CloudAPIClient } from "../cloud/api";
import { LRUCache, hashString } from "../utils/cache-utils";
import { fileToDocument, getAllMarkdownFiles } from "../utils/file-utils";
import { chunkMarkdown } from "./chunker";
import { VectorStore, ChunkInfo } from "../utils/vector-store";

const CHUNK_TARGET = 420;
const CHUNK_OVERLAP = 64;
const CHUNK_MAX = 520;

/**
 * Vector-based retriever with token-level chunking (420/64/520) + SQLite persistence.
 * Chunks for embedding, merges back to document-level results.
 * Embeddings survive Obsidian restarts — no full re-embed on each startup.
 */
export class VectorRetriever {
  private vault: Vault;
  private settings: PluginSettings;
  private client: CloudAPIClient;
  private store: VectorStore;
  private documents: Map<string, Document> = new Map();
  private queryCache: LRUCache<string, number[]>;
  private loaded = false;

  constructor(vault: Vault, settings: PluginSettings) {
    this.vault = vault;
    this.settings = settings;
    this.client = new CloudAPIClient(settings);
    this.store = new VectorStore(vault);
    this.queryCache = new LRUCache<string, number[]>(50);
  }

  private get embeddings(): Map<string, number[]> { return this.store.embeddings; }
  private get chunkInfo(): Map<string, ChunkInfo> { return this.store.chunkInfo; }

  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
    this.client.updateSettings(settings);
  }

  /**
   * Build vector index — restore from SQLite DB → embed only new/unknown chunks
   */
  async buildIndex(onProgress?: (stage: string, current: number, total: number) => void): Promise<void> {
    if (!this.settings.apiKey) {
      console.warn("[RAG] Vector search disabled: no API key");
      this.loaded = true;
      return;
    }

    // 1) Load persisted embeddings from SQLite database file
    onProgress?.("恢复数据库...", 0, 1);
    const hasData = await this.store.load();
    if (hasData) {
      console.log(`[RAG] Restored ${this.embeddings.size} chunk embeddings from vectors.db`);
    }

    // 2) Build document map
    onProgress?.("扫描文件...", 0, 1);
    this.documents.clear();
    const files = getAllMarkdownFiles(this.vault);
    for (const file of files) {
      const doc = await fileToDocument(file, this.vault);
      this.documents.set(doc.id, doc);
    }

    // 3) Identify chunks that need embedding
    onProgress?.("切片中...", 0, 1);
    const persistedIds = new Set(this.embeddings.keys());
    const newJobs: Array<{ chunkId: string; text: string; info: ChunkInfo }> = [];
    let totalChunks = 0;

    for (const [docId, doc] of this.documents) {
      const chunks = chunkMarkdown(doc.content, CHUNK_TARGET, CHUNK_OVERLAP, CHUNK_MAX);
      for (let i = 0; i < chunks.length; i++) {
        const chunkId = `${docId}#chunk_${i}`;
        const text = `${doc.title}\n${chunks[i].text}`;
        totalChunks++;
        if (!persistedIds.has(chunkId)) {
          newJobs.push({
            chunkId,
            text,
            info: { docId, title: doc.title, path: doc.path, scope: "mainline" },
          });
        }
        // Ensure chunkInfo is up-to-date even for persisted chunks
        if (!this.chunkInfo.has(chunkId)) {
          this.chunkInfo.set(chunkId, { docId, title: doc.title, path: doc.path, scope: "mainline" });
        }
      }
    }

    console.log(`[RAG] ${totalChunks} chunks total, ${newJobs.length} new to embed`);

    if (newJobs.length === 0) {
      this.loaded = true;
      onProgress?.("完成", totalChunks, totalChunks);
      return;
    }

    // 4) Embed new chunks in batches, persist immediately
    const batchSize = 5;
    for (let i = 0; i < newJobs.length; i += batchSize) {
      onProgress?.(`嵌入中 ${i + 1}-${Math.min(i + batchSize, newJobs.length)}/${newJobs.length}`, i + 1, newJobs.length);
      const batch = newJobs.slice(i, i + batchSize);
      const embedBatch: Array<{ chunkId: string; embedding: number[] }> = [];
      const infoBatch: Array<{ chunkId: string; info: ChunkInfo }> = [];

      const promises = batch.map(async ({ chunkId, text, info }) => {
        try {
          const embedding = await this.client.embed(text);
          this.embeddings.set(chunkId, embedding);
          this.chunkInfo.set(chunkId, info);
          embedBatch.push({ chunkId, embedding });
          infoBatch.push({ chunkId, info });
        } catch (error) {
          console.warn(`[RAG] Failed to embed chunk ${chunkId}:`, error);
        }
      });
      await Promise.all(promises);

      // Persist to SQLite database
      if (embedBatch.length > 0 || infoBatch.length > 0) {
        await this.store.saveIncremental(embedBatch, infoBatch);
      }

      if (i + batchSize < newJobs.length) {
        await this.sleep(200);
      }
    }

    this.loaded = true;
    console.log(`[RAG] Vector index built: ${this.embeddings.size} chunk embeddings persisted`);
  }

  /** Incremental update: delete old chunks for docId, read file fresh, embed new */
  async upsertDocument(filePath: string): Promise<void> {
    if (!this.loaded || !this.settings.apiKey) return;

    // 1) Read fresh content from vault
    const file = this.vault.getAbstractFileByPath(filePath);
    if (!file || !("stat" in file)) return;
    const doc = await fileToDocument(file, this.vault);

    // 2) Remove old chunks for this docId from memory
    const docId = doc.id;
    const oldChunkIds: string[] = [];
    for (const chunkId of this.embeddings.keys()) {
      if (chunkId.startsWith(`${docId}#`)) oldChunkIds.push(chunkId);
    }
    for (const cid of oldChunkIds) {
      this.embeddings.delete(cid);
      this.chunkInfo.delete(cid);
    }

    // 3) Chunk and embed new content
    const chunks = chunkMarkdown(doc.content, CHUNK_TARGET, CHUNK_OVERLAP, CHUNK_MAX);
    const newChunks: Array<{ chunkId: string; embedding: number[] }> = [];
    const newInfo: Array<{ chunkId: string; info: ChunkInfo }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = `${docId}#chunk_${i}`;
      const text = `${doc.title}\n${chunks[i].text}`;
      try {
        const embedding = await this.client.embed(text);
        this.embeddings.set(chunkId, embedding);
        this.chunkInfo.set(chunkId, { docId, title: doc.title, path: doc.path, scope: "mainline" });
        newChunks.push({ chunkId, embedding });
        newInfo.push({ chunkId, info: { docId, title: doc.title, path: doc.path, scope: "mainline" } });
      } catch (e) {
        console.warn(`[RAG] Failed to embed chunk ${chunkId}:`, e);
      }
    }

    // 4) Persist — full save to remove old chunks from DB
    if (newChunks.length > 0) {
      await this.store.save();
    }
  }

  /** Clear all persisted embeddings (force full rebuild next time) */
  async clearStore(): Promise<void> {
    await this.store.clear();
  }

  /**
   * Search using vector similarity — chunk-level → merge to document-level
   */
  async search(query: string, options: { limit: number } = { limit: 30 }): Promise<SearchResult[]> {
    if (!this.settings.apiKey || !this.loaded || this.embeddings.size === 0) {
      return [];
    }

    let queryEmbedding: number[];
    const queryHash = hashString(query);
    const cachedQuery = this.queryCache.get(`q:${queryHash}`);
    if (cachedQuery) {
      queryEmbedding = cachedQuery;
    } else {
      try {
        queryEmbedding = await this.client.embed(query);
        this.queryCache.set(`q:${queryHash}`, queryEmbedding);
      } catch (error) {
        console.error("[RAG] Failed to embed query:", error);
        return [];
      }
    }

    // Chunk-level similarities
    const similarities: Array<{ chunkId: string; similarity: number }> = [];
    for (const [chunkId, embedding] of this.embeddings) {
      similarities.push({ chunkId, similarity: this.cosineSimilarity(queryEmbedding, embedding) });
    }
    similarities.sort((a, b) => b.similarity - a.similarity);

    // Merge to document-level: keep best similarity per docId
    const docBest = new Map<string, { similarity: number; title: string; path: string; scope: string }>();
    for (const { chunkId, similarity } of similarities) {
      const info = this.chunkInfo.get(chunkId);
      if (!info) continue;
      const existing = docBest.get(info.docId);
      if (!existing || similarity > existing.similarity) {
        docBest.set(info.docId, { similarity, title: info.title, path: info.path, scope: info.scope });
      }
    }

    const topDocs = [...docBest.entries()]
      .sort((a, b) => b[1].similarity - a[1].similarity)
      .slice(0, options.limit);

    if (!topDocs.length) return [];
    const maxScore = topDocs[0][1].similarity;
    return topDocs.map(([docId, { similarity, title, path, scope }]) => {
      const doc = this.documents.get(docId);
      return {
        docId, title, path,
        score: similarity / maxScore,
        snippet: doc?.summary || "",
        source: "vector" as const,
      };
    });
  }

  async searchWithExpansion(
    query: string, limit = 20, expandTopK = 3, expandNeighbors = 5,
  ): Promise<SearchResult[]> {
    const initial = await this.search(query, { limit });
    if (!initial.length || expandTopK <= 0) return initial;

    const seenIds = new Set(initial.map(r => r.docId));
    const expanded = [...initial];

    for (const seed of initial.slice(0, expandTopK)) {
      const seedDoc = this.documents.get(seed.docId);
      if (!seedDoc) continue;
      const seedText = seedDoc.summary || seedDoc.content.substring(0, 300);
      const neighbors = await this.search(seedText, { limit: expandNeighbors + seenIds.size });
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
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const d = Math.sqrt(na) * Math.sqrt(nb);
    return d === 0 ? 0 : dot / d;
  }

  getStats() {
    return { documentCount: this.documents.size, embeddingCount: this.embeddings.size, loaded: this.loaded };
  }

  private sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
}
