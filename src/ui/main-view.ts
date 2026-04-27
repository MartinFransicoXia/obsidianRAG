import { ItemView, WorkspaceLeaf, MarkdownRenderer, Notice } from "obsidian";
import { ChatMessage, FusedResult, RankedArticle, KnowledgeUnit } from "../types";

export const VIEW_TYPE_RAG = "enhanced-rag-view";

/**
 * Main RAG chat view - conversation-based UI migrated from indexRAG
 */
export class MainRAGView extends ItemView {
  private messages: ChatMessage[] = [];
  private threadEl: HTMLElement | null = null;
  private inputEl: HTMLTextAreaElement | null = null;
  private statusEl: HTMLElement | null = null;

  private onSearch: ((query: string, onToken: (token: string) => void) => Promise<{ answer: string; sources: Array<{ path: string; title: string }> }>) | null = null;
  private onSelectResult: ((result: FusedResult) => void) | null = null;
  private onSelectUnit: ((unit: KnowledgeUnit) => void) | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_RAG;
  }

  getDisplayText(): string {
    return "Enhanced RAG";
  }

  getIcon(): string {
    return "brain";
  }

  async onOpen(): Promise<void> {
    this.renderLayout();
    this.setStatus("就绪");
  }

  setOnSearch(callback: (query: string, onToken: (token: string) => void) => Promise<{ answer: string; sources: Array<{ path: string; title: string }> }>): void {
    this.onSearch = callback;
  }

  setOnSelectResult(callback: (result: FusedResult) => void): void {
    this.onSelectResult = callback;
  }

  setOnSelectUnit(callback: (unit: KnowledgeUnit) => void): void {
    this.onSelectUnit = callback;
  }

  /**
   * Render the main layout: header + thread + composer
   */
  private renderLayout(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("rag-chat-view");

    // Header
    const header = contentEl.createDiv({ cls: "rag-chat-header" });
    header.createEl("h3", { text: "💬 Enhanced RAG" });
    this.statusEl = header.createDiv({ cls: "rag-chat-status" });

    const actions = header.createDiv({ cls: "rag-chat-actions" });
    this.makeBtn(actions, "💬 新会话", () => this.clearMessages());

    // Thread area
    this.threadEl = contentEl.createDiv({ cls: "rag-chat-thread" });
    this.renderMessages();

    // Composer (input area)
    const composer = contentEl.createDiv({ cls: "rag-chat-composer" });
    this.inputEl = composer.createEl("textarea", {
      cls: "rag-chat-input",
      attr: { placeholder: "输入问题，Enter 发送，Shift+Enter 换行" }
    });
    this.inputEl.addEventListener("keydown", async (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        await this.sendMessage();
      }
    });

    const footer = composer.createDiv({ cls: "rag-chat-footer" });
    this.makeBtn(footer, "发送", () => this.sendMessage()).addClass("rag-chat-send");
  }

  private makeBtn(parent: HTMLElement, text: string, onClick: () => void): HTMLElement {
    const btn = parent.createEl("button", { text, cls: "rag-chat-btn" });
    btn.addEventListener("click", onClick);
    return btn;
  }

  private setStatus(text: string): void {
    if (this.statusEl) this.statusEl.setText(text);
  }

  /**
   * Render all messages in the thread
   */
  private renderMessages(): void {
    if (!this.threadEl) return;
    this.threadEl.empty();

    if (this.messages.length === 0) {
      this.threadEl.createDiv({
        cls: "rag-chat-empty",
        text: "输入问题开始对话。基于你的笔记库检索并回答。"
      });
      return;
    }

    for (const msg of this.messages) {
      const wrap = this.threadEl.createDiv({ cls: `rag-chat-message ${msg.role}` });

      // Show sources for assistant messages
      if (msg.role === "assistant" && msg.sources?.length) {
        const sources = wrap.createDiv({ cls: "rag-chat-sources" });
        sources.createSpan({ text: "📄 来源：" });
        for (const src of msg.sources) {
          const link = sources.createEl("a", {
            text: src.title,
            cls: "rag-chat-source-link",
            attr: { title: src.path }
          });
          link.addEventListener("click", (e: Event) => {
            e.preventDefault();
            this.openFile(src.path);
          });
          sources.createSpan({ text: " " });
        }
      }

      const bubble = wrap.createDiv({ cls: "rag-chat-bubble" });
      if (msg.streaming) {
        bubble.createSpan({ text: msg.content || "思考中..." });
      } else {
        MarkdownRenderer.render(this.app, msg.content, bubble, "", this);
      }
    }

    this.threadEl.scrollTop = this.threadEl.scrollHeight;
  }

  private async openFile(path: string): Promise<void> {
    if (this.app.vault.getAbstractFileByPath(path)) {
      await this.app.workspace.openLinkText(path, "", true);
    }
  }

  private clearMessages(): void {
    this.messages = [];
    this.renderMessages();
  }

  /**
   * Send message: extract input, call search+LLM, stream response
   */
  async sendMessage(): Promise<void> {
    if (!this.inputEl) return;
    const query = this.inputEl.value.trim();
    if (!query) return;

    if (!this.onSearch) {
      new Notice("搜索回调未设置");
      return;
    }

    // Add user message
    this.messages.push({ role: "user", content: query });
    this.inputEl.value = "";

    // Add placeholder assistant message
    const assistantMsg: ChatMessage = { role: "assistant", content: "", streaming: true };
    this.messages.push(assistantMsg);
    this.renderMessages();
    this.setStatus("正在检索...");

    try {
      const result = await this.onSearch(query, (token: string) => {
        assistantMsg.content += token;
        assistantMsg.streaming = true;
        this.renderMessages();
      });

      assistantMsg.content = result.answer;
      assistantMsg.sources = result.sources;
      assistantMsg.streaming = false;
      this.setStatus(`检索完成，引用了 ${result.sources.length} 个文件`);
    } catch (e) {
      assistantMsg.content = `❌ 错误：${(e as Error).message}`;
      assistantMsg.streaming = false;
      this.setStatus("查询失败");
    }

    this.renderMessages();
  }

  async onClose(): Promise<void> {
    // cleanup if needed
  }
}
