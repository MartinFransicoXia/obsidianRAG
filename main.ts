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

type SourceItem = {
  relative_path?: string;
  filepath?: string;
  similarity?: number;
  chunk_id?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  thinking?: string;
  sources?: SourceItem[];
  streaming?: boolean;
};

type BackendStatus = {
  indexed_files: number;
  vector_count: number;
  needs_rebuild: boolean;
  last_indexed_at?: string;
  llm_provider: string;
  llm_healthy: boolean;
  ollama_healthy?: boolean;
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
  llmProvider: string;
  apiBaseUrl: string;
  apiKey: string;
  chatModel: string;
  enableThinking: boolean;
  similarityThreshold: number;
  maxResults: number;
  autoOpenOnLoad: boolean;
}

const DEFAULT_SETTINGS: ObsidianRAGSettings = {
  backendUrl: "http://127.0.0.1:8765",
  llmProvider: "ollama",
  apiBaseUrl: "",
  apiKey: "",
  chatModel: "qwen3-vl:30b",
  enableThinking: false,
  similarityThreshold: 0.72,
  maxResults: 8,
  autoOpenOnLoad: true,
};

export default class ObsidianRAGPlugin extends Plugin {
  settings: ObsidianRAGSettings = DEFAULT_SETTINGS;
  currentSessionId: string | null = null;

  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_RAG, (leaf) => new ObsidianRAGView(leaf, this));
    this.addRibbonIcon("messages-square", "打开 obsidianRAG", async () => {
      await this.activateView();
    });
    this.addCommand({
      id: "open-chat",
      name: "打开聊天面板",
      callback: async () => this.activateView(),
    });
    this.addCommand({
      id: "rebuild-index",
      name: "重建知识库索引",
      callback: async () => {
        const view = await this.activateView();
        await view.rebuildIndex();
      },
    });
    this.addCommand({
      id: "end-chat-session",
      name: "结束当前会话",
      callback: async () => {
        const view = await this.activateView();
        await view.endSession();
      },
    });
    this.addSettingTab(new ObsidianRAGSettingTab(this.app, this));

    if (this.settings.autoOpenOnLoad) {
      void this.activateView();
    }
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_RAG);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  getVaultPath(): string {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof FileSystemAdapter)) {
      throw new Error("obsidianRAG 仅支持桌面版文件系统适配器。");
    }
    return adapter.getBasePath();
  }

  getProviderPayload() {
    return {
      provider: this.settings.llmProvider,
      api_base: this.settings.apiBaseUrl.trim() || undefined,
      api_key: this.settings.apiKey.trim() || undefined,
      model: this.settings.chatModel,
      enable_thinking: this.settings.enableThinking,
    };
  }

  async activateView(): Promise<ObsidianRAGView> {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_RAG)[0];
    if (!leaf) {
      const rightLeaf = this.app.workspace.getRightLeaf(false);
      if (!rightLeaf) {
        throw new Error("无法创建 obsidianRAG 侧边栏视图。");
      }
      leaf = rightLeaf;
      await leaf.setViewState({ type: VIEW_TYPE_RAG, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    return leaf.view as ObsidianRAGView;
  }

  async api<T>(path: string, body: Record<string, unknown>): Promise<T> {
    console.debug("obsidianRAG api request", { path, body, backendUrl: this.settings.backendUrl });
    const response = await fetch(`${this.settings.backendUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("obsidianRAG api error", { path, status: response.status, detail });
      throw new Error(detail || `HTTP ${response.status}`);
    }
    const payload = (await response.json()) as T;
    console.debug("obsidianRAG api response", { path, payload });
    return payload;
  }

  async stream(path: string, body: Record<string, unknown>, onEvent: (event: ChatStreamEvent) => void): Promise<void> {
    const response = await fetch(`${this.settings.backendUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `HTTP ${response.status}`);
    }
    if (!response.body) {
      throw new Error("流式响应不可用。");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          continue;
        }
        onEvent(JSON.parse(trimmed) as ChatStreamEvent);
      }

      if (done) {
        break;
      }
    }

    const trailing = buffer.trim();
    if (trailing) {
      onEvent(JSON.parse(trailing) as ChatStreamEvent);
    }
  }
}

class ObsidianRAGView extends ItemView {
  plugin: ObsidianRAGPlugin;
  threadEl!: HTMLDivElement;
  statusEl!: HTMLDivElement;
  inputEl!: HTMLTextAreaElement;
  messages: ChatMessage[] = [];
  private renderScheduled = false;

  constructor(leaf: WorkspaceLeaf, plugin: ObsidianRAGPlugin) {
    super(leaf);
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
    this.statusEl = heading.createDiv({ cls: "obsidian-rag-status", text: "正在连接后端..." });

    const actions = header.createDiv({ cls: "obsidian-rag-actions" });
    this.makeButton(actions, "重建", async () => this.rebuildIndex());
    this.makeButton(actions, "新建", async () => this.newSession());
    this.makeButton(actions, "结束", async () => this.endSession());

    this.threadEl = contentEl.createDiv({ cls: "obsidian-rag-thread" });
    this.renderMessages();

    const composer = contentEl.createDiv({ cls: "obsidian-rag-composer" });
    this.inputEl = composer.createEl("textarea", {
      cls: "obsidian-rag-input",
      attr: { placeholder: "输入问题，Enter 发送，Shift+Enter 换行" },
    });
    this.inputEl.addEventListener("keydown", async (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        await this.sendMessage();
      }
    });

    const footer = composer.createDiv({ cls: "obsidian-rag-footer" });
    footer.createDiv({ cls: "obsidian-rag-hint", text: "每轮都会重新检索整个 vault 的已索引内容。" });
    this.makeButton(footer, "发送", async () => this.sendMessage());
  }

  makeButton(container: HTMLElement, label: string, onClick: () => Promise<void> | void) {
    const button = container.createEl("button", { cls: "obsidian-rag-button", text: label });
    button.addEventListener("click", () => void onClick());
    return button;
  }

  private async copyToClipboard(text: string): Promise<void> {
    const normalized = text.trim();
    if (!normalized) {
      new Notice("没有可复制的内容", 2000);
      return;
    }

    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(normalized);
      return;
    }

    const helper = document.createElement("textarea");
    helper.value = normalized;
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.focus();
    helper.select();
    document.execCommand("copy");
    helper.remove();
  }

  scheduleRenderMessages() {
    if (this.renderScheduled) {
      return;
    }
    this.renderScheduled = true;
    window.setTimeout(() => {
      this.renderScheduled = false;
      this.renderMessages();
    }, 40);
  }

  renderMessages() {
    this.threadEl.empty();
    if (!this.messages.length) {
      this.threadEl.createDiv({
        cls: "obsidian-rag-empty",
        text: "右侧栏聊天面板已就绪。先确认 Python 后端已经启动，再提问或手动重建索引。",
      });
      return;
    }

    for (const message of this.messages) {
      const wrap = this.threadEl.createDiv({ cls: `obsidian-rag-message ${message.role}` });
      const copyButton = wrap.createEl("button", {
        cls: "obsidian-rag-copy-button",
        attr: {
          type: "button",
          "aria-label": "复制此消息",
          title: "复制此消息",
        },
      });
      copyButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await this.copyToClipboard(wrap.innerText);
          new Notice("已复制", 1600);
        } catch (error) {
          new Notice(`复制失败：${String(error)}`, 2600);
        }
      });

      if (message.thinking?.trim()) {
        const reasoning = wrap.createEl("details", { cls: "obsidian-rag-thinking" });
        if (message.streaming) {
          reasoning.open = true;
        }
        reasoning.createEl("summary", { text: message.streaming ? "思考中..." : "思考过程" });
        const thinkingBody = reasoning.createDiv({ cls: "obsidian-rag-thinking-body" });
        void MarkdownRenderer.render(this.app, message.thinking, thinkingBody, "", this.plugin);
      }

      const bubble = wrap.createDiv({ cls: "obsidian-rag-bubble" });
      const content = message.content || (message.streaming ? "_正在输出..._" : "");
      void MarkdownRenderer.render(this.app, content, bubble, "", this.plugin);

      if (message.sources?.length) {
        const sources = wrap.createDiv({ cls: "obsidian-rag-sources" });
        for (const source of message.sources) {
          const similarity = typeof source.similarity === "number" ? ` ${source.similarity.toFixed(3)}` : "";
          sources.createDiv({ cls: "obsidian-rag-source", text: `${source.relative_path ?? "unknown"}${similarity}` });
        }
      }
    }
    this.threadEl.scrollTop = this.threadEl.scrollHeight;
  }

  async refreshStatus() {
    try {
      const status = await this.plugin.api<BackendStatus>("/status", {
        vault_path: this.plugin.getVaultPath(),
        provider: this.plugin.settings.llmProvider,
        api_base: this.plugin.settings.apiBaseUrl.trim() || undefined,
        api_key: this.plugin.settings.apiKey.trim() || undefined,
      });
      const providerLabel = status.llm_healthy
        ? `${status.llm_provider} 已连接`
        : `${status.llm_provider} 不可用`;
      const parts = [providerLabel, `${status.indexed_files} 个文件`, `${status.vector_count} 个分块`];
      if (status.needs_rebuild) {
        parts.push("建议重建");
      }
      this.statusEl.setText(parts.join(" | "));
      if (status.needs_rebuild) {
        new Notice("obsidianRAG：vault 已变化，建议重建索引。", 5000);
      }
    } catch (error) {
      this.statusEl.setText(`后端不可用：${String(error)}`);
    }
  }

  async rebuildIndex() {
    this.statusEl.setText("正在构建索引...");
    try {
      const result = await this.plugin.api<{ file_count: number; chunk_count: number }>("/index/build", {
        vault_path: this.plugin.getVaultPath(),
      });
      new Notice(`obsidianRAG：已索引 ${result.file_count} 个文件。`);
      await this.refreshStatus();
    } catch (error) {
      new Notice(`obsidianRAG：重建索引失败：${String(error)}`, 8000);
      this.statusEl.setText("构建失败");
    }
  }

  async sendMessage() {
    const query = this.inputEl.value.trim();
    if (!query) {
      return;
    }

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      thinking: "",
      sources: [],
      streaming: true,
    };

    this.messages.push({ role: "user", content: query });
    this.messages.push(assistantMessage);
    this.inputEl.value = "";
    this.renderMessages();
    this.statusEl.setText("正在思考...");

    try {
      await this.plugin.stream(
        "/chat/stream",
        {
          vault_path: this.plugin.getVaultPath(),
          query,
          ...this.plugin.getProviderPayload(),
          threshold: this.plugin.settings.similarityThreshold,
          max_results: this.plugin.settings.maxResults,
        },
        (event) => {
          switch (event.type) {
            case "session":
              this.plugin.currentSessionId = event.session_id;
              break;
            case "thinking":
              assistantMessage.thinking = `${assistantMessage.thinking ?? ""}${event.delta}`;
              this.scheduleRenderMessages();
              break;
            case "content":
              assistantMessage.content += event.delta;
              this.scheduleRenderMessages();
              break;
            case "sources":
              assistantMessage.sources = event.sources;
              this.scheduleRenderMessages();
              break;
            case "done":
              this.plugin.currentSessionId = event.session_id;
              assistantMessage.content = event.answer;
              assistantMessage.thinking = event.thinking ?? assistantMessage.thinking;
              assistantMessage.sources = event.sources;
              assistantMessage.streaming = false;
              break;
            case "error":
              throw new Error(event.message);
          }
        }
      );
      assistantMessage.streaming = false;
      this.renderMessages();
      await this.refreshStatus();
    } catch (error) {
      assistantMessage.streaming = false;
      const message = error instanceof Error ? error.message : String(error);
      assistantMessage.content = assistantMessage.content
        ? `${assistantMessage.content}\n\n请求失败：${message}`
        : `请求失败：${message}`;
      this.renderMessages();
      this.statusEl.setText("请求失败");
    }
  }

  async endSession() {
    try {
      const result = await this.plugin.api<{ exported_path?: string }>("/session/end", {
        vault_path: this.plugin.getVaultPath(),
      });
      if (result.exported_path) {
        new Notice(`obsidianRAG：聊天记录已导出到 ${result.exported_path}`);
      } else {
        new Notice("obsidianRAG：当前会话为空。");
      }
      this.messages = [];
      this.plugin.currentSessionId = null;
      this.renderMessages();
      await this.refreshStatus();
    } catch (error) {
      new Notice(`obsidianRAG：结束会话失败：${String(error)}`, 8000);
    }
  }

  async newSession() {
    await this.endSession();
  }
}

class ObsidianRAGSettingTab extends PluginSettingTab {
  plugin: ObsidianRAGPlugin;

  constructor(app: App, plugin: ObsidianRAGPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "obsidianRAG" });
    containerEl.createEl("div", { text: "BBX with codex", cls: "obsidian-rag-settings-credit" });

    new Setting(containerEl)
      .setName("后端地址")
      .setDesc("Python 后端地址。使用插件前请先手动启动 backend/server.py。")
      .addText((text) =>
        text.setPlaceholder("http://127.0.0.1:8765").setValue(this.plugin.settings.backendUrl).onChange(async (value) => {
          this.plugin.settings.backendUrl = value.trim() || DEFAULT_SETTINGS.backendUrl;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("模型提供方")
      .setDesc("选择 Ollama 或兼容 OpenAI 的 API 后端。")
      .addDropdown((dropdown) =>
        dropdown
          .addOption("ollama", "Ollama")
          .addOption("openai-compatible", "OpenAI 兼容接口")
          .setValue(this.plugin.settings.llmProvider)
          .onChange(async (value) => {
            this.plugin.settings.llmProvider = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("提供方 Base URL")
      .setDesc("Ollama 可选覆盖，OpenAI 兼容接口必填。例如：https://api.openai.com/v1")
      .addText((text) =>
        text.setPlaceholder("http://127.0.0.1:11434").setValue(this.plugin.settings.apiBaseUrl).onChange(async (value) => {
          this.plugin.settings.apiBaseUrl = value.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("API 密钥")
      .setDesc("仅用于需要鉴权的远程模型提供方。")
      .addText((text) => {
        text.inputEl.type = "password";
        text.setPlaceholder("sk-...")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("聊天模型")
      .setDesc("当前所选模型提供方使用的模型名称。")
      .addText((text) =>
        text.setPlaceholder("qwen3-vl:30b").setValue(this.plugin.settings.chatModel).onChange(async (value) => {
          this.plugin.settings.chatModel = value.trim() || DEFAULT_SETTINGS.chatModel;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("开启思考过程")
      .setDesc("对于 DeepSeek 等提供方，在模型支持时请求单独返回 reasoning/thinking 内容。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableThinking).onChange(async (value) => {
          this.plugin.settings.enableThinking = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("相似度阈值")
      .setDesc("低于这个相似度分数的文本分块将被忽略。")
      .addSlider((slider) =>
        slider
          .setLimits(0.3, 0.95, 0.01)
          .setValue(this.plugin.settings.similarityThreshold)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.similarityThreshold = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("最大召回数")
      .setDesc("每次提问最多返回的检索分块数量上限。")
      .addSlider((slider) =>
        slider
          .setLimits(2, 16, 1)
          .setValue(this.plugin.settings.maxResults)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxResults = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("启动时自动打开侧边栏")
      .setDesc("Obsidian 启动时自动打开聊天面板。")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.autoOpenOnLoad).onChange(async (value) => {
          this.plugin.settings.autoOpenOnLoad = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Vault 路径")
      .setDesc("由桌面版文件系统适配器自动解析。")
      .addText((text) => text.setValue(this.plugin.getVaultPath()).setDisabled(true));
  }
}
