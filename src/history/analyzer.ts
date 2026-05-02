import { LocalHistory, QueryRecord } from "../types";

/**
 * History analyzer - extracts insights from user history
 */
export class HistoryAnalyzer {
  /**
   * Calculate topic preferences from query and interaction history
   */
  calculateTopicPreferences(history: LocalHistory): Record<string, number> {
    const topicScores: Record<string, number> = {};

    // Score from queries
    for (const query of history.queries) {
      const words = this.extractKeywords(query.text);
      for (const word of words) {
        topicScores[word] = (topicScores[word] || 0) + 1;
      }
    }

    // Score from document interactions (higher weight)
    for (const interaction of history.documentInteractions) {
      // Use docId as a proxy for topic
      const words = this.extractKeywords(interaction.docId);
      const weight = interaction.action === "save" ? 3 : interaction.action === "copy" ? 2 : 1;
      for (const word of words) {
        topicScores[word] = (topicScores[word] || 0) + weight;
      }
    }

    // Normalize scores to 0-1 range
    const maxScore = Math.max(...Object.values(topicScores), 1);
    const normalized: Record<string, number> = {};
    for (const [topic, score] of Object.entries(topicScores)) {
      if (score >= 2) { // Only keep topics that appear at least twice
        normalized[topic] = score / maxScore;
      }
    }

    return normalized;
  }

  /**
   * Find related queries from history
   */
  findRelatedQueries(history: LocalHistory, query: string, limit: number = 5): QueryRecord[] {
    const queryKeywords = this.extractKeywords(query);

    const scored = history.queries.map(record => {
      const recordKeywords = this.extractKeywords(record.text);
      const overlap = queryKeywords.filter(k => recordKeywords.includes(k)).length;
      const recency = 1 / (1 + (Date.now() - record.timestamp) / (24 * 60 * 60 * 1000));
      return { record, score: overlap * recency };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.record);
  }

  /**
   * Get frequently used documents
   */
  getFrequentDocuments(history: LocalHistory, limit: number = 10): Array<{ docId: string; count: number }> {
    const counts: Record<string, number> = {};

    for (const interaction of history.documentInteractions) {
      counts[interaction.docId] = (counts[interaction.docId] || 0) + 1;
    }

    return Object.entries(counts)
      .map(([docId, count]) => ({ docId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fff\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 1);
  }
}
