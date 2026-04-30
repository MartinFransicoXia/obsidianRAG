import { CloudAPIRequest, CloudAPIResponse } from "../types";
import { PluginSettings } from "../types";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Cloud API client for DeepSeek (and compatible APIs)
 */
export class CloudAPIClient {
  private settings: PluginSettings;

  constructor(settings: PluginSettings) {
    this.settings = settings;
  }

  updateSettings(settings: PluginSettings): void {
    this.settings = settings;
  }

  /**
   * Call the chat completion API
   */
  async chat(request: CloudAPIRequest): Promise<string> {
    if (!this.settings.apiKey) {
      throw new Error("API key not configured. Please set it in plugin settings.");
    }

    const url = `${this.settings.apiBaseUrl}/chat/completions`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.settings.apiKey}`
          },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 429) {
            // Rate limited, wait and retry
            const retryAfter = response.headers.get("Retry-After");
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY_MS * (attempt + 1);
            await this.sleep(delay);
            continue;
          }
          throw new Error(`API error ${response.status}: ${errorText}`);
        }

        const data: CloudAPIResponse = await response.json();
        if (data.choices && data.choices.length > 0) {
          return data.choices[0].message.content;
        }
        throw new Error("No response choices returned");
      } catch (error) {
        lastError = error as Error;
        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }
    }

    throw lastError || new Error("API call failed after retries");
  }

  /**
   * Generate embeddings for text
   * Uses embeddingBaseUrl (fallback to apiBaseUrl), embeddingModel, and embeddingApiKey (fallback to apiKey).
   */
  async embed(text: string): Promise<number[]> {
    const baseUrl = (this.settings.embeddingBaseUrl || this.settings.apiBaseUrl).replace(/\/$/, "");
    const url = `${baseUrl}/embeddings`;
    const model = this.settings.embeddingModel || "text-embedding-v4";
    const embedKey = this.settings.embeddingApiKey || this.settings.apiKey;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (embedKey) {
      headers["Authorization"] = `Bearer ${embedKey}`;
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model,
            input: text
          })
        });

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : RETRY_DELAY_MS * (attempt + 1);
            await this.sleep(delay);
            continue;
          }
          const errorText = await response.text();
          throw new Error(`Embedding API error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
          return data.data[0].embedding;
        }
        throw new Error("No embedding returned");
      } catch (error) {
        if (attempt < MAX_RETRIES - 1) {
          await this.sleep(RETRY_DELAY_MS * (attempt + 1));
        } else {
          throw error;
        }
      }
    }

    throw new Error("Embedding API call failed after retries");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
