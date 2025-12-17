import * as vscode from 'vscode';
import * as path from 'path';
import { parseCodeToFlow } from '@logigo/bridge';

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
    const languageId = document.languageId;
    const isUntitled = document.isUntitled;

    // Accept JavaScript, TypeScript, or untitled files (which might be JS)
    const supportedLanguages = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];
    const isSupportedLanguage = supportedLanguages.includes(languageId);

    // For untitled or plaintext files, try to parse anyway
    if (!isSupportedLanguage && !isUntitled && languageId !== 'plaintext') {
      vscode.window.showWarningMessage(`LogiGo works best with JavaScript/TypeScript files (detected: ${languageId})`);
      return;
    }

    const code = document.getText();
    const filePath = document.uri.fsPath || 'Untitled';

    showFlowchart(context, code, filePath, document);
  });

  context.subscriptions.push(visualizeCommand);
}

function showFlowchart(context: vscode.ExtensionContext, code: string, filePath: string, document: vscode.TextDocument) {
  const columnToShowIn = vscode.window.activeTextEditor
    ? vscode.window.activeTextEditor.viewColumn
    : undefined;

  const isNewPanel = !currentPanel;

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

    // Setup message handler ONCE when panel is created
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

          case 'insertCode':
            console.log('[LogiGo] insertCode received, code length:', message.code?.length);

            // Create a new untitled document with the example code
            const newDoc = await vscode.workspace.openTextDocument({
              language: 'javascript',
              content: message.code
            });
            await vscode.window.showTextDocument(newDoc, vscode.ViewColumn.One);

            // Update the tracked document to the new one
            currentDocument = newDoc;

            // Re-setup the document watcher for the new document
            setupDocumentWatcher(context, newDoc);

            // Small delay to ensure document is ready, then update webview
            if (currentPanel) {
              await new Promise(resolve => setTimeout(resolve, 100));
              updateWebview(currentPanel, context, message.code, 'Example');
              console.log('[LogiGo] updateWebview called for example');
            }

            vscode.window.showInformationMessage('📚 Algorithm example loaded!');
            break;
        }
      },
      undefined,
      context.subscriptions
    );
  }

  currentDocument = document;
  setupDocumentWatcher(context, document);

  // Always set/update the HTML content
  const flowData = parseCodeToFlow(code);
  currentPanel.webview.html = getWebviewContent(currentPanel, context, flowData, filePath);
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
  console.log('[Extension] updateWebview called, code length:', code?.length);
  const flowData = parseCodeToFlow(code);
  console.log('[Extension] Parsed flowData, nodes:', flowData?.nodes?.length, 'edges:', flowData?.edges?.length);

  // Send update via postMessage instead of rebuilding HTML
  console.log('[Extension] Sending updateFlow postMessage');
  panel.webview.postMessage({
    type: 'updateFlow',
    flowData,
    filePath
  });
  console.log('[Extension] postMessage sent to webview');
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
