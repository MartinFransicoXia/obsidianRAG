import { RankedArticle } from "../types";

/**
 * History boost — the only remaining fusion logic.
 * Score fusion is now handled by ranker.ts (two-step ranking).
 */
export class ResultFusion {
  /**
   * Apply history boost to ranked results
   */
  applyHistoryBoost(
    results: RankedArticle[],
    topicPreferences: Record<string, number>
  ): RankedArticle[] {
    return results.map(result => {
      let boost = 0;
      const titleLower = result.title.toLowerCase();

      for (const [topic, preference] of Object.entries(topicPreferences)) {
        if (titleLower.includes(topic.toLowerCase())) {
          boost += preference * 0.3;
        }
      }

      return {
        ...result,
        finalScore: result.finalScore + boost
      };
    }).sort((a, b) => b.finalScore - a.finalScore);
  }
}
