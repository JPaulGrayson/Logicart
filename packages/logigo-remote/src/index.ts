export interface LogiGoRemoteOptions {
  serverUrl: string;
  sessionName?: string;
  code?: string;
  retryAttempts?: number;
  retryDelayMs?: number;
  batchIntervalMs?: number;
  offlineQueueSize?: number;
}

export interface Checkpoint {
  id: string;
  label?: string;
  variables?: Record<string, any>;
  line?: number;
}

export interface SessionInfo {
  sessionId: string;
  connectUrl: string;
}

interface QueuedCheckpoint extends Checkpoint {
  timestamp: number;
}

export class LogiGoRemote {
  private serverUrl: string;
  private sessionName: string;
  private code?: string;
  private retryAttempts: number;
  private retryDelayMs: number;
  private batchIntervalMs: number;
  private offlineQueueSize: number;
  
  private sessionId: string | null = null;
  private connectUrl: string | null = null;
  private queue: QueuedCheckpoint[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private isProcessing = false;

  constructor(options: LogiGoRemoteOptions) {
    this.serverUrl = options.serverUrl.replace(/\/$/, '');
    this.sessionName = options.sessionName || 'Remote App';
    this.code = options.code;
    this.retryAttempts = options.retryAttempts ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
    this.batchIntervalMs = options.batchIntervalMs ?? 50;
    this.offlineQueueSize = options.offlineQueueSize ?? 100;
  }

  private async fetchWithRetry(url: string, options: RequestInit, attempts = this.retryAttempts): Promise<Response> {
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) return response;
        if (response.status >= 500 && i < attempts - 1) {
          await this.delay(this.retryDelayMs * (i + 1));
          continue;
        }
        return response;
      } catch (error) {
        if (i === attempts - 1) throw error;
        await this.delay(this.retryDelayMs * (i + 1));
      }
    }
    throw new Error('Max retries exceeded');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async createSession(): Promise<SessionInfo> {
    const response = await this.fetchWithRetry(
      `${this.serverUrl}/api/remote/session`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.sessionName,
          code: this.code
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const data = await response.json();
    this.sessionId = data.sessionId;
    this.connectUrl = data.connectUrl;

    return {
      sessionId: this.sessionId!,
      connectUrl: this.connectUrl!
    };
  }

  async checkpoint(id: string, variables: Record<string, any> = {}, label?: string): Promise<void> {
    if (!this.sessionId) {
      await this.createSession();
    }

    const checkpoint: QueuedCheckpoint = {
      id,
      variables,
      label,
      timestamp: Date.now()
    };

    this.queue.push(checkpoint);

    if (this.queue.length > this.offlineQueueSize) {
      this.queue.shift();
    }

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushQueue(), this.batchIntervalMs);
    }
  }

  private async flushQueue(): Promise<void> {
    this.batchTimer = null;

    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const checkpoints = [...this.queue];
    this.queue = [];

    try {
      for (const cp of checkpoints) {
        await this.fetchWithRetry(
          `${this.serverUrl}/api/remote/checkpoint`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: this.sessionId,
              checkpoint: {
                id: cp.id,
                label: cp.label,
                variables: cp.variables,
                line: cp.line
              }
            })
          }
        );
      }
    } catch (error) {
      this.queue = [...checkpoints, ...this.queue].slice(0, this.offlineQueueSize);
      console.error('[LogiGo] Failed to send checkpoints:', error);
    } finally {
      this.isProcessing = false;
      
      if (this.queue.length > 0 && !this.batchTimer) {
        this.batchTimer = setTimeout(() => this.flushQueue(), this.batchIntervalMs);
      }
    }
  }

  async end(): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    await this.flushQueue();

    if (this.sessionId) {
      try {
        await this.fetchWithRetry(
          `${this.serverUrl}/api/remote/session/end`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: this.sessionId })
          }
        );
      } catch (error) {
        console.error('[LogiGo] Failed to end session:', error);
      }
    }

    this.sessionId = null;
    this.connectUrl = null;
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  getConnectUrl(): string | null {
    return this.connectUrl;
  }

  static async quickConnect(serverUrl: string, sessionName?: string): Promise<(id: string, variables?: Record<string, any>) => void> {
    const client = new LogiGoRemote({
      serverUrl,
      sessionName: sessionName || 'Quick Session'
    });

    const { connectUrl } = await client.createSession();
    console.log(`[LogiGo] View checkpoints at: ${connectUrl}`);

    return (id: string, variables: Record<string, any> = {}) => {
      client.checkpoint(id, variables);
    };
  }
}

export default LogiGoRemote;
