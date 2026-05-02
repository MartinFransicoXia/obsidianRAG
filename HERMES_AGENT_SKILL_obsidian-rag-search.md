---
name: obsidian-rag-search
description: "Call Obsidian Enhanced RAG plugin's local API server, then read full content from the C: drive vault."
---

# Obsidian RAG Search — Query Workflow

## Overview

Three task categories:
1. **查询类** — User asks a question → search vault → read full content → compose answer
2. **规划类** — Time-sensitive tasks (weekly/monthly summaries). Pay attention to temporal context.
3. **复习类** — Agent quizzes the user → user answers → agent checks against notes → feedback

This skill covers the **technical workflow** used by all three categories.

## Prerequisites

- Obsidian running on Windows with Enhanced RAG plugin enabled
- Plugin "启用本地 API" ON
- Plugin bind address: `0.0.0.0` (patched from `127.0.0.1` in `src/utils/local-server.ts`)
- Windows firewall rule `RAG-WSL-Only` allows WSL IP on ports 8765-8775
- C: drive mounted at `/mnt/c-ro/` (read-only)

## Vault Location

```
Windows: C:\Users\XiaYan\Desktop\日记与规划\
WSL:    /mnt/c-ro/Users/XiaYan/Desktop/日记与规划/
```

## RAG is Always Available

The RAG search API (`POST /search`) is the **primary tool for any fuzzy information lookup**. Whenever you need to find something vague, cross-reference topics, or search for notes on a concept, try RAG first before crawling directories.

---

## 查询类 Workflow (Detailed)

User asks a question → you search → you read → you answer.

### Step 1: Find active port

### Step 1: Find active port

The plugin auto-increments ports if 8765 is occupied (to 8766, 8767...). Always scan first.

```python
scan = terminal("for p in 8765 8766 8767; do code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://172.24.112.1:$p/health 2>/dev/null); [ \\\"$code\\\" = \\\"200\\\" ] && echo \\\"PORT:$p\\\" && break; done\")
port = extract_port(scan)
```

```python
import json
search = terminal(f'''curl -s -X POST http://172.24.112.1:{port}/search \
  -H "Content-Type: application/json" \
  -d '{{"query":"{user_query}", "limit":10}}' \
  --max-time 30''')
results = json.loads(search)
```

`results` structure:
```json
{
  "ranked": [{"path": "笔记/结构化学/...", "finalScore": 0.58, "snippet": "...", "cardBonus": 0.13, "fromExpansion": false}],
  "cards": {"笔记/结构化学/...": {"content": "...", "oneLineSummary": "...", ...}}
}
```

### Step 3: Read full content from C: drive

**API snippets are too short — always read the full file.** The card `content` field is truncated to 2000 chars.

```python
vault_root = "/mnt/c-ro/Users/XiaYan/Desktop/日记与规划/"
top_result_path = results["ranked"][0]["path"]
full_path = vault_root + top_result_path

content = read_file(path=full_path)
```

### Step 4: Compose answer

Use the full file content to answer the user. Cite the file path as source.

### Step 5: Handle OCR/noise results

The vault contains OCR cache files (`pic2md-cache/`, `*.ocr.md`, `*.ocr-cache.md`). These may appear in search results but generally have low informational value. Prefer results from `笔记/` or `日记/` directories when multiple relevant results exist.

---

## 规划类 Workflow

Time-based tasks: weekly summaries, monthly summaries, or any report that covers a period of time.

### Key differences from 查询类

| Aspect | 查询类 | 规划类 |
|--------|--------|--------|
| Discovery | RAG search (fuzzy) | Direct file discovery by date |
| Content | Read full articles | Skim diaries + check card summaries |
| Output | Answer in chat | Write markdown file to USB |

### Workflow

1. **确定时间段** — e.g., March = `2026-03`
2. **直接找文件，不走 RAG**
   ```
   日记:   ls 日记/2026-03-*.md
   笔记:   find笔记/ -type d -name "*2026_03*"
   回顾:   check回顾/ for existing summaries
   ```
3. **用卡片快速筛选** — read index card `oneLineSummary` to decide which notes to deep-dive
4. **读代表性日记** — early/mid/late of the period
---

## 复习类 Workflow

Three scenarios based on scope:

### 场景 1 — 大范围复习（如"复习结构化学"）

Time span large, many files. Cannot do all at once.

1. **列出规划** — Survey the topic's directory, list what's covered, propose a phased plan
2. **逐个阶段执行** for each phase:
   - Read the relevant note files (go directly, skip RAG since path is clear)
   - Quiz the user with 1-2 questions
   - Wait for their answer
   - Check against notes → give feedback (what's right/wrong, what to focus on)

### 场景 2 — 复习今日多门课程

Multiple courses from today. Can be done in one session.

1. **直接找包含今天日期的笔记文件夹** (NOT through diary)
   ```
   find笔记/ -type d -name "*2026_05_02*"
   ```
2. For each course found:
   - Read the relevant files
   - Quiz → answer → check → feedback

### 场景 3 — 复习今日单课程（如"复习今天结构化学"）

Very specific target. File path is clear — skip RAG entirely.

1. Go directly to the file: `笔记/结构化学/结构化学2026_<today>/`
2. Read → quiz → check → feedback

### Common Structure

Each quiz cycle follows:

```
Read notes → Ask question → Wait for user answer → 
Check answer against notes → 
Give feedback: what was correct, what was wrong/missed, what to focus on next
```

---

## Planning Output Location

For 规划类 tasks, save output markdown files to:

```
/mnt/usb/已确认-待移回Windows/<date>_<topic>.md

Naming convention follows existing files (e.g., `2026-05-01_200500-rag-agent-api.md`).
```

---

## RAG Usage Rule

| Situation | Use RAG? |
|-----------|----------|
| Fuzzy/ambiguous query | ✅ Always try first |
| Find files by path pattern (e.g., `*2026_03*`) | ❌ Direct file discovery |
| Specific known file (e.g., "今天结构化学的笔记") | ❌ Go straight to file |
| Broad time-period survey | ❌ Direct directory listing + card summaries |
| Cross-reference topics | ✅ |

---

## Endpoints

### `POST http://172.24.112.1:{port}/search`

**Request:** `{"query": "...", "limit": 10}`
- `query` (string, required): search query
- `limit` (number, optional, max 50): default 10

**Response fields of interest:**
| Field | Type | Description |
|-------|------|-------------|
| `ranked[].path` | string | Relative path within vault (e.g., `笔记/结构化学/xxx.md`) |
| `ranked[].finalScore` | number | Combined score (0~1) |
| `ranked[].cardBonus` | number | 0~0.30 bonus from index card matching |
| `ranked[].fromExpansion` | bool | True if from Wiki Link expansion |
| `ranked[].snippet` | string | Short excerpt (may be truncated or just YAML frontmatter) |
| `cards[key].content` | string | Full note body up to 2000 chars (after removing YAML) |
| `cards[key].oneLineSummary` | string | LLM-generated summary |
| `cards[key].questionTypes` | string[] | e.g. `["definition", "explanation", "reference"]` |

### `GET http://172.24.112.1:{port}/health`

Returns index statistics. Healthy state:
```json
{
  "keyword": {"documentCount": 1418, "termCount": 87076, "indexed": true},
  "cards": {"cardCount": 708, "loaded": true},
  "vector": {"documentCount": 1418, "embeddingCount": 4161, "loaded": true}
}
```

## Diagnostics

### keyword/cards both 0, vector has data — startup race condition (NOW FIXED)

If health shows `keyword: {documentCount: 0}` and `cards: {cardCount: 0}` but vector has data, the `buildIndexes()` ran before Obsidian's vault file cache was ready.

**Fix** (applied in `src/retrieval/manager.ts`):
```typescript
for (let retry = 0; retry < 30; retry++) {
  if (this.vault.getMarkdownFiles().length > 0) break;
  await new Promise((r) => setTimeout(r, 300));
}
```

**If still broken:** the `main.js` was not copied to the vault's plugin directory.
- Source: `C:\Users\XiaYan\Desktop\知识库\知识库项目管理\10_RAG插件\RAG插件实现\obsidian-enhanced-rag\main.js`
- Target: `<vault>/.obsidian/plugins/obsidian-enhanced-rag/main.js`

### Connection fails — check port and firewall

1. `curl -s http://172.24.112.1:8765/health --max-time 5`
2. If timeout, try 8766, 8767
3. If all fail, check Obsidian is running and plugin is enabled
4. Check Windows firewall rule: `netsh advfirewall firewall show rule name=all | findstr "RAG"`

## Known Bugs Already Fixed

| Bug | Fix | Status |
|-----|-----|--------|
| QueryType REFERENCE/TROUBLESHOOTING produces NaN scores | Rebuild main.js after source fix | Fixed |
| keyword/cards empty on startup (race condition) | Retry loop (max 9s) in buildIndexes() | Fixed |
| Server binds to 127.0.0.1 (not reachable from WSL) | Changed to 0.0.0.0 in local-server.ts | Applied |

## Notes

- 10KB max request body
- CORS enabled for local agents
- Bind address: 0.0.0.0 (local network only)
- Windows firewall restricts to WSL IP 172.24.123.153
