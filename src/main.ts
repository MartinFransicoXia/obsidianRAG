import { Plugin, WorkspaceLeaf, Notice, TFile, TAbstractFile } from "obsidian";
import { PluginSettings, DEFAULT_SETTINGS, QueryType, FusedResult, KnowledgeUnit, ChatSource, RankedArticle, IndexCard, PipelineResult } from "./types";
import { RAGSettingTab } from "./settings";
import { RetrievalManager } from "./retrieval/manager";
import { ResultFusion } from "./fusion/result-fusion";
import { QueryAnalyzer } from "./fusion/query-analyzer";
import { KnowledgeGenerator } from "./knowledge/generator";
import { HistoryManager } from "./history/manager";
import { CloudCache } from "./cloud/cache";
import { CardGenerator } from "./retrieval/card-generator";
import { MainRAGView, VIEW_TYPE_RAG } from "./ui/main-view";
import { UnitDetailView, VIEW_TYPE_RAG_UNIT } from "./ui/unit-view";
import { HistoryView, VIEW_TYPE_RAG_HISTORY } from "./ui/history-view";

const CHAT_SYSTEM_PROMPT = `你是一个基于用户笔记库的问答助手。

## 规则
1. 只基于提供的笔记内容回答，不要编造信息
2. 如果笔记内容不足以回答问题，明确说明哪些部分缺乏依据
3. 每个关键事实都要标注来源文件路径
4. 回答要简洁有用，不要冗长
5. 如果找到多个相关笔记，综合整理而非简单罗列

## 来源标注格式
在每个关键事实后用以下格式标注来源：
> 📄 来源：\`路径/文件名.md\`

## 输出格式
用 markdown 格式输出，结构清晰。`;

function buildPipelinePrompt(
  query: string,
  ranked: RankedArticle[],
  cards: Map<string, IndexCard>,
  contentMap?: Map<string, string>,
  knowledgeUnits?: KnowledgeUnit[]
): string {
  let prompt = `## 用户问题\n${query}\n\n`;

  // Include knowledge units if available
  if (knowledgeUnits?.length) {
    prompt += `## 知识单元整理\n`;
    for (let i = 0; i < Math.min(knowledgeUnits.length, 5); i++) {
      const ku = knowledgeUnits[i];
      prompt += `### ${ku.topic}\n${ku.summary}\n`;
      if (ku.keyPoints?.length) {
        prompt += ku.keyPoints.map(p => `- ${p}`).join("\n") + "\n";
      }
      prompt += "\n";
    }
    prompt += "---\n\n";
  }

  prompt += `## 相关笔记\n\n`;
  for (let i = 0; i < Math.min(ranked.length, 10); i++) {
    const r = ranked[i];
    const tag = r.fromExpansion ? " [拓展]" : "";
    prompt += `### [${i + 1}] ${r.title}${tag}\n路径：\`${r.path}\`\n`;

    // Full content for all articles (atomic notes are small)
    const content = contentMap?.get(r.docId) || r.snippet;
    if (content) prompt += `内容：${content}\n`;
    prompt += "\n";
  }
  return prompt;
}

/**
 * Enhanced RAG Plugin for Obsidian
 * Pipeline: BM25 + vector chunk retrieval → Wiki Link expansion → index card boosted ranking → LLM streaming Q&A
 */
export default class EnhancedRAGPlugin extends Plugin {
  settings: PluginSettings = { ...DEFAULT_SETTINGS };

  private retrievalManager!: RetrievalManager;
  private resultFusion!: ResultFusion;
  private queryAnalyzer!: QueryAnalyzer;
  private knowledgeGenerator!: KnowledgeGenerator;
  private historyManager!: HistoryManager;
  private cloudCache!: CloudCache;
  private cardGenerator!: CardGenerator;

  private mainView: MainRAGView | null = null;

  async onload(): Promise<void> {
    await this.loadSettings();

    // Initialize managers
    const pluginDir = `${this.app.vault.configDir}/plugins/obsidian-enhanced-rag`;
    this.retrievalManager = new RetrievalManager(this.app.vault, this.settings);
    this.resultFusion = new ResultFusion();
    this.queryAnalyzer = new QueryAnalyzer();
    this.knowledgeGenerator = new KnowledgeGenerator(this.app.vault, this.settings);
    this.historyManager = new HistoryManager(this.app, pluginDir, this.settings.historyRetentionDays);
    this.cloudCache = new CloudCache(this.settings.cacheSize);
    this.cardGenerator = new CardGenerator(this.app.vault);

    // Wire knowledge generator into retrieval manager
    this.retrievalManager.setKnowledgeGenerator(this.knowledgeGenerator);

    // Register views
    this.registerView(VIEW_TYPE_RAG, (leaf) => {
      this.mainView = new MainRAGView(leaf);
      this.setupMainViewCallbacks();
      return this.mainView;
    });

    this.registerView(VIEW_TYPE_RAG_UNIT, (leaf) => new UnitDetailView(leaf));
    this.registerView(VIEW_TYPE_RAG_HISTORY, (leaf) => new HistoryView(leaf));

    // Add ribbon icon to open RAG view
    this.addRibbonIcon("brain", "打开 RAG 搜索", () => this.activateView());

    // Add commands
    this.addCommand({
      id: "open-rag-search",
      name: "打开 RAG 搜索",
      callback: () => this.activateView()
    });

    this.addCommand({
      id: "rag-search",
      name: "RAG 搜索",
      callback: () => {
        this.activateView();
      }
    });

    this.addCommand({
      id: "rebuild-indexes",
      name: "重建检索索引",
      callback: () => this.rebuildIndexes()
    });

    this.addCommand({
      id: "rebuild-index-cards",
      name: "重建索引卡",
      callback: () => this.rebuildIndexCards()
    });

    // Add settings tab
    this.addSettingTab(new RAGSettingTab(this.app, this));

    // Register file events for incremental indexing
    this.registerEvent(
      this.app.vault.on("modify", (file) => this.onFileModify(file))
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => this.onFileDelete(file))
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => this.onFileRename(file, oldPath))
    );

    // Initialize history
    await this.historyManager.init();

    // Build indexes in background
    this.retrievalManager.buildIndexes().catch(err => {
      console.error("[RAG] Failed to build indexes:", err);
    });

    console.log("[RAG] Plugin loaded");
  }

  async onunload(): Promise<void> {
    // Clean up views
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG_UNIT);
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG_HISTORY);
    console.log("[RAG] Plugin unloaded");
  }

  async loadSettings(): Promise<void> {
    const data = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    // Update managers with new settings
    this.retrievalManager?.updateSettings(this.settings);
    this.knowledgeGenerator?.updateSettings(this.settings);
  }

  /**
   * Activate the main RAG view
   */
  async activateView(): Promise<void> {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
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
  private setupMainViewCallbacks(): void {
    if (!this.mainView) return;

    this.mainView.setOnSearch(async (query: string, onToken: (token: string) => void) => {
      return await this.chatQuery(query, onToken);
    });

    this.mainView.setOnSelectResult((result: FusedResult | RankedArticle) => {
      this.app.workspace.openLinkText(result.path, "");
      this.historyManager.recordInteraction(result.docId, "click");
    });

    this.mainView.setOnSelectUnit((unit: KnowledgeUnit) => {
      this.openUnitDetail(unit);
    });
  }

  /**
   * Chat query: pipeline retrieval → stream LLM answer
   */
  async chatQuery(query: string, onToken: (token: string) => void): Promise<{ answer: string; sources: ChatSource[] }> {
    if (!this.settings.apiKey) {
      throw new Error("API key not configured. Please set it in plugin settings.");
    }

    // Execute pipeline search
    const { ranked, cards } = await this.retrievalManager.pipelineSearch(query, 10);

    // Apply history boost
    const topicPreferences = this.historyManager.getTopicPreferences();
    const boosted = this.resultFusion.applyHistoryBoost(ranked, topicPreferences);

    if (boosted.length === 0) {
      return { answer: "⚠️ 未找到相关笔记，请尝试不同的关键词。", sources: [] };
    }

    // Build content map — full content for all articles (atomic notes are small)
    const contentMap = new Map<string, string>();
    for (const article of boosted) {
      const file = this.app.vault.getAbstractFileByPath(article.path);
      if (file && "stat" in file) {
        try {
          const content = await this.app.vault.cachedRead(file as import("obsidian").TFile);
          contentMap.set(article.docId, content);
        } catch {
          // use snippet as fallback
        }
      }
    }

    // ── Generate knowledge units (cluster + merge by topic) ──
    let knowledgeUnits: KnowledgeUnit[] = [];
    if (this.settings.showKnowledgeUnits) {
      try {
        const fusedResults = boosted.map(r => ({
          docId: r.docId,
          title: r.title,
          path: r.path,
          finalScore: r.finalScore,
          scoreBreakdown: { keywordScore: 0, indexScore: 0, vectorScore: 0 },
          snippet: r.snippet,
        }));
        const history = this.historyManager.getHistory();
        knowledgeUnits = await this.knowledgeGenerator.generate(fusedResults, query, history);
      } catch (e) {
        console.warn("[RAG] Knowledge unit generation failed:", e);
      }
    }

    // Build prompt
    const userPrompt = buildPipelinePrompt(query, boosted, cards, contentMap, knowledgeUnits);

    // Stream from API
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
    if (!reader) throw new Error("无法读取流式响应");

    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const jsonStr = trimmed.slice(6);
        if (jsonStr === "[DONE]") continue;

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            onToken(delta);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    // Build sources list
    const sourceMap = new Map<string, ChatSource>();
    for (const r of boosted.slice(0, 10)) {
      if (!sourceMap.has(r.path)) {
        sourceMap.set(r.path, { path: r.path, title: r.title });
      }
    }

    // Record in history
    await this.historyManager.recordQuery(query, []);

    return { answer: fullContent, sources: Array.from(sourceMap.values()) };
  }

  // performSearch removed - chat UI now uses chatQuery directly

  /**
   * Open knowledge unit detail view
   */
  private async openUnitDetail(unit: KnowledgeUnit): Promise<void> {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
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
  async rebuildIndexes(): Promise<void> {
    const notice = new Notice("正在重建索引...", 0);
    try {
      await this.retrievalManager.buildIndexes((stage, current, total) => {
        notice.setMessage(`索引: ${stage} (${current}/${total})`);
      });
      notice.setMessage("索引重建完成");
      setTimeout(() => notice.hide(), 5000);
    } catch (error) {
      console.error("[RAG] Index rebuild failed:", error);
      notice.setMessage(`索引重建失败: ${(error as Error).message}`);
      setTimeout(() => notice.hide(), 8000);
    }
  }

  /**
   * Rebuild all index cards
   */
  async rebuildIndexCards(): Promise<void> {
    new Notice("正在重建索引卡...");
    try {
      const count = await this.cardGenerator.generateAll(true);
      new Notice(`索引卡重建完成：生成 ${count} 张`);
    } catch (error) {
      console.error("[RAG] Index card rebuild failed:", error);
      new Notice(`索引卡重建失败: ${(error as Error).message}`);
    }
  }

  /**
   * Enrich index cards with LLM semantic fields
   */
  async enrichIndexCards(): Promise<void> {
    const notice = new Notice("正在调用 LLM 填充语义字段...", 0);
    try {
      const count = await this.cardGenerator.enrichCards(
        this.settings.apiKey,
        this.settings.apiBaseUrl,
        this.settings.enrichModel,
        (current, total, stage) => {
          notice.setMessage(`LLM 填充: ${stage}`);
        },
      );
      notice.setMessage(`LLM 填充完成：更新 ${count} 张索引卡`);
      setTimeout(() => notice.hide(), 5000);
    } catch (error) {
      console.error("[RAG] Card enrichment failed:", error);
      notice.setMessage(`语义字段填充失败: ${(error as Error).message}`);
      setTimeout(() => notice.hide(), 8000);
    }
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    this.cloudCache.clear();
    new Notice("缓存已清除");
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    await this.historyManager.clearHistory();
    new Notice("历史已重置");
  }

  /**
   * Handle file modifications for incremental indexing
   */
  private async onFileModify(file: TAbstractFile): Promise<void> {
    if (file instanceof TFile && file.extension === "md") {
      // Skip index card files themselves
      if (file.path.startsWith("00_INDEX/")) return;
      await this.retrievalManager.updateDocument(file.path);
      if (this.settings.autoGenerateCards) {
        await this.cardGenerator.generateCard(file);
      }
    }
  }

  /**
   * Handle file deletion for index cleanup
   */
  private async onFileDelete(file: TAbstractFile): Promise<void> {
    if (file instanceof TFile) {
      this.retrievalManager.removeDocument(file.path);
      if (file.extension === "md" && this.settings.autoGenerateCards) {
        await this.cardGenerator.deleteCard(file.basename);
      }
    }
  }

  /**
   * Handle file rename for index update
   */
  private async onFileRename(file: TAbstractFile, oldPath: string): Promise<void> {
    if (file instanceof TFile && file.extension === "md") {
      if (file.path.startsWith("00_INDEX/")) return;
      this.retrievalManager.removeDocument(oldPath);
      await this.retrievalManager.updateDocument(file.path);
      if (this.settings.autoGenerateCards) {
        const oldName = oldPath.split("/").pop()?.replace(/\.md$/, "") || "";
        await this.cardGenerator.renameCard(oldName, file);
      }
    }
  }
}
