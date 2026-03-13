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
  llmProvider: "ollama",
  apiBaseUrl: "",
  apiKey: "",
  chatModel: "qwen3-vl:30b",
  enableThinking: false,
  similarityThreshold: 0.72,
  maxResults: 8,
  autoOpenOnLoad: true
};
var ObsidianRAGPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
    this.currentSessionId = null;
  }
  async onload() {
    await this.loadSettings();
    this.registerView(VIEW_TYPE_RAG, (leaf) => new ObsidianRAGView(leaf, this));
    this.addRibbonIcon("messages-square", "\u6253\u5F00 obsidianRAG", async () => {
      await this.activateView();
    });
    this.addCommand({
      id: "open-chat",
      name: "\u6253\u5F00\u804A\u5929\u9762\u677F",
      callback: async () => this.activateView()
    });
    this.addCommand({
      id: "rebuild-index",
      name: "\u91CD\u5EFA\u77E5\u8BC6\u5E93\u7D22\u5F15",
      callback: async () => {
        const view = await this.activateView();
        await view.rebuildIndex();
      }
    });
    this.addCommand({
      id: "end-chat-session",
      name: "\u7ED3\u675F\u5F53\u524D\u4F1A\u8BDD",
      callback: async () => {
        const view = await this.activateView();
        await view.endSession();
      }
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
  getVaultPath() {
    const adapter = this.app.vault.adapter;
    if (!(adapter instanceof import_obsidian.FileSystemAdapter)) {
      throw new Error("obsidianRAG \u4EC5\u652F\u6301\u684C\u9762\u7248\u6587\u4EF6\u7CFB\u7EDF\u9002\u914D\u5668\u3002");
    }
    return adapter.getBasePath();
  }
  getProviderPayload() {
    return {
      provider: this.settings.llmProvider,
      api_base: this.settings.apiBaseUrl.trim() || void 0,
      api_key: this.settings.apiKey.trim() || void 0,
      model: this.settings.chatModel,
      enable_thinking: this.settings.enableThinking
    };
  }
  async activateView() {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_RAG)[0];
    if (!leaf) {
      const rightLeaf = this.app.workspace.getRightLeaf(false);
      if (!rightLeaf) {
        throw new Error("\u65E0\u6CD5\u521B\u5EFA obsidianRAG \u4FA7\u8FB9\u680F\u89C6\u56FE\u3002");
      }
      leaf = rightLeaf;
      await leaf.setViewState({ type: VIEW_TYPE_RAG, active: true });
    }
    this.app.workspace.revealLeaf(leaf);
    return leaf.view;
  }
  async api(path, body) {
    const response = await fetch(`${this.settings.backendUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `HTTP ${response.status}`);
    }
    return await response.json();
  }
  async stream(path, body, onEvent) {
    const response = await fetch(`${this.settings.backendUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(detail || `HTTP ${response.status}`);
    }
    if (!response.body) {
      throw new Error("\u6D41\u5F0F\u54CD\u5E94\u4E0D\u53EF\u7528\u3002");
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
        onEvent(JSON.parse(trimmed));
      }
      if (done) {
        break;
      }
    }
    const trailing = buffer.trim();
    if (trailing) {
      onEvent(JSON.parse(trailing));
    }
  }
};
var ObsidianRAGView = class extends import_obsidian.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.messages = [];
    this.renderScheduled = false;
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
    this.makeButton(actions, "\u91CD\u5EFA", async () => this.rebuildIndex());
    this.makeButton(actions, "\u65B0\u5EFA", async () => this.newSession());
    this.makeButton(actions, "\u7ED3\u675F", async () => this.endSession());
    this.threadEl = contentEl.createDiv({ cls: "obsidian-rag-thread" });
    this.renderMessages();
    const composer = contentEl.createDiv({ cls: "obsidian-rag-composer" });
    this.inputEl = composer.createEl("textarea", {
      cls: "obsidian-rag-input",
      attr: { placeholder: "\u8F93\u5165\u95EE\u9898\uFF0CEnter \u53D1\u9001\uFF0CShift+Enter \u6362\u884C" }
    });
    this.inputEl.addEventListener("keydown", async (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        await this.sendMessage();
      }
    });
    const footer = composer.createDiv({ cls: "obsidian-rag-footer" });
    footer.createDiv({ cls: "obsidian-rag-hint", text: "\u6BCF\u8F6E\u90FD\u4F1A\u91CD\u65B0\u68C0\u7D22\u6574\u4E2A vault \u7684\u5DF2\u7D22\u5F15\u5185\u5BB9\u3002" });
    this.makeButton(footer, "\u53D1\u9001", async () => this.sendMessage());
  }
  makeButton(container, label, onClick) {
    const button = container.createEl("button", { cls: "obsidian-rag-button", text: label });
    button.addEventListener("click", () => void onClick());
    return button;
  }
  async copyToClipboard(text) {
    const normalized = text.trim();
    if (!normalized) {
      new import_obsidian.Notice("\u6CA1\u6709\u53EF\u590D\u5236\u7684\u5185\u5BB9", 2e3);
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
        text: "\u53F3\u4FA7\u680F\u804A\u5929\u9762\u677F\u5DF2\u5C31\u7EEA\u3002\u5148\u786E\u8BA4 Python \u540E\u7AEF\u5DF2\u7ECF\u542F\u52A8\uFF0C\u518D\u63D0\u95EE\u6216\u624B\u52A8\u91CD\u5EFA\u7D22\u5F15\u3002"
      });
      return;
    }
    for (const message of this.messages) {
      const wrap = this.threadEl.createDiv({ cls: `obsidian-rag-message ${message.role}` });
      const copyButton = wrap.createEl("button", {
        cls: "obsidian-rag-copy-button",
        attr: {
          type: "button",
          "aria-label": "\u590D\u5236\u6B64\u6D88\u606F",
          title: "\u590D\u5236\u6B64\u6D88\u606F"
        }
      });
      copyButton.addEventListener("click", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await this.copyToClipboard(wrap.innerText);
          new import_obsidian.Notice("\u5DF2\u590D\u5236", 1600);
        } catch (error) {
          new import_obsidian.Notice(`\u590D\u5236\u5931\u8D25\uFF1A${String(error)}`, 2600);
        }
      });
      if (message.thinking?.trim()) {
        const reasoning = wrap.createEl("details", { cls: "obsidian-rag-thinking" });
        if (message.streaming) {
          reasoning.open = true;
        }
        reasoning.createEl("summary", { text: message.streaming ? "\u601D\u8003\u4E2D..." : "\u601D\u8003\u8FC7\u7A0B" });
        const thinkingBody = reasoning.createDiv({ cls: "obsidian-rag-thinking-body" });
        void import_obsidian.MarkdownRenderer.render(this.app, message.thinking, thinkingBody, "", this.plugin);
      }
      const bubble = wrap.createDiv({ cls: "obsidian-rag-bubble" });
      const content = message.content || (message.streaming ? "_\u6B63\u5728\u8F93\u51FA..._" : "");
      void import_obsidian.MarkdownRenderer.render(this.app, content, bubble, "", this.plugin);
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
      const status = await this.plugin.api("/status", {
        vault_path: this.plugin.getVaultPath(),
        provider: this.plugin.settings.llmProvider,
        api_base: this.plugin.settings.apiBaseUrl.trim() || void 0,
        api_key: this.plugin.settings.apiKey.trim() || void 0
      });
      const providerLabel = status.llm_healthy ? `${status.llm_provider} \u5DF2\u8FDE\u63A5` : `${status.llm_provider} \u4E0D\u53EF\u7528`;
      const parts = [providerLabel, `${status.indexed_files} \u4E2A\u6587\u4EF6`, `${status.vector_count} \u4E2A\u5206\u5757`];
      if (status.needs_rebuild) {
        parts.push("\u5EFA\u8BAE\u91CD\u5EFA");
      }
      this.statusEl.setText(parts.join(" | "));
      if (status.needs_rebuild) {
        new import_obsidian.Notice("obsidianRAG\uFF1Avault \u5DF2\u53D8\u5316\uFF0C\u5EFA\u8BAE\u91CD\u5EFA\u7D22\u5F15\u3002", 5e3);
      }
    } catch (error) {
      this.statusEl.setText(`\u540E\u7AEF\u4E0D\u53EF\u7528\uFF1A${String(error)}`);
    }
  }
  async rebuildIndex() {
    this.statusEl.setText("\u6B63\u5728\u6784\u5EFA\u7D22\u5F15...");
    try {
      const result = await this.plugin.api("/index/build", {
        vault_path: this.plugin.getVaultPath()
      });
      new import_obsidian.Notice(`obsidianRAG\uFF1A\u5DF2\u7D22\u5F15 ${result.file_count} \u4E2A\u6587\u4EF6\u3002`);
      await this.refreshStatus();
    } catch (error) {
      new import_obsidian.Notice(`obsidianRAG\uFF1A\u91CD\u5EFA\u7D22\u5F15\u5931\u8D25\uFF1A${String(error)}`, 8e3);
      this.statusEl.setText("\u6784\u5EFA\u5931\u8D25");
    }
  }
  async sendMessage() {
    const query = this.inputEl.value.trim();
    if (!query) {
      return;
    }
    const assistantMessage = {
      role: "assistant",
      content: "",
      thinking: "",
      sources: [],
      streaming: true
    };
    this.messages.push({ role: "user", content: query });
    this.messages.push(assistantMessage);
    this.inputEl.value = "";
    this.renderMessages();
    this.statusEl.setText("\u6B63\u5728\u601D\u8003...");
    try {
      await this.plugin.stream(
        "/chat/stream",
        {
          vault_path: this.plugin.getVaultPath(),
          query,
          ...this.plugin.getProviderPayload(),
          threshold: this.plugin.settings.similarityThreshold,
          max_results: this.plugin.settings.maxResults
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
      assistantMessage.content = assistantMessage.content ? `${assistantMessage.content}

\u8BF7\u6C42\u5931\u8D25\uFF1A${message}` : `\u8BF7\u6C42\u5931\u8D25\uFF1A${message}`;
      this.renderMessages();
      this.statusEl.setText("\u8BF7\u6C42\u5931\u8D25");
    }
  }
  async endSession() {
    try {
      const result = await this.plugin.api("/session/end", {
        vault_path: this.plugin.getVaultPath()
      });
      if (result.exported_path) {
        new import_obsidian.Notice(`obsidianRAG\uFF1A\u804A\u5929\u8BB0\u5F55\u5DF2\u5BFC\u51FA\u5230 ${result.exported_path}`);
      } else {
        new import_obsidian.Notice("obsidianRAG\uFF1A\u5F53\u524D\u4F1A\u8BDD\u4E3A\u7A7A\u3002");
      }
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
};
var ObsidianRAGSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "obsidianRAG" });
    containerEl.createEl("div", { text: "BBX with codex", cls: "obsidian-rag-settings-credit" });
    new import_obsidian.Setting(containerEl).setName("\u540E\u7AEF\u5730\u5740").setDesc("Python \u540E\u7AEF\u5730\u5740\u3002\u4F7F\u7528\u63D2\u4EF6\u524D\u8BF7\u5148\u624B\u52A8\u542F\u52A8 backend/server.py\u3002").addText(
      (text) => text.setPlaceholder("http://127.0.0.1:8765").setValue(this.plugin.settings.backendUrl).onChange(async (value) => {
        this.plugin.settings.backendUrl = value.trim() || DEFAULT_SETTINGS.backendUrl;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u6A21\u578B\u63D0\u4F9B\u65B9").setDesc("\u9009\u62E9 Ollama \u6216\u517C\u5BB9 OpenAI \u7684 API \u540E\u7AEF\u3002").addDropdown(
      (dropdown) => dropdown.addOption("ollama", "Ollama").addOption("openai-compatible", "OpenAI \u517C\u5BB9\u63A5\u53E3").setValue(this.plugin.settings.llmProvider).onChange(async (value) => {
        this.plugin.settings.llmProvider = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u63D0\u4F9B\u65B9 Base URL").setDesc("Ollama \u53EF\u9009\u8986\u76D6\uFF0COpenAI \u517C\u5BB9\u63A5\u53E3\u5FC5\u586B\u3002\u4F8B\u5982\uFF1Ahttps://api.openai.com/v1").addText(
      (text) => text.setPlaceholder("http://127.0.0.1:11434").setValue(this.plugin.settings.apiBaseUrl).onChange(async (value) => {
        this.plugin.settings.apiBaseUrl = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("API \u5BC6\u94A5").setDesc("\u4EC5\u7528\u4E8E\u9700\u8981\u9274\u6743\u7684\u8FDC\u7A0B\u6A21\u578B\u63D0\u4F9B\u65B9\u3002").addText((text) => {
      text.inputEl.type = "password";
      text.setPlaceholder("sk-...").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value.trim();
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("\u804A\u5929\u6A21\u578B").setDesc("\u5F53\u524D\u6240\u9009\u6A21\u578B\u63D0\u4F9B\u65B9\u4F7F\u7528\u7684\u6A21\u578B\u540D\u79F0\u3002").addText(
      (text) => text.setPlaceholder("qwen3-vl:30b").setValue(this.plugin.settings.chatModel).onChange(async (value) => {
        this.plugin.settings.chatModel = value.trim() || DEFAULT_SETTINGS.chatModel;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u5F00\u542F\u601D\u8003\u8FC7\u7A0B").setDesc("\u5BF9\u4E8E DeepSeek \u7B49\u63D0\u4F9B\u65B9\uFF0C\u5728\u6A21\u578B\u652F\u6301\u65F6\u8BF7\u6C42\u5355\u72EC\u8FD4\u56DE reasoning/thinking \u5185\u5BB9\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.enableThinking).onChange(async (value) => {
        this.plugin.settings.enableThinking = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u76F8\u4F3C\u5EA6\u9608\u503C").setDesc("\u4F4E\u4E8E\u8FD9\u4E2A\u76F8\u4F3C\u5EA6\u5206\u6570\u7684\u6587\u672C\u5206\u5757\u5C06\u88AB\u5FFD\u7565\u3002").addSlider(
      (slider) => slider.setLimits(0.3, 0.95, 0.01).setValue(this.plugin.settings.similarityThreshold).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.similarityThreshold = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u6700\u5927\u53EC\u56DE\u6570").setDesc("\u6BCF\u6B21\u63D0\u95EE\u6700\u591A\u8FD4\u56DE\u7684\u68C0\u7D22\u5206\u5757\u6570\u91CF\u4E0A\u9650\u3002").addSlider(
      (slider) => slider.setLimits(2, 16, 1).setValue(this.plugin.settings.maxResults).setDynamicTooltip().onChange(async (value) => {
        this.plugin.settings.maxResults = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u542F\u52A8\u65F6\u81EA\u52A8\u6253\u5F00\u4FA7\u8FB9\u680F").setDesc("Obsidian \u542F\u52A8\u65F6\u81EA\u52A8\u6253\u5F00\u804A\u5929\u9762\u677F\u3002").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoOpenOnLoad).onChange(async (value) => {
        this.plugin.settings.autoOpenOnLoad = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Vault \u8DEF\u5F84").setDesc("\u7531\u684C\u9762\u7248\u6587\u4EF6\u7CFB\u7EDF\u9002\u914D\u5668\u81EA\u52A8\u89E3\u6790\u3002").addText((text) => text.setValue(this.plugin.getVaultPath()).setDisabled(true));
  }
};
