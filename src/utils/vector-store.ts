/**
 * Local file persistence for chunk embeddings.
 * Stored in .obsidian/plugins/obsidian-enhanced-rag/data/
 * Survives Obsidian restarts — no re-embedding needed on startup.
 */

import { Vault } from "obsidian";

interface ChunkInfo {
  docId: string;
  title: string;
  path: string;
  scope: string;
}

const DATA_DIR = ".obsidian/plugins/obsidian-enhanced-rag/data";
const EMBEDDINGS_FILE = `${DATA_DIR}/embeddings.json`;
const CHUNK_INFO_FILE = `${DATA_DIR}/chunk_info.json`;
const SPLIT_SIZE = 300; // max chunks per split file

export class VectorStore {
  private vault: Vault;
  private _embeddings: Map<string, number[]> = new Map();
  private _chunkInfo: Map<string, ChunkInfo> = new Map();
  private _loaded = false;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  get embeddings(): Map<string, number[]> { return this._embeddings; }
  get chunkInfo(): Map<string, ChunkInfo> { return this._chunkInfo; }

  /** Ensure data directory exists */
  private async ensureDir(): Promise<void> {
    try {
      await this.vault.adapter.mkdir(DATA_DIR);
    } catch {
      // already exists or no permission
    }
  }

  /** Load all persisted data into memory */
  async load(): Promise<boolean> {
    if (this._loaded) return true;
    try {
      await this.ensureDir();

      // Load chunk info
      if (await this.vault.adapter.exists(CHUNK_INFO_FILE)) {
        const raw = await this.vault.adapter.read(CHUNK_INFO_FILE);
        const obj = JSON.parse(raw);
        this._chunkInfo = new Map(Object.entries(obj));
      }

      // Load embeddings (supports split files)
      const baseFile = EMBEDDINGS_FILE;
      if (await this.vault.adapter.exists(baseFile)) {
        const raw = await this.vault.adapter.read(baseFile);
        const obj = JSON.parse(raw);
        for (const [k, v] of Object.entries(obj)) {
          this._embeddings.set(k, v as number[]);
        }
      }

      // Check for split files
      let splitIdx = 0;
      while (await this.vault.adapter.exists(`${EMBEDDINGS_FILE.replace(".json", "")}_${splitIdx}.json`)) {
        const sRaw = await this.vault.adapter.read(`${EMBEDDINGS_FILE.replace(".json", "")}_${splitIdx}.json`);
        const sObj = JSON.parse(sRaw);
        for (const [k, v] of Object.entries(sObj)) {
          this._embeddings.set(k, v as number[]);
        }
        splitIdx++;
      }

      this._loaded = true;
      console.log(`[VectorStore] Loaded ${this._embeddings.size} embeddings, ${this._chunkInfo.size} chunk infos`);
      return true;
    } catch (e) {
      console.warn("[VectorStore] Failed to load persisted data:", e);
      return false;
    }
  }

  /** Persist all in-memory data to files */
  async save(): Promise<void> {
    try {
      await this.ensureDir();

      // Save chunk info
      const ciObj: Record<string, ChunkInfo> = {};
      for (const [k, v] of this._chunkInfo) ciObj[k] = v;
      await this.vault.adapter.write(CHUNK_INFO_FILE, JSON.stringify(ciObj));

      // Save embeddings (split if too large)
      const entries = [...this._embeddings.entries()];
      if (entries.length <= SPLIT_SIZE) {
        const embObj: Record<string, number[]> = {};
        for (const [k, v] of entries) embObj[k] = v;
        await this.vault.adapter.write(EMBEDDINGS_FILE, JSON.stringify(embObj));
      } else {
        for (let i = 0; i < entries.length; i += SPLIT_SIZE) {
          const batch = entries.slice(i, i + SPLIT_SIZE);
          const embObj: Record<string, number[]> = {};
          for (const [k, v] of batch) embObj[k] = v;
          const fname = i === 0 ? EMBEDDINGS_FILE : `${EMBEDDINGS_FILE.replace(".json", "")}_${Math.floor(i / SPLIT_SIZE)}.json`;
          await this.vault.adapter.write(fname, JSON.stringify(embObj));
        }
      }
    } catch (e) {
      console.warn("[VectorStore] Failed to save:", e);
    }
  }

  /** Clear all persisted data */
  async clear(): Promise<void> {
    this._embeddings.clear();
    this._chunkInfo.clear();
    try {
      if (await this.vault.adapter.exists(EMBEDDINGS_FILE)) {
        await this.vault.adapter.remove(EMBEDDINGS_FILE);
      }
      if (await this.vault.adapter.exists(CHUNK_INFO_FILE)) {
        await this.vault.adapter.remove(CHUNK_INFO_FILE);
      }
    } catch (e) {
      console.warn("[VectorStore] Failed to clear files:", e);
    }
  }
}
