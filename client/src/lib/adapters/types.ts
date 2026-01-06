export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface FileInfo {
  path: string;
  content: string;
  language?: string;
}

export type FileChangeCallback = (content: string, path: string) => void;

/**
 * IDEAdapter interface - abstracts IDE-specific file and editor operations
 * Allows LogicArt to work across different IDE environments (standalone, Replit, VS Code, etc.)
 */
export interface IDEAdapter {
  /**
   * Initialize the adapter and set up connections to the IDE
   */
  initialize(): Promise<void>;
  
  /**
   * Clean up resources when adapter is no longer needed
   */
  cleanup(): void;
  
  /**
   * Get the currently active/focused file content
   */
  getCurrentFileContent(): Promise<string>;
  
  /**
   * Get the path of the currently active file
   */
  getCurrentFilePath(): string;
  
  /**
   * Get full file info (path + content + metadata)
   */
  getCurrentFile(): Promise<FileInfo>;
  
  /**
   * Write content to the current file
   */
  writeFile(content: string): Promise<void>;
  
  /**
   * Watch for changes to the current file
   * Returns an unsubscribe function
   */
  watchFileChanges(callback: FileChangeCallback): () => void;
  
  /**
   * Get the currently selected text in the editor (if any)
   */
  getSelectedText(): Promise<string | null>;
  
  /**
   * Navigate to a specific line in the editor
   */
  navigateToLine(line: number): void;
  
  /**
   * Highlight a range of text in the editor
   */
  highlightRange(range: Range): void;
  
  /**
   * Check if the adapter supports editing (some might be read-only)
   */
  supportsEditing(): boolean;
  
  /**
   * Check if the adapter has an integrated editor (affects UI layout)
   */
  hasIntegratedEditor(): boolean;
  
  /**
   * Get the adapter type/name for debugging and UI decisions
   */
  getAdapterType(): 'standalone' | 'replit' | 'vscode' | 'cursor' | 'webcontainer';
}
