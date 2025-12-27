import type { CheckpointData, RuntimeOptions, Breakpoint, LogiGoMessage } from './types';

const MAX_QUEUE_SIZE = 5000;

export class LogiGoRuntime {
  private queue: CheckpointData[] = [];
  private flushScheduled = false;
  private manifestHash: string;
  private breakpoints = new Map<string, Breakpoint>();
  private pausePromise: Promise<void> | null = null;
  private resumeCallback: (() => void) | null = null;
  private sessionId: string;
  private started = false;
  private queueOverflowWarned = false;

  constructor(options: RuntimeOptions = {}) {
    this.manifestHash = options.manifestHash || '';
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'session_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    this.postMessage({
      source: 'LOGIGO_CORE',
      type: 'LOGIGO_SESSION_START',
      payload: {
        sessionId: this.sessionId,
        manifestHash: this.manifestHash,
        timestamp: Date.now()
      }
    });
  }

  end(): void {
    if (!this.started) return;
    
    this.flush();
    
    this.postMessage({
      source: 'LOGIGO_CORE',
      type: 'LOGIGO_SESSION_END',
      payload: {
        sessionId: this.sessionId,
        timestamp: Date.now()
      }
    });

    this.started = false;
  }

  checkpoint(id: string, variables?: Record<string, any>): void {
    if (!this.started) {
      this.start();
    }

    if (this.queue.length >= MAX_QUEUE_SIZE) {
      if (!this.queueOverflowWarned) {
        console.warn(`[LogiGo] Checkpoint queue overflow (${MAX_QUEUE_SIZE} items). Dropping checkpoints to prevent browser crash. This may indicate an infinite loop.`);
        this.queueOverflowWarned = true;
      }
      return;
    }

    // FAST PATH: Shallow capture only.
    // We capture top-level values immediately. Nested object mutations
    // before the next microtask will reflect the *future* state,
    // but this trade-off is necessary for performance in tight loops.
    const rawVariables = variables ? { ...variables } : {};

    this.queue.push({
      id,
      rawVariables,
      timestamp: Date.now(),
      manifestVersion: this.manifestHash
    });

    if (!this.flushScheduled) {
      this.flushScheduled = true;
      queueMicrotask(() => this.flush());
    }
  }

  async checkpointAsync(id: string, variables?: Record<string, any>): Promise<void> {
    this.checkpoint(id, variables);

    const bp = this.breakpoints.get(id);
    if (bp && bp.enabled) {
      if (!bp.condition || this.evaluateCondition(bp.condition, variables || {})) {
        await this.waitForResume();
      }
    }
  }

  setBreakpoint(id: string, enabled = true, condition?: string): void {
    this.breakpoints.set(id, { id, enabled, condition });
  }

  removeBreakpoint(id: string): void {
    this.breakpoints.delete(id);
  }

  clearBreakpoints(): void {
    this.breakpoints.clear();
  }

  resume(): void {
    if (this.resumeCallback) {
      this.resumeCallback();
      this.resumeCallback = null;
      this.pausePromise = null;
    }
  }

  private async waitForResume(): Promise<void> {
    if (this.pausePromise) return this.pausePromise;

    this.pausePromise = new Promise(resolve => {
      this.resumeCallback = resolve;
    });

    return this.pausePromise;
  }

  private evaluateCondition(condition: string, variables: Record<string, any>): boolean {
    try {
      const fn = new Function(...Object.keys(variables), `return ${condition}`);
      return !!fn(...Object.values(variables));
    } catch {
      return true;
    }
  }

  private flush(): void {
    const batch = this.queue.splice(0);
    this.flushScheduled = false;
    this.queueOverflowWarned = false;

    batch.forEach(data => {
      // HEAVY PATH: Serialize now, while user code is paused/done
      const serializedVariables = this.safeSerialize(data.rawVariables);

      this.postMessage({
        source: 'LOGIGO_CORE',
        type: 'LOGIGO_CHECKPOINT',
        payload: {
          id: data.id,
          timestamp: data.timestamp,
          manifestVersion: data.manifestVersion,
          variables: serializedVariables
        }
      });
    });
  }

  private postMessage(message: LogiGoMessage): void {
    if (typeof window !== 'undefined') {
      window.postMessage(message, '*');
    }
  }

  private safeSerialize(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      try {
        if (value === undefined) {
          result[key] = undefined;
        } else if (value === null) {
          result[key] = null;
        } else if (typeof value === 'function') {
          result[key] = '[Function]';
        } else if (typeof value === 'symbol') {
          result[key] = value.toString();
        } else if (typeof value === 'object') {
          if (Array.isArray(value)) {
            result[key] = value.slice(0, 100).map(v => 
              typeof v === 'object' ? '[Object]' : v
            );
          } else {
            result[key] = '[Object]';
          }
        } else {
          result[key] = value;
        }
      } catch {
        result[key] = '[Error serializing]';
      }
    }
    
    return result;
  }
}

let globalRuntime: LogiGoRuntime | null = null;

export function createRuntime(options?: RuntimeOptions): LogiGoRuntime {
  globalRuntime = new LogiGoRuntime(options);
  return globalRuntime;
}

export function checkpoint(id: string, variables?: Record<string, any>): void {
  if (!globalRuntime) {
    globalRuntime = new LogiGoRuntime();
  }
  globalRuntime.checkpoint(id, variables);
}

export async function checkpointAsync(id: string, variables?: Record<string, any>): Promise<void> {
  if (!globalRuntime) {
    globalRuntime = new LogiGoRuntime();
  }
  return globalRuntime.checkpointAsync(id, variables);
}

if (typeof window !== 'undefined') {
  (window as any).LogiGo = {
    checkpoint,
    checkpointAsync,
    createRuntime,
    _runtime: null as LogiGoRuntime | null,

    get runtime() {
      if (!this._runtime) {
        this._runtime = new LogiGoRuntime();
      }
      return this._runtime;
    },

    setBreakpoint(id: string, enabled?: boolean, condition?: string) {
      this.runtime.setBreakpoint(id, enabled, condition);
    },

    removeBreakpoint(id: string) {
      this.runtime.removeBreakpoint(id);
    },

    resume() {
      this.runtime.resume();
    }
  };
}

export default LogiGoRuntime;
