import { Vault } from "obsidian";
import { PluginSettings, SearchResult, PipelineResult, IndexCard, KnowledgeUnit } from "../types";
import { KeywordRetriever } from "./keyword-retriever";
import { IndexCardStore } from "./index-retriever";
import { VectorRetriever } from "./vector-retriever";
import { rankArticles, boostByCardFields } from "../fusion/ranker";
import { QueryAnalyzer } from "../fusion/query-analyzer";

/**
 * Retrieval pipeline orchestrator
 *
 * Pipeline: QueryAnalysis → BM25+Vector → Vector expansion → Wiki Link expansion →
 *           On-demand card reading → 2-step ranking (+questionTypes) → Knowledge Units
 */
export class RetrievalManager {
  private vault: Vault;
  private settings: PluginSettings;
  private keywordRetriever: KeywordRetriever;
  private cardStore: IndexCardStore;
  private vectorRetriever: VectorRetriever;
  private queryAnalyzer: QueryAnalyzer;
  private knowledgeGenerator: any = null; // Lazy-injected from main.ts

  constructor(vault: Vault, settings: PluginSettings) {
    this.vault = vault;
    this.settings = settings;
    this.keywordRetriever = new KeywordRetriever(vault);
    this.cardStore = new IndexCardStore(vault);
    this.vectorRetriever = new VectorRetriever(vault, settings);
    this.queryAnalyzer = new QueryAnalyzer();
  }

  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
    this.vectorRetriever.updateSettings(settings);
  }

  /** Inject knowledge generator (circular dependency avoidance) */
  setKnowledgeGenerator(generator: any): void {
    this.knowledgeGenerator = generator;
  }

  /**
   * Build all indexes (keyword + cards + vector)
   */
  async buildIndexes(onProgress?: (stage: string, current: number, total: number) => void): Promise<void> {
    console.log("[RAG] Building all indexes...");
    onProgress?.("重建关键词索引...", 0, 1);
    const [kw, cards] = await Promise.all([
      this.keywordRetriever.buildIndex(),
      this.cardStore.loadIndex(),
    ]);
    onProgress?.("重建卡片索引...", 0, 1);
    await this.vectorRetriever.buildIndex(onProgress);
    console.log("[RAG] All indexes built");
  }

  /**
   * Pipeline search: query analysis → retrieval → expansion → ranking → knowledge units
   */
  async pipelineSearch(query: string, limit: number = 10): Promise<PipelineResult> {
    // ── ① Query type detection ──
    const queryType = this.queryAnalyzer.detect(query);

    // ── ② Core retrieval: BM25 + Vector (with neighbor expansion) ──
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

    // ── ③ Wiki Link expansion ──
    const expansionPaths: string[] = [];
    for (const path of corePaths) {
      const linked = this.cardStore.getLinkedPaths(path);
      for (const lp of linked) {
        if (!coreSet.has(lp)) {
          expansionPaths.push(lp);
        }
      }
    }

    // ── ④ On-demand card reading ──
    const allCandidatePaths = [...corePaths, ...expansionPaths];
    const cards = this.cardStore.getCardsByPaths(allCandidatePaths);

    // ── ⑤ Two-step ranking (with question_types matching) ──
    let ranked = rankArticles(kwResults, vecResults, expansionPaths);
    ranked = boostByCardFields(ranked, query, cards, queryType);

    console.log(
      `[RAG] Pipeline: queryType=${queryType}, keyword=${kwResults.length}, vector=${vecResults.length}, ` +
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
