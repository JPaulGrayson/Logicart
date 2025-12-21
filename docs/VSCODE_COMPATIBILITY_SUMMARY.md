# LogiGo VS Code / Antigravity Compatibility Summary

## Purpose
This document summarizes the technical architecture of LogiGo and identifies which features are platform-specific vs platform-agnostic, to facilitate VS Code extension development and cross-platform parity.

---

## Architecture Overview

LogiGo uses a **pluggable adapter pattern** to support multiple IDEs:

```
┌─────────────────────────────────────────────────────────┐
│                    LogiGo Core                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Parser    │  │  Renderer   │  │  Interpreter    │  │
│  │  (Acorn)    │  │ (ReactFlow) │  │  (Step Engine)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│                         │                               │
│              ┌──────────┴──────────┐                    │
│              │    IDEAdapter       │                    │
│              │    (Interface)      │                    │
│              └──────────┬──────────┘                    │
│         ┌───────────────┼───────────────┐               │
│         ▼               ▼               ▼               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐        │
│  │  Replit     │ │ Standalone  │ │  VS Code    │        │
│  │  Adapter    │ │  Adapter    │ │  Adapter    │        │
│  └─────────────┘ └─────────────┘ └─────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## IDEAdapter Interface

All adapters must implement this interface:

```typescript
interface IDEAdapter {
  // Lifecycle
  initialize(): Promise<void>;
  cleanup(): void;
  
  // File Operations
  getCurrentFile(): FileInfo | null;
  getFileContent(): string;
  
  // File Watching
  onFileChange(callback: FileChangeCallback): () => void;
  
  // Editor Integration
  jumpToLine(line: number, column?: number): void;
  highlightRange(range: Range): void;
  
  // Bidirectional Editing
  updateSource(newContent: string): Promise<void>;
}
```

---

## Platform-Specific Features

### Replit-Only (ReplitAdapter)

| Feature | API Used | Notes |
|---------|----------|-------|
| Active file detection | `window.replit.session.getActiveFile()` | Auto-detects which file user is editing |
| File change watching | `window.replit.session.onActiveFileChange()` | Notified when user switches files |
| File reading | `window.replit.fs.readFile(path)` | Read file contents |
| File writing | `window.replit.fs.writeFile(path, content)` | For bidirectional editing |
| File watching | `window.replit.fs.watchFile(path, callback)` | Real-time content updates |

### VS Code Equivalent APIs

| Replit API | VS Code Equivalent |
|------------|-------------------|
| `replit.session.getActiveFile()` | `vscode.window.activeTextEditor?.document.uri` |
| `replit.session.onActiveFileChange()` | `vscode.window.onDidChangeActiveTextEditor` |
| `replit.fs.readFile()` | `vscode.workspace.fs.readFile()` |
| `replit.fs.writeFile()` | `vscode.workspace.fs.writeFile()` |
| `replit.fs.watchFile()` | `vscode.workspace.onDidChangeTextDocument` |

---

## Platform-Agnostic Features

These work identically across all platforms:

### Core Visualization
- **AST Parsing**: Acorn parser runs client-side, no IDE dependency
- **Flowchart Rendering**: React Flow components are pure React
- **Node Types**: DecisionNode, ContainerNode, LabeledNode - all React components
- **Layout Engine**: Dagre graph layout - pure JavaScript

### Premium Features
- **Ghost Diff**: Compares flowchart snapshots - pure client-side logic
- **Hierarchical Views**: Container nodes with collapse/expand
- **Breakpoints**: Node metadata, no IDE dependency
- **Fullscreen/Presentation Modes**: CSS + React state

### Comment Labels
- **`// @logigo:` comments**: Parsed from source code, works everywhere

---

## Remote Mode Considerations

### Current Architecture (Replit-Hosted)

```
┌──────────────────┐     HTTP/SSE      ┌──────────────────┐
│  External App    │ ───────────────▶  │  LogiGo Server   │
│  (Any Platform)  │                   │  (Replit-hosted) │
└──────────────────┘                   └────────┬─────────┘
                                                │
                                       ┌────────▼─────────┐
                                       │  /remote page    │
                                       │  (Visualization) │
                                       └──────────────────┘
```

### Options for VS Code

1. **Use Published LogiGo URL**: VS Code users can send checkpoints to the published Replit app and view in browser
2. **Local Server Mode**: Bundle a lightweight Express server with the VS Code extension
3. **Direct Integration**: Skip Remote Mode entirely, use VS Code's built-in debugging APIs

---

## Questions for Antigravity

### Extension Status
1. Has the VS Code extension already been developed?
2. If yes, what's the current feature set?
3. Is it published to the VS Code marketplace?

### Architecture Decisions
4. Does the extension use a webview panel for the flowchart?
5. How is file sync handled - using `vscode.workspace` APIs?
6. Is there a VSCodeAdapter implementation we should integrate?

### Remote Mode
7. Can VS Code users connect to Remote Mode via the published URL?
8. Should we add a local server option for offline usage?
9. Any interest in using VS Code's Debug Adapter Protocol for checkpoint integration?

### Feature Parity
10. Which Replit features should be prioritized for VS Code?
11. Are there VS Code-specific features we should add (e.g., CodeLens, inline decorations)?

---

## Recommended VS Code Adapter Implementation

```typescript
// Proposed VSCodeAdapter structure
import * as vscode from 'vscode';
import { IDEAdapter, FileInfo, FileChangeCallback, Range } from './types';

export class VSCodeAdapter implements IDEAdapter {
  private context: vscode.ExtensionContext;
  private changeListeners: Set<FileChangeCallback> = new Set();
  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  async initialize(): Promise<void> {
    // Watch for active editor changes
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.notifyFileChange(editor.document);
        }
      })
    );

    // Watch for document content changes
    this.disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.notifyFileChange(event.document);
      })
    );
  }

  getCurrentFile(): FileInfo | null {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return null;
    
    return {
      path: editor.document.uri.fsPath,
      content: editor.document.getText(),
      language: editor.document.languageId
    };
  }

  jumpToLine(line: number, column: number = 0): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const position = new vscode.Position(line - 1, column);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(
      new vscode.Range(position, position),
      vscode.TextEditorRevealType.InCenter
    );
  }

  async updateSource(newContent: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const fullRange = new vscode.Range(
      editor.document.positionAt(0),
      editor.document.positionAt(editor.document.getText().length)
    );

    await editor.edit((editBuilder) => {
      editBuilder.replace(fullRange, newContent);
    });
  }

  cleanup(): void {
    this.disposables.forEach(d => d.dispose());
    this.disposables = [];
  }

  private notifyFileChange(document: vscode.TextDocument): void {
    this.changeListeners.forEach(callback => {
      callback(document.getText(), document.uri.fsPath);
    });
  }
}
```

---

## Integration Packages Summary

| Package | Purpose | Platform |
|---------|---------|----------|
| `logigo-embed` | Embeddable React component | Any React app |
| `logigo-remote` | HTTP client for Remote Mode | Any JavaScript runtime |
| `logigo-core` | Runtime overlay + checkpoint API | Browser-based apps |
| `@logigo/bridge` | Shared parser + types | All platforms |

---

## Next Steps

1. **Confirm Extension Status**: Get update from Antigravity on VS Code extension progress
2. **Share This Document**: Review architecture decisions together
3. **Prioritize Features**: Decide which features need VS Code parity first
4. **Integration Testing**: Test logigo-remote from a VS Code terminal app

---

*Document prepared: December 2024*
*Contact: LogiGo Development Team*
