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
 * Read an index card file (JSON format from 00_INDEX/files/)
 */
export async function readIndexCard(file: TFile, vault: Vault): Promise<IndexCard | null> {
  try {
    const content = await vault.cachedRead(file);
    const data = JSON.parse(content);
    return {
      id: data.id || file.path,
      title: data.title || file.basename,
      summary: data.summary || "",
      topics: data.topics || [],
      links: data.links || [],
      keywords: data.keywords || [],
      wordCount: data.wordCount || 0,
      lastModified: data.lastModified || file.stat.mtime,
      filePath: data.filePath || ""
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
    if (child instanceof TFile && child.extension === "json") {
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
    .replace(/[^\w\u4e00-\u9fff\s]/g, " ")
    .split(/\s+/)
    .filter(token => token.length > 1);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
