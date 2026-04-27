import { CloudAPIClient } from "./api";
import { CloudCache } from "./cache";
import { PluginSettings, Document, KnowledgeUnit, DocumentCluster } from "../types";

/**
 * Batch processor for cloud API calls
 * Reduces API calls by merging multiple requests
 */
export class BatchProcessor {
  private client: CloudAPIClient;
  private cache: CloudCache;
  private settings: PluginSettings;

  constructor(settings: PluginSettings) {
    this.settings = settings;
    this.client = new CloudAPIClient(settings);
    this.cache = new CloudCache(settings.cacheSize);
  }

  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
    this.client.updateSettings(settings);
  }

  /**
   * Generate knowledge units from document clusters in a single API call
   */
  async generateKnowledgeUnits(
    clusters: DocumentCluster[],
    query: string
  ): Promise<KnowledgeUnit[]> {
    if (clusters.length === 0) return [];

    // Check cache first
    const cacheKey = this.buildCacheKey(clusters, query);
    const cached = this.cache.get(cacheKey, this.settings.mergeModel);
    if (cached) {
      try {
        return this.parseKnowledgeUnits(JSON.parse(cached));
      } catch {
        // Cache miss, proceed with API call
      }
    }

    const prompt = this.buildBatchPrompt(clusters, query);

    const response = await this.client.chat({
      model: this.settings.mergeModel,
      messages: [
        {
          role: "system",
          content: "你是一个知识整理专家。请根据提供的文档簇，为每个主题生成一个知识单元。输出必须是有效的JSON数组格式。"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 8000,
      temperature: 0.2
    });

    // Cache the response
    this.cache.set(cacheKey, this.settings.mergeModel, response);

    // Parse and return
    const parsed = this.parseResponse(response);
    return this.parseKnowledgeUnits(parsed);
  }

  /**
   * Identify topics from documents
   */
  async identifyTopics(documents: Document[], query: string): Promise<string[]> {
    // Extract topics from document metadata
    const topicsFromDocs = new Set<string>();
    for (const doc of documents) {
      if (doc.topics) {
        doc.topics.forEach(t => topicsFromDocs.add(t));
      }
    }

    // If enough topics from metadata, return them
    if (topicsFromDocs.size >= 3) {
      return [...topicsFromDocs].slice(0, 8);
    }

    // Use AI to identify topics
    const cacheKey = `topics:${query}:${documents.map(d => d.id).join(",")}`;
    const cached = this.cache.get(cacheKey, this.settings.mergeModel);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        // Proceed with API call
      }
    }

    const docSummaries = documents
      .map(d => `- ${d.title}: ${d.summary || d.content.substring(0, 100)}`)
      .join("\n");

    const response = await this.client.chat({
      model: this.settings.mergeModel,
      messages: [
        {
          role: "system",
          content: "分析文档集合，提取3-8个主要主题。以JSON数组格式返回，如 [\"主题1\", \"主题2\"]"
        },
        {
          role: "user",
          content: `查询：${query}\n\n文档：\n${docSummaries}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });

    this.cache.set(cacheKey, this.settings.mergeModel, response);

    try {
      const topics = JSON.parse(response);
      if (Array.isArray(topics)) {
        return topics.slice(0, 8);
      }
    } catch {
      // Parse failed, return extracted topics
    }

    return [...topicsFromDocs];
  }

  /**
   * Build a batch prompt for knowledge unit generation
   */
  private buildBatchPrompt(clusters: DocumentCluster[], query: string): string {
    let prompt = `请根据以下文档簇，为每个主题生成一个知识单元。

## 查询：${query}

## 文档簇信息：
`;

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      prompt += `### 主题 ${i + 1}：${cluster.topic}\n`;
      prompt += `文档数量：${cluster.documents.length}\n`;
      prompt += `文档列表：\n`;

      for (const doc of cluster.documents) {
        const summary = doc.summary || doc.content.substring(0, 150);
        prompt += `- ${doc.title}: ${summary}\n`;
      }
      prompt += "\n";
    }

    prompt += `## 生成要求：
1. 每个知识单元包含：主题名称、合并摘要（300-500字）、3-5个关键点、建议使用场景
2. 消除重复内容，保留最准确版本
3. 补充缺失的逻辑环节

## 输出格式：
请以JSON数组格式输出：
[
  {
    "topic": "主题名称",
    "summary": "合并摘要",
    "keyPoints": ["关键点1", "关键点2"],
    "suggestedUsage": "建议使用场景"
  }
]`;

    return prompt;
  }

  /**
   * Parse response JSON from AI
   */
  private parseResponse(response: string): unknown[] {
    // Try to find JSON array in response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Fall through
      }
    }

    // Try parsing the whole response
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Failed to parse
    }

    return [];
  }

  /**
   * Convert parsed response to KnowledgeUnit objects
   */
  private parseKnowledgeUnits(data: unknown[]): KnowledgeUnit[] {
    return data.map((item, index) => {
      const obj = item as Record<string, unknown>;
      return {
        id: `ku-${Date.now()}-${index}`,
        topic: (obj.topic as string) || `主题 ${index + 1}`,
        summary: (obj.summary as string) || "",
        keyPoints: Array.isArray(obj.keyPoints) ? obj.keyPoints as string[] : [],
        sourceCount: 0,
        relevanceScore: 1 - index * 0.1,
        historyBoost: 0,
        suggestedUsage: (obj.suggestedUsage as string) || "",
        sourceDocuments: []
      };
    });
  }

  /**
   * Build a cache key from clusters and query
   */
  private buildCacheKey(clusters: DocumentCluster[], query: string): string {
    const clusterIds = clusters
      .map(c => c.documents.map(d => d.id).sort().join(","))
      .sort()
      .join("|");
    return `${query}::${clusterIds}`;
  }
}
