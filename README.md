# Obsidian Enhanced RAG 插件

增强版 RAG（检索增强生成）插件，采用流水线架构，通过 Wiki Link 领域拓展和索引卡按需读取提升检索质量。

## 核心功能

### 流水线检索
```
用户查询
   │
   ▼
① 核心检索（BM25 + 向量 + 邻居拓展）
   │  定位候选文章，向量检索带邻居拓展扩大候选池
   ▼
② Wiki Link 领域拓展
   │  解析命中文章索引卡中的链接，发现关联文章
   ▼
③ 按需读取索引卡
   │  只读候选文章的卡片，不做全量扫描
   ▼
④ 两步排序
   │  第一步：BM25×0.55 + 向量×0.45 + 交叉命中加分 + 拓展降权
   │  第二步：索引卡字段加分（关键词/主题/领域匹配，上限 +0.25）
   ▼
最终结果（核心文章取完整内容，拓展文章取卡片摘要）
```

### 知识单元生成
- 自动识别主题并聚类相关文档
- 通过云端 AI 模型生成结构化知识单元
- 消除重复内容，补充缺失信息

### 历史感知
- 记录用户查询和交互历史
- 基于历史偏好优化检索排序
- 支持历史数据导出和导入

## 安装

1. 将插件文件夹复制到 Obsidian 插件目录：
   ```
   .obsidian/plugins/obsidian-enhanced-rag/
   ```

2. 文件结构：
   ```
   obsidian-enhanced-rag/
   ├── main.js          # 构建产物
   ├── manifest.json    # 插件清单
   └── styles.css       # 样式文件
   ```

3. 在 Obsidian 设置中启用插件

## 构建

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build

# 类型检查
npm run lint
```

## 配置

### API 配置
- **API Key**：DeepSeek API 密钥（向量检索和知识单元生成需要）
- **API Base URL**：API 基础地址，默认 `https://api.deepseek.com/v1`
- **Chat Model**：对话模型，默认 `deepseek-reasoner`
- **Merge Model**：内容合并模型，默认 `deepseek-chat`

### Embedding 配置
- **Embedding Model**：向量化模型，默认 `text-embedding-v4`
- **Embedding Base URL**：Embedding API 地址（留空则与 API Base URL 相同），如 `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **Embedding 维度**：向量维度，默认 1024

### Rerank 配置
- **启用 Rerank**：使用 Rerank 模型对检索结果二次排序
- **Rerank Model**：排序模型，如 `qwen3-rerank` / `gte-rerank-v2`
- **Rerank Base URL**：Rerank API 地址（留空则与 API Base URL 相同）

### 检索权重配置
- **关键词检索权重**：默认 0.40
- **索引检索权重**：默认 0.35
- **向量检索权重**：默认 0.25

### 性能配置
- **缓存大小**：LRU 缓存最大条目数，默认 100
- **历史保留天数**：默认 30 天
- **启用查询类型检测**：默认开启
- **自动生成索引卡**：文件保存时自动生成/更新索引卡到 00_INDEX/files/

## 使用方法

1. 点击左侧栏的 RAG 图标打开搜索面板
2. 输入查询内容，按 Enter 或点击搜索按钮
3. 查看 AI 回答和来源引用
4. 点击来源链接跳转到对应文档

### 命令
- **打开 RAG 搜索**：打开搜索面板
- **重建检索索引**：手动重建关键词 + 向量索引
- **重建索引卡**：扫描所有 Markdown 文件，重新生成 00_INDEX/files/ 下的索引卡

## 索引结构

插件从 `00_INDEX/files/` 目录读取结构化索引卡（YAML frontmatter + Markdown 格式）：

```yaml
---
doc_id: "path/to/file.md"
title: "文档标题"
path: "path/to/file.md"
scope: "mainline"
domain: "领域"
topic_primary: "主要主题"
one_line_summary: "一句话总结"
note_role: "concept"
source_hash: "a1b2c3d4..."
build_status: "success"
generated_at: "2026-04-28T12:00:00+00:00"
tags:
  - "标签1"
  - "标签2"
headings:
  - "标题1"
  - "标题2"
retrieval_keywords:
  - "关键词1"
  - "关键词2"
outlinks:
  - "关联文档1"
topic_secondary: []
question_types: []
best_for: []
not_for: []
read_with: []
---

# 文档标题

一句话总结内容
```

### 统一字段说明（19 字段）

| 分组 | 字段 | 说明 |
|------|------|------|
| 身份标识 | `doc_id`, `title`, `path`, `scope` | 文档基本标识 |
| 结构特征 | `tags`, `headings`, `outlinks` | 标签、大纲、Wiki Link |
| 语义分类 | `domain`, `topic_primary`, `note_role`, `retrieval_keywords` 等 | 领域/主题/类型/关键词 |
| 构建元数据 | `source_hash`, `build_status`, `generated_at` | 哈希增量 + 构建状态 |
| 上下文 | `content` | 原始内容截断 |

### 增量更新

- **单文件增量**：SHA1 哈希比对，内容不变则跳过
- **全量重建**：通过设置面板"重建索引卡"按钮触发，清理孤立卡片
- **自动触发**：开启"自动生成索引卡"后，文件保存时自动更新

## 技术架构

```
用户界面 (View Layer)
    ↓
检索流水线 (Retrieval Pipeline)
    ├── BM25 检索 (Keyword Retriever)
    ├── 向量检索 + 邻居拓展 (Vector Retriever)
    ├── Wiki Link 领域拓展 (Index Card Store)
    ├── 按需读卡 (On-demand Card Reading)
    └── 两步排序 (Ranker)
    ↓
历史增强 (History Boost)
    ↓
知识单元生成器 (Knowledge Generator)
    ↓
历史管理器 (History Manager)
    ↓
用户界面展示
```

## 注意事项

1. 向量检索和知识单元生成需要有效的 API Key
2. 无 API Key 时，插件仍可使用关键词检索
3. 首次使用会构建索引，大型库可能需要几分钟
4. 索引会自动增量更新
5. Wiki Link 拓展依赖 `00_INDEX/files/` 中的索引卡

## 许可证

MIT License
