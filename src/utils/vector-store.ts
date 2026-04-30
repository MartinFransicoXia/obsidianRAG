/**
 * IndexedDB persistence for chunk embeddings.
 * Survives Obsidian restarts — no re-embedding needed on startup.
 */

const DB_NAME = "obsidian-enhanced-rag";
const DB_VERSION = 1;
const STORE_EMBEDDINGS = "embeddings";   // chunkId → Float32Array
const STORE_CHUNK_INFO = "chunk_info";   // chunkId → {docId, title, path, scope}
const STORE_META = "meta";               // key-value metadata

interface ChunkInfo {
  docId: string;
  title: string;
  path: string;
  scope: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_EMBEDDINGS)) {
        db.createObjectStore(STORE_EMBEDDINGS);
      }
      if (!db.objectStoreNames.contains(STORE_CHUNK_INFO)) {
        db.createObjectStore(STORE_CHUNK_INFO);
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const vectorStore = {
  async clear(): Promise<void> {
    const db = await openDB();
    const tx = db.transaction([STORE_EMBEDDINGS, STORE_CHUNK_INFO, STORE_META], "readwrite");
    tx.objectStore(STORE_EMBEDDINGS).clear();
    tx.objectStore(STORE_CHUNK_INFO).clear();
    tx.objectStore(STORE_META).clear();
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },

  async putEmbedding(chunkId: string, embedding: number[]): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_EMBEDDINGS, "readwrite");
    tx.objectStore(STORE_EMBEDDINGS).put(new Float32Array(embedding), chunkId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },

  async putEmbeddingsBatch(entries: Array<{ chunkId: string; embedding: number[] }>): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_EMBEDDINGS, "readwrite");
    const store = tx.objectStore(STORE_EMBEDDINGS);
    for (const { chunkId, embedding } of entries) {
      store.put(new Float32Array(embedding), chunkId);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },

  async getEmbedding(chunkId: string): Promise<number[] | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EMBEDDINGS, "readonly");
      const req = tx.objectStore(STORE_EMBEDDINGS).get(chunkId);
      req.onsuccess = () => {
        db.close();
        const val = req.result;
        resolve(val ? Array.from(new Float32Array(val as ArrayBuffer)) : null);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getAllEmbeddings(): Promise<Map<string, number[]>> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EMBEDDINGS, "readonly");
      const req = tx.objectStore(STORE_EMBEDDINGS).getAll();
      const keysReq = tx.objectStore(STORE_EMBEDDINGS).getAllKeys();
      let embeddings: Map<string, number[]> | null = null;
      tx.oncomplete = () => {
        db.close();
        resolve(embeddings || new Map());
      };
      tx.onerror = () => reject(tx.error);
      keysReq.onsuccess = () => {
        req.onsuccess = () => {
          const result = new Map<string, number[]>();
          const keys = keysReq.result;
          const values = req.result;
          for (let i = 0; i < keys.length; i++) {
            result.set(keys[i] as string, Array.from(new Float32Array(values[i] as ArrayBuffer)));
          }
          embeddings = result;
        };
      };
    });
  },

  async putChunkInfo(chunkId: string, info: ChunkInfo): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_CHUNK_INFO, "readwrite");
    tx.objectStore(STORE_CHUNK_INFO).put(info, chunkId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },

  async putChunkInfoBatch(entries: Array<{ chunkId: string; info: ChunkInfo }>): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_CHUNK_INFO, "readwrite");
    const store = tx.objectStore(STORE_CHUNK_INFO);
    for (const { chunkId, info } of entries) {
      store.put(info, chunkId);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAllChunkInfo(): Promise<Map<string, ChunkInfo>> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CHUNK_INFO, "readonly");
      const req = tx.objectStore(STORE_CHUNK_INFO).getAll();
      const keysReq = tx.objectStore(STORE_CHUNK_INFO).getAllKeys();
      let result: Map<string, ChunkInfo> | null = null;
      tx.oncomplete = () => { db.close(); resolve(result || new Map()); };
      tx.onerror = () => reject(tx.error);
      keysReq.onsuccess = () => {
        req.onsuccess = () => {
          result = new Map<string, ChunkInfo>();
          const keys = keysReq.result;
          const values = req.result;
          for (let i = 0; i < keys.length; i++) {
            result.set(keys[i] as string, values[i] as ChunkInfo);
          }
        };
      };
    });
  },

  async embeddingCount(): Promise<number> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EMBEDDINGS, "readonly");
      const req = tx.objectStore(STORE_EMBEDDINGS).count();
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = () => reject(req.error);
    });
  },

  /** Store metadata like last build time or content hashes */
  async setMeta(key: string, value: string): Promise<void> {
    const db = await openDB();
    const tx = db.transaction(STORE_META, "readwrite");
    tx.objectStore(STORE_META).put(value, key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    });
  },

  async getMeta(key: string): Promise<string | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_META, "readonly");
      const req = tx.objectStore(STORE_META).get(key);
      req.onsuccess = () => { db.close(); resolve((req.result as string) || null); };
      req.onerror = () => reject(req.error);
    });
  },
};
