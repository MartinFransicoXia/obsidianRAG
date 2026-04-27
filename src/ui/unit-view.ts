import { ItemView, WorkspaceLeaf } from "obsidian";
import { KnowledgeUnit } from "../types";

export const VIEW_TYPE_RAG_UNIT = "enhanced-rag-unit-view";

/**
 * Knowledge unit detail view
 */
export class UnitDetailView extends ItemView {
  private unit: KnowledgeUnit | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_RAG_UNIT;
  }

  getDisplayText(): string {
    return this.unit ? `知识单元: ${this.unit.topic}` : "知识单元详情";
  }

  getIcon(): string {
    return "book-open";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  setUnit(unit: KnowledgeUnit): void {
    this.unit = unit;
    this.render();
  }

  private render(): void {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("rag-unit-detail");

    if (!this.unit) {
      container.createEl("p", { text: "请选择一个知识单元查看详情" });
      return;
    }

    // Header
    container.createEl("h2", { text: this.unit.topic });

    // Meta info
    const meta = container.createDiv("rag-unit-detail-meta");
    meta.createEl("span", { text: `相关性: ${this.unit.relevanceScore.toFixed(2)}` });
    meta.createEl("span", { text: `源文档数: ${this.unit.sourceCount}` });
    if (this.unit.historyBoost > 0) {
      meta.createEl("span", { text: `历史加成: +${this.unit.historyBoost.toFixed(2)}` });
    }

    // Summary
    container.createEl("h3", { text: "摘要" });
    container.createEl("p", { text: this.unit.summary, cls: "rag-unit-detail-summary" });

    // Key points
    if (this.unit.keyPoints.length > 0) {
      container.createEl("h3", { text: "关键点" });
      const list = container.createEl("ul");
      for (const point of this.unit.keyPoints) {
        list.createEl("li", { text: point });
      }
    }

    // Suggested usage
    if (this.unit.suggestedUsage) {
      container.createEl("h3", { text: "建议使用" });
      container.createEl("p", { text: this.unit.suggestedUsage });
    }

    // Source documents
    if (this.unit.sourceDocuments.length > 0) {
      container.createEl("h3", { text: "源文档" });
      const list = container.createEl("ul", { cls: "rag-source-list" });
      for (const docId of this.unit.sourceDocuments) {
        const item = list.createEl("li");
        const link = item.createEl("a", { text: docId });
        link.href = "#";
        link.addEventListener("click", (e) => {
          e.preventDefault();
          // Open the document
          const file = this.app.vault.getAbstractFileByPath(docId);
          if (file) {
            this.app.workspace.openLinkText(docId, "");
          }
        });
      }
    }
  }
}
