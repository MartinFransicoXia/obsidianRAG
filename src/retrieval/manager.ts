import { Vault } from "obsidian";
import { PluginSettings, SearchResult, PipelineResult, IndexCard } from "../types";
import { KeywordRetriever } from "./keyword-retriever";
import { IndexCardStore } from "./index-retriever";
import { VectorRetriever } from "./vector-retriever";
import { rankArticles, boostByCardFields } from "../fusion/ranker";

/**
 * Retrieval pipeline orchestrator
 *
 * Pipeline: BM25 + Vector → Vector expansion → Wiki Link expansion →
 *           On-demand card reading → 2-step ranking
 */
export class RetrievalManager {
  private vault: Vault;
  private settings: PluginSettings;
  private keywordRetriever: KeywordRetriever;
  private cardStore: IndexCardStore;
  private vectorRetriever: VectorRetriever;

  constructor(vault: Vault, settings: PluginSettings) {
    this.vault = vault;
    this.settings = settings;
    this.keywordRetriever = new KeywordRetriever(vault);
    this.cardStore = new IndexCardStore(vault);
    this.vectorRetriever = new VectorRetriever(vault, settings);
  }

  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
    this.vectorRetriever.updateSettings(settings);
  }

  /**
   * Build all indexes (keyword + cards + vector)
   */
  async buildIndexes(): Promise<void> {
    console.log("[RAG] Building all indexes...");
    await Promise.all([
      this.keywordRetriever.buildIndex(),
      this.cardStore.loadIndex(),
      this.vectorRetriever.buildIndex()
    ]);
    console.log("[RAG] All indexes built");
  }

  /**
   * Pipeline search: core retrieval → expansion → on-demand cards → ranking
   */
  async pipelineSearch(query: string, limit: number = 10): Promise<PipelineResult> {
    // ── ① Core retrieval: BM25 + Vector (with neighbor expansion) ──
    const [kwResults, vecResults] = await Promise.all([
      this.keywordRetriever.search(query, { limit: 50 }),
      this.settings.apiKey
        ? this.vectorRetriever.searchWithExpansion(query, 20, 3, 5)
        : Promise.resolve([] as SearchResult[])
    ]);

    // Core hit doc IDs (top candidates from each)
    const coreSet = new Set<string>();
    for (const r of kwResults.slice(0, 20)) coreSet.add(r.docId);
    for (const r of vecResults.slice(0, 20)) coreSet.add(r.docId);
    const corePaths = [...coreSet];

    // ── ② Wiki Link expansion: parse links from hit articles' index cards ──
    const expansionPaths: string[] = [];
    for (const path of corePaths) {
      const linked = this.cardStore.getLinkedPaths(path);
      for (const lp of linked) {
        if (!coreSet.has(lp)) {
          expansionPaths.push(lp);
        }
      }
    }

    // ── ③ On-demand card reading: only for candidate articles ──
    const allCandidatePaths = [...corePaths, ...expansionPaths];
    const cards = this.cardStore.getCardsByPaths(allCandidatePaths);

    // ── ④ Two-step ranking ──
    let ranked = rankArticles(kwResults, vecResults, expansionPaths);
    ranked = boostByCardFields(ranked, query, cards);

    console.log(
      `[RAG] Pipeline: keyword=${kwResults.length}, vector=${vecResults.length}, ` +
      `expansion=${expansionPaths.length}, ranked=${ranked.length}`
    );

    return { ranked: ranked.slice(0, limit), cards };
  }

  /**
   * Update a single document in keyword index
   */
  async updateDocument(filePath: string): Promise<void> {
    await this.keywordRetriever.updateDocument(filePath);
  }

  /**
   * Remove a document from keyword index
   */
  removeDocument(filePath: string): void {
    this.keywordRetriever.removeDocument(filePath);
  }

  /**
   * Get statistics for all retrievers
   */
  getStats() {
    return {
      keyword: this.keywordRetriever.getStats(),
      cards: this.cardStore.getStats(),
      vector: this.vectorRetriever.getStats()
    };
  }
}
