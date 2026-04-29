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
const ENRICH_SYSTEM_PROMPT = `你是知识库索引专家。根据文档卡片信息，补充 5 个语义字段。只输出合法 JSON，不要其他内容。

字段说明：
- topic_secondary: 涉及但非核心的其他主题，0-3 个
- question_types: 适用问题类型，从枚举选择 1-4 个
  枚举：definition(定义), explanation(原理解释), comparison(对比), procedure(步骤流程), reference(公式数据参考), troubleshooting(问题排查)
- best_for: 什么场景优先推荐这篇，1-3 个
- not_for: 什么场景不推荐这篇，0-2 个
- read_with: 建议一起阅读的文件名，0-3 个（只写文件名，不含路径和 .md 后缀）

输出格式：
{"topic_secondary":["次主题"],"question_types":["definition"],"best_for":["场景"],"not_for":[],"read_with":["文件名"]}`;

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

  // ── LLM semantic enrichment ──────────────────────────────

  /**
   * Call LLM to fill topic_secondary, question_types, best_for, not_for, read_with
   * Reads all card files from 00_INDEX/files/, sends metadata to LLM, writes back updated cards.
   */
  async enrichCards(apiKey: string, apiBaseUrl: string, model: string): Promise<number> {
    if (!apiKey) {
      console.warn("[RAG] No API key configured, skipping card enrichment");
      return 0;
    }

    const cardFiles = this.getCardFiles();
    if (cardFiles.length === 0) return 0;

    const baseUrl = apiBaseUrl.replace(/\/$/, "");
    const batchSize = 5;
    let count = 0;

    for (let i = 0; i < cardFiles.length; i += batchSize) {
      const batch = cardFiles.slice(i, i + batchSize);
      try {
        const cardsData: Array<Record<string, unknown>> = [];
        for (const file of batch) {
          const content = await this.vault.cachedRead(file);
          const fm = this.parseFrontmatter(content);
          const body = this.stripFrontmatter(content);
          cardsData.push({
            index: cardsData.length + 1,
            title: fm.title || file.basename,
            domain: fm.domain || "",
            note_role: fm.note_role || "mixed",
            headings: this.extractHeadings(body).slice(0, 10),
            one_line_summary: fm.one_line_summary || "",
            retrieval_keywords: this.parseYamlList(fm.retrieval_keywords).slice(0, 5),
            tags: this.parseYamlList(fm.tags).slice(0, 5),
          });
        }

        const userMsg = cardsData.map(d => JSON.stringify(d)).join("\n");
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: ENRICH_SYSTEM_PROMPT },
              { role: "user", content: userMsg },
            ],
            max_tokens: 2000,
            temperature: 0.1,
            response_format: { type: "json_object" },
          }),
        });

        if (!resp.ok) {
          console.warn(`[RAG] Enrich batch failed: HTTP ${resp.status}`);
          continue;
        }

        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) continue;

        const results = JSON.parse(content);
        const items: Array<Record<string, unknown>> = Array.isArray(results) ? results : [results];

        for (let j = 0; j < items.length && j < batch.length; j++) {
          const item = items[j];
          const file = batch[j];
          const cardContent = await this.vault.cachedRead(file);
          const fm = this.parseFrontmatter(cardContent);
          const body = this.stripFrontmatter(cardContent);
          const title = this.extractTitle(body, file.basename);

          const readWith = (item.read_with as string[]) || [];
          const validatedReadWith = await this.validateLinks(readWith);

          // Build updated card with enriched fields
          const newCard = this.buildCardFile({
            docId: fm.doc_id || file.path,
            title,
            path: fm.path || file.path,
            scope: fm.scope || "mainline",
            domain: fm.domain || "",
            topicPrimary: fm.topic_primary || title,
            oneLineSummary: fm.one_line_summary || "",
            tags: this.parseYamlList(fm.tags),
            headings: this.extractHeadings(body),
            retrievalKeywords: this.parseYamlList(fm.retrieval_keywords),
            outlinks: this.parseYamlList(fm.outlinks),
            noteRole: fm.note_role || "mixed",
            sourceHash: fm.source_hash || "",
          }, {
            topicSecondary: (item.topic_secondary as string[]) || [],
            questionTypes: (item.question_types as string[]) || [],
            bestFor: (item.best_for as string[]) || [],
            notFor: (item.not_for as string[]) || [],
            readWith: validatedReadWith,
          });

          await this.vault.modify(file, newCard);
          count++;
        }
      } catch (e) {
        console.warn(`[RAG] Enrich batch error:`, e);
      }
    }

    if (count) {
      console.log(`[RAG] LLM enriched ${count} index cards`);
    }
    return count;
  }

  private getCardFiles(): TFile[] {
    const dir = this.vault.getAbstractFileByPath(INDEX_DIR);
    if (!(dir instanceof TFolder)) return [];
    return dir.children.filter((c): c is TFile => c instanceof TFile && c.extension === "md");
  }

  private parseYamlList(raw: string | undefined): string[] {
    if (!raw) return [];
    if (raw.includes("\n")) {
      return raw.split("\n").filter(l => l.trim()).map(l => l.trim().replace(/^["']|["']$/g, ""));
    }
    return raw.split(",").filter(x => x.trim()).map(x => x.trim().replace(/^["']|["']$/g, ""));
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
  }, enriched?: {
    topicSecondary?: string[];
    questionTypes?: string[];
    bestFor?: string[];
    notFor?: string[];
    readWith?: string[];
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

    // LLM-enriched fields (or empty)
    const ts = enriched?.topicSecondary || [];
    const qt = enriched?.questionTypes || [];
    const bf = enriched?.bestFor || [];
    const nf = enriched?.notFor || [];
    const rw = enriched?.readWith || [];

    if (ts.length) {
      lines.push("topic_secondary:");
      for (const t of ts) lines.push(`  - "${escape(t)}"`);
    } else {
      lines.push("topic_secondary: []");
    }
    if (qt.length) {
      lines.push("question_types:");
      for (const q of qt) lines.push(`  - "${escape(q)}"`);
    } else {
      lines.push("question_types: []");
    }
    if (bf.length) {
      lines.push("best_for:");
      for (const b of bf) lines.push(`  - "${escape(b)}"`);
    } else {
      lines.push("best_for: []");
    }
    if (nf.length) {
      lines.push("not_for:");
      for (const n of nf) lines.push(`  - "${escape(n)}"`);
    } else {
      lines.push("not_for: []");
    }
    if (rw.length) {
      lines.push("read_with:");
      for (const r of rw) lines.push(`  - "${escape(r)}"`);
    } else {
      lines.push("read_with: []");
    }

    const fm = lines.join("\n") + "\n";
    return `---\n${fm}---\n\n# ${data.title}\n\n${data.oneLineSummary}`;
  }
}
