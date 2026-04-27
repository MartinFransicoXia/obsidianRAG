import { ItemView, WorkspaceLeaf } from "obsidian";
import { QueryRecord } from "../types";

export const VIEW_TYPE_RAG_HISTORY = "enhanced-rag-history-view";

/**
 * History view - shows recent queries
 */
export class HistoryView extends ItemView {
  private queries: QueryRecord[] = [];
  private onSelectQuery: ((query: string) => void) | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_RAG_HISTORY;
  }

  getDisplayText(): string {
    return "查询历史";
  }

  getIcon(): string {
    return "history";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  setQueries(queries: QueryRecord[]): void {
    this.queries = queries;
    this.render();
  }

  setOnSelectQuery(callback: (query: string) => void): void {
    this.onSelectQuery = callback;
  }

  private render(): void {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("rag-history-view");

    container.createEl("h3", { text: "最近查询" });

    if (this.queries.length === 0) {
      container.createEl("p", { text: "暂无查询历史", cls: "rag-history-empty" });
      return;
    }

    const list = container.createDiv("rag-history-list");
    for (const query of this.queries) {
      const item = list.createDiv("rag-history-item");

      const text = item.createDiv("rag-history-text");
      text.setText(query.text);

      const meta = item.createDiv("rag-history-meta");
      const date = new Date(query.timestamp);
      meta.setText(`${date.toLocaleDateString()} | ${query.retrievedCount} 结果`);

      item.addEventListener("click", () => {
        if (this.onSelectQuery) {
          this.onSelectQuery(query.text);
        }
      });
    }
  }
}
