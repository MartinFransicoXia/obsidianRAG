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
      .setDesc("用于内容合并的模型")
      .addText(text => text
        .setPlaceholder("deepseek-chat")
        .setValue(this.plugin.settings.mergeModel)
        .onChange(async (value) => {
          this.plugin.settings.mergeModel = value;
          await this.plugin.saveSettings();
        }));

    // Weight Configuration
    containerEl.createEl("h3", { text: "检索权重配置" });

    new Setting(containerEl)
      .setName("关键词检索权重")
      .setDesc("关键词检索的默认权重 (0-1)")
      .addSlider(slider => slider
        .setLimits(0, 1, 0.05)
        .setValue(this.plugin.settings.defaultWeights.keyword)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.defaultWeights.keyword = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("索引检索权重")
      .setDesc("索引检索的默认权重 (0-1)")
      .addSlider(slider => slider
        .setLimits(0, 1, 0.05)
        .setValue(this.plugin.settings.defaultWeights.index)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.defaultWeights.index = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName("向量检索权重")
      .setDesc("向量检索的默认权重 (0-1)")
      .addSlider(slider => slider
        .setLimits(0, 1, 0.05)
        .setValue(this.plugin.settings.defaultWeights.vector)
        .setDynamicTooltip()
        .onChange(async (value) => {
          this.plugin.settings.defaultWeights.vector = value;
          await this.plugin.saveSettings();
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
      .setName("启用查询类型检测")
      .setDesc("根据查询类型自动调整权重")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.enableQueryTypeDetection)
        .onChange(async (value) => {
          this.plugin.settings.enableQueryTypeDetection = value;
          await this.plugin.saveSettings();
        }));

    // UI Configuration
    containerEl.createEl("h3", { text: "界面配置" });

    new Setting(containerEl)
      .setName("自动打开面板")
      .setDesc("搜索时自动打开 RAG 面板")
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoOpenChatPanel)
        .onChange(async (value) => {
          this.plugin.settings.autoOpenChatPanel = value;
          await this.plugin.saveSettings();
        }));

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
