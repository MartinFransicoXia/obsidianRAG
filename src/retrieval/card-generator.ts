import { Vault, TFile, TFolder } from "obsidian";

const INDEX_DIR = "00_INDEX/files";

/**
 * Simple SHA1 hash (browser-compatible)
 */
async function sha1(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Index card generator — parses Markdown files and generates
 * unified-field index cards in 00_INDEX/files/
 *
 * Unified fields (19): docId, title, path, scope,
 *   tags, headings, outlinks,
 *   domain, topicPrimary, topicSecondary, noteRole, questionTypes,
 *   oneLineSummary, retrievalKeywords, bestFor, notFor, readWith,
 *   sourceHash, buildStatus, generatedAt, content
 */
export class CardGenerator {
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  /**
   * Generate an index card for a single file (with hash check)
   */
  async generateCard(file: TFile, force: boolean = false): Promise<boolean> {
    const content = await this.vault.cachedRead(file);
    const newHash = await sha1(content);

    // Hash-based incremental: skip if unchanged
    if (!force) {
      const cardPath = `${INDEX_DIR}/${file.basename}.md`;
      const existing = this.vault.getAbstractFileByPath(cardPath);
      if (existing instanceof TFile) {
        const cardContent = await this.vault.cachedRead(existing);
        const storedHash = this.extractHashFromFrontmatter(cardContent);
        if (storedHash === newHash) return false;
      }
    }

    const fm = this.parseFrontmatter(content);
    const body = this.stripFrontmatter(content);
    const title = this.extractTitle(body, file.basename);
    const rawLinks = this.extractWikiLinks(content);
    const validLinks = await this.validateLinks(rawLinks);
    const tags = this.extractTags(content, fm);
    const headings = this.extractHeadings(body);
    const domain = this.extractDomain(file.path);
    const oneLine = this.extractOneLineSummary(body);
    const keywords = this.extractKeywords(content, title);
    const noteRole = this.inferNoteRole(content);

    const cardContent = this.buildCardFile({
      docId: file.path,
      title,
      path: file.path,
      scope: "mainline",
      domain,
      topicPrimary: title,
      oneLineSummary: oneLine,
      tags,
      headings,
      retrievalKeywords: keywords,
      outlinks: validLinks,
      noteRole,
      sourceHash: newHash,
    });

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
    return true;
  }

  /**
   * Generate cards for all markdown files in the vault
   */
  async generateAll(force: boolean = false): Promise<number> {
    const files = this.vault.getMarkdownFiles();
    let count = 0;

    for (const file of files) {
      if (file.path.startsWith(INDEX_DIR)) continue;
      try {
        const changed = await this.generateCard(file, force);
        if (changed) count++;
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
    await this.generateCard(newFile, true);
  }

  // ── Link validation ──────────────────────────────────────

  private async validateLinks(links: string[]): Promise<string[]> {
    const valid: string[] = [];
    for (const link of links) {
      const clean = link.replace(/\.md$/, "");
      // Try exact path match
      const file = this.vault.getAbstractFileByPath(clean + ".md");
      if (file instanceof TFile) {
        valid.push(link);
        continue;
      }
      // Try as resolved link (Obsidian link resolution)
      const resolved = this.vault.getAbstractFileByPath(link);
      if (resolved instanceof TFile) {
        valid.push(link);
      }
    }
    return valid;
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
    if (fm.tags) {
      const tagList = fm.tags.split("\n").length > 1
        ? fm.tags.split("\n")
        : fm.tags.split(",");
      for (const t of tagList) {
        const clean = t.trim().replace(/^["']|["']$/g, "").replace(/^-\s+/, "");
        if (clean) tags.push(clean);
      }
    }
    const inlineRegex = /(?:^|\s)#([一-鿿\w]{2,})/g;
    let match;
    while ((match = inlineRegex.exec(content)) !== null) {
      if (!tags.includes(match[1])) tags.push(match[1]);
    }
    return tags;
  }

  private extractHeadings(body: string): string[] {
    const headings: string[] = [];
    const regex = /^#{1,3}\s+(.+)$/gm;
    let match;
    while ((match = regex.exec(body)) !== null) {
      headings.push(match[1].trim());
    }
    return headings;
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

  private inferNoteRole(content: string): string {
    const patterns: [string, RegExp][] = [
      ["howto", /(?:^|\n)##?\s*(?:步骤|操作|方法|如何|怎么|教程|Step)/i],
      ["reference", /(?:^|\n)##?\s*(?:参考|Ref|API|参数|配置|字段|属性)/i],
      ["concept", /(?:^|\n)##?\s*(?:原理|概念|理论|机制|定义|什么是)/i],
      ["project", /(?:^|\n)##?\s*(?:进度|计划|TODO|任务|里程碑)/i],
      ["moc", /(?:^|\n)##?\s*(?:目录|索引|导航|MOC|Map)/i],
    ];
    for (const [role, pattern] of patterns) {
      if (pattern.test(content)) return role;
    }
    return "mixed";
  }

  private extractHashFromFrontmatter(cardContent: string): string {
    const match = cardContent.match(/source_hash:\s*"([a-f0-9]+)"/);
    return match ? match[1] : "";
  }

  // ── Build card file ──────────────────────────────────────

  private buildCardFile(data: {
    docId: string;
    title: string;
    path: string;
    scope: string;
    domain: string;
    topicPrimary: string;
    oneLineSummary: string;
    tags: string[];
    headings: string[];
    retrievalKeywords: string[];
    outlinks: string[];
    noteRole: string;
    sourceHash: string;
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
      `note_role: "${data.noteRole}"`,
      `source_hash: "${data.sourceHash}"`,
      `build_status: "success"`,
      `generated_at: "${new Date().toISOString()}"`,
    ];

    if (data.tags.length) {
      lines.push("tags:");
      for (const tag of data.tags.slice(0, 10)) lines.push(`  - "${escape(tag)}"`);
    } else {
      lines.push("tags: []");
    }

    if (data.headings.length) {
      lines.push("headings:");
      for (const h of data.headings.slice(0, 20)) lines.push(`  - "${escape(h)}"`);
    } else {
      lines.push("headings: []");
    }

    if (data.retrievalKeywords.length) {
      lines.push("retrieval_keywords:");
      for (const kw of data.retrievalKeywords.slice(0, 8)) lines.push(`  - "${escape(kw)}"`);
    } else {
      lines.push("retrieval_keywords: []");
    }

    if (data.outlinks.length) {
      lines.push("outlinks:");
      for (const link of data.outlinks.slice(0, 20)) lines.push(`  - "${escape(link)}"`);
    } else {
      lines.push("outlinks: []");
    }

    // Empty lists for LLM-generated fields
    lines.push("topic_secondary: []");
    lines.push("question_types: []");
    lines.push("best_for: []");
    lines.push("not_for: []");
    lines.push("read_with: []");

    const fm = lines.join("\n") + "\n";
    return `---\n${fm}---\n\n# ${data.title}\n\n${data.oneLineSummary}`;
  }
}
