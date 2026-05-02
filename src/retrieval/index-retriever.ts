import { Vault } from "obsidian";
import { IndexCard } from "../types";
import { getIndexCards } from "../utils/file-utils";

/**
 * Index card store — loads cards from 00_INDEX/files/ and provides
 * on-demand card reading + Wiki Link resolution.
 *
 * No longer performs search — cards are used for expansion and ranking only.
 */
export class IndexCardStore {
  private vault: Vault;
  private cardsByPath: Map<string, IndexCard> = new Map();
  private cardsById: Map<string, IndexCard> = new Map();
  private allKnownPaths: Set<string> = new Set();
  private loaded = false;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  /**
   * Load all index cards and build path mappings
   */
  async loadIndex(): Promise<void> {
    const cards = await getIndexCards(this.vault);
    this.cardsByPath.clear();
    this.cardsById.clear();
    this.allKnownPaths.clear();

    for (const card of cards) {
      const path = card.path || card.docId;
      this.cardsByPath.set(path.toLowerCase(), card);
      this.cardsById.set(card.docId, card);
      this.allKnownPaths.add(path.toLowerCase());
      // Also store by basename for fuzzy matching
      const basename = path.replace(/\.md$/, "").split("/").pop()?.toLowerCase();
      if (basename) {
        this.allKnownPaths.add(basename);
      }
    }

    this.loaded = true;
    console.log(`[RAG] Index card store loaded: ${cards.length} cards`);
  }

  /**
   * Get a card by file path
   */
  getCardByPath(path: string): IndexCard | undefined {
    if (!this.loaded) return undefined;
    return this.cardsByPath.get(path.toLowerCase());
  }

  /**
   * Get cards by multiple paths (on-demand reading)
   */
  getCardsByPaths(paths: string[]): Map<string, IndexCard> {
    const result = new Map<string, IndexCard>();
    for (const p of paths) {
      const card = this.cardsByPath.get(p.toLowerCase());
      if (card) result.set(p, card);
    }
    return result;
  }

  /**
   * Get linked file paths from a card (Wiki Link expansion).
   * Validates links against known file paths.
   */
  getLinkedPaths(cardPath: string): string[] {
    const card = this.cardsByPath.get(cardPath.toLowerCase());
    if (!card) return [];

    const linked: string[] = [];
    const allLinks = [...(card.outlinks || [])];

    for (const link of allLinks) {
      const clean = link.trim().replace(/\.md$/, "").toLowerCase();
      // Try exact path match
      if (this.allKnownPaths.has(clean)) {
        linked.push(link.trim());
        continue;
      }
      // Try basename match
      const namePart = clean.split("/").pop() || clean;
      if (this.allKnownPaths.has(namePart)) {
        linked.push(link.trim());
      }
    }

    return [...new Set(linked)];
  }

  /**
   * Resolve a link name to a known file path
   */
  resolveLink(linkName: string): string | null {
    const clean = linkName.trim().replace(/\.md$/, "").toLowerCase();

    // Exact path match
    if (this.cardsByPath.has(clean)) {
      return clean;
    }

    // Basename match
    const namePart = clean.split("/").pop() || clean;
    for (const [path] of this.cardsByPath) {
      const pathBasename = path.split("/").pop()?.replace(/\.md$/, "");
      if (pathBasename === namePart) {
        return path;
      }
    }

    return null;
  }

  /**
   * Get all loaded cards
   */
  getAllCards(): IndexCard[] {
    return [...this.cardsByPath.values()];
  }

  /**
   * Get statistics
   */
  getStats(): { cardCount: number; loaded: boolean } {
    return {
      cardCount: this.cardsByPath.size,
      loaded: this.loaded
    };
  }
}
