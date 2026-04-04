import {
  App,
  FileSystemAdapter,
  ItemView,
  MarkdownRenderer,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
} from "obsidian";

const VIEW_TYPE_RAG = "obsidian-rag-view";

type SourceItem = { relative_path?: string; filepath?: string; similarity?: number; rerank_score?: number; chunk_id?: string };
type ChatMessage = { role: "user" | "assistant"; content: string; thinking?: string; sources?: SourceItem[]; streaming?: boolean };
type BackendStatus = {
  indexed_files: number; vector_count: number; needs_rebuild: boolean; last_indexed_at?: string;
  chat_provider: string; chat_healthy: boolean; embedding_provider: string; embedding_model: string;
  embedding_configured: boolean; embedding_batch_enabled: boolean; rerank_provider: string;
  rerank_model: string; rerank_configured: boolean; active_index_job?: string | null; rebuild_reasons?: string[];
};
type ProviderTestResponse = { success: boolean; message: string; request_id?: string };
type IndexBuildStatus = {
  mode: string; status: string; job_id?: string | null; provider_job_id?: string | null;
  request_counts?: { total: number; completed: number; failed: number };
  output_file_id?: string | null; error_file_id?: string | null; message?: string; file_count?: number; chunk_count?: number;
};
type ChatStreamEvent =
  | { type: "session"; session_id: string }
  | { type: "thinking"; delta: string }
  | { type: "content"; delta: string }
  | { type: "sources"; sources: SourceItem[] }
  | { type: "done"; session_id: string; answer: string; thinking?: string; sources: SourceItem[] }
  | { type: "error"; message: string };

interface ObsidianRAGSettings {
  backendUrl: string;
  chatProvider: "ollama" | "openai-compatible"; chatApiBaseUrl: string; chatApiKey: string; chatModel: string; enableThinking: boolean;
  embeddingProvider: "sentence-transformers" | "vllm" | "dashscope"; embeddingApiBaseUrl: string; embeddingApiKey: string; embeddingModel: string; embeddingDimensions: number; embeddingEncodingFormat: string;
  embeddingBatchEnabled: boolean; embeddingBatchApiBaseUrl: string; embeddingBatchApiKey: string; embeddingBatchCompletionWindow: string; embeddingBatchPollSeconds: number; batchOutputDir: string; batchDeleteRemoteFilesAfterDownload: boolean; batchEnableCallback: boolean; batchCallbackUrl: string;
  rerankProvider: "vllm" | "dashscope"; rerankApiBaseUrl: string; rerankApiKey: string; rerankModel: string; rerankTopN: number; rerankInstruction: string; rerankReturnDocuments: boolean; rerankTimeoutSeconds: number;
  similarityThreshold: number | null; maxResults: number; retrievalLimit: number; rerankCandidates: number; finalNoteCount: number;
  chunkTargetTokens: number; chunkOverlapTokens: number; chunkMaxTokens: number; neighborWindow: number; groupMergeMaxGap: number; finalGroupCountCap: number; finalContextTokenBudget: number; enableTemporalExpansion: boolean; temporalWindowDays: number; enableSecondPassEntityExpansion: boolean; enableQueryRewrite: boolean;
  indexingMode: "realtime" | "batch"; autoOpenOnLoad: boolean;
}

type LegacySettings = Partial<{ llmProvider: string; apiBaseUrl: string; apiKey: string; chatModel: string; enableThinking: boolean; similarityThreshold: number; maxResults: number; autoOpenOnLoad: boolean }>;

const DEFAULT_SETTINGS: ObsidianRAGSettings = {
  backendUrl: "http://127.0.0.1:8765",
  chatProvider: "ollama", chatApiBaseUrl: "", chatApiKey: "", chatModel: "qwen3-vl:30b", enableThinking: false,
  embeddingProvider: "vllm", embeddingApiBaseUrl: "http://127.0.0.1:8001/v1", embeddingApiKey: "", embeddingModel: "Qwen/Qwen3-Embedding-8B", embeddingDimensions: 0, embeddingEncodingFormat: "float",
  embeddingBatchEnabled: false, embeddingBatchApiBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", embeddingBatchApiKey: "", embeddingBatchCompletionWindow: "24h", embeddingBatchPollSeconds: 30, batchOutputDir: ".obsidian/plugins/obsidianRAG/data/batch", batchDeleteRemoteFilesAfterDownload: false, batchEnableCallback: false, batchCallbackUrl: "",
  rerankProvider: "vllm", rerankApiBaseUrl: "http://127.0.0.1:8002", rerankApiKey: "", rerankModel: "Qwen/Qwen3-Reranker-4B", rerankTopN: 10, rerankInstruction: "Given a user question, retrieve relevant notes that help answer it.", rerankReturnDocuments: true, rerankTimeoutSeconds: 60,
  similarityThreshold: 0.72, maxResults: 8, retrievalLimit: 30, rerankCandidates: 15, finalNoteCount: 5,
  chunkTargetTokens: 420, chunkOverlapTokens: 64, chunkMaxTokens: 520, neighborWindow: 1, groupMergeMaxGap: 1, finalGroupCountCap: 8, finalContextTokenBudget: 4800, enableTemporalExpansion: true, temporalWindowDays: 2, enableSecondPassEntityExpansion: false, enableQueryRewrite: false,
  indexingMode: "realtime", autoOpenOnLoad: true,
};

const REBUILD_REASON_LABELS: Record<string, string> = {
  index_empty: "当前索引为空",
  manifest_missing: "缺少索引元数据",
  source_files_changed: "笔记文件或索引签名已变化",
  embedding_provider_changed: "Embedding provider 已变化",
  embedding_model_changed: "Embedding 模型已变化",
  embedding_dimensions_changed: "Embedding 维度已变化",
  embedding_encoding_format_changed: "Embedding 编码格式已变化",
  chunk_target_tokens_changed: "切片目标 token 已变化",
  chunk_overlap_tokens_changed: "切片 overlap 已变化",
  chunk_max_tokens_changed: "切片最大 token 已变化",
  prefix_rule_version_changed: "Prefix 规则版本已变化",
  index_version_changed: "索引版本已变化",
};

function formatRebuildReasons(reasons?: string[]): string {
  if (!reasons?.length) return "";
  return reasons.map((reason) => REBUILD_REASON_LABELS[reason] ?? reason).join("、");
}

function normalizeSettings(data: Partial<ObsidianRAGSettings> & LegacySettings | null | undefined): ObsidianRAGSettings {
  const raw = data ?? {};
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    chatProvider: (raw.chatProvider ?? raw.llmProvider ?? DEFAULT_SETTINGS.chatProvider) as ObsidianRAGSettings["chatProvider"],
    chatApiBaseUrl: raw.chatApiBaseUrl ?? raw.apiBaseUrl ?? DEFAULT_SETTINGS.chatApiBaseUrl,
    chatApiKey: raw.chatApiKey ?? raw.apiKey ?? DEFAULT_SETTINGS.chatApiKey,
    chatModel: raw.chatModel ?? DEFAULT_SETTINGS.chatModel,
    enableThinking: raw.enableThinking ?? DEFAULT_SETTINGS.enableThinking,
    similarityThreshold: raw.similarityThreshold ?? DEFAULT_SETTINGS.similarityThreshold,
    maxResults: raw.maxResults ?? DEFAULT_SETTINGS.maxResults,
    autoOpenOnLoad: raw.autoOpenOnLoad ?? DEFAULT_SETTINGS.autoOpenOnLoad,
  };
}

export default class ObsidianRAGPlugin extends Plugin {
  settings: ObsidianRAGSettings = DEFAULT_SETTINGS;
  currentSessionId: string | null = null;

  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_RAG, (leaf) => new ObsidianRAGView(leaf, this));
    this.addRibbonIcon("messages-square", "打开 obsidianRAG", async () => this.activateView());
    this.addCommand({ id: "open-chat", name: "打开聊天面板", callback: async () => this.activateView() });
    this.addCommand({ id: "rebuild-index", name: "重建知识库索引", callback: async () => (await this.activateView()).rebuildIndex() });
    this.addCommand({ id: "end-chat-session", name: "结束当前会话", callback: async () => (await this.activateView()).endSession() });
    this.addSettingTab(new ObsidianRAGSettingTab(this.app, this));
    if (this.settings.autoOpenOnLoad) void this.activateView();
  }

  onunload() { this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG); }
  async loadSettings() { this.settings = normalizeSettings((await this.loadData()) as Partial<ObsidianRAGSettings> & LegacySettings); }
  async saveSettings() { await this.saveData(this.settings); }
  getVaultPath() { const a = this.app.vault.adapter; if (!(a instanceof FileSystemAdapter)) throw new Error("obsidianRAG 仅支持桌面端文件系统适配器。"); return a.getBasePath(); }
  getChatPayload() { const s = this.settings; return { provider: s.chatProvider, api_base: s.chatApiBaseUrl.trim(), api_key: s.chatApiKey.trim(), model: s.chatModel.trim(), enable_thinking: s.enableThinking }; }
  getEmbeddingPayload() { const s = this.settings; return { provider: s.embeddingProvider, api_base: s.embeddingApiBaseUrl.trim(), api_key: s.embeddingApiKey.trim(), model: s.embeddingModel.trim(), dimensions: s.embeddingDimensions, encoding_format: s.embeddingEncodingFormat.trim() || "float" }; }
  getBatchPayload() { const s = this.settings; return { enabled: s.embeddingBatchEnabled, api_base: s.embeddingBatchApiBaseUrl.trim(), api_key: s.embeddingBatchApiKey.trim(), completion_window: s.embeddingBatchCompletionWindow.trim(), poll_interval_seconds: s.embeddingBatchPollSeconds, output_dir: s.batchOutputDir.trim(), delete_remote_files_after_download: s.batchDeleteRemoteFilesAfterDownload, enable_callback: s.batchEnableCallback, callback_url: s.batchCallbackUrl.trim() }; }
  getRerankPayload() { const s = this.settings; return { provider: s.rerankProvider, api_base: s.rerankApiBaseUrl.trim(), api_key: s.rerankApiKey.trim(), model: s.rerankModel.trim(), top_n: s.rerankTopN, instruct: s.rerankInstruction.trim(), return_documents: s.rerankReturnDocuments, timeout_seconds: s.rerankTimeoutSeconds }; }
  getRetrievalPayload() { const s = this.settings; return { similarity_threshold: s.similarityThreshold, max_results: s.maxResults, retrieval_limit: s.retrievalLimit, rerank_candidates: s.rerankCandidates, final_note_count: s.finalNoteCount, chunk_target_tokens: s.chunkTargetTokens, chunk_overlap_tokens: s.chunkOverlapTokens, chunk_max_tokens: s.chunkMaxTokens, neighbor_window: s.neighborWindow, same_note_group_merge_gap: s.groupMergeMaxGap, final_group_count_cap: s.finalGroupCountCap, final_context_token_budget: s.finalContextTokenBudget, enable_temporal_expansion: s.enableTemporalExpansion, temporal_window_days: s.temporalWindowDays, enable_second_pass_entity_expansion: s.enableSecondPassEntityExpansion, enable_query_rewrite: s.enableQueryRewrite, indexing_mode: s.indexingMode }; }
  getStatusPayload() { return { vault_path: this.getVaultPath(), chat: this.getChatPayload(), embedding: this.getEmbeddingPayload(), batch: this.getBatchPayload(), rerank: this.getRerankPayload(), retrieval: this.getRetrievalPayload() }; }
  getBuildIndexPayload() { return { vault_path: this.getVaultPath(), embedding: this.getEmbeddingPayload(), batch: this.getBatchPayload(), retrieval: this.getRetrievalPayload() }; }
  getBuildIndexStatusPayload(jobId?: string | null) { return { vault_path: this.getVaultPath(), job_id: jobId ?? undefined, embedding: this.getEmbeddingPayload(), batch: this.getBatchPayload(), retrieval: this.getRetrievalPayload() }; }
  getChatRequestPayload(query: string) { return { vault_path: this.getVaultPath(), query, chat: this.getChatPayload(), embedding: this.getEmbeddingPayload(), rerank: this.getRerankPayload(), retrieval: this.getRetrievalPayload() }; }
  async activateView(): Promise<ObsidianRAGView> { let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_RAG)[0]; if (!leaf) { const rightLeaf = this.app.workspace.getRightLeaf(false); if (!rightLeaf) throw new Error("无法创建 obsidianRAG 侧边栏视图。"); leaf = rightLeaf; await leaf.setViewState({ type: VIEW_TYPE_RAG, active: true }); } this.app.workspace.revealLeaf(leaf); return leaf.view as ObsidianRAGView; }
  async api<T>(path: string, body: Record<string, unknown>) { const r = await fetch(`${this.settings.backendUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`); return await r.json() as T; }
  async stream(path: string, body: Record<string, unknown>, onEvent: (e: ChatStreamEvent) => void) { const r = await fetch(`${this.settings.backendUrl}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) throw new Error((await r.text()) || `HTTP ${r.status}`); if (!r.body) throw new Error("流式响应不可用。"); const reader = r.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; while (true) { const { value, done } = await reader.read(); buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done }); const lines = buffer.split(/\r?\n/); buffer = lines.pop() ?? ""; for (const line of lines) { const t = line.trim(); if (t) onEvent(JSON.parse(t) as ChatStreamEvent); } if (done) break; } const trailing = buffer.trim(); if (trailing) onEvent(JSON.parse(trailing) as ChatStreamEvent); }
}

class ObsidianRAGView extends ItemView {
  plugin: ObsidianRAGPlugin; threadEl!: HTMLDivElement; statusEl!: HTMLDivElement; inputEl!: HTMLTextAreaElement; messages: ChatMessage[] = []; private renderScheduled = false; private batchJobId: string | null = null; private batchPollTimer: number | null = null;
  constructor(leaf: WorkspaceLeaf, plugin: ObsidianRAGPlugin) { super(leaf); this.plugin = plugin; }
  getViewType() { return VIEW_TYPE_RAG; } getDisplayText() { return "obsidianRAG"; } getIcon() { return "messages-square"; }
  async onOpen() { this.renderLayout(); await this.refreshStatus(); }
  renderLayout() {
    const { contentEl } = this; contentEl.empty(); contentEl.addClass("obsidian-rag-view");
    const header = contentEl.createDiv({ cls: "obsidian-rag-header" }); const heading = header.createDiv(); heading.createDiv({ cls: "obsidian-rag-title", text: "obsidianRAG" }); this.statusEl = heading.createDiv({ cls: "obsidian-rag-status", text: "正在连接后端..." });
    const actions = header.createDiv({ cls: "obsidian-rag-actions" }); this.makeButton(actions, "重建索引", async () => this.rebuildIndex()); this.makeButton(actions, "取消索引", async () => this.cancelIndexBuild()); this.makeButton(actions, "新会话", async () => this.newSession()); this.makeButton(actions, "结束会话", async () => this.endSession());
    this.threadEl = contentEl.createDiv({ cls: "obsidian-rag-thread" }); this.renderMessages();
    const composer = contentEl.createDiv({ cls: "obsidian-rag-composer" }); this.inputEl = composer.createEl("textarea", { cls: "obsidian-rag-input", attr: { placeholder: "输入问题，Enter 发送，Shift+Enter 换行" } }); this.inputEl.addEventListener("keydown", async (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); await this.sendMessage(); } });
    const footer = composer.createDiv({ cls: "obsidian-rag-footer" }); footer.createDiv({ cls: "obsidian-rag-hint", text: "每轮问答都会基于当前索引重新检索你的 Obsidian 笔记。" }); this.makeButton(footer, "发送", async () => this.sendMessage());
  }
  makeButton(c: HTMLElement, label: string, onClick: () => Promise<void> | void) { const b = c.createEl("button", { cls: "obsidian-rag-button", text: label }); b.addEventListener("click", () => void onClick()); return b; }
  async copyToClipboard(text: string) { const t = text.trim(); if (!t) return new Notice("没有可复制的内容", 2000); if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(t); const h = document.createElement("textarea"); h.value = t; h.style.position = "fixed"; h.style.opacity = "0"; document.body.appendChild(h); h.focus(); h.select(); document.execCommand("copy"); h.remove(); }
  scheduleRenderMessages() { if (this.renderScheduled) return; this.renderScheduled = true; window.setTimeout(() => { this.renderScheduled = false; this.renderMessages(); }, 40); }
  async openSource(path?: string) { if (path) await this.app.workspace.openLinkText(path, "", true); }
  renderMessages() {
    this.threadEl.empty();
    if (!this.messages.length) return void this.threadEl.createDiv({ cls: "obsidian-rag-empty", text: "侧边栏聊天面板已经就绪。先确认 Python 后端已启动，再提问或手动重建索引。" });
    for (const m of this.messages) {
      const wrap = this.threadEl.createDiv({ cls: `obsidian-rag-message ${m.role}` });
      const copy = wrap.createEl("button", { cls: "obsidian-rag-copy-button", attr: { type: "button", "aria-label": "复制此消息", title: "复制此消息" } });
      copy.addEventListener("click", async (e) => { e.preventDefault(); e.stopPropagation(); try { await this.copyToClipboard(wrap.innerText); new Notice("已复制", 1600); } catch (error) { new Notice(`复制失败：${String(error)}`, 2600); } });
      if (m.thinking?.trim()) { const d = wrap.createEl("details", { cls: "obsidian-rag-thinking" }); if (m.streaming) d.open = true; d.createEl("summary", { text: m.streaming ? "思考中..." : "思考过程" }); const body = d.createDiv({ cls: "obsidian-rag-thinking-body" }); void MarkdownRenderer.render(this.app, m.thinking, body, "", this.plugin); }
      const bubble = wrap.createDiv({ cls: "obsidian-rag-bubble" }); void MarkdownRenderer.render(this.app, m.content || (m.streaming ? "_正在输出..._" : ""), bubble, "", this.plugin);
      if (m.sources?.length) { const sources = wrap.createDiv({ cls: "obsidian-rag-sources" }); for (const s of m.sources) { const parts = []; if (typeof s.similarity === "number") parts.push(`sim ${s.similarity.toFixed(3)}`); if (typeof s.rerank_score === "number") parts.push(`rerank ${s.rerank_score.toFixed(3)}`); const item = sources.createDiv({ cls: "obsidian-rag-source", text: `${s.relative_path ?? "unknown"}${parts.length ? ` · ${parts.join(" · ")}` : ""}` }); item.addEventListener("click", () => void this.openSource(s.relative_path)); } }
    }
    this.threadEl.scrollTop = this.threadEl.scrollHeight;
  }
  private stopBatchPolling() { if (this.batchPollTimer != null) { window.clearTimeout(this.batchPollTimer); this.batchPollTimer = null; } }
  private async pollBatchStatus(jobId?: string | null) {
    const targetJobId = jobId ?? this.batchJobId;
    if (!targetJobId) return;
    try {
      const r = await this.plugin.api<IndexBuildStatus>("/index/build/status", this.plugin.getBuildIndexStatusPayload(targetJobId));
      this.batchJobId = r.job_id ?? targetJobId;
      const counts = r.request_counts ?? { total: 0, completed: 0, failed: 0 };
      this.statusEl.setText(`批量索引 ${r.status} | ${counts.completed}/${counts.total} 完成 | failed ${counts.failed}`);
      if (r.status === "completed") {
        this.stopBatchPolling();
        new Notice(`obsidianRAG：批量索引完成，共 ${counts.completed}/${counts.total} 个切片。`, 5000);
        await this.refreshStatus();
        return;
      }
      if (["failed", "cancelled", "expired"].includes(r.status)) {
        this.stopBatchPolling();
        new Notice(`obsidianRAG：批量索引状态为 ${r.status}。${r.message ?? ""}`, 6000);
        await this.refreshStatus();
        return;
      }
      this.stopBatchPolling();
      this.batchPollTimer = window.setTimeout(() => void this.pollBatchStatus(this.batchJobId), this.plugin.settings.embeddingBatchPollSeconds * 1000);
    } catch (error) {
      this.stopBatchPolling();
      this.statusEl.setText(`批量索引轮询失败：${String(error)}`);
    }
  }
  async refreshStatus() {
    try {
      const s = await this.plugin.api<BackendStatus>("/status", this.plugin.getStatusPayload());
      const parts = [
        `${s.chat_provider}: ${s.chat_healthy ? "可用" : "未就绪"}`,
        `embedding: ${s.embedding_provider}`,
        `rerank: ${s.rerank_provider}`,
        `${s.indexed_files} 个文件`,
        `${s.vector_count} 个向量`,
      ];
      if (s.active_index_job) {
        this.batchJobId = s.active_index_job;
        parts.push(`active job: ${s.active_index_job}`);
        void this.pollBatchStatus(s.active_index_job);
      }
      if (s.needs_rebuild) {
        const reasonText = formatRebuildReasons(s.rebuild_reasons);
        parts.push(reasonText ? `需要重建索引: ${reasonText}` : "需要重建索引");
      }
      this.statusEl.setText(parts.join(" | "));
    } catch (error) {
      this.statusEl.setText(`后端不可用：${String(error)}`);
    }
  }
  async rebuildIndex() { this.statusEl.setText("正在构建索引..."); try { const r = await this.plugin.api<IndexBuildStatus>("/index/build", this.plugin.getBuildIndexPayload()); if (r.mode === "batch") { this.batchJobId = r.job_id ?? null; new Notice(`obsidianRAG：批量任务已提交。${r.message ?? ""}`, 5000); await this.pollBatchStatus(this.batchJobId); } else { new Notice(`obsidianRAG：已索引 ${r.file_count ?? 0} 个文件，生成 ${r.chunk_count ?? 0} 个切片。`, 5000); await this.refreshStatus(); } } catch (error) { new Notice(`obsidianRAG：重建索引失败：${String(error)}`, 8000); this.statusEl.setText("构建失败"); } }
  async cancelIndexBuild() { try { const r = await this.plugin.api<IndexBuildStatus>("/index/build/cancel", this.plugin.getBuildIndexStatusPayload(this.batchJobId)); this.stopBatchPolling(); this.batchJobId = null; new Notice(`obsidianRAG：${r.message ?? "已取消批量索引任务。"}`, 5000); await this.refreshStatus(); } catch (error) { new Notice(`obsidianRAG：取消批量索引失败：${String(error)}`, 8000); } }
  async sendMessage() {
    const query = this.inputEl.value.trim(); if (!query) return;
    const assistant: ChatMessage = { role: "assistant", content: "", thinking: "", sources: [], streaming: true };
    this.messages.push({ role: "user", content: query }); this.messages.push(assistant); this.inputEl.value = ""; this.renderMessages(); this.statusEl.setText("正在思考...");
    try {
      await this.plugin.stream("/chat/stream", this.plugin.getChatRequestPayload(query), (e) => {
        if (e.type === "session") this.plugin.currentSessionId = e.session_id;
        if (e.type === "thinking") { assistant.thinking = `${assistant.thinking ?? ""}${e.delta}`; this.scheduleRenderMessages(); }
        if (e.type === "content") { assistant.content += e.delta; this.scheduleRenderMessages(); }
        if (e.type === "sources") { assistant.sources = e.sources; this.scheduleRenderMessages(); }
        if (e.type === "done") { this.plugin.currentSessionId = e.session_id; assistant.content = e.answer; assistant.thinking = e.thinking ?? assistant.thinking; assistant.sources = e.sources; assistant.streaming = false; }
        if (e.type === "error") throw new Error(e.message);
      });
      assistant.streaming = false; this.renderMessages(); await this.refreshStatus();
    } catch (error) {
      assistant.streaming = false; const message = error instanceof Error ? error.message : String(error); assistant.content = assistant.content ? `${assistant.content}\n\n请求失败：${message}` : `请求失败：${message}`; this.renderMessages(); this.statusEl.setText("请求失败");
    }
  }
  async endSession() { try { const r = await this.plugin.api<{ exported_path?: string }>("/session/end", { vault_path: this.plugin.getVaultPath() }); new Notice(r.exported_path ? `obsidianRAG：聊天记录已导出到 ${r.exported_path}` : "obsidianRAG：当前会话为空。", 4000); this.messages = []; this.plugin.currentSessionId = null; this.renderMessages(); await this.refreshStatus(); } catch (error) { new Notice(`obsidianRAG：结束会话失败：${String(error)}`, 8000); } }
  async newSession() { await this.endSession(); }
  async onClose() { this.stopBatchPolling(); }
}

class ObsidianRAGSettingTab extends PluginSettingTab {
  plugin: ObsidianRAGPlugin;
  constructor(app: App, plugin: ObsidianRAGPlugin) { super(app, plugin); this.plugin = plugin; }
  private async save() { await this.plugin.saveSettings(); this.display(); }
  private section(title: string, desc: string) { this.containerEl.createEl("h3", { text: title }); this.containerEl.createEl("p", { text: desc, cls: "obsidian-rag-settings-section-desc" }); }
  private text(name: string, desc: string, value: string, onChange: (v: string) => Promise<void>, placeholder = "", password = false) { new Setting(this.containerEl).setName(name).setDesc(desc).addText((t) => { if (password) t.inputEl.type = "password"; t.setPlaceholder(placeholder).setValue(value).onChange((v) => void onChange(v)); }); }
  private number(name: string, desc: string, value: number | null, onChange: (v: number | null) => Promise<void>, step = "1", placeholder = "") { new Setting(this.containerEl).setName(name).setDesc(desc).addText((t) => { t.inputEl.type = "number"; t.inputEl.step = step; t.setPlaceholder(placeholder).setValue(value == null ? "" : String(value)).onChange((v) => { const n = v.trim() === "" ? null : Number(v); if (n === null || !Number.isNaN(n)) void onChange(n); }); }); }
  private toggle(name: string, desc: string, value: boolean, onChange: (v: boolean) => Promise<void>) { new Setting(this.containerEl).setName(name).setDesc(desc).addToggle((t) => t.setValue(value).onChange((v) => void onChange(v))); }
  private dropdown(name: string, desc: string, value: string, options: [string, string][], onChange: (v: string) => Promise<void>) { new Setting(this.containerEl).setName(name).setDesc(desc).addDropdown((d) => { for (const [v, l] of options) d.addOption(v, l); d.setValue(value).onChange((v) => void onChange(v)); }); }
  private button(name: string, desc: string, label: string, onClick: () => Promise<void>) { new Setting(this.containerEl).setName(name).setDesc(desc).addButton((b) => b.setButtonText(label).onClick(() => void onClick())); }
  private async test(path: string, body: Record<string, unknown>, label: string) { try { const r = await this.plugin.api<ProviderTestResponse>(path, body); new Notice(`${label} 成功：${r.message}`, 4000); } catch (error) { new Notice(`${label} 失败：${String(error)}`, 6000); } }

  display(): void {
    const s = this.plugin.settings; const c = this.containerEl; c.empty(); c.createEl("h2", { text: "obsidianRAG" }); c.createEl("div", { text: "Provider-aware Obsidian retrieval assistant", cls: "obsidian-rag-settings-credit" });
    this.section("Backend", "连接本地 Python FastAPI 后端。");
    this.text("Backend URL", "例如 http://127.0.0.1:8765", s.backendUrl, async (v) => { s.backendUrl = v.trim() || DEFAULT_SETTINGS.backendUrl; await this.save(); }, DEFAULT_SETTINGS.backendUrl);

    this.section("Chat", "聊天 provider 与模型配置。");
    this.dropdown("Chat Provider", "支持 Ollama 和 OpenAI-compatible。", s.chatProvider, [["ollama", "Ollama"], ["openai-compatible", "OpenAI-compatible"]], async (v) => { s.chatProvider = v as ObsidianRAGSettings["chatProvider"]; await this.save(); });
    this.text("Chat Base URL", "Ollama 可留空使用默认地址，OpenAI-compatible 必填。", s.chatApiBaseUrl, async (v) => { s.chatApiBaseUrl = v.trim(); await this.save(); }, "http://127.0.0.1:11434");
    if (s.chatProvider === "openai-compatible") this.text("Chat API Key", "远程聊天 provider 使用。", s.chatApiKey, async (v) => { s.chatApiKey = v.trim(); await this.save(); }, "sk-...", true);
    this.text("Chat Model", "聊天模型名称。", s.chatModel, async (v) => { s.chatModel = v.trim() || DEFAULT_SETTINGS.chatModel; await this.save(); }, DEFAULT_SETTINGS.chatModel);
    this.toggle("Enable Thinking", "开启模型思考/推理输出（若 provider 支持）。", s.enableThinking, async (v) => { s.enableThinking = v; await this.save(); });
    this.button("Chat Connection", "测试当前聊天 provider 配置。", "Test Chat Connection", async () => this.test("/provider/test/chat", { chat: this.plugin.getChatPayload() }, "Chat 连接测试"));

    this.section("Embedding", "控制 query embedding 和 realtime indexing embedding。");
    this.dropdown("Embedding Provider", "支持 sentence-transformers、vLLM、DashScope。", s.embeddingProvider, [["sentence-transformers", "sentence-transformers"], ["vllm", "vLLM"], ["dashscope", "DashScope"]], async (v) => { s.embeddingProvider = v as ObsidianRAGSettings["embeddingProvider"]; await this.save(); });
    if (s.embeddingProvider !== "sentence-transformers") this.text("Embedding Base URL", "本地 vLLM 或 DashScope compatible-mode 地址。", s.embeddingApiBaseUrl, async (v) => { s.embeddingApiBaseUrl = v.trim(); await this.save(); }, s.embeddingProvider === "dashscope" ? "https://dashscope.aliyuncs.com/compatible-mode/v1" : DEFAULT_SETTINGS.embeddingApiBaseUrl);
    if (s.embeddingProvider === "dashscope") this.text("Embedding API Key", "DashScope embedding key。", s.embeddingApiKey, async (v) => { s.embeddingApiKey = v.trim(); await this.save(); }, "sk-...", true);
    this.text("Embedding Model", "embedding 模型名称。", s.embeddingModel, async (v) => { s.embeddingModel = v.trim() || DEFAULT_SETTINGS.embeddingModel; await this.save(); }, DEFAULT_SETTINGS.embeddingModel);
    this.number("Embedding Dimensions", "0 表示使用 provider 默认维度。", s.embeddingDimensions, async (v) => { s.embeddingDimensions = Math.max(0, Math.floor(v ?? 0)); await this.save(); }, "1", "0");
    this.text("Embedding Encoding Format", "通常保持 float。", s.embeddingEncodingFormat, async (v) => { s.embeddingEncodingFormat = v.trim() || "float"; await this.save(); }, "float");
    this.button("Embedding Connection", "测试当前 embedding provider 配置。", "Test Embedding Connection", async () => this.test("/provider/test/embedding", { embedding: this.plugin.getEmbeddingPayload() }, "Embedding 连接测试"));

    this.section("Embedding Batch", "仅用于索引阶段，不进入实时问答链路。");
    this.toggle("Enable Embedding Batch", "启用后，索引模式可切换到 batch。", s.embeddingBatchEnabled, async (v) => { s.embeddingBatchEnabled = v; await this.save(); });
    this.dropdown("Indexing Mode", "realtime 为同步索引，batch 为离线批量索引。", s.indexingMode, [["realtime", "Realtime"], ["batch", "Batch"]], async (v) => { s.indexingMode = v as ObsidianRAGSettings["indexingMode"]; await this.save(); });
    [["Batch Base URL", "DashScope batch compatible-mode 地址。", "embeddingBatchApiBaseUrl", DEFAULT_SETTINGS.embeddingBatchApiBaseUrl], ["Completion Window", "例如 24h 到 336h。", "embeddingBatchCompletionWindow", DEFAULT_SETTINGS.embeddingBatchCompletionWindow], ["Batch Output Dir", "本地保存 batch 结果的目录。", "batchOutputDir", DEFAULT_SETTINGS.batchOutputDir], ["Batch Callback URL", "如果启用回调，请填写。", "batchCallbackUrl", "https://example.com/callback"]].forEach(([name, desc, key, placeholder]) => this.text(name, desc, (s as unknown as Record<string, string>)[key], async (v) => { (s as unknown as Record<string, string>)[key] = v.trim(); await this.save(); }, placeholder));
    this.text("Batch API Key", "Batch embedding 使用。", s.embeddingBatchApiKey, async (v) => { s.embeddingBatchApiKey = v.trim(); await this.save(); }, "sk-...", true);
    this.number("Batch Poll Seconds", "批量任务轮询间隔。", s.embeddingBatchPollSeconds, async (v) => { s.embeddingBatchPollSeconds = Math.max(5, Math.floor(v ?? 30)); await this.save(); }, "1", "30");
    this.toggle("Delete Remote Files", "下载结果后删除远端 batch 文件。", s.batchDeleteRemoteFilesAfterDownload, async (v) => { s.batchDeleteRemoteFilesAfterDownload = v; await this.save(); });
    this.toggle("Enable Batch Callback", "预留回调能力。", s.batchEnableCallback, async (v) => { s.batchEnableCallback = v; await this.save(); });
    this.button("Batch Embedding Connection", "测试 batch embedding 配置。", "Test Batch Embedding Connection", async () => this.test("/provider/test/batch-embedding", { embedding: this.plugin.getEmbeddingPayload(), batch: this.plugin.getBatchPayload() }, "Batch Embedding 连接测试"));

    this.section("Rerank", "控制 rerank provider 与排序参数。");
    this.dropdown("Rerank Provider", "支持 vLLM 与 DashScope。", s.rerankProvider, [["vllm", "vLLM"], ["dashscope", "DashScope"]], async (v) => { s.rerankProvider = v as ObsidianRAGSettings["rerankProvider"]; await this.save(); });
    this.text("Rerank Base URL", "本地 vLLM 或 DashScope rerank 地址。", s.rerankApiBaseUrl, async (v) => { s.rerankApiBaseUrl = v.trim(); await this.save(); }, s.rerankProvider === "dashscope" ? "https://dashscope.aliyuncs.com" : DEFAULT_SETTINGS.rerankApiBaseUrl);
    if (s.rerankProvider === "dashscope") this.text("Rerank API Key", "DashScope rerank key。", s.rerankApiKey, async (v) => { s.rerankApiKey = v.trim(); await this.save(); }, "sk-...", true);
    [["Rerank Model", "例如 qwen3-rerank / gte-rerank-v2。", "rerankModel", DEFAULT_SETTINGS.rerankModel], ["Rerank Instruction", "DashScope qwen3-rerank 可选 instruction。", "rerankInstruction", DEFAULT_SETTINGS.rerankInstruction]].forEach(([name, desc, key, placeholder]) => this.text(name, desc, (s as unknown as Record<string, string>)[key], async (v) => { (s as unknown as Record<string, string>)[key] = v.trim(); await this.save(); }, placeholder));
    this.number("Rerank Top N", "最终参与 rerank 的文档数。", s.rerankTopN, async (v) => { s.rerankTopN = Math.max(1, Math.floor(v ?? 10)); await this.save(); });
    this.toggle("Return Documents", "DashScope gte-rerank-v2 是否返回文档。", s.rerankReturnDocuments, async (v) => { s.rerankReturnDocuments = v; await this.save(); });
    this.number("Rerank Timeout Seconds", "rerank 请求超时。", s.rerankTimeoutSeconds, async (v) => { s.rerankTimeoutSeconds = Math.max(5, Math.floor(v ?? 60)); await this.save(); });
    this.button("Rerank Connection", "测试当前 rerank provider 配置。", "Test Rerank Connection", async () => this.test("/provider/test/rerank", { rerank: this.plugin.getRerankPayload() }, "Rerank 连接测试"));

    this.section("Retrieval", "控制召回、rerank 候选数和上下文预算。");
    this.number("Similarity Threshold", "相似度阈值，留空表示不过滤。", s.similarityThreshold, async (v) => { s.similarityThreshold = v; await this.save(); }, "0.01", "0.72");
    const numKeys: Array<[keyof ObsidianRAGSettings, string, string]> = [
      ["maxResults", "Max Results", "初步显示/保留的最大结果数。"], ["retrievalLimit", "Retrieval Limit", "向量初召的候选上限。"], ["rerankCandidates", "Rerank Candidates", "进入 rerank 的候选数量。"], ["finalNoteCount", "Final Note Count", "最终送入上下文的笔记数。"],
      ["chunkTargetTokens", "Chunk Target Tokens", "切片目标长度。"], ["chunkOverlapTokens", "Chunk Overlap Tokens", "切片重叠长度。"], ["chunkMaxTokens", "Chunk Max Tokens", "切片最大长度。"], ["neighborWindow", "Neighbor Window", "邻域扩展窗口。"],
      ["groupMergeMaxGap", "Group Merge Max Gap", "同笔记局部聚合时允许的间隔。"], ["finalGroupCountCap", "Final Group Count Cap", "最终上下文的 group 数上限。"], ["finalContextTokenBudget", "Final Context Token Budget", "最终上下文 token 预算。"], ["temporalWindowDays", "Temporal Window Days", "跨天扩展窗口。"],
    ];
    for (const [key, name, desc] of numKeys) this.number(name, desc, s[key] as number, async (v) => { s[key] = Math.max(0, Math.floor(v ?? 0)) as never; await this.save(); });
    [["enableTemporalExpansion", "Enable Temporal Expansion", "为 daily notes 预留时间扩展。"], ["enableSecondPassEntityExpansion", "Enable Second-pass Entity Expansion", "预留二次实体扩展。"], ["enableQueryRewrite", "Enable Query Rewrite", "预留 query rewrite。"]].forEach(([key, name, desc]) => this.toggle(name, desc, (s as unknown as Record<string, boolean>)[key], async (v) => { (s as unknown as Record<string, boolean>)[key] = v; await this.save(); }));

    this.section("UI / Behavior", "界面行为和当前 vault 信息。");
    this.toggle("Auto Open On Load", "Obsidian 启动时自动打开侧边栏。", s.autoOpenOnLoad, async (v) => { s.autoOpenOnLoad = v; await this.save(); });
    new Setting(c).setName("Vault Path").setDesc("由桌面端文件系统适配器自动解析。").addText((t) => t.setValue(this.plugin.getVaultPath()).setDisabled(true));
  }
}
