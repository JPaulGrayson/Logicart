import { IDEAdapter, FileInfo, FileChangeCallback, Range } from './types';

// Replit Extension API types
declare global {
  interface Window {
    replit?: {
      session: {
        getActiveFile(): string | null;
        onActiveFileChange(callback: (file: string | null) => void): () => void;
      };
      fs: {
        readFile(path: string): Promise<string>;
        writeFile(path: string, content: string): Promise<void>;
        watchTextFile(path: string, callback: (content: string) => void): () => void;
      };
    };
  }
}

/**
 * ReplitAdapter - Integrates with Replit Extension APIs
 * Uses Replit's session and fs modules to interact with the IDE
 */
export class ReplitAdapter implements IDEAdapter {
  private currentFilePath: string | null = null;
  private currentContent: string = '';
  private changeListeners: Set<FileChangeCallback> = new Set();
  private unsubscribeFileWatch: (() => void) | null = null;
  private unsubscribeActiveFileChange: (() => void) | null = null;

  async initialize(): Promise<void> {
    if (!window.replit) {
      throw new Error('Replit Extension API not available. This adapter only works within Replit.');
    }

    // Get the initially active file
    const activePath = window.replit.session.getActiveFile();
    if (activePath) {
      await this.switchToFile(activePath);
    }

    // Watch for active file changes
    this.unsubscribeActiveFileChange = window.replit.session.onActiveFileChange(async (newPath) => {
      if (newPath && newPath !== this.currentFilePath) {
        await this.switchToFile(newPath);
      }
    });
  }

  private async switchToFile(path: string): Promise<void> {
    if (!window.replit) return;

    // Unsubscribe from previous file watch
    if (this.unsubscribeFileWatch) {
      this.unsubscribeFileWatch();
      this.unsubscribeFileWatch = null;
    }

    // Update current file
    this.currentFilePath = path;

    // Read initial content
    this.currentContent = await window.replit.fs.readFile(path);

    // Watch for changes to this file
    this.unsubscribeFileWatch = window.replit.fs.watchTextFile(path, (content) => {
      this.currentContent = content;
      this.changeListeners.forEach(callback => {
        callback(content, path);
      });
    });

    // Notify listeners of file switch
    this.changeListeners.forEach(callback => {
      callback(this.currentContent, path);
    });
  }

  cleanup(): void {
    if (this.unsubscribeFileWatch) {
      this.unsubscribeFileWatch();
    }
    if (this.unsubscribeActiveFileChange) {
      this.unsubscribeActiveFileChange();
    }
    this.changeListeners.clear();
  }

  async getCurrentFileContent(): Promise<string> {
    return this.currentContent;
  }

  getCurrentFilePath(): string {
    return this.currentFilePath || 'untitled.js';
  }

  async getCurrentFile(): Promise<FileInfo> {
    return {
      path: this.getCurrentFilePath(),
      content: this.currentContent,
      language: this.getLanguageFromPath(this.currentFilePath)
    };
  }

  private getLanguageFromPath(path: string | null): string {
    if (!path) return 'javascript';
    const ext = path.split('.').pop()?.toLowerCase();
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'go': 'go',
      'rs': 'rust',
    };
    return languageMap[ext || ''] || 'javascript';
  }

  async writeFile(content: string): Promise<void> {
    if (!window.replit || !this.currentFilePath) {
      throw new Error('No file is currently active');
    }

    await window.replit.fs.writeFile(this.currentFilePath, content);
    // Note: The watchTextFile callback will handle notifying listeners
  }

  watchFileChanges(callback: FileChangeCallback): () => void {
    this.changeListeners.add(callback);

    return () => {
      this.changeListeners.delete(callback);
    };
  }

  async getSelectedText(): Promise<string | null> {
    // Not supported by current Replit Extension API
    return null;
  }

  navigateToLine(line: number): void {
    // Log for debugging - Replit's editor should handle this automatically
    console.log(`Navigate to line ${line} (Replit Editor integration)`);
    // TODO: Use editor API when available
  }

  highlightRange(range: Range): void {
    // Log for debugging - Replit's editor should handle this automatically
    console.log(`Highlight range (Replit Editor integration)`, range);
    // TODO: Use editor API when available
  }

  supportsEditing(): boolean {
    return true;
  }

  hasIntegratedEditor(): boolean {
    // Replit has its own editor
    return true;
  }

  getAdapterType(): 'replit' {
    return 'replit';
  }
}
