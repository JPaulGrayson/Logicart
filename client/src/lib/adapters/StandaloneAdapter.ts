import { IDEAdapter, FileInfo, FileChangeCallback, Range } from './types';

/**
 * StandaloneAdapter - In-memory adapter for standalone Cartographer usage
 * Manages code state internally without relying on external IDE
 */
export class StandaloneAdapter implements IDEAdapter {
  private code: string;
  private filePath: string;
  private changeListeners: Set<FileChangeCallback>;
  
  constructor(initialCode: string = '', filePath: string = 'untitled.js') {
    this.code = initialCode;
    this.filePath = filePath;
    this.changeListeners = new Set();
  }
  
  async initialize(): Promise<void> {
    // No initialization needed for standalone mode
  }
  
  cleanup(): void {
    this.changeListeners.clear();
  }
  
  async getCurrentFileContent(): Promise<string> {
    return this.code;
  }
  
  getCurrentFilePath(): string {
    return this.filePath;
  }
  
  async getCurrentFile(): Promise<FileInfo> {
    return {
      path: this.filePath,
      content: this.code,
      language: 'javascript'
    };
  }
  
  async writeFile(content: string): Promise<void> {
    this.code = content;
    // Notify all listeners of the change
    this.changeListeners.forEach(callback => {
      callback(content, this.filePath);
    });
  }
  
  watchFileChanges(callback: FileChangeCallback): () => void {
    this.changeListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.changeListeners.delete(callback);
    };
  }
  
  async getSelectedText(): Promise<string | null> {
    // Not supported in standalone mode
    return null;
  }
  
  navigateToLine(line: number): void {
    // Implemented by UI layer in standalone mode
    console.log(`Navigate to line ${line} (handled by CodeEditor component)`);
  }
  
  highlightRange(range: Range): void {
    // Implemented by UI layer in standalone mode
    console.log(`Highlight range (handled by CodeEditor component)`, range);
  }
  
  supportsEditing(): boolean {
    return true;
  }
  
  hasIntegratedEditor(): boolean {
    // Standalone mode has its own editor component
    return false;
  }
  
  getAdapterType(): 'standalone' {
    return 'standalone';
  }
  
  /**
   * Standalone-specific method to update code programmatically
   * Used by the CodeEditor component
   */
  setCode(code: string): void {
    this.writeFile(code);
  }
  
  /**
   * Standalone-specific method to update file path
   */
  setFilePath(path: string): void {
    this.filePath = path;
  }
}
