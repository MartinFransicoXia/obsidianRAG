import { Vault, TFile, TFolder } from "obsidian";

const INDEX_DIR = "00_INDEX/files";

/**
 * Index card generator — parses Markdown files and generates
 * structured index cards in 00_INDEX/files/
 *
 * Card format: YAML frontmatter + Markdown body (title + one-line summary)
 */
export class CardGenerator {
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  /**
   * Generate an index card for a single file
   */
  async generateCard(file: TFile): Promise<void> {
    const content = await this.vault.cachedRead(file);
    const fm = this.parseFrontmatter(content);
    const body = this.stripFrontmatter(content);
    const title = this.extractTitle(body, file.basename);
    const links = this.extractWikiLinks(content);
    const tags = this.extractTags(content, fm);
    const domain = this.extractDomain(file.path);
    const oneLine = this.extractOneLineSummary(body);
    const keywords = this.extractKeywords(content, title);

    const cardFrontmatter = this.buildCardFrontmatter({
      docId: file.path,
      title,
      path: file.path,
      scope: "mainline",
      domain,
      topicPrimary: title,
      oneLineSummary: oneLine,
      tags,
      retrievalKeywords: keywords,
      relatedFiles: links,
    });

    const cardContent = `---\n${cardFrontmatter}---\n\n# ${title}\n\n${oneLine}`;
    const cardPath = `${INDEX_DIR}/${file.basename}.md`;

    // Ensure directory exists
    const dir = this.vault.getAbstractFileByPath(INDEX_DIR);
    if (!dir) {
      await this.vault.createFolder(INDEX_DIR);
    }

    // Write or update card
    const existing = this.vault.getAbstractFileByPath(cardPath);
    if (existing instanceof TFile) {
      await this.vault.modify(existing, cardContent);
    } else {
      await this.vault.create(cardPath, cardContent);
    }
  }

  /**
   * Generate cards for all markdown files in the vault
   */
  async generateAll(force: boolean = false): Promise<number> {
    const dir = this.vault.getAbstractFileByPath(INDEX_DIR);
    const existingCards = new Set<string>();
    if (dir instanceof TFolder) {
      for (const child of dir.children) {
        if (child instanceof TFile) {
          existingCards.add(child.basename);
        }
      }
    }

    const files = this.vault.getMarkdownFiles();
    let count = 0;

    for (const file of files) {
      // Skip files in 00_INDEX directory itself
      if (file.path.startsWith(INDEX_DIR)) continue;
      // Skip existing cards unless force
      if (!force && existingCards.has(file.basename)) continue;

      try {
        await this.generateCard(file);
        count++;
      } catch (e) {
        console.warn(`[RAG] Failed to generate card for ${file.path}:`, e);
      }
    }

    return count;
  }

  /**
   * Delete the index card for a file
   */
  async deleteCard(fileName: string): Promise<void> {
    const cardPath = `${INDEX_DIR}/${fileName}.md`;
    const file = this.vault.getAbstractFileByPath(cardPath);
    if (file instanceof TFile) {
      await this.vault.delete(file);
    }
  }

  /**
   * Rename the index card when a file is renamed
   */
  async renameCard(oldName: string, newFile: TFile): Promise<void> {
    await this.deleteCard(oldName);
    await this.generateCard(newFile);
  }

  // ── Parsing helpers ──────────────────────────────────────

  private parseFrontmatter(content: string): Record<string, string> {
    const fm: Record<string, string> = {};
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return fm;

    const lines = match[1].split("\n");
    let currentKey: string | null = null;
    let currentList: string[] = [];

    for (const line of lines) {
      const listMatch = line.match(/^\s{2,}-\s+(.+)$/);
      if (listMatch && currentKey) {
        currentList.push(listMatch[1].trim().replace(/^["']|["']$/g, ""));
        continue;
      }
      if (currentKey && currentList.length) {
        fm[currentKey] = currentList.join("\n");
        currentList = [];
        currentKey = null;
      }
      const kv = line.match(/^([\w_]+)\s*:\s*(.*)$/);
      if (kv) {
        const key = kv[1];
        const val = kv[2].trim().replace(/^["']|["']$/g, "");
        if (val) {
          fm[key] = val;
        } else {
          currentKey = key;
          currentList = [];
        }
      }
    }
    if (currentKey && currentList.length) {
      fm[currentKey] = currentList.join("\n");
    }
    return fm;
  }

  private stripFrontmatter(content: string): string {
    return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
  }

  private extractTitle(body: string, fallback: string): string {
    for (const line of body.split("\n")) {
      const match = line.trim().match(/^#\s+(.+)$/);
      if (match) return match[1].trim();
    }
    return fallback;
  }

  private extractWikiLinks(content: string): string[] {
    const links: string[] = [];
    const seen = new Set<string>();
    const regex = /\[\[([^\]|]+?)(?:\|[^\]]+)?\]\]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const link = match[1].trim();
      const lower = link.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        links.push(link);
      }
    }
    return links;
  }

  private extractTags(content: string, fm: Record<string, string>): string[] {
    const tags: string[] = [];
    // From frontmatter
    if (fm.tags) {
      const tagList = fm.tags.split("\n").length > 1
        ? fm.tags.split("\n")
        : fm.tags.split(",");
      for (const t of tagList) {
        const clean = t.trim().replace(/^["']|["']$/g, "").replace(/^-\s+/, "");
        if (clean) tags.push(clean);
      }
    }
    // Inline #tags
    const inlineRegex = /(?:^|\s)#([一-鿿\w]{2,})/g;
    let match;
    while ((match = inlineRegex.exec(content)) !== null) {
      if (!tags.includes(match[1])) tags.push(match[1]);
    }
    return tags;
  }

  private extractDomain(path: string): string {
    const parts = path.split("/");
    return parts.length > 1 ? parts[0] : "";
  }

  private extractOneLineSummary(body: string): string {
    for (const line of body.split("\n")) {
      const stripped = line.trim();
      if (stripped && !stripped.startsWith("#")) {
        return stripped.substring(0, 150);
      }
    }
    return "";
  }

  private extractKeywords(content: string, title: string): string[] {
    const keywords: string[] = [];
    if (title) keywords.push(title.replace(/[#\-_]/g, " ").trim());

    // Extract meaningful words (Chinese 2+, English 3+)
    const words = content.match(/[一-鿿]{2,}|[a-zA-Z]{3,}/g) || [];
    const freq: Record<string, number> = {};
    for (const w of words) {
      const lower = w.toLowerCase();
      freq[lower] = (freq[lower] || 0) + 1;
    }

    const titleLower = title.toLowerCase();
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    for (const [word, count] of sorted) {
      if (count < 3) break;
      if (!titleLower.includes(word) && word.length >= 2) {
        keywords.push(word);
      }
      if (keywords.length >= 8) break;
    }
    return keywords;
  }

  private buildCardFrontmatter(data: {
    docId: string;
    title: string;
    path: string;
    scope: string;
    domain: string;
    topicPrimary: string;
    oneLineSummary: string;
    tags: string[];
    retrievalKeywords: string[];
    relatedFiles: string[];
  }): string {
    const escape = (s: string) => s.replace(/"/g, '\\"').replace(/\n/g, " ");
    const lines: string[] = [
      `doc_id: "${escape(data.docId)}"`,
      `title: "${escape(data.title)}"`,
      `path: "${escape(data.path)}"`,
      `scope: "${data.scope}"`,
      `domain: "${escape(data.domain)}"`,
      `topic_primary: "${escape(data.topicPrimary)}"`,
      `one_line_summary: "${escape(data.oneLineSummary)}"`,
      `question_type: ""`,
    ];

    if (data.tags.length) {
      lines.push("tags:");
      for (const tag of data.tags.slice(0, 10)) lines.push(`  - "${escape(tag)}"`);
    } else {
      lines.push("tags: []");
    }

    if (data.retrievalKeywords.length) {
      lines.push("retrieval_keywords:");
      for (const kw of data.retrievalKeywords.slice(0, 8)) lines.push(`  - "${escape(kw)}"`);
    } else {
      lines.push("retrieval_keywords: []");
    }

    if (data.relatedFiles.length) {
      lines.push("related_files:");
      for (const link of data.relatedFiles.slice(0, 20)) lines.push(`  - "${escape(link)}"`);
    } else {
      lines.push("related_files: []");
    }

    return lines.join("\n") + "\n";
  }
}
