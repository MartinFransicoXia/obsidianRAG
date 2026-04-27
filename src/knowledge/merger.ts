import { Document, DocumentCluster, KnowledgeUnit } from "../types";
import { BatchProcessor } from "../cloud/batch-processor";

/**
 * Content merger - combines related documents into knowledge units
 */
export class ContentMerger {
  private batchProcessor: BatchProcessor;

  constructor(batchProcessor: BatchProcessor) {
    this.batchProcessor = batchProcessor;
  }

  /**
   * Merge documents in clusters into knowledge units
   */
  async merge(
    clusters: DocumentCluster[],
    query: string
  ): Promise<KnowledgeUnit[]> {
    if (clusters.length === 0) return [];

    // Use batch processor to generate knowledge units
    const units = await this.batchProcessor.generateKnowledgeUnits(clusters, query);

    // Enrich units with source document info
    for (let i = 0; i < units.length && i < clusters.length; i++) {
      const unit = units[i];
      const cluster = clusters[i];

      unit.sourceCount = cluster.documents.length;
      unit.sourceDocuments = cluster.documents.map(d => d.id);
      unit.relevanceScore = 1 - i * 0.1; // Simple relevance ranking
    }

    return units;
  }

  /**
   * Simple local merge (fallback when API is not available)
   */
  mergeLocally(clusters: DocumentCluster[], query: string): KnowledgeUnit[] {
    return clusters.map((cluster, index) => {
      const allContent = cluster.documents
        .map(d => d.summary || d.content.substring(0, 200))
        .join(" ");

      // Extract key sentences
      const sentences = allContent
        .split(/[。！？\n.!?]+/)
        .filter(s => s.trim().length > 10)
        .slice(0, 5);

      return {
        id: `ku-local-${Date.now()}-${index}`,
        topic: cluster.topic,
        summary: sentences.join("。") + "。",
        keyPoints: sentences.slice(0, 3).map(s => s.trim()),
        sourceCount: cluster.documents.length,
        relevanceScore: 1 - index * 0.1,
        historyBoost: 0,
        suggestedUsage: `基于 ${cluster.documents.length} 篇文档的综合信息`,
        sourceDocuments: cluster.documents.map(d => d.id)
      };
    });
  }
}
