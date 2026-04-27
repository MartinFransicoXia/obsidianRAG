import { Document, DocumentCluster, FusedResult, IndexCard } from "../types";

/**
 * Document clustering - groups documents by topic
 */
export class DocumentClusterer {
  private indexCards: IndexCard[] = [];

  setIndexCards(cards: IndexCard[]): void {
    this.indexCards = cards;
  }

  /**
   * Cluster documents by topic based on index cards and links
   */
  cluster(documents: Document[], topics: string[]): DocumentCluster[] {
    const clusters: DocumentCluster[] = topics.map(topic => ({
      topic,
      documents: [],
      coreDocument: null
    }));

    // Assign documents to clusters based on topic matching
    const assigned = new Set<string>();

    for (const doc of documents) {
      // Find matching index card
      const card = this.indexCards.find(
        c => c.filePath === doc.id || c.title.toLowerCase() === doc.title.toLowerCase()
      );

      if (card && card.topics.length > 0) {
        // Match by topics in index card
        for (const cluster of clusters) {
          if (card.topics.some(t => this.topicMatch(t, cluster.topic))) {
            cluster.documents.push(doc);
            assigned.add(doc.id);
            break;
          }
        }
      }
    }

    // Assign remaining documents based on title/content similarity to topics
    for (const doc of documents) {
      if (assigned.has(doc.id)) continue;

      let bestCluster: DocumentCluster | null = null;
      let bestScore = 0;

      for (const cluster of clusters) {
        const score = this.computeTopicScore(doc, cluster.topic);
        if (score > bestScore) {
          bestScore = score;
          bestCluster = cluster;
        }
      }

      if (bestCluster && bestScore > 0.1) {
        bestCluster.documents.push(doc);
      }
    }

    // Identify core documents (most linked)
    for (const cluster of clusters) {
      cluster.coreDocument = this.findCoreDocument(cluster.documents);
    }

    // Remove empty clusters
    return clusters.filter(c => c.documents.length > 0);
  }

  /**
   * Check if two topics match
   */
  private topicMatch(topic1: string, topic2: string): boolean {
    const t1 = topic1.toLowerCase();
    const t2 = topic2.toLowerCase();
    return t1.includes(t2) || t2.includes(t1);
  }

  /**
   * Compute topic relevance score for a document
   */
  private computeTopicScore(doc: Document, topic: string): number {
    let score = 0;
    const topicLower = topic.toLowerCase();
    const topicWords = topicLower.split(/\s+/);

    // Check title
    const titleLower = doc.title.toLowerCase();
    if (titleLower.includes(topicLower)) score += 3;
    for (const word of topicWords) {
      if (titleLower.includes(word)) score += 1;
    }

    // Check summary
    if (doc.summary) {
      const summaryLower = doc.summary.toLowerCase();
      if (summaryLower.includes(topicLower)) score += 2;
      for (const word of topicWords) {
        if (summaryLower.includes(word)) score += 0.5;
      }
    }

    return score;
  }

  /**
   * Find the core document in a cluster (most referenced)
   */
  private findCoreDocument(documents: Document[]): Document | null {
    if (documents.length === 0) return null;
    if (documents.length === 1) return documents[0];

    // Count how many other documents link to each document
    const linkCounts = new Map<string, number>();

    for (const doc of documents) {
      if (doc.links) {
        for (const link of doc.links) {
          const linkedDoc = documents.find(
            d => d.title.toLowerCase() === link.toLowerCase()
          );
          if (linkedDoc) {
            linkCounts.set(linkedDoc.id, (linkCounts.get(linkedDoc.id) || 0) + 1);
          }
        }
      }
    }

    // Find the most linked document
    let maxLinks = 0;
    let coreDoc = documents[0];

    for (const [docId, count] of linkCounts) {
      if (count > maxLinks) {
        maxLinks = count;
        const doc = documents.find(d => d.id === docId);
        if (doc) coreDoc = doc;
      }
    }

    return coreDoc;
  }
}
