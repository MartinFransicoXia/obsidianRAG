/**
 * Local HTTP API server — exposes pipeline search to local agents (Hermes, OpenClaw, etc.)
 * Binds to 0.0.0.0 only, never exposed to network.
 */

import * as http from "http";
import { RetrievalManager } from "../retrieval/manager";

const MAX_BODY = 1024 * 10; // 10KB max request body

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) { req.destroy(); reject(new Error("body too large")); return; }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function json(res: http.ServerResponse, data: unknown, status = 200): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

export class LocalServer {
  private server: http.Server | null = null;
  private manager: RetrievalManager;
  private port: number;

  constructor(manager: RetrievalManager, port: number) {
    this.manager = manager;
    this.port = port;
  }

  start(): Promise<void> {
    if (this.server) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        // CORS for local agents
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        if (req.method === "OPTIONS") {
          res.writeHead(204); res.end(); return;
        }

        // POST /search — pipeline retrieval
        if (req.method === "POST" && req.url === "/search") {
          try {
            const body = await readBody(req);
            const { query, limit = 10 } = JSON.parse(body);
            if (!query || typeof query !== "string") {
              return json(res, { error: "query is required" }, 400);
            }
            const result = await this.manager.pipelineSearch(query, Math.min(limit, 50));
            // Serialize Map to object for JSON
            const cardsObj: Record<string, unknown> = {};
            for (const [k, v] of result.cards) {
              cardsObj[k] = v;
            }
            return json(res, {
              ranked: result.ranked,
              cards: cardsObj,
            });
          } catch (e) {
            console.error("[LocalAPI] /search error:", e);
            return json(res, { error: String(e) }, 500);
          }
        }

        // GET /health
        if (req.method === "GET" && req.url === "/health") {
          const stats = this.manager.getStats();
          return json(res, { status: "ok", ...stats });
        }

        // 404
        json(res, { error: "not found" }, 404);
      });

      this.server.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.warn(`[LocalAPI] Port ${this.port} in use, trying ${this.port + 1}`);
          this.port++;
          this.server?.close();
          this.server = null;
          this.start().then(resolve).catch(reject);
        } else {
          reject(err);
        }
      });

      this.server.listen(this.port, "0.0.0.0", () => {
        console.log(`[LocalAPI] Listening on http://0.0.0.0:${this.port}`);
        resolve();
      });
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log("[LocalAPI] Server stopped");
    }
  }

  getPort(): number {
    return this.port;
  }
}
