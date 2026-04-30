import { SearchResult, RankedArticle, IndexCard, QueryType } from "../types";

/**
 * Two-step ranking for pipeline retrieval
 *
 * Step 1: rankArticles — BM25 + vector weighted fusion + expansion boost
 * Step 2: boostByCardFields — index card field matching + question_types matching
 */

function normalizeScores(results: SearchResult[]): Map<string, number> {
  if (results.length === 0) return new Map();
  const maxScore = Math.max(...results.map(r => r.score)) || 1;
  return new Map(results.map(r => [r.docId, r.score / maxScore]));
}

/**
 * Step 1: Rank core retrieval results + expansion candidates
 */
export function rankArticles(
  keywordResults: SearchResult[],
  vectorResults: SearchResult[],
  expansionPaths: string[],
): RankedArticle[] {
  const expansionSet = new Set(expansionPaths);

  const kwScores = normalizeScores(keywordResults);
  const vecScores = normalizeScores(vectorResults);

  // Merge all unique documents
  const allDocs = new Map<string, SearchResult>();
  for (const r of keywordResults) allDocs.set(r.docId, r);
  for (const r of vectorResults) allDocs.set(r.docId, r);

  const ranked: RankedArticle[] = [];
  for (const [docId, doc] of allDocs) {
    const ks = kwScores.get(docId) || 0;
    const vs = vecScores.get(docId) || 0;

    // Core retrieval score: keyword 0.55 + vector 0.45
    const retrievalScore = ks * 0.55 + vs * 0.45;

    // Cross-hit bonus: appearing in both keyword and vector results
    const crossBonus = ks > 0 && vs > 0 ? 0.15 : 0;

    // Expansion articles get a lower base score
    const isExpanded = expansionSet.has(docId);
    const expansionBoost = isExpanded ? 0.3 : 0;

    const finalScore = retrievalScore + crossBonus + expansionBoost;

    ranked.push({
      docId,
      title: doc.title,
      path: doc.path,
      snippet: doc.snippet,
      retrievalScore,
      expansionBoost,
      cardBonus: 0,
      finalScore,
      fromExpansion: isExpanded,
    });
  }

  ranked.sort((a, b) => b.finalScore - a.finalScore);
  return ranked;
}

/**
 * Step 2: Boost scores using index card field matches
 */
export function boostByCardFields(
  ranked: RankedArticle[],
  query: string,
  cards: Map<string, IndexCard>,
  queryType?: QueryType,
): RankedArticle[] {
  const queryLower = query.toLowerCase();
  const queryTokens = new Set(queryLower.split(/\s+/));

  for (const article of ranked) {
    const card = cards.get(article.docId);
    if (!card) continue;

    let bonus = 0;

    // retrieval_keywords match
    const keywords = card.retrievalKeywords || [];
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      if (queryLower.includes(kwLower) || kwLower.includes(queryLower)) {
        bonus += 0.12;
        break;
      }
      for (const t of queryTokens) {
        if (kwLower.includes(t)) {
          bonus += 0.06;
          break;
        }
      }
    }

    // topic_primary match
    const topic = card.topicPrimary || "";
    if (topic && (queryLower.includes(topic.toLowerCase()) || topic.toLowerCase().includes(queryLower))) {
      bonus += 0.08;
    }

    // question_types match (query type detected → card's question_types alignment)
    if (queryType && card.questionTypes?.length) {
      const qtLower = card.questionTypes.map(q => q.toLowerCase());
      if (qtLower.includes(queryType.toLowerCase())) {
        bonus += 0.10;
      }
    }

    // domain match
    if (card.domain) {
      bonus += 0.03;
    }

    article.cardBonus = Math.min(bonus, 0.30);
    article.finalScore += article.cardBonus;
    article.card = card;
  }

  ranked.sort((a, b) => b.finalScore - a.finalScore);
  return ranked;
}
