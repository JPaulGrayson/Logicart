# LogiGo VS Code Extension - Flowchart Update Bug Report

## Problem Summary
When selecting a different algorithm example from the EXAMPLES dropdown in the LogiGo flowchart panel, the flowchart does not update to reflect the new example. The notification message "📚 Algorithm example loaded!" appears, and a new document with the example code is created, but the flowchart visualization remains unchanged.

---

## Project Structure
```
LogiGo/
├── bridge/                    # Shared parsing library
│   └── src/
│       └── parser.ts          # parseCodeToFlow() function
├── vscode-extension/
│   ├── src/
│   │   ├── extension.ts       # Main extension entry point
│   │   └── webview/
│   │       └── index.tsx      # React webview component
│   ├── dist/                  # Built output
│   └── package.json
└── test-example.js            # Test file for debugging
```

---

## Expected Behavior
1. User opens a JavaScript file
2. User runs "LogiGo: Visualize Current File" command
3. Flowchart panel appears showing the code's control flow
4. User selects a different example from the EXAMPLES dropdown (e.g., "Fibonacci")
5. **Expected**: Flowchart updates to show the Fibonacci algorithm's structure
6. **Actual**: Flowchart stays the same as before, showing the original code

---

## Code Flow Analysis

### Step 1: User Selects an Example
**File: `vscode-extension/src/webview/index.tsx` (lines 571-590, 924-929)**

```tsx
// The dropdown component
function AlgorithmExamplesDropdown({ onSelect }: { onSelect: (example: AlgorithmExample) => void }) {
  return (
    <div className="examples-dropdown">
      <label className="examples-label">📚 Examples:</label>
      <select
        className="examples-select"
        onChange={(e) => {
          const example = algorithmExamples.find(ex => ex.id === e.target.value);
          if (example) onSelect(example);
        }}
        defaultValue=""
      >
        <option value="" disabled>Choose an algorithm...</option>
        {algorithmExamples.map(ex => (
          <option key={ex.id} value={ex.id}>{ex.name}</option>
        ))}
      </select>
    </div>
  );
}

// The handler that gets called when an example is selected
const handleExampleSelect = (example: AlgorithmExample) => {
  // Send example code to VS Code extension to insert
  window.vscode.postMessage({ command: 'insertCode', code: example.code });
};
```

### Step 2: Extension Receives the Message
**File: `vscode-extension/src/extension.ts` (lines 76-130)**

```typescript
// Message handler setup (only when panel is first created)
currentPanel.webview.onDidReceiveMessage(
  async (message) => {
    switch (message.command) {
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
```

### Step 3: updateWebview Sends postMessage to Webview
**File: `vscode-extension/src/extension.ts` (lines 163-178)**

```typescript
function updateWebview(panel: vscode.WebviewPanel, context: vscode.ExtensionContext, code: string, filePath: string) {
  console.log('[LogiGo] updateWebview called, code length:', code?.length);
  const flowData = parseCodeToFlow(code);
  console.log('[LogiGo] Parsed flowData, nodes:', flowData?.nodes?.length, 'edges:', flowData?.edges?.length);

  // Send update via postMessage instead of rebuilding HTML
  panel.webview.postMessage({
    type: 'updateFlow',
    flowData,
    filePath
  });
  console.log('[LogiGo] postMessage sent to webview');
}
```

### Step 4: Webview Should Receive Message and Update State
**File: `vscode-extension/src/webview/index.tsx` (lines 896-909)**

```tsx
React.useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    const message = event.data;
    console.log('[LogiGo Webview] Message received:', message.type);
    if (message.type === 'updateFlow' && message.flowData) {
      console.log('[LogiGo Webview] Setting new flowData with', message.flowData?.nodes?.length, 'nodes');
      // Force a new object reference to ensure React re-renders
      setFlowData({ ...message.flowData });
    }
  };

  window.addEventListener('message', handleMessage);
  return () => window.removeEventListener('message', handleMessage);
}, []);
```

### Step 5: React Should Re-render When flowData Changes
**File: `vscode-extension/src/webview/index.tsx` (lines 857-873)**

```tsx
// Initialize interpreter when flowData changes
React.useEffect(() => {
  // Track previous for ghost diff
  if (flowData && previousFlowData && features.ghostDiff) {
    const diff = ghostDiff.diffTrees(previousFlowData.nodes || [], flowData.nodes || []);
    setDiffNodes(diff);
  } else {
    setDiffNodes((flowData.nodes || []).map((n: FlowNode) => ({ ...n, diffStatus: 'unchanged' as DiffStatus })));
  }

  setPreviousFlowData(flowData);

  const interp = new SimpleInterpreter(flowData);
  setInterpreter(interp);
  setProgress(interp.getProgress());
  setCurrentStep(null);
}, [flowData, ghostDiff]);
```

---

## What Has Been Tried

### Attempt 1: Rebuild Entire WebView HTML (Original Approach)
Changed `insertCode` handler to replace the entire webview HTML:
```typescript
currentPanel.webview.html = getWebviewContent(currentPanel, context, flowData, 'Example');
```
**Result**: Did not work. Flowchart did not update.

### Attempt 2: Use postMessage Instead of HTML Replacement
Changed to use `postMessage` to send new flowData, which should trigger React state update:
```typescript
currentPanel.webview.postMessage({
  type: 'updateFlow',
  flowData,
  filePath: 'Example'
});
```
**Result**: Did not work. The message appears to not reach the webview, or the state update doesn't trigger a re-render.

### Attempt 3: Call updateWebview Directly
Used the existing `updateWebview` function which already uses postMessage:
```typescript
updateWebview(currentPanel, context, message.code, 'Example');
```
**Result**: Did not work.

### Attempt 4: Add Delay Before Sending Message
Added a 100ms delay to ensure document is ready:
```typescript
await new Promise(resolve => setTimeout(resolve, 100));
updateWebview(currentPanel, context, message.code, 'Example');
```
**Result**: Did not work.

### Attempt 5: Force New Object Reference in React
Changed the webview's message handler to spread the object:
```typescript
setFlowData({ ...message.flowData });
```
**Result**: Did not work.

### Attempt 6: Discovered Extension Was Running from Installed VSIX
Found that the extension was installed as a packaged `.vsix` file, not running from development source code. The user had `logigo.logigo-1.0.0` in their extensions folder.

**Actions taken**:
- Uninstalled the extension via VS Code UI
- Removed cached extension files
- Rebuilt the extension package
- Attempted to reinstall from fresh VSIX

**Result**: Extension commands stopped appearing in the command palette ("No matching commands" error).

---

## Current State

1. **Extension installation is broken** - The LogiGo commands no longer appear in the command palette
2. **The core flowchart update issue was never solved** - Before the installation broke, the flowchart would not update when selecting examples

---

## Observations

1. The notification "📚 Algorithm example loaded!" DOES appear, confirming the `insertCode` message reaches the extension
2. A new document with the example code IS created and displayed
3. The webview panel remains visible but shows the OLD flowchart
4. Console logs were added but it's unclear if they're being reached (user cannot easily access webview console)

---

## Theories

1. **Message not reaching webview**: The `postMessage` from extension to webview might not be delivered
2. **React state update not triggering re-render**: The `setFlowData()` call might not cause React to re-render
3. **Stale closure issue**: The message listener might have a stale reference to `setFlowData`
4. **Content Security Policy blocking messages**: The webview's CSP might interfere
5. **Panel reference issue**: `currentPanel` might be referencing a different panel than expected
6. **Webview context not ready**: The webview might not have its message listener set up when the message arrives

---

## Key Files to Review

1. **extension.ts**: Main extension file, handles messages from webview
2. **webview/index.tsx**: React component that renders the flowchart
3. **bridge/src/parser.ts**: Parses JavaScript code into flowchart data
4. **package.json**: Extension manifest with activation events and commands

---

## Package.json Activation Events
```json
"activationEvents": [
  "onLanguage:javascript",
  "onLanguage:typescript",
  "onCommand:logigo.visualize",
  "onCommand:logigo.execute"
]
```

---

## Questions for Debugging

1. Is the webview's `window.addEventListener('message', ...)` actually receiving the messages?
2. Is `setFlowData()` being called with the new data?
3. Is the useEffect that depends on `flowData` running when flowData changes?
4. Why would replacing the entire webview HTML also fail to update the display?
5. Is there some caching mechanism in VS Code webviews that's preserving old content?
