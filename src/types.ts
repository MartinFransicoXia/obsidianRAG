/**
 * Core type definitions for Enhanced RAG Plugin
 */

// ============================================
// Settings Types
// ============================================

export interface PluginSettings {
  apiKey: string;
  apiBaseUrl: string;
  chatModel: string;
  mergeModel: string;
  // Embedding
  embeddingModel: string;
  embeddingBaseUrl: string;  // 留空则与 apiBaseUrl 相同
  embeddingApiKey: string;   // 留空则与 apiKey 相同
  embeddingDimensions: number;
  // Rerank
  rerankEnabled: boolean;
  rerankModel: string;
  rerankBaseUrl: string;     // 留空则与 apiBaseUrl 相同
  rerankApiKey: string;      // 留空则与 apiKey 相同
  // Index cards
  autoGenerateCards: boolean;
  enrichModel: string;  // 索引卡语义字段填充模型
  // General
  cacheSize: number;
  historyRetentionDays: number;
  enableQueryTypeDetection: boolean;
  autoOpenChatPanel: boolean;
  showKnowledgeUnits: boolean;
  theme: "light" | "dark" | "auto";
}

export const DEFAULT_SETTINGS: PluginSettings = {
  apiKey: "",
  apiBaseUrl: "https://api.deepseek.com/v1",
  chatModel: "deepseek-reasoner",
  mergeModel: "deepseek-chat",
  embeddingModel: "text-embedding-v4",
  embeddingBaseUrl: "",
  embeddingApiKey: "",
  embeddingDimensions: 1024,
  rerankEnabled: false,
  rerankModel: "qwen3-rerank",
  rerankBaseUrl: "",
  rerankApiKey: "",
  autoGenerateCards: true,
  enrichModel: "deepseek-chat",
  cacheSize: 100,
  historyRetentionDays: 30,
  enableQueryTypeDetection: true,
  autoOpenChatPanel: true,
  showKnowledgeUnits: true,
  theme: "auto"
};

// ============================================
// Query Types
// ============================================

export enum QueryType {
  DEFINITION = "definition",
  PROCEDURE = "procedure",
  COMPARISON = "comparison",
  EXPLANATION = "explanation",
  SUMMARIZATION = "summarization",
  REFERENCE = "reference",
  TROUBLESHOOTING = "troubleshooting"
}

// ============================================
// Retrieval Types
// ============================================

export interface Document {
  id: string;
  title: string;
  content: string;
  path: string;
  summary?: string;
  topics?: string[];
  links?: string[];
  lastModified: number;
}

export interface SearchResult {
  docId: string;
  title: string;
  path: string;
  score: number;
  snippet: string;
  source: "keyword" | "index" | "vector";
  metadata?: Record<string, unknown>;
}

export interface FusedResult {
  docId: string;
  title: string;
  path: string;
  finalScore: number;
  scoreBreakdown: {
    keywordScore: number;
    indexScore: number;
    vectorScore: number;
  };
  snippet: string;
}

export interface RankedArticle {
  docId: string;
  title: string;
  path: string;
  snippet: string;
  retrievalScore: number;
  expansionBoost: number;
  cardBonus: number;
  finalScore: number;
  fromExpansion: boolean;
  card?: IndexCard;
}

export interface PipelineResult {
  ranked: RankedArticle[];
  cards: Map<string, IndexCard>;
}

// ============================================
// Index Types
// ============================================

export interface IndexCard {
  // ── 身份标识 ──
  docId: string;
  title: string;
  path: string;
  scope: string;
  // ── 结构特征 ──
  tags: string[];
  headings: string[];
  outlinks: string[];
  // ── 语义分类 ──
  domain: string;
  topicPrimary: string;
  topicSecondary: string[];
  noteRole: string;
  questionTypes: string[];
  oneLineSummary: string;
  retrievalKeywords: string[];
  bestFor: string[];
  notFor: string[];
  // ── 构建元数据 ──
  sourceHash: string;
  buildStatus: string;
  generatedAt: string;
  // ── 上下文 ──
  content: string;
}

export interface InvertedIndex {
  [term: string]: string[]; // term -> docIds
}

// ============================================
// Knowledge Unit Types
// ============================================

export interface KnowledgeUnit {
  id: string;
  topic: string;
  summary: string;
  keyPoints: string[];
  sourceCount: number;
  relevanceScore: number;
  historyBoost: number;
  suggestedUsage: string;
  sourceDocuments: string[];
}

// ============================================
// History Types
// ============================================

export interface QueryRecord {
  id: string;
  text: string;
  timestamp: number;
  retrievedCount: number;
  usedKnowledgeUnits: string[];
}

export interface DocumentInteraction {
  docId: string;
  timestamp: number;
  action: "click" | "copy" | "save";
  queryId?: string;
}

export interface MergeCacheEntry {
  topic: string;
  synthesizedContent: string;
  timestamp: number;
  sourceHashes: string[];
  ttl: number;
}

export interface LocalHistory {
  queries: QueryRecord[];
  documentInteractions: DocumentInteraction[];
  topicPreferences: Record<string, number>;
  mergeCache: Record<string, MergeCacheEntry>;
}

// ============================================
// Cloud API Types
// ============================================

export interface CloudAPIRequest {
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  max_tokens?: number;
  temperature?: number;
}

export interface CloudAPIResponse {
  id: string;
  choices: Array<{
    message: { role: string; content: string };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface CachedResponse {
  response: string;
  timestamp: number;
  queryHash: string;
}

// ============================================
// UI Types
// ============================================

export interface SearchState {
  query: string;
  isLoading: boolean;
  results: FusedResult[];
  knowledgeUnits: KnowledgeUnit[];
  error: string | null;
}

export interface ChatSource {
  path: string;
  title: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChatSource[];
  streaming?: boolean;
}

// ============================================
// Cluster Types
// ============================================

export interface DocumentCluster {
  topic: string;
  documents: Document[];
  coreDocument: Document | null;
}
