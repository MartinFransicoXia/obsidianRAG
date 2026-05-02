import { App, PluginSettingTab, Setting } from "obsidian";
import EnhancedRAGPlugin from "./main";
import { PluginSettings } from "./types";

/**
 * Settings tab for Enhanced RAG plugin
 */
export class RAGSettingTab extends PluginSettingTab {
  plugin: EnhancedRAGPlugin;

  constructor(app: App, plugin: EnhancedRAGPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Enhanced RAG 设置" });

    // API Configuration
    containerEl.createEl("h3", { text: "API 配置" });

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("DeepSeek API 密钥")
      .addText(text => text
        .setPlaceholder("sk-...")
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("API Base URL")
      .setDesc("API 基础地址")
      .addText(text => text
        .setPlaceholder("https://api.deepseek.com/v1")
        .setValue(this.plugin.settings.apiBaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.apiBaseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Chat Model")
      .setDesc("用于对话和推理的模型")
      .addText(text => text
        .setPlaceholder("deepseek-reasoner")
        .setValue(this.plugin.settings.chatModel)
        .onChange(async (value) => {
          this.plugin.settings.chatModel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Merge Model")
      .setDesc("知识单元聚合并用的模型（可共用 Chat Model）")
      .addText(text => text
        .setPlaceholder("deepseek-chat")
        .setValue(this.plugin.settings.mergeModel)
        .onChange(async (value) => {
          this.plugin.settings.mergeModel = value;
          await this.plugin.saveSettings();
        }));

    // Embedding Configuration
    containerEl.createEl("h3", { text: "Embedding 配置" });

    new Setting(containerEl)
      .setName("Embedding Model")
      .setDesc("向量化模型（如 text-embedding-v4）")
      .addText(text => text
        .setPlaceholder("text-embedding-v4")
        .setValue(this.plugin.settings.embeddingModel)
        .onChange(async (value) => {
          this.plugin.settings.embeddingModel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Embedding Base URL")
      .setDesc("Embedding API 地址（留空则与 API Base URL 相同）")
      .addText(text => text
        .setPlaceholder("https://dashscope.aliyuncs.com/compatible-mode/v1")
        .setValue(this.plugin.settings.embeddingBaseUrl)
        .onChange(async (value) => {
          this.plugin.settings.embeddingBaseUrl = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Embedding API Key")
      .setDesc("Embedding API 密钥（留空则使用 Chat 的 API Key）")
      .addText(text => text
        .setPlaceholder("留空则共用")
        .setValue(this.plugin.settings.embeddingApiKey)
        .onChange(async (value) => {
          this.plugin.settings.embeddingApiKey = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("Embedding 维度")
      .setDesc("向量维度（text-embedding-v4 支持 64-2048）")
      .addText(text => text
        .setPlaceholder("1024")
        .setValue(String(this.plugin.settings.embeddingDimensions))
        .onChange(async (value) => {
          const num = parseInt(value, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.embeddingDimensions = num;
            await this.plugin.saveSettings();
          }
        }));

    // Index Card Enrichment
    containerEl.createEl("h3", { text: "索引卡语义填充" });

    new Setting(containerEl)
      .setName("填充模型")
      .setDesc("用于填充 one_line_summary / topic_secondary / question_types / best_for / not_for 的模型")
      .addText(text => text
        .setPlaceholder("deepseek-chat")
        .setValue(this.plugin.settings.enrichModel)
        .onChange(async (value) => {
          this.plugin.settings.enrichModel = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("LLM 填充语义字段")
      .setDesc("调用 LLM 批量填充所有索引卡的 5 个语义字段（需要已配置 API Key）")
      .addButton(button => button
        .setButtonText("开始填充")
        .onClick(async () => {
          button.setButtonText("填充中...");
          try {
            await this.plugin.enrichIndexCards();
            button.setButtonText("完成");
          } catch (e) {
            button.setButtonText("失败");
          }
          setTimeout(() => button.setButtonText("开始填充"), 2000);
        }));

    // Performance Configuration
    containerEl.createEl("h3", { text: "性能配置" });

    new Setting(containerEl)
      .setName("缓存大小")
      .setDesc("LRU 缓存最大条目数")
      .addText(text => text
        .setPlaceholder("100")
        .setValue(String(this.plugin.settings.cacheSize))
        .onChange(async (value) => {
          const num = parseInt(value, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.cacheSize = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName("历史保留天数")
      .setDesc("历史数据保留天数")
      .addText(text => text
        .setPlaceholder("30")
        .setValue(String(this.plugin.settings.historyRetentionDays))
        .onChange(async (value) => {
          const num = parseInt(value, 10);
          if (!isNaN(num) && num > 0) {
            this.plugin.settings.historyRetentionDays = num;
            await this.plugin.saveSettings();
          }
        }));

    new Setting(containerEl)
      .setName("自动生成索引卡")
      .setDesc("文件保存时自动生成/更新索引卡到 00_INDEX/files/")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoGenerateCards)
        .onChange(async (value) => {
          this.plugin.settings.autoGenerateCards = value;
          await this.plugin.saveSettings();
        }));

    // Local API Server
    containerEl.createEl("h3", { text: "本地 API 服务" });

    new Setting(containerEl)
      .setName("启用本地 API")
      .setDesc("启动本地 HTTP 服务，暴露检索接口给 Hermes/OpenClaw 等 Agent 调用")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.localServerEnabled)
        .onChange(async (value) => {
          this.plugin.settings.localServerEnabled = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("监听端口")
      .setDesc("本地 API 服务端口号（监听 0.0.0.0，允 WSL/局域网访问）")
      .addText(text => text
        .setPlaceholder("8765")
        .setValue(String(this.plugin.settings.localServerPort))
        .onChange(async (value) => {
          const num = parseInt(value, 10);
          if (!isNaN(num) && num > 0 && num < 65536) {
            this.plugin.settings.localServerPort = num;
            await this.plugin.saveSettings();
          }
        }));

    // UI Configuration
    containerEl.createEl("h3", { text: "界面配置" });

    new Setting(containerEl)
      .setName("显示知识单元")
      .setDesc("在结果中显示知识单元")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showKnowledgeUnits)
        .onChange(async (value) => {
          this.plugin.settings.showKnowledgeUnits = value;
          await this.plugin.saveSettings();
        }));

    // Management
    containerEl.createEl("h3", { text: "数据管理" });

    new Setting(containerEl)
      .setName("重建索引")
      .setDesc("重建检索索引（清除并重新构建关键词和向量索引）")
      .addButton(button => button
        .setButtonText("重建")
        .onClick(async () => {
          await this.plugin.rebuildIndexes();
          button.setButtonText("完成");
          setTimeout(() => button.setButtonText("重建"), 2000);
        }));

    new Setting(containerEl)
      .setName("重建索引卡")
      .setDesc("扫描所有 Markdown 文件，重新生成 00_INDEX/files/ 下的索引卡")
      .addButton(button => button
        .setButtonText("重建")
        .onClick(async () => {
          await this.plugin.rebuildIndexCards();
          button.setButtonText("完成");
          setTimeout(() => button.setButtonText("重建"), 2000);
        }));

    new Setting(containerEl)
      .setName("清除缓存")
      .setDesc("清除所有缓存数据")
      .addButton(button => button
        .setButtonText("清除")
        .onClick(async () => {
          await this.plugin.clearCache();
          button.setButtonText("已清除");
          setTimeout(() => button.setButtonText("清除"), 2000);
        }));

    new Setting(containerEl)
      .setName("重置历史")
      .setDesc("清除所有查询和交互历史")
      .addButton(button => button
        .setButtonText("重置")
        .setWarning()
        .onClick(async () => {
          await this.plugin.clearHistory();
          button.setButtonText("已重置");
          setTimeout(() => button.setButtonText("重置"), 2000);
        }));
  }
}
