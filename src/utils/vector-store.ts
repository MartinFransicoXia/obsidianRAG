/**
 * SQLite persistence for chunk embeddings via sql.js.
 * Database file: .obsidian/plugins/obsidian-enhanced-rag/data/vectors.db
 */

import { Vault } from "obsidian";
import initSqlJs, { Database as SqlJsDatabase } from "sql.js";

const DB_PATH = ".obsidian/plugins/obsidian-enhanced-rag/data/vectors.db";
const DATA_DIR = ".obsidian/plugins/obsidian-enhanced-rag/data";
const WASM_PATH = ".obsidian/plugins/obsidian-enhanced-rag/sql-wasm.wasm";

export interface ChunkInfo {
  docId: string;
  title: string;
  path: string;
  scope: string;
}

export class VectorStore {
  private vault: Vault;
  private db: SqlJsDatabase | null = null;
  private _embeddings: Map<string, number[]> = new Map();
  private _chunkInfo: Map<string, ChunkInfo> = new Map();
  private _loaded = false;
  private _dirty = false;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  get embeddings(): Map<string, number[]> { return this._embeddings; }
  get chunkInfo(): Map<string, ChunkInfo> { return this._chunkInfo; }

  private async ensureDir(): Promise<void> {
    try { await this.vault.adapter.mkdir(DATA_DIR); } catch { /* ok */ }
  }

  private async initDB(): Promise<SqlJsDatabase> {
    if (this.db) return this.db;

    await this.ensureDir();

    // Load WASM binary from plugin directory (avoid fetch)
    const wasmBuffer = await this.vault.adapter.readBinary(WASM_PATH);
    const SQL = await initSqlJs({ wasmBinary: new Uint8Array(wasmBuffer) });

    // Try to load existing database file
    let buffer: ArrayBuffer | null = null;
    try {
      if (await this.vault.adapter.exists(DB_PATH)) {
        buffer = await this.vault.adapter.readBinary(DB_PATH);
      }
    } catch { /* file doesn't exist yet */ }

    this.db = buffer
      ? new SQL.Database(new Uint8Array(buffer))
      : new SQL.Database();

    // Create tables
    this.db.run(`
      CREATE TABLE IF NOT EXISTS embeddings (
        chunk_id TEXT PRIMARY KEY,
        embedding BLOB NOT NULL
      );
      CREATE TABLE IF NOT EXISTS chunk_info (
        chunk_id TEXT PRIMARY KEY,
        doc_id TEXT NOT NULL,
        title TEXT NOT NULL,
        path TEXT NOT NULL,
        scope TEXT DEFAULT 'mainline'
      );
      CREATE INDEX IF NOT EXISTS idx_chunk_info_doc ON chunk_info(doc_id);
      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    return this.db;
  }

  /** Load all data from database file into memory */
  async load(): Promise<boolean> {
    if (this._loaded) return true;
    try {
      const db = await this.initDB();

      // Load embeddings
      this._embeddings.clear();
      const embRows = db.exec("SELECT chunk_id, embedding FROM embeddings");
      if (embRows.length > 0) {
        const { columns, values } = embRows[0];
        const idIdx = columns.indexOf("chunk_id");
        const embIdx = columns.indexOf("embedding");
        for (const row of values) {
          const chunkId = row[idIdx] as string;
          const blob = row[embIdx] as Uint8Array;
          const embedding = Array.from(new Float32Array(blob.buffer.slice(blob.byteOffset, blob.byteOffset + blob.byteLength)));
          this._embeddings.set(chunkId, embedding);
        }
      }

      // Load chunk info
      this._chunkInfo.clear();
      const ciRows = db.exec("SELECT chunk_id, doc_id, title, path, scope FROM chunk_info");
      if (ciRows.length > 0) {
        const { columns, values } = ciRows[0];
        const idIdx = columns.indexOf("chunk_id");
        const docIdx = columns.indexOf("doc_id");
        const tIdx = columns.indexOf("title");
        const pIdx = columns.indexOf("path");
        const sIdx = columns.indexOf("scope");
        for (const row of values) {
          this._chunkInfo.set(row[idIdx] as string, {
            docId: row[docIdx] as string,
            title: row[tIdx] as string,
            path: row[pIdx] as string,
            scope: row[sIdx] as string,
          });
        }
      }

      this._loaded = true;
      console.log(`[VectorStore] Loaded ${this._embeddings.size} embeddings, ${this._chunkInfo.size} chunk infos from SQLite`);
      return true;
    } catch (e) {
      console.warn("[VectorStore] Failed to load database:", e);
      return false;
    }
  }

  /** Persist all in-memory data to the database file */
  async save(): Promise<void> {
    if (!this._loaded) return;
    try {
      const db = await this.initDB();

      // Write in transaction
      db.run("BEGIN TRANSACTION");

      // Clear and repopulate embeddings
      db.run("DELETE FROM embeddings");
      const insertEmb = db.prepare("INSERT OR REPLACE INTO embeddings (chunk_id, embedding) VALUES (?, ?)");
      for (const [chunkId, embedding] of this._embeddings) {
        const arr = new Float32Array(embedding);
        insertEmb.run([chunkId, new Uint8Array(arr.buffer)]);
      }
      insertEmb.free();

      // Clear and repopulate chunk info
      db.run("DELETE FROM chunk_info");
      const insertCI = db.prepare("INSERT OR REPLACE INTO chunk_info (chunk_id, doc_id, title, path, scope) VALUES (?, ?, ?, ?, ?)");
      for (const [chunkId, info] of this._chunkInfo) {
        insertCI.run([chunkId, info.docId, info.title, info.path, info.scope]);
      }
      insertCI.free();

      db.run("COMMIT");

      // Write database file to disk
      const data = db.export();
      await this.ensureDir();
      await this.vault.adapter.writeBinary(DB_PATH, data.buffer as ArrayBuffer);

      this._dirty = false;
    } catch (e) {
      console.warn("[VectorStore] Failed to save database:", e);
    }
  }

  /** Update a single embedding in-place (for batch incremental saves) */
  async saveIncremental(newEmbeddings: Array<{ chunkId: string; embedding: number[] }>, newInfo: Array<{ chunkId: string; info: ChunkInfo }>): Promise<void> {
    try {
      const db = await this.initDB();
      db.run("BEGIN TRANSACTION");

      const insertEmb = db.prepare("INSERT OR REPLACE INTO embeddings (chunk_id, embedding) VALUES (?, ?)");
      for (const { chunkId, embedding } of newEmbeddings) {
        const arr = new Float32Array(embedding);
        insertEmb.run([chunkId, new Uint8Array(arr.buffer)]);
      }
      insertEmb.free();

      const insertCI = db.prepare("INSERT OR REPLACE INTO chunk_info (chunk_id, doc_id, title, path, scope) VALUES (?, ?, ?, ?, ?)");
      for (const { chunkId, info } of newInfo) {
        insertCI.run([chunkId, info.docId, info.title, info.path, info.scope]);
      }
      insertCI.free();

      db.run("COMMIT");

      const data = db.export();
      await this.ensureDir();
      await this.vault.adapter.writeBinary(DB_PATH, data.buffer as ArrayBuffer);
    } catch (e) {
      console.warn("[VectorStore] Failed to save incrementally:", e);
    }
  }

  /** Simple key-value metadata storage (e.g., file mtimes) */
  async getMeta(key: string): Promise<string | null> {
    const db = await this.initDB();
    try {
      const rows = db.exec("SELECT value FROM meta WHERE key = ?", [key]);
      if (rows.length > 0 && rows[0].values.length > 0) {
        return rows[0].values[0][0] as string;
      }
    } catch { /* not found */ }
    return null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    const db = await this.initDB();
    db.run("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", [key, value]);
    // Persist immediately so mtime tracking survives even if no chunks need embedding
    const data = db.export();
    await this.ensureDir();
    await this.vault.adapter.writeBinary(DB_PATH, data.buffer as ArrayBuffer);
  }

  /** Clear all persisted data */
  async clear(): Promise<void> {
    this._embeddings.clear();
    this._chunkInfo.clear();
    try {
      if (await this.vault.adapter.exists(DB_PATH)) {
        await this.vault.adapter.remove(DB_PATH);
      }
      // Drop in-memory DB
      if (this.db) {
        this.db.run("DELETE FROM embeddings");
        this.db.run("DELETE FROM chunk_info");
      }
    } catch (e) {
      console.warn("[VectorStore] Failed to clear:", e);
    }
  }
}
