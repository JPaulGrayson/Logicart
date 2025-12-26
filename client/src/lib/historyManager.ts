interface HistoryEntry {
  code: string;
  timestamp: number;
  label?: string;
}

interface HistoryState {
  history: HistoryEntry[];
  currentIndex: number;
}

const STORAGE_KEY = 'logigo-code-history';
const MAX_HISTORY_SIZE = 50;
const DEBOUNCE_MS = 1000;

export class HistoryManager {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;
  private lastPushTime = 0;
  private pendingCode: string | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.load();
  }

  push(code: string, label?: string, force = false) {
    const now = Date.now();
    
    if (!force && now - this.lastPushTime < DEBOUNCE_MS) {
      this.pendingCode = code;
      
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      
      this.debounceTimer = setTimeout(() => {
        if (this.pendingCode) {
          this.pushImmediate(this.pendingCode, label);
          this.pendingCode = null;
        }
      }, DEBOUNCE_MS);
      
      return;
    }
    
    this.pushImmediate(code, label);
  }

  private pushImmediate(code: string, label?: string) {
    if (this.history.length > 0 && this.history[this.currentIndex]?.code === code) {
      return;
    }
    
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    this.history.push({ 
      code, 
      timestamp: Date.now(), 
      label 
    });
    this.currentIndex++;
    
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history.shift();
      this.currentIndex--;
    }
    
    this.lastPushTime = Date.now();
    this.save();
  }

  undo(): string | null {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.save();
      return this.history[this.currentIndex].code;
    }
    return null;
  }

  redo(): string | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      this.save();
      return this.history[this.currentIndex].code;
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getCurrentEntry(): HistoryEntry | null {
    return this.history[this.currentIndex] || null;
  }

  getHistoryLength(): number {
    return this.history.length;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
    this.save();
  }

  private save() {
    try {
      const state: HistoryState = {
        history: this.history.slice(-20),
        currentIndex: Math.min(this.currentIndex, 19)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      console.warn('[HistoryManager] Failed to save history');
    }
  }

  private load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state: HistoryState = JSON.parse(saved);
        this.history = state.history || [];
        this.currentIndex = state.currentIndex ?? -1;
        
        if (this.currentIndex >= this.history.length) {
          this.currentIndex = this.history.length - 1;
        }
      }
    } catch {
      console.warn('[HistoryManager] Failed to load history');
      this.history = [];
      this.currentIndex = -1;
    }
  }
}

export const historyManager = new HistoryManager();
