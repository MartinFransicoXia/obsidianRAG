import { Vault } from "obsidian";
import { Document, SearchResult, InvertedIndex } from "../types";
import { tokenize, fileToDocument, getAllMarkdownFiles } from "../utils/file-utils";

/**
 * Keyword-based retriever using inverted index
 */
export class KeywordRetriever {
  private vault: Vault;
  private invertedIndex: InvertedIndex = {};
  private documents: Map<string, Document> = new Map();
  private indexBuilt = false;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  /**
   * Build or rebuild the inverted index
   */
  async buildIndex(): Promise<void> {
    this.invertedIndex = {};
    this.documents.clear();

    const files = getAllMarkdownFiles(this.vault);

    for (const file of files) {
      const doc = await fileToDocument(file, this.vault);
      this.documents.set(doc.id, doc);

      // Tokenize content
      const tokens = tokenize(doc.title + " " + doc.content);

      // Build inverted index
      for (const token of tokens) {
        if (!this.invertedIndex[token]) {
          this.invertedIndex[token] = [];
        }
        if (!this.invertedIndex[token].includes(doc.id)) {
          this.invertedIndex[token].push(doc.id);
        }
      }
    }

    this.indexBuilt = true;
    console.log(`[RAG] Keyword index built: ${this.documents.size} documents, ${Object.keys(this.invertedIndex).length} terms`);
  }

  /**
   * Search by keywords
   */
  async search(query: string, options: { limit: number } = { limit: 50 }): Promise<SearchResult[]> {
    if (!this.indexBuilt) {
      await this.buildIndex();
    }

    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    // Score each document
    const scores = new Map<string, number>();

    for (const token of queryTokens) {
      const docIds = this.invertedIndex[token] || [];
      // IDF-like weighting: fewer documents containing term = higher weight
      const idf = Math.log((this.documents.size + 1) / (docIds.length + 1));

      for (const docId of docIds) {
        const currentScore = scores.get(docId) || 0;
        scores.set(docId, currentScore + idf);
      }
    }

    // Sort by score and take top results
    const sorted = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, options.limit);

    // Normalize scores
    const maxScore = sorted.length > 0 ? sorted[0][1] : 1;

    const results: SearchResult[] = [];
    for (const [docId, score] of sorted) {
      const doc = this.documents.get(docId);
      if (!doc) continue;

      // Find snippet containing query terms
      const snippet = this.extractSnippet(doc.content, queryTokens);

      results.push({
        docId,
        title: doc.title,
        path: doc.path,
        score: score / maxScore,
        snippet,
        source: "keyword"
      });
    }

    return results;
  }

  /**
   * Extract a snippet containing query terms
   */
  private extractSnippet(content: string, tokens: string[]): string {
    const sentences = content.split(/[。！？\n.!?]+/);
    const lowerTokens = tokens.map(t => t.toLowerCase());

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasMatch = lowerTokens.some(token => lowerSentence.includes(token));
      if (hasMatch && sentence.trim().length > 10) {
        return sentence.trim().substring(0, 200);
      }
    }

    // Fallback: return first 200 chars
    return content.substring(0, 200).trim();
  }

  /**
   * Get index statistics
   */
  getStats(): { documentCount: number; termCount: number; indexed: boolean } {
    return {
      documentCount: this.documents.size,
      termCount: Object.keys(this.invertedIndex).length,
      indexed: this.indexBuilt
    };
  }

  /**
   * Incremental update: add or update a document
   */
  async updateDocument(filePath: string): Promise<void> {
    const file = this.vault.getAbstractFileByPath(filePath);
    if (!file || !("stat" in file)) return;

    // Remove old index entries for this document
    const oldDoc = this.documents.get(filePath);
    if (oldDoc) {
      const oldTokens = tokenize(oldDoc.title + " " + oldDoc.content);
      for (const token of oldTokens) {
        if (this.invertedIndex[token]) {
          this.invertedIndex[token] = this.invertedIndex[token].filter(id => id !== filePath);
          if (this.invertedIndex[token].length === 0) {
            delete this.invertedIndex[token];
          }
        }
      }
    }

    // Add new entries
    const doc = await fileToDocument(file as import("obsidian").TFile, this.vault);
    this.documents.set(doc.id, doc);

    const tokens = tokenize(doc.title + " " + doc.content);
    for (const token of tokens) {
      if (!this.invertedIndex[token]) {
        this.invertedIndex[token] = [];
      }
      if (!this.invertedIndex[token].includes(doc.id)) {
        this.invertedIndex[token].push(doc.id);
      }
    }
  }

  /**
   * Remove a document from the index
   */
  removeDocument(filePath: string): void {
    const doc = this.documents.get(filePath);
    if (!doc) return;

    const tokens = tokenize(doc.title + " " + doc.content);
    for (const token of tokens) {
      if (this.invertedIndex[token]) {
        this.invertedIndex[token] = this.invertedIndex[token].filter(id => id !== filePath);
        if (this.invertedIndex[token].length === 0) {
          delete this.invertedIndex[token];
        }
      }
    }

    this.documents.delete(filePath);
  }
}
