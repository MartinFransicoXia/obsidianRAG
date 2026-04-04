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

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => ObsidianRAGPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var VIEW_TYPE_RAG = "obsidian-rag-view";
var DEFAULT_SETTINGS = {
  backendUrl: "http://127.0.0.1:8765",
  chatProvider: "ollama",
  chatApiBaseUrl: "",
  chatApiKey: "",
  chatModel: "qwen3-vl:30b",
  enableThinking: false,
  embeddingProvider: "vllm",
  embeddingApiBaseUrl: "http://127.0.0.1:8001/v1",
  embeddingApiKey: "",
  embeddingModel: "Qwen/Qwen3-Embedding-8B",
  embeddingDimensions: 0,
  embeddingEncodingFormat: "float",
  embeddingBatchEnabled: false,
  embeddingBatchApiBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  embeddingBatchApiKey: "",
  embeddingBatchCompletionWindow: "24h",
  embeddingBatchPollSeconds: 30,
  batchOutputDir: ".obsidian/plugins/obsidianRAG/data/batch",
  batchDeleteRemoteFilesAfterDownload: false,
  batchEnableCallback: false,
  batchCallbackUrl: "",
  rerankProvider: "vllm",
  rerankApiBaseUrl: "http://127.0.0.1:8002",
  rerankApiKey: "",
  rerankModel: "Qwen/Qwen3-Reranker-4B",
  rerankTopN: 10,
  rerankInstruction: "Given a user question, retrieve relevant notes that help answer it.",
  rerankReturnDocuments: true,
  rerankTimeoutSeconds: 60,
  similarityThreshold: 0.72,
  maxResults: 8,
  retrievalLimit: 30,
  rerankCandidates: 15,
  finalNoteCount: 5,
  chunkTargetTokens: 420,
  chunkOverlapTokens: 64,
  chunkMaxTokens: 520,
  neighborWindow: 1,
  groupMergeMaxGap: 1,
  finalGroupCountCap: 8,
  finalContextTokenBudget: 4800,
  enableTemporalExpansion: true,
  temporalWindowDays: 2,
  enableSecondPassEntityExpansion: false,
  enableQueryRewrite: false,
  indexingMode: "realtime",
  autoOpenOnLoad: true
};
var REBUILD_REASON_LABELS = {
  index_empty: "\u5F53\u524D\u7D22\u5F15\u4E3A\u7A7A",
  manifest_missing: "\u7F3A\u5C11\u7D22\u5F15\u5143\u6570\u636E",
  source_files_changed: "\u7B14\u8BB0\u6587\u4EF6\u6216\u7D22\u5F15\u7B7E\u540D\u5DF2\u53D8\u5316",
  embedding_provider_changed: "Embedding provider \u5DF2\u53D8\u5316",
  embedding_model_changed: "Embedding \u6A21\u578B\u5DF2\u53D8\u5316",
  embedding_dimensions_changed: "Embedding \u7EF4\u5EA6\u5DF2\u53D8\u5316",
  embedding_encoding_format_changed: "Embedding \u7F16\u7801\u683C\u5F0F\u5DF2\u53D8\u5316",
  chunk_target_tokens_changed: "\u5207\u7247\u76EE\u6807 token \u5DF2\u53D8\u5316",
  chunk_overlap_tokens_changed: "\u5207\u7247 overlap \u5DF2\u53D8\u5316",
  chunk_max_tokens_changed: "\u5207\u7247\u6700\u5927 token \u5DF2\u53D8\u5316",
  prefix_rule_version_changed: "Prefix \u89C4\u5219\u7248\u672C\u5DF2\u53D8\u5316",
  index_version_changed: "\u7D22\u5F15\u7248\u672C\u5DF2\u53D8\u5316"
};
function formatRebuildReasons(reasons) {
  if (!reasons?.length) return "";
  return reasons.map((reason) => REBUILD_REASON_LABELS[reason] ?? reason).join("\u3001");
}
function normalizeSettings(data) {
  const raw = data ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    chatProvider: raw.chatProvider ?? raw.llmProvider ?? DEFAULT_SETTINGS.chatProvider,
    chatApiBaseUrl: raw.chatApiBaseUrl ?? raw.apiBaseUrl ?? DEFAULT_SETTINGS.chatApiBaseUrl,
    chatApiKey: raw.chatApiKey ?? raw.apiKey ?? DEFAULT_SETTINGS.chatApiKey,
    chatModel: raw.chatModel ?? DEFAULT_SETTINGS.chatModel,
    enableThinking: raw.enableThinking ?? DEFAULT_SETTINGS.enableThinking,
    similarityThreshold: raw.similarityThreshold ?? DEFAULT_SETTINGS.similarityThreshold,
    maxResults: raw.maxResults ?? DEFAULT_SETTINGS.maxResults,
    autoOpenOnLoad: raw.autoOpenOnLoad ?? DEFAULT_SETTINGS.autoOpenOnLoad
  };
}
var ObsidianRAGPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.currentSessionId = null;
  }
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_RAG, (leaf) => new ObsidianRAGView(leaf, this));
    this.addRibbonIcon("messages-square", "\u6253\u5F00 obsidianRAG", async () => this.activateView());
    this.addCommand({ id: "open-chat", name: "\u6253\u5F00\u804A\u5929\u9762\u677F", callback: async () => this.activateView() });
    this.addCommand({ id: "rebuild-index", name: "\u91CD\u5EFA\u77E5\u8BC6\u5E93\u7D22\u5F15", callback: async () => (await this.activateView()).rebuildIndex() });
    this.addCommand({ id: "end-chat-session", name: "\u7ED3\u675F\u5F53\u524D\u4F1A\u8BDD", callback: async () => (await this.activateView()).endSession() });
    this.addSettingTab(new ObsidianRAGSettingTab(this.app, this));
    if (this.settings.autoOpenOnLoad) void this.activateView();
  }
  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG);
  }
  async loadSettings() {
    this.settings = normalizeSettings(await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  getVaultPath() {
    const a = this.app.vault.adapter;
    if (!(a instanceof import_obsidian.FileSystemAdapter)) throw new Error("obsidianRAG \u4EC5\u652F\u6301\u684C\u9762\u7AEF\u6587\u4EF6\u7CFB\u7EDF\u9002\u914D\u5668\u3002");
    return a.getBasePath();
  }
  getChatPayload() {
    const s = this.settings;
    return { provider: s.chatProvider, api_base: s.chatApiBaseUrl.trim(), api_key: s.chatApiKey.trim(), model: s.chatModel.trim(), enable_thinking: s.enableThinking };
  }
  getEmbeddingPayload() {
    const s = this.settings;
    return { provider: s.embeddingProvider, api_base: s.embeddingApiBaseUrl.trim(), api_key: s.embeddingApiKey.trim(), model: s.embeddingModel.trim(), dimensions: s.embeddingDimensions, encoding_format: s.embeddingEncodingFormat.trim() || "float" };
  }
  getBatchPayload() {
    const s = this.settings;
    return { enabled: s.embeddingBatchEnabled, api_base: s.embeddingBatchApiBaseUrl.trim(), api_key: s.embeddingBatchApiKey.trim(), completion_window: s.embeddingBatchCompletionWindow.trim(), poll_interval_seconds: s.embeddingBatchPollSeconds, output_dir: s.batchOutputDir.trim(), delete_remote_files_after_download: s.batchDeleteRemoteFilesAfterDownload, enable_callback: s.batchEnableCallback, callback_url: s.batchCallbackUrl.trim() };
  }
  getRerankPayload() {
    const s = this.settings;
    return { provider: s.rerankProvider, api_base: s.rerankApiBaseUrl.trim(), api_key: s.rerankApiKey.trim(), model: s.rerankModel.trim(), top_n: s.rerankTopN, instruct: s.rerankInstruction.trim(), return_documents: s.rerankReturnDocuments, timeout_seconds: s.rerankTimeoutSeconds };
  }
  getRetrievalPayload() {
    const s = this.settings;
    return { similarity_threshold: s.similarityThreshold, max_results: s.maxResults, retrieval_limit: s.retrievalLimit, rerank_candidates: s.rerankCandidates, final_note_count: s.finalNoteCount, chunk_target_tokens: s.chunkTargetTokens, chunk_overlap_tokens: s.chunkOverlapTokens, chunk_max_tokens: s.chunkMaxTokens, neighbor_window: s.neighborWindow, same_note_group_merge_gap: s.groupMergeMaxGap, final_group_count_cap: s.finalGroupCountCap, final_context_token_budget: s.finalContextTokenBudget, enable_temporal_expansion: s.enableTemporalExpansion, temporal_window_days: s.temporalWindowDays, enable_second_pass_entity_expansion: s.enableSecondPassEntityExpansion, enable_query_rewrite: s.enableQueryRewrite, indexing_mode: s.indexingMode };
  }
  getStatusPayload() {
    return { vault_path: this.getVaultPath(), chat: this.getChatPayload(), embedding: this.getEmbeddingPayload(), batch: this.getBatchPayload(), rerank: this.getRerankPayload(), retrieval: this.getRetrievalPayload() };
  }
  getBuildIndexPayload() {
    return { vault_path: this.getVaultPath(), embedding: this.getEmbeddingPayload(), batch: this.getBatchPayload(), retrieval: this.getRetrievalPayload() };
  }
  getBuildIndexStatusPayload(jobId) {
    return { vault_path: this.getVaultPath(), job_id: jobId ?? void 0, embedding: this.getEmbeddingPayload(), batch: this.getBatchPayload(), retrieval: this.getRetrievalPayload() };
  }
  getChatRequestPayload(query) {
    return { vault_path: this.getVaultPath(), query, chat: this.getChatPayload(), embedding: this.getEmbeddingPayload(), rerank: this.getRerankPayload(), retrieval: this.getRetrievalPayload() };
  }
  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_RAG)[0];
    if (!leaf) {
      const rightLeaf = this.app.workspace.getRightLeaf(false);
      if (!rightLeaf) throw new Error("\u65E0\u6CD5\u521B\u5EFA obsidianRAG \u4FA7\u8FB9\u680F\u89C6\u56FE\u3002");
      leaf = rightLeaf;
      await leaf.setViewState({ type: VIEW_TYPE_RAG, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    return leaf.view;
  }
  async api(path, body) {
    const r = await fetch(`${this.settings.backendUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text() || `HTTP ${r.status}`);
    return await r.json();
  }
  async stream(path, body, onEvent) {
    const r = await fetch(`${this.settings.backendUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text() || `HTTP ${r.status}`);
    if (!r.body) throw new Error("\u6D41\u5F0F\u54CD\u5E94\u4E0D\u53EF\u7528\u3002");
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (t) onEvent(JSON.parse(t));
      }
      if (done) break;
    }
    const trailing = buffer.trim();
    if (trailing) onEvent(JSON.parse(trailing));
  }
};
var ObsidianRAGView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.messages = [];
    this.renderScheduled = false;
    this.batchJobId = null;
    this.batchPollTimer = null;
    this.plugin = plugin;
  }
  getViewType() {
    return VIEW_TYPE_RAG;
  }
  getDisplayText() {
    return "obsidianRAG";
  }
  getIcon() {
    return "messages-square";
  }
  async onOpen() {
    this.renderLayout();
    await this.refreshStatus();
  }
  renderLayout() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("obsidian-rag-view");
    const header = contentEl.createDiv({ cls: "obsidian-rag-header" });
    const heading = header.createDiv();
    heading.createDiv({ cls: "obsidian-rag-title", text: "obsidianRAG" });
    this.statusEl = heading.createDiv({ cls: "obsidian-rag-status", text: "\u6B63\u5728\u8FDE\u63A5\u540E\u7AEF..." });
    const actions = header.createDiv({ cls: "obsidian-rag-actions" });
    this.makeButton(actions, "\u91CD\u5EFA\u7D22\u5F15", async () => this.rebuildIndex());
    this.makeButton(actions, "\u53D6\u6D88\u7D22\u5F15", async () => this.cancelIndexBuild());
    this.makeButton(actions, "\u65B0\u4F1A\u8BDD", async () => this.newSession());
    this.makeButton(actions, "\u7ED3\u675F\u4F1A\u8BDD", async () => this.endSession());
    this.threadEl = contentEl.createDiv({ cls: "obsidian-rag-thread" });
    this.renderMessages();
    const composer = contentEl.createDiv({ cls: "obsidian-rag-composer" });
    this.inputEl = composer.createEl("textarea", { cls: "obsidian-rag-input", attr: { placeholder: "\u8F93\u5165\u95EE\u9898\uFF0CEnter \u53D1\u9001\uFF0CShift+Enter \u6362\u884C" } });
    this.inputEl.addEventListener("keydown", async (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        await this.sendMessage();
      }
    });
    const footer = composer.createDiv({ cls: "obsidian-rag-footer" });
    footer.createDiv({ cls: "obsidian-rag-hint", text: "\u6BCF\u8F6E\u95EE\u7B54\u90FD\u4F1A\u57FA\u4E8E\u5F53\u524D\u7D22\u5F15\u91CD\u65B0\u68C0\u7D22\u4F60\u7684 Obsidian \u7B14\u8BB0\u3002" });
    this.makeButton(footer, "\u53D1\u9001", async () => this.sendMessage());
  }
  makeButton(c, label, onClick) {
    const b = c.createEl("button", { cls: "obsidian-rag-button", text: label });
    b.addEventListener("click", () => void onClick());
    return b;
  }
  async copyToClipboard(text) {
    const t = text.trim();
    if (!t) return new import_obsidian.Notice("\u6CA1\u6709\u53EF\u590D\u5236\u7684\u5185\u5BB9", 2e3);
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(t);
    const h = document.createElement("textarea");
    h.value = t;
    h.style.position = "fixed";
    h.style.opacity = "0";
    document.body.appendChild(h);
    h.focus();
    h.select();
    document.execCommand("copy");
    h.remove();
  }
  scheduleRenderMessages() {
    if (this.renderScheduled) return;
    this.renderScheduled = true;
    window.setTimeout(() => {
      this.renderScheduled = false;
      this.renderMessages();
    }, 40);
  }
  async openSource(path) {
    if (path) await this.app.workspace.openLinkText(path, "", true);
  }
  renderMessages() {
    this.threadEl.empty();
    if (!this.messages.length) return void this.threadEl.createDiv({ cls: "obsidian-rag-empty", text: "\u4FA7\u8FB9\u680F\u804A\u5929\u9762\u677F\u5DF2\u7ECF\u5C31\u7EEA\u3002\u5148\u786E\u8BA4 Python \u540E\u7AEF\u5DF2\u542F\u52A8\uFF0C\u518D\u63D0\u95EE\u6216\u624B\u52A8\u91CD\u5EFA\u7D22\u5F15\u3002" });
    for (const m of this.messages) {
      const wrap = this.threadEl.createDiv({ cls: `obsidian-rag-message ${m.role}` });
      const copy = wrap.createEl("button", { cls: "obsidian-rag-copy-button", attr: { type: "button", "aria-label": "\u590D\u5236\u6B64\u6D88\u606F", title: "\u590D\u5236\u6B64\u6D88\u606F" } });
      copy.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          await this.copyToClipboard(wrap.innerText);
          new import_obsidian.Notice("\u5DF2\u590D\u5236", 1600);
        } catch (error) {
          new import_obsidian.Notice(`\u590D\u5236\u5931\u8D25\uFF1A${String(error)}`, 2600);
        }
      });
      if (m.thinking?.trim()) {
        const d = wrap.createEl("details", { cls: "obsidian-rag-thinking" });
        if (m.streaming) d.open = true;
        d.createEl("summary", { text: m.streaming ? "\u601D\u8003\u4E2D..." : "\u601D\u8003\u8FC7\u7A0B" });
        const body = d.createDiv({ cls: "obsidian-rag-thinking-body" });
        void import_obsidian.MarkdownRenderer.render(this.app, m.thinking, body, "", this.plugin);
      }
      const bubble = wrap.createDiv({ cls: "obsidian-rag-bubble" });
      void import_obsidian.MarkdownRenderer.render(this.app, m.content || (m.streaming ? "_\u6B63\u5728\u8F93\u51FA..._" : ""), bubble, "", this.plugin);
      if (m.sources?.length) {
        const sources = wrap.createDiv({ cls: "obsidian-rag-sources" });
        for (const s of m.sources) {
          const parts = [];
          if (typeof s.similarity === "number") parts.push(`sim ${s.similarity.toFixed(3)}`);
          if (typeof s.rerank_score === "number") parts.push(`rerank ${s.rerank_score.toFixed(3)}`);
          const item = sources.createDiv({ cls: "obsidian-rag-source", text: `${s.relative_path ?? "unknown"}${parts.length ? ` \xB7 ${parts.join(" \xB7 ")}` : ""}` });
          item.addEventListener("click", () => void this.openSource(s.relative_path));
        }
      }
    }
    this.threadEl.scrollTop = this.threadEl.scrollHeight;
  }
  stopBatchPolling() {
    if (this.batchPollTimer != null) {
      window.clearTimeout(this.batchPollTimer);
      this.batchPollTimer = null;
    }
  }
  async pollBatchStatus(jobId) {
    const targetJobId = jobId ?? this.batchJobId;
    if (!targetJobId) return;
    try {
      const r = await this.plugin.api("/index/build/status", this.plugin.getBuildIndexStatusPayload(targetJobId));
      this.batchJobId = r.job_id ?? targetJobId;
      const counts = r.request_counts ?? { total: 0, completed: 0, failed: 0 };
      this.statusEl.setText(`\u6279\u91CF\u7D22\u5F15 ${r.status} | ${counts.completed}/${counts.total} \u5B8C\u6210 | failed ${counts.failed}`);
      if (r.status === "completed") {
        this.stopBatchPolling();
        new import_obsidian.Notice(`obsidianRAG\uFF1A\u6279\u91CF\u7D22\u5F15\u5B8C\u6210\uFF0C\u5171 ${counts.completed}/${counts.total} \u4E2A\u5207\u7247\u3002`, 5e3);
        await this.refreshStatus();
        return;
      }
      if (["failed", "cancelled", "expired"].includes(r.status)) {
        this.stopBatchPolling();
        new import_obsidian.Notice(`obsidianRAG\uFF1A\u6279\u91CF\u7D22\u5F15\u72B6\u6001\u4E3A ${r.status}\u3002${r.message ?? ""}`, 6e3);
        await this.refreshStatus();
        return;
      }
      this.stopBatchPolling();
      this.batchPollTimer = window.setTimeout(() => void this.pollBatchStatus(this.batchJobId), this.plugin.settings.embeddingBatchPollSeconds * 1e3);
    } catch (error) {
      this.stopBatchPolling();
      this.statusEl.setText(`\u6279\u91CF\u7D22\u5F15\u8F6E\u8BE2\u5931\u8D25\uFF1A${String(error)}`);
    }
  }
  async refreshStatus() {
    try {
      const s = await this.plugin.api("/status", this.plugin.getStatusPayload());
      const parts = [
        `${s.chat_provider}: ${s.chat_healthy ? "\u53EF\u7528" : "\u672A\u5C31\u7EEA"}`,
        `embedding: ${s.embedding_provider}`,
        `rerank: ${s.rerank_provider}`,
        `${s.indexed_files} \u4E2A\u6587\u4EF6`,
        `${s.vector_count} \u4E2A\u5411\u91CF`
      ];
      if (s.active_index_job) {
        this.batchJobId = s.active_index_job;
        parts.push(`active job: ${s.active_index_job}`);
        void this.pollBatchStatus(s.active_index_job);
      }
      if (s.needs_rebuild) {
        const reasonText = formatRebuildReasons(s.rebuild_reasons);
        parts.push(reasonText ? `\u9700\u8981\u91CD\u5EFA\u7D22\u5F15: ${reasonText}` : "\u9700\u8981\u91CD\u5EFA\u7D22\u5F15");
      }
      this.statusEl.setText(parts.join(" | "));
    } catch (error) {
      this.statusEl.setText(`\u540E\u7AEF\u4E0D\u53EF\u7528\uFF1A${String(error)}`);
    }
  }
  async rebuildIndex() {
    this.statusEl.setText("\u6B63\u5728\u6784\u5EFA\u7D22\u5F15...");
    try {
      const r = await this.plugin.api("/index/build", this.plugin.getBuildIndexPayload());
      if (r.mode === "batch") {
        this.batchJobId = r.job_id ?? null;
        new import_obsidian.Notice(`obsidianRAG\uFF1A\u6279\u91CF\u4EFB\u52A1\u5DF2\u63D0\u4EA4\u3002${r.message ?? ""}`, 5e3);
        await this.pollBatchStatus(this.batchJobId);
      } else {
        new import_obsidian.Notice(`obsidianRAG\uFF1A\u5DF2\u7D22\u5F15 ${r.file_count ?? 0} \u4E2A\u6587\u4EF6\uFF0C\u751F\u6210 ${r.chunk_count ?? 0} \u4E2A\u5207\u7247\u3002`, 5e3);
        await this.refreshStatus();
      }
    } catch (error) {
      new import_obsidian.Notice(`obsidianRAG\uFF1A\u91CD\u5EFA\u7D22\u5F15\u5931\u8D25\uFF1A${String(error)}`, 8e3);
      this.statusEl.setText("\u6784\u5EFA\u5931\u8D25");
    }
  }
  async cancelIndexBuild() {
    try {
      const r = await this.plugin.api("/index/build/cancel", this.plugin.getBuildIndexStatusPayload(this.batchJobId));
      this.stopBatchPolling();
      this.batchJobId = null;
      new import_obsidian.Notice(`obsidianRAG\uFF1A${r.message ?? "\u5DF2\u53D6\u6D88\u6279\u91CF\u7D22\u5F15\u4EFB\u52A1\u3002"}`, 5e3);
      await this.refreshStatus();
    } catch (error) {
      new import_obsidian.Notice(`obsidianRAG\uFF1A\u53D6\u6D88\u6279\u91CF\u7D22\u5F15\u5931\u8D25\uFF1A${String(error)}`, 8e3);
    }
  }
  async sendMessage() {
    const query = this.inputEl.value.trim();
    if (!query) return;
    const assistant = { role: "assistant", content: "", thinking: "", sources: [], streaming: true };
    this.messages.push({ role: "user", content: query });
    this.messages.push(assistant);
    this.inputEl.value = "";
    this.renderMessages();
    this.statusEl.setText("\u6B63\u5728\u601D\u8003...");
    try {
      await this.plugin.stream("/chat/stream", this.plugin.getChatRequestPayload(query), (e) => {
        if (e.type === "session") this.plugin.currentSessionId = e.session_id;
        if (e.type === "thinking") {
          assistant.thinking = `${assistant.thinking ?? ""}${e.delta}`;
          this.scheduleRenderMessages();
        }
        if (e.type === "content") {
          assistant.content += e.delta;
          this.scheduleRenderMessages();
        }
        if (e.type === "sources") {
          assistant.sources = e.sources;
          this.scheduleRenderMessages();
        }
        if (e.type === "done") {
          this.plugin.currentSessionId = e.session_id;
          assistant.content = e.answer;
          assistant.thinking = e.thinking ?? assistant.thinking;
          assistant.sources = e.sources;
          assistant.streaming = false;
        }
        if (e.type === "error") throw new Error(e.message);
      });
      assistant.streaming = false;
      this.renderMessages();
      await this.refreshStatus();
    } catch (error) {
      assistant.streaming = false;
      const message = error instanceof Error ? error.message : String(error);
      assistant.content = assistant.content ? `${assistant.content}

\u8BF7\u6C42\u5931\u8D25\uFF1A${message}` : `\u8BF7\u6C42\u5931\u8D25\uFF1A${message}`;
      this.renderMessages();
      this.statusEl.setText("\u8BF7\u6C42\u5931\u8D25");
    }
  }
  async endSession() {
    try {
      const r = await this.plugin.api("/session/end", { vault_path: this.plugin.getVaultPath() });
      new import_obsidian.Notice(r.exported_path ? `obsidianRAG\uFF1A\u804A\u5929\u8BB0\u5F55\u5DF2\u5BFC\u51FA\u5230 ${r.exported_path}` : "obsidianRAG\uFF1A\u5F53\u524D\u4F1A\u8BDD\u4E3A\u7A7A\u3002", 4e3);
      this.messages = [];
      this.plugin.currentSessionId = null;
      this.renderMessages();
      await this.refreshStatus();
    } catch (error) {
      new import_obsidian.Notice(`obsidianRAG\uFF1A\u7ED3\u675F\u4F1A\u8BDD\u5931\u8D25\uFF1A${String(error)}`, 8e3);
    }
  }
  async newSession() {
    await this.endSession();
  }
  async onClose() {
    this.stopBatchPolling();
  }
};
var ObsidianRAGSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  async save() {
    await this.plugin.saveSettings();
    this.display();
  }
  section(title, desc) {
    this.containerEl.createEl("h3", { text: title });
    this.containerEl.createEl("p", { text: desc, cls: "obsidian-rag-settings-section-desc" });
  }
  text(name, desc, value, onChange, placeholder = "", password = false) {
    new import_obsidian.Setting(this.containerEl).setName(name).setDesc(desc).addText((t) => {
      if (password) t.inputEl.type = "password";
      t.setPlaceholder(placeholder).setValue(value).onChange((v) => void onChange(v));
    });
  }
  number(name, desc, value, onChange, step = "1", placeholder = "") {
    new import_obsidian.Setting(this.containerEl).setName(name).setDesc(desc).addText((t) => {
      t.inputEl.type = "number";
      t.inputEl.step = step;
      t.setPlaceholder(placeholder).setValue(value == null ? "" : String(value)).onChange((v) => {
        const n = v.trim() === "" ? null : Number(v);
        if (n === null || !Number.isNaN(n)) void onChange(n);
      });
    });
  }
  toggle(name, desc, value, onChange) {
    new import_obsidian.Setting(this.containerEl).setName(name).setDesc(desc).addToggle((t) => t.setValue(value).onChange((v) => void onChange(v)));
  }
  dropdown(name, desc, value, options, onChange) {
    new import_obsidian.Setting(this.containerEl).setName(name).setDesc(desc).addDropdown((d) => {
      for (const [v, l] of options) d.addOption(v, l);
      d.setValue(value).onChange((v) => void onChange(v));
    });
  }
  button(name, desc, label, onClick) {
    new import_obsidian.Setting(this.containerEl).setName(name).setDesc(desc).addButton((b) => b.setButtonText(label).onClick(() => void onClick()));
  }
  async test(path, body, label) {
    try {
      const r = await this.plugin.api(path, body);
      new import_obsidian.Notice(`${label} \u6210\u529F\uFF1A${r.message}`, 4e3);
    } catch (error) {
      new import_obsidian.Notice(`${label} \u5931\u8D25\uFF1A${String(error)}`, 6e3);
    }
  }
  display() {
    const s = this.plugin.settings;
    const c = this.containerEl;
    c.empty();
    c.createEl("h2", { text: "obsidianRAG" });
    c.createEl("div", { text: "Provider-aware Obsidian retrieval assistant", cls: "obsidian-rag-settings-credit" });
    this.section("Backend", "\u8FDE\u63A5\u672C\u5730 Python FastAPI \u540E\u7AEF\u3002");
    this.text("Backend URL", "\u4F8B\u5982 http://127.0.0.1:8765", s.backendUrl, async (v) => {
      s.backendUrl = v.trim() || DEFAULT_SETTINGS.backendUrl;
      await this.save();
    }, DEFAULT_SETTINGS.backendUrl);
    this.section("Chat", "\u804A\u5929 provider \u4E0E\u6A21\u578B\u914D\u7F6E\u3002");
    this.dropdown("Chat Provider", "\u652F\u6301 Ollama \u548C OpenAI-compatible\u3002", s.chatProvider, [["ollama", "Ollama"], ["openai-compatible", "OpenAI-compatible"]], async (v) => {
      s.chatProvider = v;
      await this.save();
    });
    this.text("Chat Base URL", "Ollama \u53EF\u7559\u7A7A\u4F7F\u7528\u9ED8\u8BA4\u5730\u5740\uFF0COpenAI-compatible \u5FC5\u586B\u3002", s.chatApiBaseUrl, async (v) => {
      s.chatApiBaseUrl = v.trim();
      await this.save();
    }, "http://127.0.0.1:11434");
    if (s.chatProvider === "openai-compatible") this.text("Chat API Key", "\u8FDC\u7A0B\u804A\u5929 provider \u4F7F\u7528\u3002", s.chatApiKey, async (v) => {
      s.chatApiKey = v.trim();
      await this.save();
    }, "sk-...", true);
    this.text("Chat Model", "\u804A\u5929\u6A21\u578B\u540D\u79F0\u3002", s.chatModel, async (v) => {
      s.chatModel = v.trim() || DEFAULT_SETTINGS.chatModel;
      await this.save();
    }, DEFAULT_SETTINGS.chatModel);
    this.toggle("Enable Thinking", "\u5F00\u542F\u6A21\u578B\u601D\u8003/\u63A8\u7406\u8F93\u51FA\uFF08\u82E5 provider \u652F\u6301\uFF09\u3002", s.enableThinking, async (v) => {
      s.enableThinking = v;
      await this.save();
    });
    this.button("Chat Connection", "\u6D4B\u8BD5\u5F53\u524D\u804A\u5929 provider \u914D\u7F6E\u3002", "Test Chat Connection", async () => this.test("/provider/test/chat", { chat: this.plugin.getChatPayload() }, "Chat \u8FDE\u63A5\u6D4B\u8BD5"));
    this.section("Embedding", "\u63A7\u5236 query embedding \u548C realtime indexing embedding\u3002");
    this.dropdown("Embedding Provider", "\u652F\u6301 sentence-transformers\u3001vLLM\u3001DashScope\u3002", s.embeddingProvider, [["sentence-transformers", "sentence-transformers"], ["vllm", "vLLM"], ["dashscope", "DashScope"]], async (v) => {
      s.embeddingProvider = v;
      await this.save();
    });
    if (s.embeddingProvider !== "sentence-transformers") this.text("Embedding Base URL", "\u672C\u5730 vLLM \u6216 DashScope compatible-mode \u5730\u5740\u3002", s.embeddingApiBaseUrl, async (v) => {
      s.embeddingApiBaseUrl = v.trim();
      await this.save();
    }, s.embeddingProvider === "dashscope" ? "https://dashscope.aliyuncs.com/compatible-mode/v1" : DEFAULT_SETTINGS.embeddingApiBaseUrl);
    if (s.embeddingProvider === "dashscope") this.text("Embedding API Key", "DashScope embedding key\u3002", s.embeddingApiKey, async (v) => {
      s.embeddingApiKey = v.trim();
      await this.save();
    }, "sk-...", true);
    this.text("Embedding Model", "embedding \u6A21\u578B\u540D\u79F0\u3002", s.embeddingModel, async (v) => {
      s.embeddingModel = v.trim() || DEFAULT_SETTINGS.embeddingModel;
      await this.save();
    }, DEFAULT_SETTINGS.embeddingModel);
    this.number("Embedding Dimensions", "0 \u8868\u793A\u4F7F\u7528 provider \u9ED8\u8BA4\u7EF4\u5EA6\u3002", s.embeddingDimensions, async (v) => {
      s.embeddingDimensions = Math.max(0, Math.floor(v ?? 0));
      await this.save();
    }, "1", "0");
    this.text("Embedding Encoding Format", "\u901A\u5E38\u4FDD\u6301 float\u3002", s.embeddingEncodingFormat, async (v) => {
      s.embeddingEncodingFormat = v.trim() || "float";
      await this.save();
    }, "float");
    this.button("Embedding Connection", "\u6D4B\u8BD5\u5F53\u524D embedding provider \u914D\u7F6E\u3002", "Test Embedding Connection", async () => this.test("/provider/test/embedding", { embedding: this.plugin.getEmbeddingPayload() }, "Embedding \u8FDE\u63A5\u6D4B\u8BD5"));
    this.section("Embedding Batch", "\u4EC5\u7528\u4E8E\u7D22\u5F15\u9636\u6BB5\uFF0C\u4E0D\u8FDB\u5165\u5B9E\u65F6\u95EE\u7B54\u94FE\u8DEF\u3002");
    this.toggle("Enable Embedding Batch", "\u542F\u7528\u540E\uFF0C\u7D22\u5F15\u6A21\u5F0F\u53EF\u5207\u6362\u5230 batch\u3002", s.embeddingBatchEnabled, async (v) => {
      s.embeddingBatchEnabled = v;
      await this.save();
    });
    this.dropdown("Indexing Mode", "realtime \u4E3A\u540C\u6B65\u7D22\u5F15\uFF0Cbatch \u4E3A\u79BB\u7EBF\u6279\u91CF\u7D22\u5F15\u3002", s.indexingMode, [["realtime", "Realtime"], ["batch", "Batch"]], async (v) => {
      s.indexingMode = v;
      await this.save();
    });
    [["Batch Base URL", "DashScope batch compatible-mode \u5730\u5740\u3002", "embeddingBatchApiBaseUrl", DEFAULT_SETTINGS.embeddingBatchApiBaseUrl], ["Completion Window", "\u4F8B\u5982 24h \u5230 336h\u3002", "embeddingBatchCompletionWindow", DEFAULT_SETTINGS.embeddingBatchCompletionWindow], ["Batch Output Dir", "\u672C\u5730\u4FDD\u5B58 batch \u7ED3\u679C\u7684\u76EE\u5F55\u3002", "batchOutputDir", DEFAULT_SETTINGS.batchOutputDir], ["Batch Callback URL", "\u5982\u679C\u542F\u7528\u56DE\u8C03\uFF0C\u8BF7\u586B\u5199\u3002", "batchCallbackUrl", "https://example.com/callback"]].forEach(([name, desc, key, placeholder]) => this.text(name, desc, s[key], async (v) => {
      s[key] = v.trim();
      await this.save();
    }, placeholder));
    this.text("Batch API Key", "Batch embedding \u4F7F\u7528\u3002", s.embeddingBatchApiKey, async (v) => {
      s.embeddingBatchApiKey = v.trim();
      await this.save();
    }, "sk-...", true);
    this.number("Batch Poll Seconds", "\u6279\u91CF\u4EFB\u52A1\u8F6E\u8BE2\u95F4\u9694\u3002", s.embeddingBatchPollSeconds, async (v) => {
      s.embeddingBatchPollSeconds = Math.max(5, Math.floor(v ?? 30));
      await this.save();
    }, "1", "30");
    this.toggle("Delete Remote Files", "\u4E0B\u8F7D\u7ED3\u679C\u540E\u5220\u9664\u8FDC\u7AEF batch \u6587\u4EF6\u3002", s.batchDeleteRemoteFilesAfterDownload, async (v) => {
      s.batchDeleteRemoteFilesAfterDownload = v;
      await this.save();
    });
    this.toggle("Enable Batch Callback", "\u9884\u7559\u56DE\u8C03\u80FD\u529B\u3002", s.batchEnableCallback, async (v) => {
      s.batchEnableCallback = v;
      await this.save();
    });
    this.button("Batch Embedding Connection", "\u6D4B\u8BD5 batch embedding \u914D\u7F6E\u3002", "Test Batch Embedding Connection", async () => this.test("/provider/test/batch-embedding", { embedding: this.plugin.getEmbeddingPayload(), batch: this.plugin.getBatchPayload() }, "Batch Embedding \u8FDE\u63A5\u6D4B\u8BD5"));
    this.section("Rerank", "\u63A7\u5236 rerank provider \u4E0E\u6392\u5E8F\u53C2\u6570\u3002");
    this.dropdown("Rerank Provider", "\u652F\u6301 vLLM \u4E0E DashScope\u3002", s.rerankProvider, [["vllm", "vLLM"], ["dashscope", "DashScope"]], async (v) => {
      s.rerankProvider = v;
      await this.save();
    });
    this.text("Rerank Base URL", "\u672C\u5730 vLLM \u6216 DashScope rerank \u5730\u5740\u3002", s.rerankApiBaseUrl, async (v) => {
      s.rerankApiBaseUrl = v.trim();
      await this.save();
    }, s.rerankProvider === "dashscope" ? "https://dashscope.aliyuncs.com" : DEFAULT_SETTINGS.rerankApiBaseUrl);
    if (s.rerankProvider === "dashscope") this.text("Rerank API Key", "DashScope rerank key\u3002", s.rerankApiKey, async (v) => {
      s.rerankApiKey = v.trim();
      await this.save();
    }, "sk-...", true);
    [["Rerank Model", "\u4F8B\u5982 qwen3-rerank / gte-rerank-v2\u3002", "rerankModel", DEFAULT_SETTINGS.rerankModel], ["Rerank Instruction", "DashScope qwen3-rerank \u53EF\u9009 instruction\u3002", "rerankInstruction", DEFAULT_SETTINGS.rerankInstruction]].forEach(([name, desc, key, placeholder]) => this.text(name, desc, s[key], async (v) => {
      s[key] = v.trim();
      await this.save();
    }, placeholder));
    this.number("Rerank Top N", "\u6700\u7EC8\u53C2\u4E0E rerank \u7684\u6587\u6863\u6570\u3002", s.rerankTopN, async (v) => {
      s.rerankTopN = Math.max(1, Math.floor(v ?? 10));
      await this.save();
    });
    this.toggle("Return Documents", "DashScope gte-rerank-v2 \u662F\u5426\u8FD4\u56DE\u6587\u6863\u3002", s.rerankReturnDocuments, async (v) => {
      s.rerankReturnDocuments = v;
      await this.save();
    });
    this.number("Rerank Timeout Seconds", "rerank \u8BF7\u6C42\u8D85\u65F6\u3002", s.rerankTimeoutSeconds, async (v) => {
      s.rerankTimeoutSeconds = Math.max(5, Math.floor(v ?? 60));
      await this.save();
    });
    this.button("Rerank Connection", "\u6D4B\u8BD5\u5F53\u524D rerank provider \u914D\u7F6E\u3002", "Test Rerank Connection", async () => this.test("/provider/test/rerank", { rerank: this.plugin.getRerankPayload() }, "Rerank \u8FDE\u63A5\u6D4B\u8BD5"));
    this.section("Retrieval", "\u63A7\u5236\u53EC\u56DE\u3001rerank \u5019\u9009\u6570\u548C\u4E0A\u4E0B\u6587\u9884\u7B97\u3002");
    this.number("Similarity Threshold", "\u76F8\u4F3C\u5EA6\u9608\u503C\uFF0C\u7559\u7A7A\u8868\u793A\u4E0D\u8FC7\u6EE4\u3002", s.similarityThreshold, async (v) => {
      s.similarityThreshold = v;
      await this.save();
    }, "0.01", "0.72");
    const numKeys = [
      ["maxResults", "Max Results", "\u521D\u6B65\u663E\u793A/\u4FDD\u7559\u7684\u6700\u5927\u7ED3\u679C\u6570\u3002"],
      ["retrievalLimit", "Retrieval Limit", "\u5411\u91CF\u521D\u53EC\u7684\u5019\u9009\u4E0A\u9650\u3002"],
      ["rerankCandidates", "Rerank Candidates", "\u8FDB\u5165 rerank \u7684\u5019\u9009\u6570\u91CF\u3002"],
      ["finalNoteCount", "Final Note Count", "\u6700\u7EC8\u9001\u5165\u4E0A\u4E0B\u6587\u7684\u7B14\u8BB0\u6570\u3002"],
      ["chunkTargetTokens", "Chunk Target Tokens", "\u5207\u7247\u76EE\u6807\u957F\u5EA6\u3002"],
      ["chunkOverlapTokens", "Chunk Overlap Tokens", "\u5207\u7247\u91CD\u53E0\u957F\u5EA6\u3002"],
      ["chunkMaxTokens", "Chunk Max Tokens", "\u5207\u7247\u6700\u5927\u957F\u5EA6\u3002"],
      ["neighborWindow", "Neighbor Window", "\u90BB\u57DF\u6269\u5C55\u7A97\u53E3\u3002"],
      ["groupMergeMaxGap", "Group Merge Max Gap", "\u540C\u7B14\u8BB0\u5C40\u90E8\u805A\u5408\u65F6\u5141\u8BB8\u7684\u95F4\u9694\u3002"],
      ["finalGroupCountCap", "Final Group Count Cap", "\u6700\u7EC8\u4E0A\u4E0B\u6587\u7684 group \u6570\u4E0A\u9650\u3002"],
      ["finalContextTokenBudget", "Final Context Token Budget", "\u6700\u7EC8\u4E0A\u4E0B\u6587 token \u9884\u7B97\u3002"],
      ["temporalWindowDays", "Temporal Window Days", "\u8DE8\u5929\u6269\u5C55\u7A97\u53E3\u3002"]
    ];
    for (const [key, name, desc] of numKeys) this.number(name, desc, s[key], async (v) => {
      s[key] = Math.max(0, Math.floor(v ?? 0));
      await this.save();
    });
    [["enableTemporalExpansion", "Enable Temporal Expansion", "\u4E3A daily notes \u9884\u7559\u65F6\u95F4\u6269\u5C55\u3002"], ["enableSecondPassEntityExpansion", "Enable Second-pass Entity Expansion", "\u9884\u7559\u4E8C\u6B21\u5B9E\u4F53\u6269\u5C55\u3002"], ["enableQueryRewrite", "Enable Query Rewrite", "\u9884\u7559 query rewrite\u3002"]].forEach(([key, name, desc]) => this.toggle(name, desc, s[key], async (v) => {
      s[key] = v;
      await this.save();
    }));
    this.section("UI / Behavior", "\u754C\u9762\u884C\u4E3A\u548C\u5F53\u524D vault \u4FE1\u606F\u3002");
    this.toggle("Auto Open On Load", "Obsidian \u542F\u52A8\u65F6\u81EA\u52A8\u6253\u5F00\u4FA7\u8FB9\u680F\u3002", s.autoOpenOnLoad, async (v) => {
      s.autoOpenOnLoad = v;
      await this.save();
    });
    new import_obsidian.Setting(c).setName("Vault Path").setDesc("\u7531\u684C\u9762\u7AEF\u6587\u4EF6\u7CFB\u7EDF\u9002\u914D\u5668\u81EA\u52A8\u89E3\u6790\u3002").addText((t) => t.setValue(this.plugin.getVaultPath()).setDisabled(true));
  }
};
