"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => EnhancedRAGPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian7 = require("obsidian");

// src/types.ts
var DEFAULT_SETTINGS = {
  apiKey: "",
  apiBaseUrl: "https://api.deepseek.com/v1",
  chatModel: "deepseek-reasoner",
  mergeModel: "deepseek-chat",
  embeddingModel: "text-embedding-v4",
  embeddingBaseUrl: "",
  embeddingApiKey: "",
  embeddingDimensions: 1024,
  rerankEnabled: false,
  rerankModel: "qwen3-rerank",
  rerankBaseUrl: "",
  rerankApiKey: "",
  autoGenerateCards: true,
  enrichModel: "deepseek-chat",
  cacheSize: 100,
  historyRetentionDays: 30,
  enableQueryTypeDetection: true,
  autoOpenChatPanel: true,
  showKnowledgeUnits: true,
  theme: "auto"
};

// src/settings.ts
var import_obsidian = require("obsidian");
var RAGSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Enhanced RAG \u8BBE\u7F6E" });
    containerEl.createEl("h3", { text: "API \u914D\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("API Key").setDesc("DeepSeek API \u5BC6\u94A5").addText((text) => text.setPlaceholder("sk-...").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
      this.plugin.settings.apiKey = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("API Base URL").setDesc("API \u57FA\u7840\u5730\u5740").addText((text) => text.setPlaceholder("https://api.deepseek.com/v1").setValue(this.plugin.settings.apiBaseUrl).onChange(async (value) => {
      this.plugin.settings.apiBaseUrl = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Chat Model").setDesc("\u7528\u4E8E\u5BF9\u8BDD\u548C\u63A8\u7406\u7684\u6A21\u578B").addText((text) => text.setPlaceholder("deepseek-reasoner").setValue(this.plugin.settings.chatModel).onChange(async (value) => {
      this.plugin.settings.chatModel = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Merge Model").setDesc("\u7528\u4E8E\u5185\u5BB9\u5408\u5E76\u7684\u6A21\u578B").addText((text) => text.setPlaceholder("deepseek-chat").setValue(this.plugin.settings.mergeModel).onChange(async (value) => {
      this.plugin.settings.mergeModel = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "Embedding \u914D\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("Embedding Model").setDesc("\u5411\u91CF\u5316\u6A21\u578B\uFF08\u5982 text-embedding-v4\uFF09").addText((text) => text.setPlaceholder("text-embedding-v4").setValue(this.plugin.settings.embeddingModel).onChange(async (value) => {
      this.plugin.settings.embeddingModel = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Embedding Base URL").setDesc("Embedding API \u5730\u5740\uFF08\u7559\u7A7A\u5219\u4E0E API Base URL \u76F8\u540C\uFF09").addText((text) => text.setPlaceholder("https://dashscope.aliyuncs.com/compatible-mode/v1").setValue(this.plugin.settings.embeddingBaseUrl).onChange(async (value) => {
      this.plugin.settings.embeddingBaseUrl = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Embedding API Key").setDesc("Embedding API \u5BC6\u94A5\uFF08\u7559\u7A7A\u5219\u4F7F\u7528 Chat \u7684 API Key\uFF09").addText((text) => text.setPlaceholder("\u7559\u7A7A\u5219\u5171\u7528").setValue(this.plugin.settings.embeddingApiKey).onChange(async (value) => {
      this.plugin.settings.embeddingApiKey = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Embedding \u7EF4\u5EA6").setDesc("\u5411\u91CF\u7EF4\u5EA6\uFF08text-embedding-v4 \u652F\u6301 64-2048\uFF09").addText((text) => text.setPlaceholder("1024").setValue(String(this.plugin.settings.embeddingDimensions)).onChange(async (value) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        this.plugin.settings.embeddingDimensions = num;
        await this.plugin.saveSettings();
      }
    }));
    containerEl.createEl("h3", { text: "Rerank \u914D\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u542F\u7528 Rerank").setDesc("\u4F7F\u7528 Rerank \u6A21\u578B\u5BF9\u68C0\u7D22\u7ED3\u679C\u4E8C\u6B21\u6392\u5E8F").addToggle((toggle) => toggle.setValue(this.plugin.settings.rerankEnabled).onChange(async (value) => {
      this.plugin.settings.rerankEnabled = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Rerank Model").setDesc("\u6392\u5E8F\u6A21\u578B\uFF08\u5982 qwen3-rerank\u3001gte-rerank-v2\uFF09").addText((text) => text.setPlaceholder("qwen3-rerank").setValue(this.plugin.settings.rerankModel).onChange(async (value) => {
      this.plugin.settings.rerankModel = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Rerank Base URL").setDesc("Rerank API \u5730\u5740\uFF08\u7559\u7A7A\u5219\u4E0E API Base URL \u76F8\u540C\uFF09").addText((text) => text.setPlaceholder("https://dashscope.aliyuncs.com/compatible-mode/v1").setValue(this.plugin.settings.rerankBaseUrl).onChange(async (value) => {
      this.plugin.settings.rerankBaseUrl = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Rerank API Key").setDesc("Rerank API \u5BC6\u94A5\uFF08\u7559\u7A7A\u5219\u4F7F\u7528 Chat \u7684 API Key\uFF09").addText((text) => text.setPlaceholder("\u7559\u7A7A\u5219\u5171\u7528").setValue(this.plugin.settings.rerankApiKey).onChange(async (value) => {
      this.plugin.settings.rerankApiKey = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "\u7D22\u5F15\u5361\u8BED\u4E49\u586B\u5145" });
    new import_obsidian.Setting(containerEl).setName("\u586B\u5145\u6A21\u578B").setDesc("\u7528\u4E8E\u586B\u5145 topic_secondary / question_types / best_for / not_for / read_with \u7684\u6A21\u578B").addText((text) => text.setPlaceholder("deepseek-chat").setValue(this.plugin.settings.enrichModel).onChange(async (value) => {
      this.plugin.settings.enrichModel = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("LLM \u586B\u5145\u8BED\u4E49\u5B57\u6BB5").setDesc("\u8C03\u7528 LLM \u6279\u91CF\u586B\u5145\u6240\u6709\u7D22\u5F15\u5361\u7684 5 \u4E2A\u8BED\u4E49\u5B57\u6BB5\uFF08\u9700\u8981\u5DF2\u914D\u7F6E API Key\uFF09").addButton((button) => button.setButtonText("\u5F00\u59CB\u586B\u5145").onClick(async () => {
      button.setButtonText("\u586B\u5145\u4E2D...");
      try {
        await this.plugin.enrichIndexCards();
        button.setButtonText("\u5B8C\u6210");
      } catch (e) {
        button.setButtonText("\u5931\u8D25");
      }
      setTimeout(() => button.setButtonText("\u5F00\u59CB\u586B\u5145"), 2e3);
    }));
    containerEl.createEl("h3", { text: "\u6027\u80FD\u914D\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u7F13\u5B58\u5927\u5C0F").setDesc("LRU \u7F13\u5B58\u6700\u5927\u6761\u76EE\u6570").addText((text) => text.setPlaceholder("100").setValue(String(this.plugin.settings.cacheSize)).onChange(async (value) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        this.plugin.settings.cacheSize = num;
        await this.plugin.saveSettings();
      }
    }));
    new import_obsidian.Setting(containerEl).setName("\u5386\u53F2\u4FDD\u7559\u5929\u6570").setDesc("\u5386\u53F2\u6570\u636E\u4FDD\u7559\u5929\u6570").addText((text) => text.setPlaceholder("30").setValue(String(this.plugin.settings.historyRetentionDays)).onChange(async (value) => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        this.plugin.settings.historyRetentionDays = num;
        await this.plugin.saveSettings();
      }
    }));
    new import_obsidian.Setting(containerEl).setName("\u542F\u7528\u67E5\u8BE2\u7C7B\u578B\u68C0\u6D4B").setDesc("\u6839\u636E\u67E5\u8BE2\u7C7B\u578B\u81EA\u52A8\u8C03\u6574\u6743\u91CD").addToggle((toggle) => toggle.setValue(this.plugin.settings.enableQueryTypeDetection).onChange(async (value) => {
      this.plugin.settings.enableQueryTypeDetection = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u81EA\u52A8\u751F\u6210\u7D22\u5F15\u5361").setDesc("\u6587\u4EF6\u4FDD\u5B58\u65F6\u81EA\u52A8\u751F\u6210/\u66F4\u65B0\u7D22\u5F15\u5361\u5230 00_INDEX/files/").addToggle((toggle) => toggle.setValue(this.plugin.settings.autoGenerateCards).onChange(async (value) => {
      this.plugin.settings.autoGenerateCards = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "\u754C\u9762\u914D\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u81EA\u52A8\u6253\u5F00\u9762\u677F").setDesc("\u641C\u7D22\u65F6\u81EA\u52A8\u6253\u5F00 RAG \u9762\u677F").addToggle((toggle) => toggle.setValue(this.plugin.settings.autoOpenChatPanel).onChange(async (value) => {
      this.plugin.settings.autoOpenChatPanel = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u663E\u793A\u77E5\u8BC6\u5355\u5143").setDesc("\u5728\u7ED3\u679C\u4E2D\u663E\u793A\u77E5\u8BC6\u5355\u5143").addToggle((toggle) => toggle.setValue(this.plugin.settings.showKnowledgeUnits).onChange(async (value) => {
      this.plugin.settings.showKnowledgeUnits = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "\u6570\u636E\u7BA1\u7406" });
    new import_obsidian.Setting(containerEl).setName("\u91CD\u5EFA\u7D22\u5F15").setDesc("\u91CD\u5EFA\u68C0\u7D22\u7D22\u5F15\uFF08\u6E05\u9664\u5E76\u91CD\u65B0\u6784\u5EFA\u5173\u952E\u8BCD\u548C\u5411\u91CF\u7D22\u5F15\uFF09").addButton((button) => button.setButtonText("\u91CD\u5EFA").onClick(async () => {
      await this.plugin.rebuildIndexes();
      button.setButtonText("\u5B8C\u6210");
      setTimeout(() => button.setButtonText("\u91CD\u5EFA"), 2e3);
    }));
    new import_obsidian.Setting(containerEl).setName("\u91CD\u5EFA\u7D22\u5F15\u5361").setDesc("\u626B\u63CF\u6240\u6709 Markdown \u6587\u4EF6\uFF0C\u91CD\u65B0\u751F\u6210 00_INDEX/files/ \u4E0B\u7684\u7D22\u5F15\u5361").addButton((button) => button.setButtonText("\u91CD\u5EFA").onClick(async () => {
      await this.plugin.rebuildIndexCards();
      button.setButtonText("\u5B8C\u6210");
      setTimeout(() => button.setButtonText("\u91CD\u5EFA"), 2e3);
    }));
    new import_obsidian.Setting(containerEl).setName("\u6E05\u9664\u7F13\u5B58").setDesc("\u6E05\u9664\u6240\u6709\u7F13\u5B58\u6570\u636E").addButton((button) => button.setButtonText("\u6E05\u9664").onClick(async () => {
      await this.plugin.clearCache();
      button.setButtonText("\u5DF2\u6E05\u9664");
      setTimeout(() => button.setButtonText("\u6E05\u9664"), 2e3);
    }));
    new import_obsidian.Setting(containerEl).setName("\u91CD\u7F6E\u5386\u53F2").setDesc("\u6E05\u9664\u6240\u6709\u67E5\u8BE2\u548C\u4EA4\u4E92\u5386\u53F2").addButton((button) => button.setButtonText("\u91CD\u7F6E").setWarning().onClick(async () => {
      await this.plugin.clearHistory();
      button.setButtonText("\u5DF2\u91CD\u7F6E");
      setTimeout(() => button.setButtonText("\u91CD\u7F6E"), 2e3);
    }));
  }
};

// src/utils/file-utils.ts
var import_obsidian2 = require("obsidian");
async function fileToDocument(file, vault) {
  const content = await vault.cachedRead(file);
  const lines = content.split("\n");
  let title = file.basename;
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)/);
    if (match) {
      title = match[1].trim();
      break;
    }
  }
  const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const links = [];
  let linkMatch;
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    links.push(linkMatch[1].trim());
  }
  let summary = "";
  let inParagraph = false;
  for (const line of lines) {
    if (line.startsWith("#"))
      continue;
    if (line.trim() === "") {
      if (inParagraph)
        break;
      continue;
    }
    if (!inParagraph)
      inParagraph = true;
    summary += line + " ";
    if (summary.length > 200)
      break;
  }
  return {
    id: file.path,
    title,
    content,
    path: file.path,
    summary: summary.trim(),
    links: [...new Set(links)],
    lastModified: file.stat.mtime
  };
}
function getAllMarkdownFiles(vault) {
  return vault.getMarkdownFiles();
}
function parseCardFrontmatter(content) {
  const fm = {};
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match)
    return fm;
  const lines = match[1].split("\n");
  let currentKey = null;
  let currentList = [];
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
function parseYamlList(raw) {
  if (!raw)
    return [];
  if (raw.includes("\n")) {
    return raw.split("\n").filter((l) => l.trim()).map((l) => l.trim().replace(/^["']|["']$/g, ""));
  }
  return raw.split(",").filter((x) => x.trim()).map((x) => x.trim().replace(/^["']|["']$/g, ""));
}
async function readIndexCard(file, vault) {
  try {
    const content = await vault.cachedRead(file);
    const fm = parseCardFrontmatter(content);
    if (!fm.doc_id && !fm.title)
      return null;
    return {
      docId: fm.doc_id || file.path,
      title: fm.title || file.basename,
      path: fm.path || file.path,
      scope: fm.scope || "mainline",
      tags: parseYamlList(fm.tags || ""),
      headings: parseYamlList(fm.headings || ""),
      outlinks: parseYamlList(fm.outlinks || ""),
      domain: fm.domain || "",
      topicPrimary: fm.topic_primary || "",
      topicSecondary: parseYamlList(fm.topic_secondary || ""),
      noteRole: fm.note_role || "mixed",
      questionTypes: parseYamlList(fm.question_types || ""),
      oneLineSummary: fm.one_line_summary || "",
      retrievalKeywords: parseYamlList(fm.retrieval_keywords || ""),
      bestFor: parseYamlList(fm.best_for || ""),
      notFor: parseYamlList(fm.not_for || ""),
      readWith: parseYamlList(fm.read_with || ""),
      sourceHash: fm.source_hash || "",
      buildStatus: fm.build_status || "success",
      generatedAt: fm.generated_at || "",
      content: content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "").substring(0, 2e3)
    };
  } catch {
    return null;
  }
}
async function getIndexCards(vault) {
  const indexFolder = vault.getAbstractFileByPath("00_INDEX/files");
  if (!indexFolder || !(indexFolder instanceof import_obsidian2.TFolder)) {
    return [];
  }
  const cards = [];
  for (const child of indexFolder.children) {
    if (child instanceof import_obsidian2.TFile && child.extension === "md") {
      const card = await readIndexCard(child, vault);
      if (card)
        cards.push(card);
    }
  }
  return cards;
}
function tokenize(text) {
  return text.toLowerCase().replace(/[^\w一-鿿\s]/g, " ").split(/\s+/).filter((token) => token.length > 1);
}
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// src/retrieval/keyword-retriever.ts
var KeywordRetriever = class {
  constructor(vault) {
    this.invertedIndex = {};
    this.documents = /* @__PURE__ */ new Map();
    this.indexBuilt = false;
    this.vault = vault;
  }
  /**
   * Build or rebuild the inverted index
   */
  async buildIndex() {
    this.invertedIndex = {};
    this.documents.clear();
    const files = getAllMarkdownFiles(this.vault);
    for (const file of files) {
      const doc = await fileToDocument(file, this.vault);
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
    this.indexBuilt = true;
    console.log(`[RAG] Keyword index built: ${this.documents.size} documents, ${Object.keys(this.invertedIndex).length} terms`);
  }
  /**
   * Search by keywords
   */
  async search(query, options = { limit: 50 }) {
    if (!this.indexBuilt) {
      await this.buildIndex();
    }
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0)
      return [];
    const scores = /* @__PURE__ */ new Map();
    for (const token of queryTokens) {
      const docIds = this.invertedIndex[token] || [];
      const idf = Math.log((this.documents.size + 1) / (docIds.length + 1));
      for (const docId of docIds) {
        const currentScore = scores.get(docId) || 0;
        scores.set(docId, currentScore + idf);
      }
    }
    const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, options.limit);
    const maxScore = sorted.length > 0 ? sorted[0][1] : 1;
    const results = [];
    for (const [docId, score] of sorted) {
      const doc = this.documents.get(docId);
      if (!doc)
        continue;
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
  extractSnippet(content, tokens) {
    const sentences = content.split(/[。！？\n.!?]+/);
    const lowerTokens = tokens.map((t) => t.toLowerCase());
    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const hasMatch = lowerTokens.some((token) => lowerSentence.includes(token));
      if (hasMatch && sentence.trim().length > 10) {
        return sentence.trim().substring(0, 200);
      }
    }
    return content.substring(0, 200).trim();
  }
  /**
   * Get index statistics
   */
  getStats() {
    return {
      documentCount: this.documents.size,
      termCount: Object.keys(this.invertedIndex).length,
      indexed: this.indexBuilt
    };
  }
  /**
   * Incremental update: add or update a document
   */
  async updateDocument(filePath) {
    const file = this.vault.getAbstractFileByPath(filePath);
    if (!file || !("stat" in file))
      return;
    const oldDoc = this.documents.get(filePath);
    if (oldDoc) {
      const oldTokens = tokenize(oldDoc.title + " " + oldDoc.content);
      for (const token of oldTokens) {
        if (this.invertedIndex[token]) {
          this.invertedIndex[token] = this.invertedIndex[token].filter((id) => id !== filePath);
          if (this.invertedIndex[token].length === 0) {
            delete this.invertedIndex[token];
          }
        }
      }
    }
    const doc = await fileToDocument(file, this.vault);
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
  removeDocument(filePath) {
    const doc = this.documents.get(filePath);
    if (!doc)
      return;
    const tokens = tokenize(doc.title + " " + doc.content);
    for (const token of tokens) {
      if (this.invertedIndex[token]) {
        this.invertedIndex[token] = this.invertedIndex[token].filter((id) => id !== filePath);
        if (this.invertedIndex[token].length === 0) {
          delete this.invertedIndex[token];
        }
      }
    }
    this.documents.delete(filePath);
  }
};

// src/retrieval/index-retriever.ts
var IndexCardStore = class {
  constructor(vault) {
    this.cardsByPath = /* @__PURE__ */ new Map();
    this.cardsById = /* @__PURE__ */ new Map();
    this.allKnownPaths = /* @__PURE__ */ new Set();
    this.loaded = false;
    this.vault = vault;
  }
  /**
   * Load all index cards and build path mappings
   */
  async loadIndex() {
    const cards = await getIndexCards(this.vault);
    this.cardsByPath.clear();
    this.cardsById.clear();
    this.allKnownPaths.clear();
    for (const card of cards) {
      const path = card.path || card.docId;
      this.cardsByPath.set(path.toLowerCase(), card);
      this.cardsById.set(card.docId, card);
      this.allKnownPaths.add(path.toLowerCase());
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
  getCardByPath(path) {
    if (!this.loaded)
      return void 0;
    return this.cardsByPath.get(path.toLowerCase());
  }
  /**
   * Get cards by multiple paths (on-demand reading)
   */
  getCardsByPaths(paths) {
    const result = /* @__PURE__ */ new Map();
    for (const p of paths) {
      const card = this.cardsByPath.get(p.toLowerCase());
      if (card)
        result.set(p, card);
    }
    return result;
  }
  /**
   * Get linked file paths from a card (Wiki Link expansion).
   * Validates links against known file paths.
   */
  getLinkedPaths(cardPath) {
    const card = this.cardsByPath.get(cardPath.toLowerCase());
    if (!card)
      return [];
    const linked = [];
    const allLinks = [...card.outlinks || [], ...card.readWith || []];
    for (const link of allLinks) {
      const clean = link.trim().replace(/\.md$/, "").toLowerCase();
      if (this.allKnownPaths.has(clean)) {
        linked.push(link.trim());
        continue;
      }
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
  resolveLink(linkName) {
    const clean = linkName.trim().replace(/\.md$/, "").toLowerCase();
    if (this.cardsByPath.has(clean)) {
      return clean;
    }
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
  getAllCards() {
    return [...this.cardsByPath.values()];
  }
  /**
   * Get statistics
   */
  getStats() {
    return {
      cardCount: this.cardsByPath.size,
      loaded: this.loaded
    };
  }
};

// src/cloud/api.ts
var MAX_RETRIES = 3;
var RETRY_DELAY_MS = 1e3;
var CloudAPIClient = class {
  constructor(settings) {
    this.settings = settings;
  }
  updateSettings(settings) {
    this.settings = settings;
  }
  /**
   * Call the chat completion API
   */
  async chat(request) {
    if (!this.settings.apiKey) {
      throw new Error("API key not configured. Please set it in plugin settings.");
    }
    const url = `${this.settings.apiBaseUrl}/chat/completions`;
    let lastError = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.settings.apiKey}`
          },
          body: JSON.stringify(request)
        });
        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1e3 : RETRY_DELAY_MS * (attempt + 1);
            await this.sleep(delay);
            continue;
          }
          throw new Error(`API error ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
          return data.choices[0].message.content;
        }
        throw new Error("No response choices returned");
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }
    throw lastError || new Error("API call failed after retries");
  }
  /**
   * Generate embeddings for text
   * Uses embeddingBaseUrl (fallback to apiBaseUrl), embeddingModel, and embeddingApiKey (fallback to apiKey).
   */
  async embed(text) {
    const baseUrl = (this.settings.embeddingBaseUrl || this.settings.apiBaseUrl).replace(/\/$/, "");
    const url = `${baseUrl}/embeddings`;
    const model = this.settings.embeddingModel || "text-embedding-v4";
    const embedKey = this.settings.embeddingApiKey || this.settings.apiKey;
    const headers = { "Content-Type": "application/json" };
    if (embedKey) {
      headers["Authorization"] = `Bearer ${embedKey}`;
    }
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            input: text
          })
        });
        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1e3 : RETRY_DELAY_MS * (attempt + 1);
            await this.sleep(delay);
            continue;
          }
          const errorText = await response.text();
          throw new Error(`Embedding API error ${response.status}: ${errorText}`);
        }
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].embedding;
        }
        throw new Error("No embedding returned");
      } catch (error) {
        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(RETRY_DELAY_MS * (attempt + 1));
        } else {
          throw error;
        }
      }
    }
    throw new Error("Embedding API call failed after retries");
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/utils/cache-utils.ts
var LRUCache = class {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.cache = /* @__PURE__ */ new Map();
  }
  get(key) {
    if (!this.cache.has(key))
      return void 0;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== void 0) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }
  has(key) {
    return this.cache.has(key);
  }
  delete(key) {
    return this.cache.delete(key);
  }
  clear() {
    this.cache.clear();
  }
  get size() {
    return this.cache.size;
  }
  entries() {
    return this.cache.entries();
  }
};
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

// src/retrieval/chunker.ts
function estimateTokens(text) {
  const cjk = (text.match(/[一-鿿㐀-䶿豈-﫿]/g) || []).length;
  const words = (text.match(/[a-zA-Z]+/g) || []).length;
  const letters = (text.match(/[a-zA-Z]/g) || []).length;
  const remaining = text.length - cjk - letters;
  return Math.max(1, Math.floor(cjk + words * 1.3 + remaining * 0.25));
}
function stripFrontmatter(content) {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
}
function splitSections(content) {
  const sections = [];
  const headingRegex = /^#{2,3}\s+.+$/gm;
  let lastPos = 0;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    if (match.index > lastPos) {
      sections.push({ text: content.slice(lastPos, match.index), pos: lastPos });
    }
    lastPos = match.index;
  }
  if (lastPos < content.length) {
    sections.push({ text: content.slice(lastPos), pos: lastPos });
  }
  if (sections.length === 0) {
    sections.push({ text: content, pos: 0 });
  }
  return sections;
}
function splitParagraphs(text) {
  const parts = text.split(/\n\s*\n/);
  return parts.map((p) => p.trim()).filter((p) => p.length > 0);
}
function chunkMarkdown(content, targetTokens = 420, overlapTokens = 64, maxTokens = 520) {
  const body = stripFrontmatter(content);
  if (!body.trim())
    return [];
  const sections = splitSections(body);
  const chunks = [];
  let currentText = "";
  let currentStart = sections[0]?.pos ?? 0;
  for (const { text: secText, pos: secPos } of sections) {
    const testText = currentText ? `${currentText}

${secText}`.trim() : secText;
    if (estimateTokens(testText) <= maxTokens) {
      if (currentText) {
        currentText = testText;
      } else {
        currentText = secText;
        currentStart = secPos;
      }
    } else {
      if (currentText) {
        chunks.push({
          text: currentText,
          chunkIndex: chunks.length,
          startChar: currentStart,
          endChar: currentStart + currentText.length
        });
      }
      if (estimateTokens(secText) > maxTokens) {
        const paragraphs = splitParagraphs(secText);
        let subText = "";
        let subStart = secPos;
        for (const para of paragraphs) {
          const testSub = subText ? `${subText}

${para}`.trim() : para;
          if (estimateTokens(testSub) <= maxTokens) {
            if (subText) {
              subText = testSub;
            } else {
              subText = para;
              subStart = secPos + secText.indexOf(para);
            }
          } else {
            if (subText) {
              chunks.push({
                text: subText,
                chunkIndex: chunks.length,
                startChar: subStart,
                endChar: subStart + subText.length
              });
            }
            subText = para;
            subStart = secPos + secText.indexOf(para);
          }
        }
        if (subText) {
          currentText = subText;
          currentStart = subStart;
        } else {
          currentText = "";
        }
      } else {
        currentText = secText;
        currentStart = secPos;
      }
    }
  }
  if (currentText) {
    chunks.push({
      text: currentText,
      chunkIndex: chunks.length,
      startChar: currentStart,
      endChar: currentStart + currentText.length
    });
  }
  if (overlapTokens > 0 && chunks.length > 1) {
    const overlapped = [chunks[0]];
    for (let i = 1; i < chunks.length; i++) {
      const prev = overlapped[overlapped.length - 1];
      const curr = chunks[i];
      let overlapText = "";
      for (let j = prev.text.length - 1; j >= 0; j--) {
        const candidate = prev.text.slice(j);
        if (estimateTokens(candidate) >= overlapTokens) {
          overlapText = candidate;
          break;
        }
      }
      overlapped.push({
        text: overlapText ? `${overlapText}

${curr.text}` : curr.text,
        chunkIndex: curr.chunkIndex,
        startChar: curr.startChar,
        endChar: curr.endChar
      });
    }
    return overlapped;
  }
  return chunks;
}

// src/retrieval/vector-retriever.ts
var CHUNK_TARGET = 420;
var CHUNK_OVERLAP = 64;
var CHUNK_MAX = 520;
var VectorRetriever = class {
  constructor(vault, settings) {
    this.documents = /* @__PURE__ */ new Map();
    this.embeddings = /* @__PURE__ */ new Map();
    // chunkId → embedding
    this.chunkInfo = /* @__PURE__ */ new Map();
    this.loaded = false;
    this.vault = vault;
    this.settings = settings;
    this.client = new CloudAPIClient(settings);
    this.embeddingCache = new LRUCache(200);
  }
  updateSettings(settings) {
    this.settings = settings;
    this.client.updateSettings(settings);
  }
  /**
   * Build vector index — chunk documents → embed each chunk
   */
  async buildIndex() {
    if (!this.settings.apiKey) {
      console.warn("[RAG] Vector search disabled: no API key");
      this.loaded = true;
      return;
    }
    this.documents.clear();
    this.embeddings.clear();
    this.chunkInfo.clear();
    const files = getAllMarkdownFiles(this.vault);
    let totalChunks = 0;
    for (const file of files) {
      const doc = await fileToDocument(file, this.vault);
      this.documents.set(doc.id, doc);
    }
    console.log(`[RAG] Vector index building for ${this.documents.size} documents...`);
    const batchSize = 5;
    const embedJobs = [];
    for (const [docId, doc] of this.documents) {
      const chunks = chunkMarkdown(doc.content, CHUNK_TARGET, CHUNK_OVERLAP, CHUNK_MAX);
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = `${docId}#chunk_${i}`;
        const text = `${doc.title}
${chunk.text}`;
        embedJobs.push({
          chunkId,
          text,
          info: { docId, title: doc.title, path: doc.path, scope: "mainline" }
        });
      }
      totalChunks += chunks.length;
    }
    console.log(`[RAG] ${totalChunks} chunks to embed`);
    for (let i = 0; i < embedJobs.length; i += batchSize) {
      const batch = embedJobs.slice(i, i + batchSize);
      const promises = batch.map(async ({ chunkId, text, info }) => {
        const hashKey = hashString(text);
        const cached = this.embeddingCache.get(hashKey);
        if (cached) {
          this.embeddings.set(chunkId, cached);
          this.chunkInfo.set(chunkId, info);
          return;
        }
        try {
          const embedding = await this.client.embed(text);
          this.embeddings.set(chunkId, embedding);
          this.chunkInfo.set(chunkId, info);
          this.embeddingCache.set(hashKey, embedding);
        } catch (error) {
          console.warn(`[RAG] Failed to embed chunk ${chunkId}:`, error);
        }
      });
      await Promise.all(promises);
      if (i + batchSize < embedJobs.length) {
        await this.sleep(200);
      }
    }
    this.loaded = true;
    console.log(`[RAG] Vector index built: ${this.embeddings.size} chunk embeddings`);
  }
  /**
   * Search using vector similarity — chunk-level → merge to document-level
   */
  async search(query, options = { limit: 30 }) {
    if (!this.settings.apiKey || !this.loaded || this.embeddings.size === 0) {
      return [];
    }
    let queryEmbedding;
    const queryHash = hashString(query);
    const cachedQuery = this.embeddingCache.get(`query:${queryHash}`);
    if (cachedQuery) {
      queryEmbedding = cachedQuery;
    } else {
      try {
        queryEmbedding = await this.client.embed(query);
        this.embeddingCache.set(`query:${queryHash}`, queryEmbedding);
      } catch (error) {
        console.error("[RAG] Failed to embed query:", error);
        return [];
      }
    }
    const similarities = [];
    for (const [chunkId, embedding] of this.embeddings) {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      similarities.push({ chunkId, similarity });
    }
    similarities.sort((a, b) => b.similarity - a.similarity);
    const docBest = /* @__PURE__ */ new Map();
    for (const { chunkId, similarity } of similarities) {
      const info = this.chunkInfo.get(chunkId);
      if (!info)
        continue;
      const existing = docBest.get(info.docId);
      if (!existing || similarity > existing.similarity) {
        docBest.set(info.docId, {
          similarity,
          title: info.title,
          path: info.path,
          scope: info.scope,
          chunkId
        });
      }
    }
    const topDocs = [...docBest.entries()].sort((a, b) => b[1].similarity - a[1].similarity).slice(0, options.limit);
    if (!topDocs.length)
      return [];
    const maxScore = topDocs[0][1].similarity;
    const results = [];
    for (const [docId, { similarity, title, path, scope }] of topDocs) {
      const doc = this.documents.get(docId);
      const snippet = doc?.summary || "";
      results.push({
        docId,
        title,
        path,
        score: similarity / maxScore,
        snippet: snippet || "",
        source: "vector"
      });
    }
    return results;
  }
  /**
   * Vector search with neighbor expansion
   * Uses document-level results for neighbor discovery.
   */
  async searchWithExpansion(query, limit = 20, expandTopK = 3, expandNeighbors = 5) {
    const initial = await this.search(query, { limit });
    if (!initial.length || expandTopK <= 0)
      return initial;
    const seenIds = new Set(initial.map((r) => r.docId));
    const expanded = [...initial];
    const seeds = initial.slice(0, expandTopK);
    for (const seed of seeds) {
      const seedDoc = this.documents.get(seed.docId);
      if (!seedDoc)
        continue;
      const seedText = seedDoc.summary || seedDoc.content.substring(0, 300);
      const neighbors = await this.search(seedText, {
        limit: expandNeighbors + seenIds.size
      });
      for (const n of neighbors) {
        if (!seenIds.has(n.docId)) {
          seenIds.add(n.docId);
          n.score *= 0.7;
          expanded.push(n);
        }
      }
    }
    expanded.sort((a, b) => b.score - a.score);
    return expanded;
  }
  cosineSimilarity(a, b) {
    if (a.length !== b.length)
      return 0;
    let dotProduct = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0)
      return 0;
    return dotProduct / denominator;
  }
  getStats() {
    return {
      documentCount: this.documents.size,
      embeddingCount: this.embeddings.size,
      loaded: this.loaded
    };
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/fusion/ranker.ts
function normalizeScores(results) {
  if (results.length === 0)
    return /* @__PURE__ */ new Map();
  const maxScore = Math.max(...results.map((r) => r.score)) || 1;
  return new Map(results.map((r) => [r.docId, r.score / maxScore]));
}
function rankArticles(keywordResults, vectorResults, expansionPaths) {
  const expansionSet = new Set(expansionPaths);
  const kwScores = normalizeScores(keywordResults);
  const vecScores = normalizeScores(vectorResults);
  const allDocs = /* @__PURE__ */ new Map();
  for (const r of keywordResults)
    allDocs.set(r.docId, r);
  for (const r of vectorResults)
    allDocs.set(r.docId, r);
  const ranked = [];
  for (const [docId, doc] of allDocs) {
    const ks = kwScores.get(docId) || 0;
    const vs = vecScores.get(docId) || 0;
    const retrievalScore = ks * 0.55 + vs * 0.45;
    const crossBonus = ks > 0 && vs > 0 ? 0.15 : 0;
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
      fromExpansion: isExpanded
    });
  }
  ranked.sort((a, b) => b.finalScore - a.finalScore);
  return ranked;
}
function boostByCardFields(ranked, query, cards) {
  const queryLower = query.toLowerCase();
  const queryTokens = new Set(queryLower.split(/\s+/));
  for (const article of ranked) {
    const card = cards.get(article.docId);
    if (!card)
      continue;
    let bonus = 0;
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
    const topic = card.topicPrimary || "";
    if (topic && (queryLower.includes(topic.toLowerCase()) || topic.toLowerCase().includes(queryLower))) {
      bonus += 0.08;
    }
    if (card.domain) {
      bonus += 0.03;
    }
    article.cardBonus = Math.min(bonus, 0.25);
    article.finalScore += article.cardBonus;
    article.card = card;
  }
  ranked.sort((a, b) => b.finalScore - a.finalScore);
  return ranked;
}

// src/retrieval/manager.ts
var RetrievalManager = class {
  constructor(vault, settings) {
    this.vault = vault;
    this.settings = settings;
    this.keywordRetriever = new KeywordRetriever(vault);
    this.cardStore = new IndexCardStore(vault);
    this.vectorRetriever = new VectorRetriever(vault, settings);
  }
  updateSettings(settings) {
    this.settings = settings;
    this.vectorRetriever.updateSettings(settings);
  }
  /**
   * Build all indexes (keyword + cards + vector)
   */
  async buildIndexes() {
    console.log("[RAG] Building all indexes...");
    await Promise.all([
      this.keywordRetriever.buildIndex(),
      this.cardStore.loadIndex(),
      this.vectorRetriever.buildIndex()
    ]);
    console.log("[RAG] All indexes built");
  }
  /**
   * Pipeline search: core retrieval → expansion → on-demand cards → ranking
   */
  async pipelineSearch(query, limit = 10) {
    const [kwResults, vecResults] = await Promise.all([
      this.keywordRetriever.search(query, { limit: 50 }),
      this.settings.apiKey ? this.vectorRetriever.searchWithExpansion(query, 20, 3, 5) : Promise.resolve([])
    ]);
    const coreSet = /* @__PURE__ */ new Set();
    for (const r of kwResults.slice(0, 20))
      coreSet.add(r.docId);
    for (const r of vecResults.slice(0, 20))
      coreSet.add(r.docId);
    const corePaths = [...coreSet];
    const expansionPaths = [];
    for (const path of corePaths) {
      const linked = this.cardStore.getLinkedPaths(path);
      for (const lp of linked) {
        if (!coreSet.has(lp)) {
          expansionPaths.push(lp);
        }
      }
    }
    const allCandidatePaths = [...corePaths, ...expansionPaths];
    const cards = this.cardStore.getCardsByPaths(allCandidatePaths);
    let ranked = rankArticles(kwResults, vecResults, expansionPaths);
    ranked = boostByCardFields(ranked, query, cards);
    console.log(
      `[RAG] Pipeline: keyword=${kwResults.length}, vector=${vecResults.length}, expansion=${expansionPaths.length}, ranked=${ranked.length}`
    );
    return { ranked: ranked.slice(0, limit), cards };
  }
  /**
   * Update a single document in keyword index
   */
  async updateDocument(filePath) {
    await this.keywordRetriever.updateDocument(filePath);
  }
  /**
   * Remove a document from keyword index
   */
  removeDocument(filePath) {
    this.keywordRetriever.removeDocument(filePath);
  }
  /**
   * Get statistics for all retrievers
   */
  getStats() {
    return {
      keyword: this.keywordRetriever.getStats(),
      cards: this.cardStore.getStats(),
      vector: this.vectorRetriever.getStats()
    };
  }
};

// src/fusion/result-fusion.ts
var ResultFusion = class {
  /**
   * Apply history boost to ranked results
   */
  applyHistoryBoost(results, topicPreferences) {
    return results.map((result) => {
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
};

// src/fusion/query-analyzer.ts
var QueryAnalyzer = class {
  constructor() {
    // Chinese patterns
    this.patterns = {
      definition: [
        /什么是/,
        /什么叫/,
        /定义/,
        /含义/,
        /意思/,
        /概念/,
        /是什么/,
        /怎样理解/
      ],
      procedure: [
        /怎么/,
        /如何/,
        /步骤/,
        /方法/,
        /做法/,
        /流程/,
        /过程/,
        /教程/
      ],
      comparison: [
        /区别/,
        /不同/,
        /比较/,
        /对比/,
        /差异/,
        /vs/i,
        /versus/i,
        /哪个[好坏快慢]/
      ],
      explanation: [
        /为什么/,
        /原因/,
        /解释/,
        /说明/,
        /原理/,
        /机制/
      ],
      summarization: [
        /总结/,
        /概述/,
        /概要/,
        /综述/,
        /简述/,
        /概括/
      ]
    };
  }
  /**
   * Detect query type from query text
   */
  detect(query) {
    const scores = {
      ["definition" /* DEFINITION */]: 0,
      ["procedure" /* PROCEDURE */]: 0,
      ["comparison" /* COMPARISON */]: 0,
      ["explanation" /* EXPLANATION */]: 0,
      ["summarization" /* SUMMARIZATION */]: 0
    };
    for (const [type, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        if (pattern.test(query)) {
          scores[type] += 1;
        }
      }
    }
    let maxScore = 0;
    let detectedType = "explanation" /* EXPLANATION */;
    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        detectedType = type;
      }
    }
    return detectedType;
  }
};

// src/knowledge/cluster.ts
var DocumentClusterer = class {
  constructor() {
    this.indexCards = [];
  }
  setIndexCards(cards) {
    this.indexCards = cards;
  }
  /**
   * Cluster documents by topic based on index cards and links
   */
  cluster(documents, topics) {
    const clusters = topics.map((topic) => ({
      topic,
      documents: [],
      coreDocument: null
    }));
    const assigned = /* @__PURE__ */ new Set();
    for (const doc of documents) {
      const card = this.indexCards.find(
        (c) => c.path === doc.id || c.title.toLowerCase() === doc.title.toLowerCase()
      );
      if (card && card.topicPrimary) {
        for (const cluster of clusters) {
          if (this.topicMatch(card.topicPrimary, cluster.topic)) {
            cluster.documents.push(doc);
            assigned.add(doc.id);
            break;
          }
        }
      }
    }
    for (const doc of documents) {
      if (assigned.has(doc.id))
        continue;
      let bestCluster = null;
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
    for (const cluster of clusters) {
      cluster.coreDocument = this.findCoreDocument(cluster.documents);
    }
    return clusters.filter((c) => c.documents.length > 0);
  }
  /**
   * Check if two topics match
   */
  topicMatch(topic1, topic2) {
    const t1 = topic1.toLowerCase();
    const t2 = topic2.toLowerCase();
    return t1.includes(t2) || t2.includes(t1);
  }
  /**
   * Compute topic relevance score for a document
   */
  computeTopicScore(doc, topic) {
    let score = 0;
    const topicLower = topic.toLowerCase();
    const topicWords = topicLower.split(/\s+/);
    const titleLower = doc.title.toLowerCase();
    if (titleLower.includes(topicLower))
      score += 3;
    for (const word of topicWords) {
      if (titleLower.includes(word))
        score += 1;
    }
    if (doc.summary) {
      const summaryLower = doc.summary.toLowerCase();
      if (summaryLower.includes(topicLower))
        score += 2;
      for (const word of topicWords) {
        if (summaryLower.includes(word))
          score += 0.5;
      }
    }
    return score;
  }
  /**
   * Find the core document in a cluster (most referenced)
   */
  findCoreDocument(documents) {
    if (documents.length === 0)
      return null;
    if (documents.length === 1)
      return documents[0];
    const linkCounts = /* @__PURE__ */ new Map();
    for (const doc of documents) {
      if (doc.links) {
        for (const link of doc.links) {
          const linkedDoc = documents.find(
            (d) => d.title.toLowerCase() === link.toLowerCase()
          );
          if (linkedDoc) {
            linkCounts.set(linkedDoc.id, (linkCounts.get(linkedDoc.id) || 0) + 1);
          }
        }
      }
    }
    let maxLinks = 0;
    let coreDoc = documents[0];
    for (const [docId, count] of linkCounts) {
      if (count > maxLinks) {
        maxLinks = count;
        const doc = documents.find((d) => d.id === docId);
        if (doc)
          coreDoc = doc;
      }
    }
    return coreDoc;
  }
};

// src/knowledge/merger.ts
var ContentMerger = class {
  constructor(batchProcessor) {
    this.batchProcessor = batchProcessor;
  }
  /**
   * Merge documents in clusters into knowledge units
   */
  async merge(clusters, query) {
    if (clusters.length === 0)
      return [];
    const units = await this.batchProcessor.generateKnowledgeUnits(clusters, query);
    for (let i = 0; i < units.length && i < clusters.length; i++) {
      const unit = units[i];
      const cluster = clusters[i];
      unit.sourceCount = cluster.documents.length;
      unit.sourceDocuments = cluster.documents.map((d) => d.id);
      unit.relevanceScore = 1 - i * 0.1;
    }
    return units;
  }
  /**
   * Simple local merge (fallback when API is not available)
   */
  mergeLocally(clusters, query) {
    return clusters.map((cluster, index) => {
      const allContent = cluster.documents.map((d) => d.summary || d.content.substring(0, 200)).join(" ");
      const sentences = allContent.split(/[。！？\n.!?]+/).filter((s) => s.trim().length > 10).slice(0, 5);
      return {
        id: `ku-local-${Date.now()}-${index}`,
        topic: cluster.topic,
        summary: sentences.join("\u3002") + "\u3002",
        keyPoints: sentences.slice(0, 3).map((s) => s.trim()),
        sourceCount: cluster.documents.length,
        relevanceScore: 1 - index * 0.1,
        historyBoost: 0,
        suggestedUsage: `\u57FA\u4E8E ${cluster.documents.length} \u7BC7\u6587\u6863\u7684\u7EFC\u5408\u4FE1\u606F`,
        sourceDocuments: cluster.documents.map((d) => d.id)
      };
    });
  }
};

// src/cloud/cache.ts
var CloudCache = class {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new LRUCache(maxSize);
  }
  /**
   * Get cached response for a query
   */
  get(query, model) {
    const key = this.generateKey(query, model);
    const entry = this.cache.get(key);
    if (!entry)
      return null;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1e3;
    if (Date.now() - entry.timestamp > thirtyDaysMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.response;
  }
  /**
   * Store a response in cache
   */
  set(query, model, response) {
    const key = this.generateKey(query, model);
    this.cache.set(key, {
      response,
      timestamp: Date.now(),
      queryHash: key
    });
  }
  /**
   * Clear all cached entries
   */
  clear() {
    this.cache.clear();
  }
  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
  generateKey(query, model) {
    return `${model}:${hashString(query)}`;
  }
};

// src/cloud/batch-processor.ts
var BatchProcessor = class {
  constructor(settings) {
    this.settings = settings;
    this.client = new CloudAPIClient(settings);
    this.cache = new CloudCache(settings.cacheSize);
  }
  updateSettings(settings) {
    this.settings = settings;
    this.client.updateSettings(settings);
  }
  /**
   * Generate knowledge units from document clusters in a single API call
   */
  async generateKnowledgeUnits(clusters, query) {
    if (clusters.length === 0)
      return [];
    const cacheKey = this.buildCacheKey(clusters, query);
    const cached = this.cache.get(cacheKey, this.settings.mergeModel);
    if (cached) {
      try {
        return this.parseKnowledgeUnits(JSON.parse(cached));
      } catch {
      }
    }
    const prompt = this.buildBatchPrompt(clusters, query);
    const response = await this.client.chat({
      model: this.settings.mergeModel,
      messages: [
        {
          role: "system",
          content: "\u4F60\u662F\u4E00\u4E2A\u77E5\u8BC6\u6574\u7406\u4E13\u5BB6\u3002\u8BF7\u6839\u636E\u63D0\u4F9B\u7684\u6587\u6863\u7C07\uFF0C\u4E3A\u6BCF\u4E2A\u4E3B\u9898\u751F\u6210\u4E00\u4E2A\u77E5\u8BC6\u5355\u5143\u3002\u8F93\u51FA\u5FC5\u987B\u662F\u6709\u6548\u7684JSON\u6570\u7EC4\u683C\u5F0F\u3002"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 8e3,
      temperature: 0.2
    });
    this.cache.set(cacheKey, this.settings.mergeModel, response);
    const parsed = this.parseResponse(response);
    return this.parseKnowledgeUnits(parsed);
  }
  /**
   * Identify topics from documents
   */
  async identifyTopics(documents, query) {
    const topicsFromDocs = /* @__PURE__ */ new Set();
    for (const doc of documents) {
      if (doc.topics) {
        doc.topics.forEach((t) => topicsFromDocs.add(t));
      }
    }
    if (topicsFromDocs.size >= 3) {
      return [...topicsFromDocs].slice(0, 8);
    }
    const cacheKey = `topics:${query}:${documents.map((d) => d.id).join(",")}`;
    const cached = this.cache.get(cacheKey, this.settings.mergeModel);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
      }
    }
    const docSummaries = documents.map((d) => `- ${d.title}: ${d.summary || d.content.substring(0, 100)}`).join("\n");
    const response = await this.client.chat({
      model: this.settings.mergeModel,
      messages: [
        {
          role: "system",
          content: '\u5206\u6790\u6587\u6863\u96C6\u5408\uFF0C\u63D0\u53D63-8\u4E2A\u4E3B\u8981\u4E3B\u9898\u3002\u4EE5JSON\u6570\u7EC4\u683C\u5F0F\u8FD4\u56DE\uFF0C\u5982 ["\u4E3B\u98981", "\u4E3B\u98982"]'
        },
        {
          role: "user",
          content: `\u67E5\u8BE2\uFF1A${query}

\u6587\u6863\uFF1A
${docSummaries}`
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    });
    this.cache.set(cacheKey, this.settings.mergeModel, response);
    try {
      const topics = JSON.parse(response);
      if (Array.isArray(topics)) {
        return topics.slice(0, 8);
      }
    } catch {
    }
    return [...topicsFromDocs];
  }
  /**
   * Build a batch prompt for knowledge unit generation
   */
  buildBatchPrompt(clusters, query) {
    let prompt = `\u8BF7\u6839\u636E\u4EE5\u4E0B\u6587\u6863\u7C07\uFF0C\u4E3A\u6BCF\u4E2A\u4E3B\u9898\u751F\u6210\u4E00\u4E2A\u77E5\u8BC6\u5355\u5143\u3002

## \u67E5\u8BE2\uFF1A${query}

## \u6587\u6863\u7C07\u4FE1\u606F\uFF1A
`;
    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];
      prompt += `### \u4E3B\u9898 ${i + 1}\uFF1A${cluster.topic}
`;
      prompt += `\u6587\u6863\u6570\u91CF\uFF1A${cluster.documents.length}
`;
      prompt += `\u6587\u6863\u5217\u8868\uFF1A
`;
      for (const doc of cluster.documents) {
        const summary = doc.summary || doc.content.substring(0, 150);
        prompt += `- ${doc.title}: ${summary}
`;
      }
      prompt += "\n";
    }
    prompt += `## \u751F\u6210\u8981\u6C42\uFF1A
1. \u6BCF\u4E2A\u77E5\u8BC6\u5355\u5143\u5305\u542B\uFF1A\u4E3B\u9898\u540D\u79F0\u3001\u5408\u5E76\u6458\u8981\uFF08300-500\u5B57\uFF09\u30013-5\u4E2A\u5173\u952E\u70B9\u3001\u5EFA\u8BAE\u4F7F\u7528\u573A\u666F
2. \u6D88\u9664\u91CD\u590D\u5185\u5BB9\uFF0C\u4FDD\u7559\u6700\u51C6\u786E\u7248\u672C
3. \u8865\u5145\u7F3A\u5931\u7684\u903B\u8F91\u73AF\u8282

## \u8F93\u51FA\u683C\u5F0F\uFF1A
\u8BF7\u4EE5JSON\u6570\u7EC4\u683C\u5F0F\u8F93\u51FA\uFF1A
[
  {
    "topic": "\u4E3B\u9898\u540D\u79F0",
    "summary": "\u5408\u5E76\u6458\u8981",
    "keyPoints": ["\u5173\u952E\u70B91", "\u5173\u952E\u70B92"],
    "suggestedUsage": "\u5EFA\u8BAE\u4F7F\u7528\u573A\u666F"
  }
]`;
    return prompt;
  }
  /**
   * Parse response JSON from AI
   */
  parseResponse(response) {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed))
          return parsed;
      } catch {
      }
    }
    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed))
        return parsed;
    } catch {
    }
    return [];
  }
  /**
   * Convert parsed response to KnowledgeUnit objects
   */
  parseKnowledgeUnits(data) {
    return data.map((item, index) => {
      const obj = item;
      return {
        id: `ku-${Date.now()}-${index}`,
        topic: obj.topic || `\u4E3B\u9898 ${index + 1}`,
        summary: obj.summary || "",
        keyPoints: Array.isArray(obj.keyPoints) ? obj.keyPoints : [],
        sourceCount: 0,
        relevanceScore: 1 - index * 0.1,
        historyBoost: 0,
        suggestedUsage: obj.suggestedUsage || "",
        sourceDocuments: []
      };
    });
  }
  /**
   * Build a cache key from clusters and query
   */
  buildCacheKey(clusters, query) {
    const clusterIds = clusters.map((c) => c.documents.map((d) => d.id).sort().join(",")).sort().join("|");
    return `${query}::${clusterIds}`;
  }
};

// src/knowledge/generator.ts
var KnowledgeGenerator = class {
  constructor(vault, settings) {
    this.vault = vault;
    this.settings = settings;
    this.batchProcessor = new BatchProcessor(settings);
    this.clusterer = new DocumentClusterer();
    this.merger = new ContentMerger(this.batchProcessor);
  }
  updateSettings(settings) {
    this.settings = settings;
    this.batchProcessor.updateSettings(settings);
  }
  /**
   * Generate knowledge units from fused results
   */
  async generate(fusedResults, query, history = null) {
    if (fusedResults.length === 0)
      return [];
    const topResults = fusedResults.slice(0, 20);
    const documents = [];
    for (const result of topResults) {
      const file = this.vault.getAbstractFileByPath(result.path);
      if (file && "stat" in file) {
        const doc = await fileToDocument(file, this.vault);
        doc.topics = this.extractTopicsFromResult(result);
        documents.push(doc);
      }
    }
    const indexCards = await getIndexCards(this.vault);
    this.clusterer.setIndexCards(indexCards);
    let topics;
    try {
      if (this.settings.apiKey) {
        topics = await this.batchProcessor.identifyTopics(documents, query);
      } else {
        topics = this.extractTopicsLocally(documents);
      }
    } catch (error) {
      console.error("[RAG] Topic identification failed, using local fallback:", error);
      topics = this.extractTopicsLocally(documents);
    }
    if (topics.length === 0) {
      topics = [query];
    }
    const clusters = this.clusterer.cluster(documents, topics);
    let units;
    try {
      if (this.settings.apiKey) {
        units = await this.merger.merge(clusters, query);
      } else {
        units = this.merger.mergeLocally(clusters, query);
      }
    } catch (error) {
      console.error("[RAG] Knowledge unit generation failed, using local fallback:", error);
      units = this.merger.mergeLocally(clusters, query);
    }
    if (history) {
      units = this.applyHistoryBoost(units, history.topicPreferences);
    }
    return units;
  }
  /**
   * Extract topics from search result metadata
   */
  extractTopicsFromResult(result) {
    const topics = [];
    const titleWords = result.title.split(/[\s\-_]+/).filter((w) => w.length > 1);
    topics.push(...titleWords);
    return topics;
  }
  /**
   * Local topic extraction (without API)
   */
  extractTopicsLocally(documents) {
    const topicFreq = /* @__PURE__ */ new Map();
    for (const doc of documents) {
      const words = doc.title.split(/[\s\-_]+/).filter((w) => w.length > 1);
      for (const word of words) {
        topicFreq.set(word, (topicFreq.get(word) || 0) + 1);
      }
      if (doc.topics) {
        for (const topic of doc.topics) {
          topicFreq.set(topic, (topicFreq.get(topic) || 0) + 2);
        }
      }
    }
    return [...topicFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([topic]) => topic);
  }
  /**
   * Apply history-based boost to knowledge units
   */
  applyHistoryBoost(units, topicPreferences) {
    return units.map((unit) => {
      let boost = 0;
      const topicLower = unit.topic.toLowerCase();
      for (const [topic, preference] of Object.entries(topicPreferences)) {
        if (topicLower.includes(topic.toLowerCase())) {
          boost += preference * 0.15;
        }
      }
      return {
        ...unit,
        historyBoost: Math.min(boost, 0.3)
      };
    }).sort((a, b) => {
      const scoreA = a.relevanceScore + a.historyBoost;
      const scoreB = b.relevanceScore + b.historyBoost;
      return scoreB - scoreA;
    });
  }
};

// src/history/storage.ts
var DATA_VERSION = 1;
var DEFAULT_HISTORY = {
  queries: [],
  documentInteractions: [],
  topicPreferences: {},
  mergeCache: {}
};
var HistoryStorage = class {
  constructor(app, pluginDir) {
    this.app = app;
    this.pluginDir = pluginDir;
  }
  /**
   * Load history from disk
   */
  async load() {
    try {
      const adapter = this.app.vault.adapter;
      const dataPath = `${this.pluginDir}/data.json`;
      if (await adapter.exists(dataPath)) {
        const raw = await adapter.read(dataPath);
        const data = JSON.parse(raw);
        if (data.version !== DATA_VERSION) {
          return this.migrate(data);
        }
        return {
          queries: data.queries || [],
          documentInteractions: data.documentInteractions || [],
          topicPreferences: data.topicPreferences || {},
          mergeCache: data.mergeCache || {}
        };
      }
    } catch (error) {
      console.error("[RAG] Failed to load history:", error);
    }
    return { ...DEFAULT_HISTORY };
  }
  /**
   * Save history to disk
   */
  async save(history) {
    try {
      const adapter = this.app.vault.adapter;
      if (!await adapter.exists(this.pluginDir)) {
        await adapter.mkdir(this.pluginDir);
      }
      const data = {
        version: DATA_VERSION,
        ...history
      };
      await adapter.write(
        `${this.pluginDir}/data.json`,
        JSON.stringify(data, null, 2)
      );
    } catch (error) {
      console.error("[RAG] Failed to save history:", error);
      throw error;
    }
  }
  /**
   * Clean up old data based on retention policy
   */
  cleanup(history, retentionDays) {
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1e3;
    const cleanQueries = history.queries.filter((q) => q.timestamp > cutoff).slice(-100);
    const cleanInteractions = history.documentInteractions.filter((i) => i.timestamp > cutoff).slice(-500);
    const cleanMergeCache = {};
    let cacheCount = 0;
    const entries = Object.entries(history.mergeCache).sort((a, b) => b[1].timestamp - a[1].timestamp);
    for (const [key, entry] of entries) {
      if (cacheCount >= 100)
        break;
      if (entry.timestamp > cutoff) {
        cleanMergeCache[key] = entry;
        cacheCount++;
      }
    }
    return {
      queries: cleanQueries,
      documentInteractions: cleanInteractions,
      topicPreferences: history.topicPreferences,
      mergeCache: cleanMergeCache
    };
  }
  /**
   * Export history as JSON
   */
  async export(history) {
    return JSON.stringify({
      version: DATA_VERSION,
      exportDate: (/* @__PURE__ */ new Date()).toISOString(),
      ...history
    }, null, 2);
  }
  /**
   * Import history from JSON
   */
  async import(jsonString) {
    const data = JSON.parse(jsonString);
    return {
      queries: data.queries || [],
      documentInteractions: data.documentInteractions || [],
      topicPreferences: data.topicPreferences || {},
      mergeCache: data.mergeCache || {}
    };
  }
  /**
   * Migrate old data format
   */
  migrate(data) {
    console.log("[RAG] Migrating history data...");
    return { ...DEFAULT_HISTORY };
  }
};

// src/history/analyzer.ts
var HistoryAnalyzer = class {
  /**
   * Calculate topic preferences from query and interaction history
   */
  calculateTopicPreferences(history) {
    const topicScores = {};
    for (const query of history.queries) {
      const words = this.extractKeywords(query.text);
      for (const word of words) {
        topicScores[word] = (topicScores[word] || 0) + 1;
      }
    }
    for (const interaction of history.documentInteractions) {
      const words = this.extractKeywords(interaction.docId);
      const weight = interaction.action === "save" ? 3 : interaction.action === "copy" ? 2 : 1;
      for (const word of words) {
        topicScores[word] = (topicScores[word] || 0) + weight;
      }
    }
    const maxScore = Math.max(...Object.values(topicScores), 1);
    const normalized = {};
    for (const [topic, score] of Object.entries(topicScores)) {
      if (score >= 2) {
        normalized[topic] = score / maxScore;
      }
    }
    return normalized;
  }
  /**
   * Find related queries from history
   */
  findRelatedQueries(history, query, limit = 5) {
    const queryKeywords = this.extractKeywords(query);
    const scored = history.queries.map((record) => {
      const recordKeywords = this.extractKeywords(record.text);
      const overlap = queryKeywords.filter((k) => recordKeywords.includes(k)).length;
      const recency = 1 / (1 + (Date.now() - record.timestamp) / (24 * 60 * 60 * 1e3));
      return { record, score: overlap * recency };
    });
    return scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.record);
  }
  /**
   * Get frequently used documents
   */
  getFrequentDocuments(history, limit = 10) {
    const counts = {};
    for (const interaction of history.documentInteractions) {
      counts[interaction.docId] = (counts[interaction.docId] || 0) + 1;
    }
    return Object.entries(counts).map(([docId, count]) => ({ docId, count })).sort((a, b) => b.count - a.count).slice(0, limit);
  }
  /**
   * Extract keywords from text
   */
  extractKeywords(text) {
    return text.toLowerCase().replace(/[^\w\u4e00-\u9fff\s]/g, " ").split(/\s+/).filter((w) => w.length > 1);
  }
};

// src/history/manager.ts
var HistoryManager = class {
  constructor(app, pluginDir, retentionDays = 30) {
    this.app = app;
    this.pluginDir = pluginDir;
    this.retentionDays = retentionDays;
    this.storage = new HistoryStorage(app, pluginDir);
    this.analyzer = new HistoryAnalyzer();
    this.history = {
      queries: [],
      documentInteractions: [],
      topicPreferences: {},
      mergeCache: {}
    };
  }
  /**
   * Initialize and load history
   */
  async init() {
    this.history = await this.storage.load();
    this.history = this.storage.cleanup(this.history, this.retentionDays);
    this.history.topicPreferences = this.analyzer.calculateTopicPreferences(this.history);
    console.log(`[RAG] History loaded: ${this.history.queries.length} queries, ${this.history.documentInteractions.length} interactions`);
  }
  /**
   * Record a search query
   */
  async recordQuery(text, knowledgeUnits) {
    const record = {
      id: generateId(),
      text,
      timestamp: Date.now(),
      retrievedCount: knowledgeUnits.length,
      usedKnowledgeUnits: knowledgeUnits.map((u) => u.id)
    };
    this.history.queries.push(record);
    if (this.history.queries.length > 100) {
      this.history.queries = this.history.queries.slice(-100);
    }
    await this.save();
  }
  /**
   * Record a document interaction
   */
  async recordInteraction(docId, action, queryId) {
    const interaction = {
      docId,
      timestamp: Date.now(),
      action,
      queryId
    };
    this.history.documentInteractions.push(interaction);
    if (this.history.documentInteractions.length > 500) {
      this.history.documentInteractions = this.history.documentInteractions.slice(-500);
    }
    this.history.topicPreferences = this.analyzer.calculateTopicPreferences(this.history);
    await this.save();
  }
  /**
   * Get current history
   */
  getHistory() {
    return this.history;
  }
  /**
   * Get topic preferences
   */
  getTopicPreferences() {
    return this.history.topicPreferences;
  }
  /**
   * Get recent queries
   */
  getRecentQueries(limit = 20) {
    return this.history.queries.slice(-limit).reverse();
  }
  /**
   * Find related queries
   */
  findRelatedQueries(query, limit = 5) {
    return this.analyzer.findRelatedQueries(this.history, query, limit);
  }
  /**
   * Get merge cache entry
   */
  getMergeCache(key) {
    const entry = this.history.mergeCache[key];
    if (!entry)
      return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      delete this.history.mergeCache[key];
      return null;
    }
    return entry.synthesizedContent;
  }
  /**
   * Set merge cache entry
   */
  async setMergeCache(key, topic, content, sourceHashes) {
    this.history.mergeCache[key] = {
      topic,
      synthesizedContent: content,
      timestamp: Date.now(),
      sourceHashes,
      ttl: this.retentionDays * 24 * 60 * 60 * 1e3
    };
    const keys = Object.keys(this.history.mergeCache);
    if (keys.length > 100) {
      const sorted = keys.sort(
        (a, b) => this.history.mergeCache[a].timestamp - this.history.mergeCache[b].timestamp
      );
      for (const key2 of sorted.slice(0, keys.length - 100)) {
        delete this.history.mergeCache[key2];
      }
    }
    await this.save();
  }
  /**
   * Clear all history
   */
  async clearHistory() {
    this.history = {
      queries: [],
      documentInteractions: [],
      topicPreferences: {},
      mergeCache: {}
    };
    await this.save();
  }
  /**
   * Export history data
   */
  async exportData() {
    return this.storage.export(this.history);
  }
  /**
   * Import history data
   */
  async importData(json) {
    this.history = await this.storage.import(json);
    this.history.topicPreferences = this.analyzer.calculateTopicPreferences(this.history);
    await this.save();
  }
  /**
   * Save history to disk
   */
  async save() {
    try {
      await this.storage.save(this.history);
    } catch (error) {
      console.error("[RAG] Failed to save history:", error);
    }
  }
};

// src/retrieval/card-generator.ts
var import_obsidian3 = require("obsidian");
var INDEX_DIR = "00_INDEX/files";
async function sha1(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
var ENRICH_SYSTEM_PROMPT = `\u4F60\u662F\u77E5\u8BC6\u5E93\u7D22\u5F15\u4E13\u5BB6\u3002\u6839\u636E\u6587\u6863\u5361\u7247\u4FE1\u606F\uFF0C\u8865\u5145 5 \u4E2A\u8BED\u4E49\u5B57\u6BB5\u3002\u53EA\u8F93\u51FA\u5408\u6CD5 JSON\uFF0C\u4E0D\u8981\u5176\u4ED6\u5185\u5BB9\u3002

\u5B57\u6BB5\u8BF4\u660E\uFF1A
- topic_secondary: \u6D89\u53CA\u4F46\u975E\u6838\u5FC3\u7684\u5176\u4ED6\u4E3B\u9898\uFF0C0-3 \u4E2A
- question_types: \u9002\u7528\u95EE\u9898\u7C7B\u578B\uFF0C\u4ECE\u679A\u4E3E\u9009\u62E9 1-4 \u4E2A
  \u679A\u4E3E\uFF1Adefinition(\u5B9A\u4E49), explanation(\u539F\u7406\u89E3\u91CA), comparison(\u5BF9\u6BD4), procedure(\u6B65\u9AA4\u6D41\u7A0B), reference(\u516C\u5F0F\u6570\u636E\u53C2\u8003), troubleshooting(\u95EE\u9898\u6392\u67E5)
- best_for: \u4EC0\u4E48\u573A\u666F\u4F18\u5148\u63A8\u8350\u8FD9\u7BC7\uFF0C1-3 \u4E2A
- not_for: \u4EC0\u4E48\u573A\u666F\u4E0D\u63A8\u8350\u8FD9\u7BC7\uFF0C0-2 \u4E2A
- read_with: \u5EFA\u8BAE\u4E00\u8D77\u9605\u8BFB\u7684\u6587\u4EF6\u540D\uFF0C0-3 \u4E2A\uFF08\u53EA\u5199\u6587\u4EF6\u540D\uFF0C\u4E0D\u542B\u8DEF\u5F84\u548C .md \u540E\u7F00\uFF09

\u8F93\u51FA\u683C\u5F0F\uFF1A
{"topic_secondary":["\u6B21\u4E3B\u9898"],"question_types":["definition"],"best_for":["\u573A\u666F"],"not_for":[],"read_with":["\u6587\u4EF6\u540D"]}`;
var CardGenerator = class {
  constructor(vault) {
    this.vault = vault;
  }
  /**
   * Generate an index card for a single file (with hash check)
   */
  async generateCard(file, force = false) {
    const content = await this.vault.cachedRead(file);
    const newHash = await sha1(content);
    if (!force) {
      const cardPath2 = `${INDEX_DIR}/${file.basename}.md`;
      const existing2 = this.vault.getAbstractFileByPath(cardPath2);
      if (existing2 instanceof import_obsidian3.TFile) {
        const cardContent2 = await this.vault.cachedRead(existing2);
        const storedHash = this.extractHashFromFrontmatter(cardContent2);
        if (storedHash === newHash)
          return false;
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
      sourceHash: newHash
    });
    const cardPath = `${INDEX_DIR}/${file.basename}.md`;
    const dir = this.vault.getAbstractFileByPath(INDEX_DIR);
    if (!dir) {
      await this.vault.createFolder(INDEX_DIR);
    }
    const existing = this.vault.getAbstractFileByPath(cardPath);
    if (existing instanceof import_obsidian3.TFile) {
      await this.vault.modify(existing, cardContent);
    } else {
      await this.vault.create(cardPath, cardContent);
    }
    return true;
  }
  /**
   * Generate cards for all markdown files in the vault
   */
  async generateAll(force = false) {
    const files = this.vault.getMarkdownFiles();
    let count = 0;
    for (const file of files) {
      if (file.path.startsWith(INDEX_DIR))
        continue;
      try {
        const changed = await this.generateCard(file, force);
        if (changed)
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
  async deleteCard(fileName) {
    const cardPath = `${INDEX_DIR}/${fileName}.md`;
    const file = this.vault.getAbstractFileByPath(cardPath);
    if (file instanceof import_obsidian3.TFile) {
      await this.vault.delete(file);
    }
  }
  /**
   * Rename the index card when a file is renamed
   */
  async renameCard(oldName, newFile) {
    await this.deleteCard(oldName);
    await this.generateCard(newFile, true);
  }
  // ── LLM semantic enrichment ──────────────────────────────
  /**
   * Call LLM to fill topic_secondary, question_types, best_for, not_for, read_with
   * Reads all card files from 00_INDEX/files/, sends metadata to LLM, writes back updated cards.
   */
  async enrichCards(apiKey, apiBaseUrl, model) {
    if (!apiKey) {
      console.warn("[RAG] No API key configured, skipping card enrichment");
      return 0;
    }
    const cardFiles = this.getCardFiles();
    if (cardFiles.length === 0)
      return 0;
    const baseUrl = apiBaseUrl.replace(/\/$/, "");
    const batchSize = 5;
    let count = 0;
    for (let i = 0; i < cardFiles.length; i += batchSize) {
      const batch = cardFiles.slice(i, i + batchSize);
      try {
        const cardsData = [];
        for (const file of batch) {
          const content2 = await this.vault.cachedRead(file);
          const fm = this.parseFrontmatter(content2);
          const body = this.stripFrontmatter(content2);
          cardsData.push({
            index: cardsData.length + 1,
            title: fm.title || file.basename,
            domain: fm.domain || "",
            note_role: fm.note_role || "mixed",
            headings: this.extractHeadings(body).slice(0, 10),
            one_line_summary: fm.one_line_summary || "",
            retrieval_keywords: this.parseYamlList(fm.retrieval_keywords).slice(0, 5),
            tags: this.parseYamlList(fm.tags).slice(0, 5)
          });
        }
        const userMsg = cardsData.map((d) => JSON.stringify(d)).join("\n");
        const resp = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: ENRICH_SYSTEM_PROMPT },
              { role: "user", content: userMsg }
            ],
            max_tokens: 2e3,
            temperature: 0.1,
            response_format: { type: "json_object" }
          })
        });
        if (!resp.ok) {
          console.warn(`[RAG] Enrich batch failed: HTTP ${resp.status}`);
          continue;
        }
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content)
          continue;
        const results = JSON.parse(content);
        const items = Array.isArray(results) ? results : [results];
        for (let j = 0; j < items.length && j < batch.length; j++) {
          const item = items[j];
          const file = batch[j];
          const cardContent = await this.vault.cachedRead(file);
          const fm = this.parseFrontmatter(cardContent);
          const body = this.stripFrontmatter(cardContent);
          const title = this.extractTitle(body, file.basename);
          const readWith = item.read_with || [];
          const validatedReadWith = await this.validateLinks(readWith);
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
            sourceHash: fm.source_hash || ""
          }, {
            topicSecondary: item.topic_secondary || [],
            questionTypes: item.question_types || [],
            bestFor: item.best_for || [],
            notFor: item.not_for || [],
            readWith: validatedReadWith
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
  getCardFiles() {
    const dir = this.vault.getAbstractFileByPath(INDEX_DIR);
    if (!(dir instanceof import_obsidian3.TFolder))
      return [];
    return dir.children.filter((c) => c instanceof import_obsidian3.TFile && c.extension === "md");
  }
  parseYamlList(raw) {
    if (!raw)
      return [];
    if (raw.includes("\n")) {
      return raw.split("\n").filter((l) => l.trim()).map((l) => l.trim().replace(/^["']|["']$/g, ""));
    }
    return raw.split(",").filter((x) => x.trim()).map((x) => x.trim().replace(/^["']|["']$/g, ""));
  }
  // ── Link validation ──────────────────────────────────────
  async validateLinks(links) {
    const valid = [];
    for (const link of links) {
      const clean = link.replace(/\.md$/, "");
      const file = this.vault.getAbstractFileByPath(clean + ".md");
      if (file instanceof import_obsidian3.TFile) {
        valid.push(link);
        continue;
      }
      const resolved = this.vault.getAbstractFileByPath(link);
      if (resolved instanceof import_obsidian3.TFile) {
        valid.push(link);
      }
    }
    return valid;
  }
  // ── Parsing helpers ──────────────────────────────────────
  parseFrontmatter(content) {
    const fm = {};
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match)
      return fm;
    const lines = match[1].split("\n");
    let currentKey = null;
    let currentList = [];
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
  stripFrontmatter(content) {
    return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "");
  }
  extractTitle(body, fallback) {
    for (const line of body.split("\n")) {
      const match = line.trim().match(/^#\s+(.+)$/);
      if (match)
        return match[1].trim();
    }
    return fallback;
  }
  extractWikiLinks(content) {
    const links = [];
    const seen = /* @__PURE__ */ new Set();
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
  extractTags(content, fm) {
    const tags = [];
    if (fm.tags) {
      const tagList = fm.tags.split("\n").length > 1 ? fm.tags.split("\n") : fm.tags.split(",");
      for (const t of tagList) {
        const clean = t.trim().replace(/^["']|["']$/g, "").replace(/^-\s+/, "");
        if (clean)
          tags.push(clean);
      }
    }
    const inlineRegex = /(?:^|\s)#([一-鿿\w]{2,})/g;
    let match;
    while ((match = inlineRegex.exec(content)) !== null) {
      if (!tags.includes(match[1]))
        tags.push(match[1]);
    }
    return tags;
  }
  extractHeadings(body) {
    const headings = [];
    const regex = /^#{1,3}\s+(.+)$/gm;
    let match;
    while ((match = regex.exec(body)) !== null) {
      headings.push(match[1].trim());
    }
    return headings;
  }
  extractDomain(path) {
    const parts = path.split("/");
    return parts.length > 1 ? parts[0] : "";
  }
  extractOneLineSummary(body) {
    for (const line of body.split("\n")) {
      const stripped = line.trim();
      if (stripped && !stripped.startsWith("#")) {
        return stripped.substring(0, 150);
      }
    }
    return "";
  }
  extractKeywords(content, title) {
    const keywords = [];
    if (title)
      keywords.push(title.replace(/[#\-_]/g, " ").trim());
    const words = content.match(/[一-鿿]{2,}|[a-zA-Z]{3,}/g) || [];
    const freq = {};
    for (const w of words) {
      const lower = w.toLowerCase();
      freq[lower] = (freq[lower] || 0) + 1;
    }
    const titleLower = title.toLowerCase();
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    for (const [word, count] of sorted) {
      if (count < 3)
        break;
      if (!titleLower.includes(word) && word.length >= 2) {
        keywords.push(word);
      }
      if (keywords.length >= 8)
        break;
    }
    return keywords;
  }
  inferNoteRole(content) {
    const patterns = [
      ["howto", /(?:^|\n)##?\s*(?:步骤|操作|方法|如何|怎么|教程|Step)/i],
      ["reference", /(?:^|\n)##?\s*(?:参考|Ref|API|参数|配置|字段|属性)/i],
      ["concept", /(?:^|\n)##?\s*(?:原理|概念|理论|机制|定义|什么是)/i],
      ["project", /(?:^|\n)##?\s*(?:进度|计划|TODO|任务|里程碑)/i],
      ["moc", /(?:^|\n)##?\s*(?:目录|索引|导航|MOC|Map)/i]
    ];
    for (const [role, pattern] of patterns) {
      if (pattern.test(content))
        return role;
    }
    return "mixed";
  }
  extractHashFromFrontmatter(cardContent) {
    const match = cardContent.match(/source_hash:\s*"([a-f0-9]+)"/);
    return match ? match[1] : "";
  }
  // ── Build card file ──────────────────────────────────────
  buildCardFile(data, enriched) {
    const escape = (s) => s.replace(/"/g, '\\"').replace(/\n/g, " ");
    const lines = [
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
      `generated_at: "${(/* @__PURE__ */ new Date()).toISOString()}"`
    ];
    if (data.tags.length) {
      lines.push("tags:");
      for (const tag of data.tags.slice(0, 10))
        lines.push(`  - "${escape(tag)}"`);
    } else {
      lines.push("tags: []");
    }
    if (data.headings.length) {
      lines.push("headings:");
      for (const h of data.headings.slice(0, 20))
        lines.push(`  - "${escape(h)}"`);
    } else {
      lines.push("headings: []");
    }
    if (data.retrievalKeywords.length) {
      lines.push("retrieval_keywords:");
      for (const kw of data.retrievalKeywords.slice(0, 8))
        lines.push(`  - "${escape(kw)}"`);
    } else {
      lines.push("retrieval_keywords: []");
    }
    if (data.outlinks.length) {
      lines.push("outlinks:");
      for (const link of data.outlinks.slice(0, 20))
        lines.push(`  - "${escape(link)}"`);
    } else {
      lines.push("outlinks: []");
    }
    const ts = enriched?.topicSecondary || [];
    const qt = enriched?.questionTypes || [];
    const bf = enriched?.bestFor || [];
    const nf = enriched?.notFor || [];
    const rw = enriched?.readWith || [];
    if (ts.length) {
      lines.push("topic_secondary:");
      for (const t of ts)
        lines.push(`  - "${escape(t)}"`);
    } else {
      lines.push("topic_secondary: []");
    }
    if (qt.length) {
      lines.push("question_types:");
      for (const q of qt)
        lines.push(`  - "${escape(q)}"`);
    } else {
      lines.push("question_types: []");
    }
    if (bf.length) {
      lines.push("best_for:");
      for (const b of bf)
        lines.push(`  - "${escape(b)}"`);
    } else {
      lines.push("best_for: []");
    }
    if (nf.length) {
      lines.push("not_for:");
      for (const n of nf)
        lines.push(`  - "${escape(n)}"`);
    } else {
      lines.push("not_for: []");
    }
    if (rw.length) {
      lines.push("read_with:");
      for (const r of rw)
        lines.push(`  - "${escape(r)}"`);
    } else {
      lines.push("read_with: []");
    }
    const fm = lines.join("\n") + "\n";
    return `---
${fm}---

# ${data.title}

${data.oneLineSummary}`;
  }
};

// src/ui/main-view.ts
var import_obsidian4 = require("obsidian");
var VIEW_TYPE_RAG = "enhanced-rag-view";
var MainRAGView = class extends import_obsidian4.ItemView {
  constructor(leaf) {
    super(leaf);
    this.messages = [];
    this.threadEl = null;
    this.inputEl = null;
    this.statusEl = null;
    this.onSearch = null;
    this.onSelectResult = null;
    this.onSelectUnit = null;
  }
  getViewType() {
    return VIEW_TYPE_RAG;
  }
  getDisplayText() {
    return "Enhanced RAG";
  }
  getIcon() {
    return "brain";
  }
  async onOpen() {
    this.renderLayout();
    this.setStatus("\u5C31\u7EEA");
  }
  setOnSearch(callback) {
    this.onSearch = callback;
  }
  setOnSelectResult(callback) {
    this.onSelectResult = callback;
  }
  setOnSelectUnit(callback) {
    this.onSelectUnit = callback;
  }
  /**
   * Render the main layout: header + thread + composer
   */
  renderLayout() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("rag-chat-view");
    const header = contentEl.createDiv({ cls: "rag-chat-header" });
    header.createEl("h3", { text: "\u{1F4AC} Enhanced RAG" });
    this.statusEl = header.createDiv({ cls: "rag-chat-status" });
    const actions = header.createDiv({ cls: "rag-chat-actions" });
    this.makeBtn(actions, "\u{1F4AC} \u65B0\u4F1A\u8BDD", () => this.clearMessages());
    this.threadEl = contentEl.createDiv({ cls: "rag-chat-thread" });
    this.renderMessages();
    const composer = contentEl.createDiv({ cls: "rag-chat-composer" });
    this.inputEl = composer.createEl("textarea", {
      cls: "rag-chat-input",
      attr: { placeholder: "\u8F93\u5165\u95EE\u9898\uFF0CEnter \u53D1\u9001\uFF0CShift+Enter \u6362\u884C" }
    });
    this.inputEl.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        await this.sendMessage();
      }
    });
    const footer = composer.createDiv({ cls: "rag-chat-footer" });
    this.makeBtn(footer, "\u53D1\u9001", () => this.sendMessage()).addClass("rag-chat-send");
  }
  makeBtn(parent, text, onClick) {
    const btn = parent.createEl("button", { text, cls: "rag-chat-btn" });
    btn.addEventListener("click", onClick);
    return btn;
  }
  setStatus(text) {
    if (this.statusEl)
      this.statusEl.setText(text);
  }
  /**
   * Render all messages in the thread
   */
  renderMessages() {
    if (!this.threadEl)
      return;
    this.threadEl.empty();
    if (this.messages.length === 0) {
      this.threadEl.createDiv({
        cls: "rag-chat-empty",
        text: "\u8F93\u5165\u95EE\u9898\u5F00\u59CB\u5BF9\u8BDD\u3002\u57FA\u4E8E\u4F60\u7684\u7B14\u8BB0\u5E93\u68C0\u7D22\u5E76\u56DE\u7B54\u3002"
      });
      return;
    }
    for (const msg of this.messages) {
      const wrap = this.threadEl.createDiv({ cls: `rag-chat-message ${msg.role}` });
      if (msg.role === "assistant" && msg.sources?.length) {
        const sources = wrap.createDiv({ cls: "rag-chat-sources" });
        sources.createSpan({ text: "\u{1F4C4} \u6765\u6E90\uFF1A" });
        for (const src of msg.sources) {
          const link = sources.createEl("a", {
            text: src.title,
            cls: "rag-chat-source-link",
            attr: { title: src.path }
          });
          link.addEventListener("click", (e) => {
            e.preventDefault();
            this.openFile(src.path);
          });
          sources.createSpan({ text: " " });
        }
      }
      const bubble = wrap.createDiv({ cls: "rag-chat-bubble" });
      if (msg.streaming) {
        bubble.createSpan({ text: msg.content || "\u601D\u8003\u4E2D..." });
      } else {
        import_obsidian4.MarkdownRenderer.render(this.app, msg.content, bubble, "", this);
      }
    }
    this.threadEl.scrollTop = this.threadEl.scrollHeight;
  }
  async openFile(path) {
    if (this.app.vault.getAbstractFileByPath(path)) {
      await this.app.workspace.openLinkText(path, "", true);
    }
  }
  clearMessages() {
    this.messages = [];
    this.renderMessages();
  }
  /**
   * Send message: extract input, call search+LLM, stream response
   */
  async sendMessage() {
    if (!this.inputEl)
      return;
    const query = this.inputEl.value.trim();
    if (!query)
      return;
    if (!this.onSearch) {
      new import_obsidian4.Notice("\u641C\u7D22\u56DE\u8C03\u672A\u8BBE\u7F6E");
      return;
    }
    this.messages.push({ role: "user", content: query });
    this.inputEl.value = "";
    const assistantMsg = { role: "assistant", content: "", streaming: true };
    this.messages.push(assistantMsg);
    this.renderMessages();
    this.setStatus("\u6B63\u5728\u68C0\u7D22...");
    try {
      const result = await this.onSearch(query, (token) => {
        assistantMsg.content += token;
        assistantMsg.streaming = true;
        this.renderMessages();
      });
      assistantMsg.content = result.answer;
      assistantMsg.sources = result.sources;
      assistantMsg.streaming = false;
      this.setStatus(`\u68C0\u7D22\u5B8C\u6210\uFF0C\u5F15\u7528\u4E86 ${result.sources.length} \u4E2A\u6587\u4EF6`);
    } catch (e) {
      assistantMsg.content = `\u274C \u9519\u8BEF\uFF1A${e.message}`;
      assistantMsg.streaming = false;
      this.setStatus("\u67E5\u8BE2\u5931\u8D25");
    }
    this.renderMessages();
  }
  async onClose() {
  }
};

// src/ui/unit-view.ts
var import_obsidian5 = require("obsidian");
var VIEW_TYPE_RAG_UNIT = "enhanced-rag-unit-view";
var UnitDetailView = class extends import_obsidian5.ItemView {
  constructor(leaf) {
    super(leaf);
    this.unit = null;
  }
  getViewType() {
    return VIEW_TYPE_RAG_UNIT;
  }
  getDisplayText() {
    return this.unit ? `\u77E5\u8BC6\u5355\u5143: ${this.unit.topic}` : "\u77E5\u8BC6\u5355\u5143\u8BE6\u60C5";
  }
  getIcon() {
    return "book-open";
  }
  async onOpen() {
    this.render();
  }
  setUnit(unit) {
    this.unit = unit;
    this.render();
  }
  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("rag-unit-detail");
    if (!this.unit) {
      container.createEl("p", { text: "\u8BF7\u9009\u62E9\u4E00\u4E2A\u77E5\u8BC6\u5355\u5143\u67E5\u770B\u8BE6\u60C5" });
      return;
    }
    container.createEl("h2", { text: this.unit.topic });
    const meta = container.createDiv("rag-unit-detail-meta");
    meta.createEl("span", { text: `\u76F8\u5173\u6027: ${this.unit.relevanceScore.toFixed(2)}` });
    meta.createEl("span", { text: `\u6E90\u6587\u6863\u6570: ${this.unit.sourceCount}` });
    if (this.unit.historyBoost > 0) {
      meta.createEl("span", { text: `\u5386\u53F2\u52A0\u6210: +${this.unit.historyBoost.toFixed(2)}` });
    }
    container.createEl("h3", { text: "\u6458\u8981" });
    container.createEl("p", { text: this.unit.summary, cls: "rag-unit-detail-summary" });
    if (this.unit.keyPoints.length > 0) {
      container.createEl("h3", { text: "\u5173\u952E\u70B9" });
      const list = container.createEl("ul");
      for (const point of this.unit.keyPoints) {
        list.createEl("li", { text: point });
      }
    }
    if (this.unit.suggestedUsage) {
      container.createEl("h3", { text: "\u5EFA\u8BAE\u4F7F\u7528" });
      container.createEl("p", { text: this.unit.suggestedUsage });
    }
    if (this.unit.sourceDocuments.length > 0) {
      container.createEl("h3", { text: "\u6E90\u6587\u6863" });
      const list = container.createEl("ul", { cls: "rag-source-list" });
      for (const docId of this.unit.sourceDocuments) {
        const item = list.createEl("li");
        const link = item.createEl("a", { text: docId });
        link.href = "#";
        link.addEventListener("click", (e) => {
          e.preventDefault();
          const file = this.app.vault.getAbstractFileByPath(docId);
          if (file) {
            this.app.workspace.openLinkText(docId, "");
          }
        });
      }
    }
  }
};

// src/ui/history-view.ts
var import_obsidian6 = require("obsidian");
var VIEW_TYPE_RAG_HISTORY = "enhanced-rag-history-view";
var HistoryView = class extends import_obsidian6.ItemView {
  constructor(leaf) {
    super(leaf);
    this.queries = [];
    this.onSelectQuery = null;
  }
  getViewType() {
    return VIEW_TYPE_RAG_HISTORY;
  }
  getDisplayText() {
    return "\u67E5\u8BE2\u5386\u53F2";
  }
  getIcon() {
    return "history";
  }
  async onOpen() {
    this.render();
  }
  setQueries(queries) {
    this.queries = queries;
    this.render();
  }
  setOnSelectQuery(callback) {
    this.onSelectQuery = callback;
  }
  render() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("rag-history-view");
    container.createEl("h3", { text: "\u6700\u8FD1\u67E5\u8BE2" });
    if (this.queries.length === 0) {
      container.createEl("p", { text: "\u6682\u65E0\u67E5\u8BE2\u5386\u53F2", cls: "rag-history-empty" });
      return;
    }
    const list = container.createDiv("rag-history-list");
    for (const query of this.queries) {
      const item = list.createDiv("rag-history-item");
      const text = item.createDiv("rag-history-text");
      text.setText(query.text);
      const meta = item.createDiv("rag-history-meta");
      const date = new Date(query.timestamp);
      meta.setText(`${date.toLocaleDateString()} | ${query.retrievedCount} \u7ED3\u679C`);
      item.addEventListener("click", () => {
        if (this.onSelectQuery) {
          this.onSelectQuery(query.text);
        }
      });
    }
  }
};

// src/main.ts
var CHAT_SYSTEM_PROMPT = `\u4F60\u662F\u4E00\u4E2A\u57FA\u4E8E\u7528\u6237\u7B14\u8BB0\u5E93\u7684\u95EE\u7B54\u52A9\u624B\u3002

## \u89C4\u5219
1. \u53EA\u57FA\u4E8E\u63D0\u4F9B\u7684\u7B14\u8BB0\u5185\u5BB9\u56DE\u7B54\uFF0C\u4E0D\u8981\u7F16\u9020\u4FE1\u606F
2. \u5982\u679C\u7B14\u8BB0\u5185\u5BB9\u4E0D\u8DB3\u4EE5\u56DE\u7B54\u95EE\u9898\uFF0C\u660E\u786E\u8BF4\u660E\u54EA\u4E9B\u90E8\u5206\u7F3A\u4E4F\u4F9D\u636E
3. \u6BCF\u4E2A\u5173\u952E\u4E8B\u5B9E\u90FD\u8981\u6807\u6CE8\u6765\u6E90\u6587\u4EF6\u8DEF\u5F84
4. \u56DE\u7B54\u8981\u7B80\u6D01\u6709\u7528\uFF0C\u4E0D\u8981\u5197\u957F
5. \u5982\u679C\u627E\u5230\u591A\u4E2A\u76F8\u5173\u7B14\u8BB0\uFF0C\u7EFC\u5408\u6574\u7406\u800C\u975E\u7B80\u5355\u7F57\u5217

## \u6765\u6E90\u6807\u6CE8\u683C\u5F0F
\u5728\u6BCF\u4E2A\u5173\u952E\u4E8B\u5B9E\u540E\u7528\u4EE5\u4E0B\u683C\u5F0F\u6807\u6CE8\u6765\u6E90\uFF1A
> \u{1F4C4} \u6765\u6E90\uFF1A\`\u8DEF\u5F84/\u6587\u4EF6\u540D.md\`

## \u8F93\u51FA\u683C\u5F0F
\u7528 markdown \u683C\u5F0F\u8F93\u51FA\uFF0C\u7ED3\u6784\u6E05\u6670\u3002`;
function buildPipelinePrompt(query, ranked, cards, contentMap) {
  let prompt = `## \u7528\u6237\u95EE\u9898
${query}

## \u76F8\u5173\u7B14\u8BB0

`;
  for (let i = 0; i < Math.min(ranked.length, 10); i++) {
    const r = ranked[i];
    const tag = r.fromExpansion ? " [\u62D3\u5C55]" : "";
    prompt += `### [${i + 1}] ${r.title}${tag}
\u8DEF\u5F84\uFF1A\`${r.path}\`
`;
    if (r.fromExpansion) {
      const card = cards.get(r.docId) || r.card;
      if (card) {
        const summary = card.oneLineSummary;
        if (summary)
          prompt += `\u6458\u8981\uFF1A${summary.substring(0, 200)}
`;
        const kw = card.retrievalKeywords;
        if (kw?.length)
          prompt += `\u5173\u952E\u8BCD\uFF1A${kw.slice(0, 5).join(", ")}
`;
      }
    } else {
      const content = contentMap?.get(r.docId) || r.snippet;
      if (content)
        prompt += `\u5185\u5BB9\uFF1A${content.substring(0, 600)}
`;
    }
    prompt += "\n";
  }
  return prompt;
}
var EnhancedRAGPlugin = class extends import_obsidian7.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
    this.mainView = null;
  }
  async onload() {
    await this.loadSettings();
    const pluginDir = `${this.app.vault.configDir}/plugins/obsidian-enhanced-rag`;
    this.retrievalManager = new RetrievalManager(this.app.vault, this.settings);
    this.resultFusion = new ResultFusion();
    this.queryAnalyzer = new QueryAnalyzer();
    this.knowledgeGenerator = new KnowledgeGenerator(this.app.vault, this.settings);
    this.historyManager = new HistoryManager(this.app, pluginDir, this.settings.historyRetentionDays);
    this.cloudCache = new CloudCache(this.settings.cacheSize);
    this.cardGenerator = new CardGenerator(this.app.vault);
    this.registerView(VIEW_TYPE_RAG, (leaf) => {
      this.mainView = new MainRAGView(leaf);
      this.setupMainViewCallbacks();
      return this.mainView;
    });
    this.registerView(VIEW_TYPE_RAG_UNIT, (leaf) => new UnitDetailView(leaf));
    this.registerView(VIEW_TYPE_RAG_HISTORY, (leaf) => new HistoryView(leaf));
    this.addRibbonIcon("brain", "\u6253\u5F00 RAG \u641C\u7D22", () => this.activateView());
    this.addCommand({
      id: "open-rag-search",
      name: "\u6253\u5F00 RAG \u641C\u7D22",
      callback: () => this.activateView()
    });
    this.addCommand({
      id: "rag-search",
      name: "RAG \u641C\u7D22",
      callback: () => {
        this.activateView();
      }
    });
    this.addCommand({
      id: "rebuild-indexes",
      name: "\u91CD\u5EFA\u68C0\u7D22\u7D22\u5F15",
      callback: () => this.rebuildIndexes()
    });
    this.addCommand({
      id: "rebuild-index-cards",
      name: "\u91CD\u5EFA\u7D22\u5F15\u5361",
      callback: () => this.rebuildIndexCards()
    });
    this.addSettingTab(new RAGSettingTab(this.app, this));
    this.registerEvent(
      this.app.vault.on("modify", (file) => this.onFileModify(file))
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => this.onFileDelete(file))
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => this.onFileRename(file, oldPath))
    );
    await this.historyManager.init();
    this.retrievalManager.buildIndexes().catch((err) => {
      console.error("[RAG] Failed to build indexes:", err);
    });
    console.log("[RAG] Plugin loaded");
  }
  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG_UNIT);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG_HISTORY);
    console.log("[RAG] Plugin unloaded");
  }
  async loadSettings() {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.retrievalManager?.updateSettings(this.settings);
    this.knowledgeGenerator?.updateSettings(this.settings);
  }
  /**
   * Activate the main RAG view
   */
  async activateView() {
    const { workspace } = this.app;
    let leaf = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_RAG);
    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_RAG, active: true });
      }
    }
    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
  /**
   * Setup callbacks for the main view
   */
  setupMainViewCallbacks() {
    if (!this.mainView)
      return;
    this.mainView.setOnSearch(async (query, onToken) => {
      return await this.chatQuery(query, onToken);
    });
    this.mainView.setOnSelectResult((result) => {
      this.app.workspace.openLinkText(result.path, "");
      this.historyManager.recordInteraction(result.docId, "click");
    });
    this.mainView.setOnSelectUnit((unit) => {
      this.openUnitDetail(unit);
    });
  }
  /**
   * Chat query: pipeline retrieval → stream LLM answer
   */
  async chatQuery(query, onToken) {
    if (!this.settings.apiKey) {
      throw new Error("API key not configured. Please set it in plugin settings.");
    }
    const { ranked, cards } = await this.retrievalManager.pipelineSearch(query, 10);
    const topicPreferences = this.historyManager.getTopicPreferences();
    const boosted = this.resultFusion.applyHistoryBoost(ranked, topicPreferences);
    if (boosted.length === 0) {
      return { answer: "\u26A0\uFE0F \u672A\u627E\u5230\u76F8\u5173\u7B14\u8BB0\uFF0C\u8BF7\u5C1D\u8BD5\u4E0D\u540C\u7684\u5173\u952E\u8BCD\u3002", sources: [] };
    }
    const contentMap = /* @__PURE__ */ new Map();
    for (const article of boosted) {
      if (!article.fromExpansion) {
        const file = this.app.vault.getAbstractFileByPath(article.path);
        if (file && "stat" in file) {
          try {
            const content = await this.app.vault.cachedRead(file);
            contentMap.set(article.docId, content);
          } catch {
          }
        }
      }
    }
    const userPrompt = buildPipelinePrompt(query, boosted, cards, contentMap);
    const url = `${this.settings.apiBaseUrl}/chat/completions`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.settings.apiKey}`
      },
      body: JSON.stringify({
        model: this.settings.chatModel,
        messages: [
          { role: "system", content: CHAT_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4096,
        stream: true
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API error (${resp.status}): ${errText}`);
    }
    const reader = resp.body?.getReader();
    if (!reader)
      throw new Error("\u65E0\u6CD5\u8BFB\u53D6\u6D41\u5F0F\u54CD\u5E94");
    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done)
        break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: "))
          continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === "[DONE]")
          continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onToken(delta);
          }
        } catch {
        }
      }
    }
    const sourceMap = /* @__PURE__ */ new Map();
    for (const r of boosted.slice(0, 10)) {
      if (!sourceMap.has(r.path)) {
        sourceMap.set(r.path, { path: r.path, title: r.title });
      }
    }
    await this.historyManager.recordQuery(query, []);
    return { answer: fullContent, sources: Array.from(sourceMap.values()) };
  }
  // performSearch removed - chat UI now uses chatQuery directly
  /**
   * Open knowledge unit detail view
   */
  async openUnitDetail(unit) {
    const { workspace } = this.app;
    let leaf = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_RAG_UNIT);
    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: VIEW_TYPE_RAG_UNIT, active: true });
      }
    }
    if (leaf) {
      const view = leaf.view;
      if (view instanceof UnitDetailView) {
        view.setUnit(unit);
      }
      workspace.revealLeaf(leaf);
    }
  }
  /**
   * Rebuild all indexes
   */
  async rebuildIndexes() {
    new import_obsidian7.Notice("\u6B63\u5728\u91CD\u5EFA\u7D22\u5F15...");
    try {
      await this.retrievalManager.buildIndexes();
      new import_obsidian7.Notice("\u7D22\u5F15\u91CD\u5EFA\u5B8C\u6210");
    } catch (error) {
      console.error("[RAG] Index rebuild failed:", error);
      new import_obsidian7.Notice(`\u7D22\u5F15\u91CD\u5EFA\u5931\u8D25: ${error.message}`);
    }
  }
  /**
   * Rebuild all index cards
   */
  async rebuildIndexCards() {
    new import_obsidian7.Notice("\u6B63\u5728\u91CD\u5EFA\u7D22\u5F15\u5361...");
    try {
      const count = await this.cardGenerator.generateAll(true);
      new import_obsidian7.Notice(`\u7D22\u5F15\u5361\u91CD\u5EFA\u5B8C\u6210\uFF1A\u751F\u6210 ${count} \u5F20`);
    } catch (error) {
      console.error("[RAG] Index card rebuild failed:", error);
      new import_obsidian7.Notice(`\u7D22\u5F15\u5361\u91CD\u5EFA\u5931\u8D25: ${error.message}`);
    }
  }
  /**
   * Enrich index cards with LLM semantic fields
   */
  async enrichIndexCards() {
    new import_obsidian7.Notice("\u6B63\u5728\u8C03\u7528 LLM \u586B\u5145\u8BED\u4E49\u5B57\u6BB5...");
    try {
      const count = await this.cardGenerator.enrichCards(
        this.settings.apiKey,
        this.settings.apiBaseUrl,
        this.settings.enrichModel
      );
      new import_obsidian7.Notice(`LLM \u586B\u5145\u5B8C\u6210\uFF1A\u66F4\u65B0 ${count} \u5F20\u7D22\u5F15\u5361`);
    } catch (error) {
      console.error("[RAG] Card enrichment failed:", error);
      new import_obsidian7.Notice(`\u8BED\u4E49\u5B57\u6BB5\u586B\u5145\u5931\u8D25: ${error.message}`);
    }
  }
  /**
   * Clear all caches
   */
  async clearCache() {
    this.cloudCache.clear();
    new import_obsidian7.Notice("\u7F13\u5B58\u5DF2\u6E05\u9664");
  }
  /**
   * Clear all history
   */
  async clearHistory() {
    await this.historyManager.clearHistory();
    new import_obsidian7.Notice("\u5386\u53F2\u5DF2\u91CD\u7F6E");
  }
  /**
   * Handle file modifications for incremental indexing
   */
  async onFileModify(file) {
    if (file instanceof import_obsidian7.TFile && file.extension === "md") {
      if (file.path.startsWith("00_INDEX/"))
        return;
      await this.retrievalManager.updateDocument(file.path);
      if (this.settings.autoGenerateCards) {
        await this.cardGenerator.generateCard(file);
      }
    }
  }
  /**
   * Handle file deletion for index cleanup
   */
  async onFileDelete(file) {
    if (file instanceof import_obsidian7.TFile) {
      this.retrievalManager.removeDocument(file.path);
      if (file.extension === "md" && this.settings.autoGenerateCards) {
        await this.cardGenerator.deleteCard(file.basename);
      }
    }
  }
  /**
   * Handle file rename for index update
   */
  async onFileRename(file, oldPath) {
    if (file instanceof import_obsidian7.TFile && file.extension === "md") {
      if (file.path.startsWith("00_INDEX/"))
        return;
      this.retrievalManager.removeDocument(oldPath);
      await this.retrievalManager.updateDocument(file.path);
      if (this.settings.autoGenerateCards) {
        const oldName = oldPath.split("/").pop()?.replace(/\.md$/, "") || "";
        await this.cardGenerator.renameCard(oldName, file);
      }
    }
  }
};
