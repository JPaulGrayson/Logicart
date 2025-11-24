import * as vscode from 'vscode';
import * as path from 'path';
import { parseCodeToFlow } from './parser';

let currentPanel: vscode.WebviewPanel | undefined;
let currentDocument: vscode.TextDocument | undefined;
let documentChangeListener: vscode.Disposable | undefined;

export function activate(context: vscode.ExtensionContext) {
  console.log('LogiGo extension activated');

  const visualizeCommand = vscode.commands.registerCommand('logigo.visualize', async () => {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    const document = editor.document;
    
    if (document.languageId !== 'javascript' && document.languageId !== 'typescript') {
      vscode.window.showWarningMessage('LogiGo only supports JavaScript and TypeScript files');
      return;
    }

    const code = document.getText();
    const filePath = document.uri.fsPath;
    
    showFlowchart(context, code, filePath, document);
  });

  context.subscriptions.push(visualizeCommand);
}

function showFlowchart(context: vscode.ExtensionContext, code: string, filePath: string, document: vscode.TextDocument) {
  const columnToShowIn = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.viewColumn
    : undefined;

  if (currentPanel) {
    currentPanel.reveal(columnToShowIn);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      'logigoFlowchart',
      'LogiGo Flowchart',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview')
        ]
      }
    );

    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
      currentDocument = undefined;
      if (documentChangeListener) {
        documentChangeListener.dispose();
        documentChangeListener = undefined;
      }
    }, null, context.subscriptions);
  }

  currentDocument = document;
  setupDocumentWatcher(context, document);
  
  // Set initial HTML content only when creating panel
  if (!currentPanel.webview.html || currentPanel.webview.html === '') {
    const flowData = parseCodeToFlow(code);
    currentPanel.webview.html = getWebviewContent(currentPanel, context, flowData, filePath);
    
    // Setup message handler
    currentPanel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'updateCode':
            if (currentDocument) {
              const edit = new vscode.WorkspaceEdit();
              const fullRange = new vscode.Range(
                currentDocument.positionAt(0),
                currentDocument.positionAt(currentDocument.getText().length)
              );
              edit.replace(currentDocument.uri, fullRange, message.code);
              await vscode.workspace.applyEdit(edit);
              await currentDocument.save();
            }
            break;
            
          case 'jumpToLine':
            const editor = vscode.window.activeTextEditor;
            if (editor && message.line !== undefined) {
              const position = new vscode.Position(message.line - 1, 0);
              editor.selection = new vscode.Selection(position, position);
              editor.revealRange(new vscode.Range(position, position));
              vscode.window.showTextDocument(editor.document, editor.viewColumn);
            }
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  } else {
    // Update existing webview
    updateWebview(currentPanel, context, code, filePath);
  }
}

function setupDocumentWatcher(context: vscode.ExtensionContext, document: vscode.TextDocument) {
  if (documentChangeListener) {
    documentChangeListener.dispose();
  }

  const config = vscode.workspace.getConfiguration('cartographer');
  const autoRefresh = config.get<boolean>('autoRefresh', true);

  if (!autoRefresh) {
    return;
  }

  documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document === currentDocument && currentPanel) {
      const code = event.document.getText();
      const filePath = event.document.uri.fsPath;
      updateWebview(currentPanel, context, code, filePath);
    }
  });
  
  context.subscriptions.push(documentChangeListener);
}

function updateWebview(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, code: string, filePath: string) {
  const flowData = parseCodeToFlow(code);
  
  // Send update via postMessage instead of rebuilding HTML
  panel.webview.postMessage({
    type: 'updateFlow',
    flowData,
    filePath
  });
}

function getWebviewContent(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, flowData: any, filePath: string): string {
  const webviewUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'webview.js')
  );
  
  const stylesUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview', 'webview.css')
  );
  
  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${panel.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${stylesUri}">
  <title>Cartographer Flowchart</title>
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">
    window.flowData = ${JSON.stringify(flowData)};
    window.filePath = ${JSON.stringify(filePath)};
    window.vscode = acquireVsCodeApi();
  </script>
  <script nonce="${nonce}" src="${webviewUri}"></script>
</body>
</html>`;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() {
  if (currentPanel) {
    currentPanel.dispose();
  }
  if (documentChangeListener) {
    documentChangeListener.dispose();
  }
}
