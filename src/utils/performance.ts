/**
 * Performance monitoring utilities
 */

export class PerformanceMonitor {
  private timers: Map<string, number> = new Map();

  start(label: string): void {
    this.timers.set(label, performance.now());
  }

  end(label: string): number {
    const start = this.timers.get(label);
    if (start === undefined) return 0;
    const elapsed = performance.now() - start;
    this.timers.delete(label);
    return elapsed;
  }

  measure<T>(label: string, fn: () => T): T {
    this.start(label);
    try {
      const result = fn();
      return result;
    } finally {
      const elapsed = this.end(label);
      console.log(`[RAG Perf] ${label}: ${elapsed.toFixed(2)}ms`);
    }
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label);
    try {
      const result = await fn();
      return result;
    } finally {
      const elapsed = this.end(label);
      console.log(`[RAG Perf] ${label}: ${elapsed.toFixed(2)}ms`);
    }
  }
}

export const perf = new PerformanceMonitor();
