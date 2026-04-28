import { TFile, Vault, TFolder } from "obsidian";
import { Document, IndexCard } from "../types";

/**
 * Read a markdown file and convert to Document
 */
export async function fileToDocument(file: TFile, vault: Vault): Promise<Document> {
  const content = await vault.cachedRead(file);
  const lines = content.split("\n");

  // Extract title from first heading or filename
  let title = file.basename;
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)/);
    if (match) {
      title = match[1].trim();
      break;
    }
  }

  // Extract wiki links
  const linkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
  const links: string[] = [];
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(content)) !== null) {
    links.push(linkMatch[1].trim());
  }

  // Extract summary (first paragraph after heading)
  let summary = "";
  let inParagraph = false;
  for (const line of lines) {
    if (line.startsWith("#")) continue;
    if (line.trim() === "") {
      if (inParagraph) break;
      continue;
    }
    if (!inParagraph) inParagraph = true;
    summary += line + " ";
    if (summary.length > 200) break;
  }

  return {
    id: file.path,
    title,
    content,
    path: file.path,
    summary: summary.trim(),
    links: [...new Set(links)],
    lastModified: file.stat.mtime
  };
}

/**
 * Get all markdown files from vault
 */
export function getAllMarkdownFiles(vault: Vault): TFile[] {
  return vault.getMarkdownFiles();
}

/**
 * Parse YAML frontmatter from a card file (no PyYAML dependency)
 */
function parseCardFrontmatter(content: string): Record<string, string> {
  const fm: Record<string, string> = {};
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return fm;

  const lines = match[1].split("\n");
  let currentKey: string | null = null;
  let currentList: string[] = [];

  for (const line of lines) {
    const listMatch = line.match(/^\s{2,}-\s+(.+)$/);
    if (listMatch && currentKey) {
      currentList.push(listMatch[1].trim().replace(/^["']|["']$/g, ""));
      continue;
    }
    if (currentKey && currentList.length) {
      fm[currentKey] = currentList.join("\n");
      currentList = [];
      currentKey = null;
    }
    const kv = line.match(/^([\w_]+)\s*:\s*(.*)$/);
    if (kv) {
      const key = kv[1];
      const val = kv[2].trim().replace(/^["']|["']$/g, "");
      if (val) {
        fm[key] = val;
      } else {
        currentKey = key;
        currentList = [];
      }
    }
  }
  if (currentKey && currentList.length) {
    fm[currentKey] = currentList.join("\n");
  }
  return fm;
}

function parseYamlList(raw: string): string[] {
  if (!raw) return [];
  if (raw.includes("\n")) {
    return raw.split("\n").filter(l => l.trim()).map(l => l.trim().replace(/^["']|["']$/g, ""));
  }
  return raw.split(",").filter(x => x.trim()).map(x => x.trim().replace(/^["']|["']$/g, ""));
}

/**
 * Read an index card file (YAML frontmatter + Markdown from 00_INDEX/files/)
 */
export async function readIndexCard(file: TFile, vault: Vault): Promise<IndexCard | null> {
  try {
    const content = await vault.cachedRead(file);
    const fm = parseCardFrontmatter(content);
    if (!fm.doc_id && !fm.title) return null;

    return {
      docId: fm.doc_id || file.path,
      title: fm.title || file.basename,
      path: fm.path || file.path,
      scope: fm.scope || "mainline",
      tags: parseYamlList(fm.tags || ""),
      headings: parseYamlList(fm.headings || ""),
      outlinks: parseYamlList(fm.outlinks || ""),
      domain: fm.domain || "",
      topicPrimary: fm.topic_primary || "",
      topicSecondary: parseYamlList(fm.topic_secondary || ""),
      noteRole: fm.note_role || "mixed",
      questionTypes: parseYamlList(fm.question_types || ""),
      oneLineSummary: fm.one_line_summary || "",
      retrievalKeywords: parseYamlList(fm.retrieval_keywords || ""),
      bestFor: parseYamlList(fm.best_for || ""),
      notFor: parseYamlList(fm.not_for || ""),
      readWith: parseYamlList(fm.read_with || ""),
      sourceHash: fm.source_hash || "",
      buildStatus: fm.build_status || "success",
      generatedAt: fm.generated_at || "",
      content: content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, "").substring(0, 2000),
    };
  } catch {
    return null;
  }
}

/**
 * Get all index cards from 00_INDEX/files/
 */
export async function getIndexCards(vault: Vault): Promise<IndexCard[]> {
  const indexFolder = vault.getAbstractFileByPath("00_INDEX/files");
  if (!indexFolder || !(indexFolder instanceof TFolder)) {
    return [];
  }

  const cards: IndexCard[] = [];
  for (const child of indexFolder.children) {
    if (child instanceof TFile && child.extension === "md") {
      const card = await readIndexCard(child, vault);
      if (card) cards.push(card);
    }
  }
  return cards;
}

/**
 * Simple text tokenizer
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿\s]/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 1);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
